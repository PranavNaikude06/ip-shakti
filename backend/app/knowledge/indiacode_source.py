"""
India Code (indiacode.gov.in) source adapter.

India Code is the Government of India's official repository of Central Acts.
It runs DSpace 7 and exposes a REST API in which **each section of an Act is a
separate item** carrying structured metadata:

    dc.identifier.section_number    e.g. "3", "124A"
    dc.identifier.section_page_note the section text (HTML)
    dc.identifier.section_footnote  amendment history
    dc.identifier.page_number       page in the official PDF
    dc.identifier.repealed          repeal status
    dc.identifier.uri               official citable URI
    dc.title.act_name               parent Act

This is why AYUR-IP does not parse PDFs. Section boundaries, section numbers,
page numbers and repeal status come from the authority itself rather than from
regexes over extracted text, which removes an entire class of citation error.

Nothing in this module invents content. Every field is either present in the
API response or left as None.
"""

from __future__ import annotations

import html
import re
import time
from dataclasses import dataclass, field
from typing import Any, Iterator

import httpx

API_ROOT = "https://indiacode.gov.in/server/api"
PAGE_SIZE = 100


# --------------------------------------------------------------------------
# Normalised record
# --------------------------------------------------------------------------

@dataclass
class SectionRecord:
    """One section of one Act, as published by India Code."""
    act_id: str
    act_name: str
    act_year: str | None
    act_number: str | None
    section_number: str | None
    title: str
    text: str
    footnote: str | None
    page: int | None
    repealed: bool
    uri: str | None
    order: int | None
    ministry: str | None = None
    department: str | None = None
    raw_metadata: dict[str, Any] = field(default_factory=dict)


# --------------------------------------------------------------------------
# HTML normalisation
# --------------------------------------------------------------------------

_BR = re.compile(r"<br\s*/?>", re.I)
_BLOCK_END = re.compile(r"</(p|div|li|tr|h[1-6])\s*>", re.I)
_TAG = re.compile(r"<[^>]+>")
_WS = re.compile(r"[ \t ]+")
_MULTINEWLINE = re.compile(r"\n{3,}")


def clean_html(raw: str | None) -> str:
    """Convert India Code's HTML section body to plain text, preserving line structure.

    Line breaks matter here: clause markers such as "(p)" sit at line starts and
    the clause splitter depends on that layout surviving.
    """
    if not raw:
        return ""
    text = _BR.sub("\n", raw)
    text = _BLOCK_END.sub("\n", text)
    text = _TAG.sub("", text)
    text = html.unescape(text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = "\n".join(_WS.sub(" ", line).rstrip() for line in text.split("\n"))
    text = _MULTINEWLINE.sub("\n\n", text)
    return text.strip()


def _meta(md: dict[str, Any], key: str) -> str | None:
    vals = md.get(key)
    if not vals:
        return None
    value = vals[0].get("value")
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def _as_int(value: str | None) -> int | None:
    try:
        n = int(str(value).strip())
    except (TypeError, ValueError):
        return None
    # India Code uses 0 as a "not recorded" sentinel for page fields.
    return n if n > 0 else None


# --------------------------------------------------------------------------
# Client
# --------------------------------------------------------------------------

class IndiaCodeClient:
    """Thin, polite client over the India Code DSpace REST API."""

    def __init__(self, timeout: float = 60.0, retries: int = 3, pause: float = 0.25) -> None:
        self._client = httpx.Client(
            timeout=timeout,
            follow_redirects=True,
            headers={"User-Agent": "AYUR-IP/0.1 (research prototype; contact: project maintainer)"},
        )
        self._retries = retries
        self._pause = pause

    def __enter__(self) -> "IndiaCodeClient":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    def close(self) -> None:
        self._client.close()

    def _get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        last: Exception | None = None
        for attempt in range(self._retries):
            try:
                resp = self._client.get(f"{API_ROOT}{path}", params=params)
                resp.raise_for_status()
                time.sleep(self._pause)
                return resp.json()
            except Exception as exc:  # network flakiness, 5xx, malformed JSON
                last = exc
                time.sleep(1.5 * (attempt + 1))
        raise RuntimeError(f"India Code request failed after {self._retries} attempts: {path}") from last

    def _search(self, query: str, page: int = 0, size: int = PAGE_SIZE) -> tuple[list[dict], int]:
        data = self._get(
            "/discover/search/objects",
            {"query": query, "dsoType": "item", "size": size, "page": page},
        )
        result = data.get("_embedded", {}).get("searchResult", {})
        objects = result.get("_embedded", {}).get("objects", [])
        total = result.get("page", {}).get("totalElements", 0)
        items = [o.get("_embedded", {}).get("indexableObject", {}) for o in objects]
        return [i for i in items if i], int(total)

    # -- public API ------------------------------------------------------

    def resolve_act_id(self, act_name: str) -> tuple[str, str] | None:
        """Find the India Code act_id for an Act title.

        Returns (act_id, canonical_act_name) or None when no confident match
        exists. The caller must treat None as "document unavailable" rather
        than substituting a guess.
        """
        items, _ = self._search(f'dc.title.act_name:"{act_name}"', size=25)
        counts: dict[tuple[str, str], int] = {}
        for item in items:
            md = item.get("metadata", {})
            act_id = _meta(md, "dc.identifier.act_id")
            name = _meta(md, "dc.title.act_name")
            if act_id and name:
                counts[(act_id, name)] = counts.get((act_id, name), 0) + 1
        if not counts:
            return None
        # Prefer the act_id backing the most sections, then the closest title.
        target = act_name.lower().strip()
        best = max(
            counts.items(),
            key=lambda kv: (kv[0][1].lower().strip() == target, kv[1]),
        )
        return best[0]

    def iter_sections(self, act_id: str) -> Iterator[SectionRecord]:
        """Yield every section record belonging to an Act, in document order."""
        page = 0
        seen: set[str] = set()
        while True:
            items, total = self._search(f'dc.identifier.act_id:"{act_id}"', page=page)
            if not items:
                break
            for item in items:
                md = item.get("metadata", {})
                if _meta(md, "dc.identifier.act_id") != act_id:
                    continue
                uri = _meta(md, "dc.identifier.uri")
                key = uri or item.get("uuid", "")
                if key in seen:
                    continue
                seen.add(key)
                yield SectionRecord(
                    act_id=act_id,
                    act_name=_meta(md, "dc.title.act_name") or "",
                    act_year=_meta(md, "dc.date.act_year"),
                    act_number=_meta(md, "dc.identifier.act_number"),
                    section_number=_meta(md, "dc.identifier.section_number"),
                    title=(item.get("name") or "").strip(),
                    text=clean_html(_meta(md, "dc.identifier.section_page_note")),
                    footnote=clean_html(_meta(md, "dc.identifier.section_footnote")) or None,
                    page=_as_int(_meta(md, "dc.identifier.page_number")),
                    repealed=str(_meta(md, "dc.identifier.repealed")).lower() == "true",
                    uri=uri,
                    order=_as_int(_meta(md, "dc.identifier.order_number")),
                    ministry=_meta(md, "dc.identifier.ministry_name"),
                    department=_meta(md, "dc.identifier.department_name"),
                    raw_metadata={},
                )
            page += 1
            if page * PAGE_SIZE >= total or page > 60:
                break

    def fetch_act(self, act_name: str) -> tuple[str, str, list[SectionRecord]] | None:
        """Resolve an Act by name and return (act_id, canonical_name, sections)."""
        resolved = self.resolve_act_id(act_name)
        if not resolved:
            return None
        act_id, canonical = resolved
        sections = list(self.iter_sections(act_id))
        sections.sort(key=lambda s: (s.order if s.order is not None else 10**6))
        return act_id, canonical, sections
