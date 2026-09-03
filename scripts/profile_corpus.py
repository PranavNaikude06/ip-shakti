"""
Profile a raw PDF corpus before ingestion.

Answers, per file and in aggregate:
  - is the text extractable, or is this a scan needing OCR?
  - what language is it in (Devanagari ratio)?
  - what structural units does it expose (sections / rules / chapters / forms)?
  - is it a duplicate of another file (sha256)?

Writes data/profiling/corpus_profile.{json,csv} and prints a summary.
Nothing here is inferred where it can be measured; unknown stays null.

Usage:
    python scripts/profile_corpus.py "C:/path/to/DATA"
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover
    sys.exit("PyMuPDF required: pip install pymupdf")

# Structural probes. Deliberately conservative: these count *candidate*
# anchors, they do not claim to have parsed the document.
PROBES = {
    "section_headings": re.compile(r"^\s*(\d+[A-Z]?)\s*\.\s+[A-Z]", re.M),
    "section_word": re.compile(r"\bSection\s+\d+[A-Z]?\b"),
    "rule_word": re.compile(r"\bRule\s+\d+[A-Z]?\b"),
    "chapter": re.compile(r"^\s*CHAPTER\s+[IVXLC\d]+", re.M | re.I),
    "subsection": re.compile(r"^\s*\(\d+\)\s", re.M),
    "clause": re.compile(r"^\s*\([a-z]{1,2}\)\s", re.M),
    "form": re.compile(r"^\s*FORM\s+\d+", re.M | re.I),
    "schedule": re.compile(r"^\s*(?:THE\s+)?(?:FIRST|SECOND|THIRD|FOURTH)?\s*SCHEDULE\b", re.M | re.I),
    "fee_marker": re.compile(r"\bfee\b", re.I),
}

DEVANAGARI = re.compile("[\u0900-\u097f]")
YEAR = re.compile(r"\b(?:1[89]\d{2}|20[0-4]\d)\b")

# Text-quality probe. A PDF can carry a text layer that passes a raw
# character count while being unusable: legacy non-Unicode Devanagari fonts
# and bad OCR both produce dense Latin noise. Function-word density separates
# them. Real legal English runs 12-25%; garbled text runs near zero.
FUNCTION_WORDS = frozenset("""
the of and to in or by any such shall be is are was for that this with as
on at from not no it its his her which who whom under section act rule
person may must made make been have has had if all other than into upon
""".split())
TOKEN = re.compile(r"[A-Za-z]{2,}")
REPLACEMENT = "\ufffd"

DOC_CLASS_MAP = {
    "acts": "ACT",
    "rules": "RULES",
    "manuals": "MANUAL",
    "guidelines": "GUIDELINE",
}

DOMAIN_MAP = {
    "patents": "PATENT",
    "trade marks": "TRADEMARK",
    "trademarks": "TRADEMARK",
    "design": "DESIGN",
    "designs": "DESIGN",
    "copyrights": "COPYRIGHT",
    "copyright": "COPYRIGHT",
    "geographical indications": "GEOGRAPHICAL_INDICATION",
    "ayush": "AYUSH_REGULATORY",
}


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def classify_path(path: Path, root: Path):
    """(domain, doc_class, subgroup) from the folder layout, not from guesswork."""
    rel = path.relative_to(root)
    parts = [p.lower() for p in rel.parts[:-1]]
    domain = next((DOMAIN_MAP[p] for p in parts if p in DOMAIN_MAP), None)
    doc_class = next((DOC_CLASS_MAP[p] for p in parts if p in DOC_CLASS_MAP), None)
    subgroup = rel.parts[1] if len(rel.parts) > 2 else None
    return domain, doc_class, subgroup


def profile_pdf(path: Path, root: Path, sample_pages):
    domain, doc_class, subgroup = classify_path(path, root)
    rec = {
        "relpath": str(path.relative_to(root)).replace("\\", "/"),
        "file_name": path.name,
        "domain_from_path": domain,
        "doc_class_from_path": doc_class,
        "subgroup": subgroup,
        "size_bytes": path.stat().st_size,
        "sha256": sha256_of(path),
        "page_count": None,
        "text_chars": 0,
        "chars_per_page": 0.0,
        "pages_with_text": 0,
        "empty_page_ratio": None,
        "extractable": None,
        "devanagari_chars": 0,
        "latin_chars": 0,
        "devanagari_share": 0.0,
        "function_word_ratio": 0.0,
        "replacement_char_rate": 0.0,
        "text_quality": None,
        "language": None,
        "has_outline": None,
        "outline_entries": 0,
        "images_total": 0,
        "pdf_title": None,
        "pdf_producer": None,
        "pdf_creation_date": None,
        "encrypted": None,
        "years_in_name": [],
        "error": None,
    }
    for name in PROBES:
        rec["probe_" + name] = 0

    try:
        doc = fitz.open(path)
    except Exception as exc:  # corrupt / unreadable
        rec["error"] = "{}: {}".format(type(exc).__name__, exc)
        return rec

    with doc:
        rec["encrypted"] = bool(doc.is_encrypted)
        rec["page_count"] = doc.page_count
        meta = doc.metadata or {}
        rec["pdf_title"] = (meta.get("title") or "").strip() or None
        rec["pdf_producer"] = (meta.get("producer") or "").strip() or None
        rec["pdf_creation_date"] = (meta.get("creationDate") or "").strip() or None
        try:
            toc = doc.get_toc()
            rec["has_outline"] = bool(toc)
            rec["outline_entries"] = len(toc)
        except Exception:
            rec["has_outline"] = None

        n = doc.page_count if sample_pages is None else min(doc.page_count, sample_pages)
        texts = []
        pages_with_text = 0
        images = 0
        for i in range(n):
            try:
                page = doc.load_page(i)
                txt = page.get_text("text")
                images += len(page.get_images(full=True))
            except Exception:
                txt = ""
            if len(txt.strip()) > 40:
                pages_with_text += 1
            texts.append(txt)
        text = "\n".join(texts)

        rec["images_total"] = images
        rec["pages_with_text"] = pages_with_text
        rec["text_chars"] = len(text)
        rec["chars_per_page"] = round(len(text) / n, 1) if n else 0.0
        rec["empty_page_ratio"] = round(1 - pages_with_text / n, 3) if n else None
        # A born-digital legal PDF runs 1500-4000 chars/page.
        # Below ~200 chars/page it is a scan and needs OCR.
        rec["extractable"] = rec["chars_per_page"] >= 200

        deva = len(DEVANAGARI.findall(text))
        latin = sum(1 for c in text if "a" <= c <= "z" or "A" <= c <= "Z")
        rec["devanagari_chars"] = deva
        rec["latin_chars"] = latin
        rec["devanagari_share"] = (
            round(deva / (deva + latin), 3) if (deva + latin) else 0.0)

        tokens = [t.lower() for t in TOKEN.findall(text)]
        fw = sum(1 for t in tokens if t in FUNCTION_WORDS)
        rec["function_word_ratio"] = round(fw / len(tokens), 4) if tokens else 0.0
        rec["replacement_char_rate"] = (
            round(text.count(REPLACEMENT) / len(text) * 1000, 2) if text else 0.0)

        # Indian Gazette notifications carry Hindi and English renderings of the
        # same provision in one file. A file that is ~half Devanagari *and*
        # carries dense English function words is bilingual, not Hindi.
        share, has_english = rec["devanagari_share"], rec["function_word_ratio"] >= 0.05
        if not rec["extractable"]:
            rec["language"] = None  # cannot tell without OCR
        elif share >= 0.85:
            rec["language"] = "HINDI"
        elif share >= 0.15:
            rec["language"] = "BILINGUAL_HI_EN" if has_english else "HINDI"
        else:
            rec["language"] = "ENGLISH"

        # Quality is judged on the Latin text, so a Hindi-only document is not
        # penalised for lacking English function words.
        if not rec["extractable"]:
            rec["text_quality"] = "NO_TEXT_LAYER"
        elif rec["language"] == "HINDI":
            rec["text_quality"] = "NON_LATIN_UNVERIFIED"
        elif rec["function_word_ratio"] >= 0.15:
            rec["text_quality"] = "GOOD"
        elif rec["function_word_ratio"] >= 0.08:
            rec["text_quality"] = "DEGRADED"
        else:
            rec["text_quality"] = "GARBLED"

        for name, pattern in PROBES.items():
            rec["probe_" + name] = len(pattern.findall(text))
        rec["years_in_name"] = sorted({int(y) for y in YEAR.findall(path.stem)})[:4]

    return rec


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("root", help="corpus root containing the domain folders")
    ap.add_argument("--out", default="data/profiling", help="output directory")
    ap.add_argument("--sample-pages", type=int, default=None,
                    help="profile only the first N pages of each PDF (faster)")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    if not root.is_dir():
        print("not a directory: {}".format(root))
        return 1

    pdfs = sorted(root.rglob("*.pdf"))
    print("Profiling {} PDFs under {}\n".format(len(pdfs), root))

    records = []
    for i, path in enumerate(pdfs, 1):
        rec = profile_pdf(path, root, args.sample_pages)
        records.append(rec)
        flag = "ERR " if rec["error"] else ("SCAN" if not rec["extractable"] else "    ")
        print("[{:3d}/{}] {} {:>4}p {:>7.0f} c/p  {:<7} {}".format(
            i, len(pdfs), flag, rec["page_count"] if rec["page_count"] is not None else "?",
            rec["chars_per_page"], rec["language"] or "UNKNOWN", rec["relpath"][:78]))

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "corpus_profile.json").write_text(
        json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
    if records:
        fields = list(records[0].keys())
        with (out_dir / "corpus_profile.csv").open("w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
            w.writeheader()
            for r in records:
                row = dict(r)
                row["years_in_name"] = ";".join(str(y) for y in r["years_in_name"])
                w.writerow(row)

    # ---------------- aggregate ----------------
    ok = [r for r in records if not r["error"]]
    scans = [r for r in ok if not r["extractable"]]
    pages = sum(r["page_count"] or 0 for r in ok)
    by_lang = Counter(r["language"] or "UNKNOWN" for r in ok)
    by_domain = Counter(r["domain_from_path"] or "UNMAPPED" for r in ok)
    by_class = Counter(r["doc_class_from_path"] or "UNMAPPED" for r in ok)

    dupes = defaultdict(list)
    for r in ok:
        dupes[r["sha256"]].append(r["relpath"])
    exact_dupes = {k: v for k, v in dupes.items() if len(v) > 1}

    print("\n" + "=" * 78)
    print("files={}  errors={}  pages={:,}  bytes={:.1f} MB".format(
        len(records), len(records) - len(ok), pages,
        sum(r["size_bytes"] for r in records) / 1e6))
    print("scanned/no-text: {}".format(len(scans)))
    print("text quality: {}".format(dict(Counter(r["text_quality"] for r in ok))))
    print("language: {}".format(dict(by_lang)))
    print("domain:   {}".format(dict(by_domain)))
    print("class:    {}".format(dict(by_class)))

    cpp = [r["chars_per_page"] for r in ok if r["extractable"]]
    if cpp:
        print("chars/page on extractable: median={:.0f} min={:.0f} max={:.0f}".format(
            statistics.median(cpp), min(cpp), max(cpp)))
    est_chunks = sum(max(r["probe_section_headings"], r["probe_subsection"])
                     for r in ok if r["extractable"])
    print("structural anchors (rough chunk-count estimate): {:,}".format(est_chunks))

    if exact_dupes:
        print("\nexact duplicate content ({} groups):".format(len(exact_dupes)))
        for h, paths in exact_dupes.items():
            print("  {}  {}".format(h[:12], "\n                ".join(paths)))
    if scans:
        print("\nfiles needing OCR:")
        for r in scans:
            print("  {:>6.0f} c/p  {}".format(r["chars_per_page"], r["relpath"]))

    garbled = [r for r in ok if r["text_quality"] in ("GARBLED", "DEGRADED")]
    if garbled:
        print("\nfiles with a text layer that is present but unusable:")
        for r in sorted(garbled, key=lambda x: x["function_word_ratio"]):
            print("  fw={:.3f} {:<9} {}".format(
                r["function_word_ratio"], r["text_quality"], r["relpath"]))

    print("\nwrote {} and .csv".format(out_dir / "corpus_profile.json"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
