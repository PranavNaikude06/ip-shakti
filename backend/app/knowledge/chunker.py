"""
Legal-aware chunking.

A fixed token window is the wrong unit for statutory text: it severs clauses
from their operative stem and produces chunks that cannot be cited. AYUR-IP
chunks along the document's own hierarchy instead.

Given Patents Act s.3, whose body reads:

    The following are not inventions within the meaning of this Act,--
      (a) an invention which is frivolous ...
      (p) an invention which, in effect, is traditional knowledge ...

this module emits one chunk per clause, each carrying the operative stem so the
chunk is self-contained for embedding **and** citable as "Section 3(p)".

Clause markers in India Code text are wrapped in amendment brackets, e.g.
``1[(b) ...]`` or ``5[(j) ...``, so the marker pattern tolerates a leading
footnote digit and bracket.
"""

from __future__ import annotations

import re

from app.models.core import Framework, LegalChunk
from app.knowledge.indiacode_source import SectionRecord

# A clause marker at the start of a line: optional footnote digits + "[",
# then "(x)" where x is a letter, roman numeral, or digit.
_CLAUSE_RE = re.compile(
    r"^[ \t]*(?:\d{1,2}\s*\[\s*)?\((?P<marker>[a-zA-Z]{1,4}|\d{1,3})\)\s+(?=\S)",
    re.MULTILINE,
)

# Lines like "4* * * * *" mark clauses omitted/repealed by amendment.
_OMITTED_RE = re.compile(r"^[ \t]*\d*\s*\*[\s*]*$", re.MULTILINE)

MIN_CLAUSE_SPLIT_CHARS = 320
MIN_CLAUSES_TO_SPLIT = 2
MAX_CHUNK_CHARS = 3000


def _slug(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-")


def _truncate(text: str, limit: int = MAX_CHUNK_CHARS) -> str:
    """Trim over-long text at a sentence boundary where possible.

    Only applies to unusually long provisions; the cut point is reported by the
    caller through char_count so nothing silently disappears.
    """
    if len(text) <= limit:
        return text
    cut = text[:limit]
    for sep in (". ", "\n"):
        idx = cut.rfind(sep)
        if idx > limit * 0.6:
            return cut[: idx + 1].strip()
    return cut.strip()


def split_clauses(text: str) -> tuple[str, list[tuple[str, str]]]:
    """Split a section body into (stem, [(clause_marker, clause_text), ...]).

    The stem is the operative language preceding the first clause. Returns an
    empty clause list when the section is not an enumerated provision.
    """
    if not text:
        return "", []

    matches = list(_CLAUSE_RE.finditer(text))
    if len(matches) < MIN_CLAUSES_TO_SPLIT:
        return text.strip(), []

    stem = text[: matches[0].start()].strip()
    clauses: list[tuple[str, str]] = []
    for i, match in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[match.start():end].strip()
        body = _OMITTED_RE.sub("", body).strip()
        if not body:
            continue
        clauses.append((match.group("marker"), body))
    return stem, clauses


def chunk_section(
    record: SectionRecord,
    document_id: str,
    domain: Framework,
    jurisdiction: str = "INDIA",
) -> list[LegalChunk]:
    """Turn one India Code section record into one or more citable chunks."""
    body = (record.text or "").strip()
    if not body:
        return []

    section = record.section_number
    heading = record.title or None
    status = "REPEALED" if record.repealed else "ACTIVE"
    base_id = f"{document_id}_S{_slug(section) if section else 'NA'}"

    # Header line makes the provision self-describing to a retriever.
    header = f"{record.act_name}"
    if section:
        header += f" - Section {section}"
    if heading:
        header += f". {heading}"

    stem, clauses = split_clauses(body)

    # Short or non-enumerated provisions stay whole.
    if not clauses or len(body) < MIN_CLAUSE_SPLIT_CHARS:
        text = _truncate(f"{header}\n\n{body}")
        return [
            LegalChunk(
                chunk_id=base_id,
                document_id=document_id,
                domain=domain,
                jurisdiction=jurisdiction,
                section=section,
                heading=heading,
                text=text,
                page_start=record.page,
                page_end=record.page,
                char_count=len(text),
                status=status,
            )
        ]

    chunks: list[LegalChunk] = []

    # Stem chunk: the operative language that governs every clause.
    if stem:
        stem_text = _truncate(f"{header}\n\n{stem}")
        chunks.append(
            LegalChunk(
                chunk_id=f"{base_id}_STEM",
                document_id=document_id,
                domain=domain,
                jurisdiction=jurisdiction,
                section=section,
                heading=heading,
                text=stem_text,
                page_start=record.page,
                page_end=record.page,
                char_count=len(stem_text),
                status=status,
            )
        )

    # One chunk per clause, each repeating the stem so it stands alone.
    for marker, clause_body in clauses:
        parts = [header]
        if stem:
            parts.append(stem)
        parts.append(clause_body)
        text = _truncate("\n\n".join(parts))
        chunks.append(
            LegalChunk(
                chunk_id=f"{base_id}_{_slug(marker)}",
                document_id=document_id,
                domain=domain,
                jurisdiction=jurisdiction,
                section=section,
                subsection=marker,
                heading=heading,
                text=text,
                page_start=record.page,
                page_end=record.page,
                char_count=len(text),
                status=status,
            )
        )

    return chunks
