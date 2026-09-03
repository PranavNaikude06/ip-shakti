"""
OCR every scanned file in the DATA corpus and load the results into the
database built by build_corpus_db.py.

Scope: the 32 files profile_corpus.py flagged as having no extractable text
layer (chars_per_page < 200). For each:
  1. Render every page at 300 DPI and OCR it (Tesseract, English + Hindi).
  2. Recompute the same quality signals profile_corpus.py computes for the
     PDF-text-layer files, so OCR'd files are judged by the same yardstick.
  3. Update the file's source_file row in place (extraction_status becomes
     OCR_COMPLETED, not a new row).
  4. For the files that actually carry legal weight (authority_tier
     PRIMARY_LEGISLATION or SUBORDINATE_LEGISLATION), split the OCR text into
     provisions with a regex-based splitter and load provision / provision_text
     / chunk rows against the instrument_version that build_corpus_db.py
     already created for that file.

Stakeholder comment letters and drafts are still OCR'd (so they are
searchable as context) but never get provision/chunk rows: authority_tier is
NON_NORMATIVE_COMMENT / DRAFT_OR_NOTICE, weight zero, and the
assert_evidence_is_citable trigger would reject them as evidence anyway.

The regex splitter here is intentionally simple. It is not the project's
legal-aware chunker (backend/app/knowledge/), and OCR text is noisier than a
native PDF text layer, so citation_label values from this path are heuristic.
Every chunk it produces is stamped extraction_method='OCR' so this is visible
downstream, and the run is honest about failures: a file that OCRs to
function-word noise is left NO_TEXT_LAYER rather than marked complete.

Usage:
    python scripts/ocr_corpus.py --db data/ayurip.db
    python scripts/ocr_corpus.py --db data/ayurip.db --only "Design/Rules/*"
"""

from __future__ import annotations

import argparse
import fnmatch
import hashlib
import io
import json
import os
import re
import sqlite3
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    import fitz  # PyMuPDF
    import pytesseract
    from PIL import Image
except ImportError as exc:
    sys.exit("missing dependency: {}".format(exc))

ROOT = Path(__file__).resolve().parent.parent
PROFILE = ROOT / "data/profiling/corpus_profile.json"
OCR_OUT = ROOT / "data/ocr"
TESSDATA_DIR = ROOT / "data/tessdata"
TESSERACT_EXE = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
DATA_CORPUS_ROOT = Path("C:/Users/ADMIN/Downloads/DATA-20260903T053355Z-1-001/DATA")
KB_VERSION = "2026.09.03"

pytesseract.pytesseract.tesseract_cmd = TESSERACT_EXE
os.environ["TESSDATA_PREFIX"] = str(TESSDATA_DIR)
TESS_CONFIG = ""

DEVANAGARI = re.compile("[\u0900-\u097f]")
TOKEN = re.compile(r"[A-Za-z]{2,}")
FUNCTION_WORDS = frozenset("""
the of and to in or by any such shall be is are was for that this with as
on at from not no it its his her which who whom under section act rule
person may must made make been have has had if all other than into upon
""".split())

# Splits on a line that starts a numbered Section (Acts) or Rule (Rules).
# Deliberately loose: OCR line breaks are unreliable, so this anchors on the
# number-plus-period pattern rather than expecting clean paragraph structure.
SECTION_START = re.compile(
    r"^\s*(\d{1,3}[A-Z]?)\s*\.\s+(.{3,120}?)\s*$", re.M)
RULE_START = re.compile(
    r"^\s*(?:Rule\s+)?(\d{1,3}[A-Z]?)\s*\.\s+(.{3,120}?)\s*$", re.M)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def slug(value: str, limit: int = 48) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-").upper()
    return s[:limit] or "X"


def ocr_pdf(path: Path) -> tuple[str, list[int]]:
    """Return (full_text, chars_per_page) for one PDF via Tesseract."""
    texts, per_page = [], []
    with fitz.open(path) as doc:
        for i in range(doc.page_count):
            page = doc.load_page(i)
            pix = page.get_pixmap(dpi=300)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            txt = pytesseract.image_to_string(img, lang="eng+hin", config=TESS_CONFIG)
            texts.append(txt)
            per_page.append(len(txt))
    return "\n\f\n".join(texts), per_page


def quality_signals(text: str) -> dict:
    deva = len(DEVANAGARI.findall(text))
    latin = sum(1 for c in text if "a" <= c <= "z" or "A" <= c <= "Z")
    deva_share = round(deva / (deva + latin), 3) if (deva + latin) else 0.0
    tokens = [t.lower() for t in TOKEN.findall(text)]
    fw = sum(1 for t in tokens if t in FUNCTION_WORDS)
    fw_ratio = round(fw / len(tokens), 4) if tokens else 0.0

    if deva_share >= 0.85:
        language = "HINDI"
    elif deva_share >= 0.15:
        language = "BILINGUAL_HI_EN" if fw_ratio >= 0.05 else "HINDI"
    else:
        language = "ENGLISH"

    if language == "HINDI":
        quality = "NON_LATIN_UNVERIFIED"
    elif fw_ratio >= 0.15:
        quality = "GOOD"
    elif fw_ratio >= 0.08:
        quality = "DEGRADED"
    else:
        quality = "GARBLED"

    return {"devanagari_share": deva_share, "function_word_ratio": fw_ratio,
            "language": language, "quality": quality}


def split_provisions(text: str, is_rules: bool) -> list[tuple[str, str, str]]:
    """Best-effort (number, heading, body) triples from OCR'd Act/Rules text."""
    pattern = RULE_START if is_rules else SECTION_START
    matches = list(pattern.finditer(text))
    out = []
    for i, m in enumerate(matches):
        number, heading = m.group(1), m.group(2).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if len(body) < 20:
            continue
        out.append((number, heading, body))
    return out


def find_ocr_targets(cx: sqlite3.Connection, only: str | None):
    rows = cx.execute("""
        SELECT sf.source_file_id, sf.relpath, sf.page_count,
               iv.instrument_version_id, iv.instrument_id, iv.authority_tier,
               f.framework_code
          FROM source_file sf
          JOIN instrument_version iv ON iv.source_file_id = sf.source_file_id
          LEFT JOIN instrument_framework f ON f.instrument_id = iv.instrument_id
         WHERE sf.extraction_status = 'NO_TEXT_LAYER'
           AND sf.is_canonical = 1
         ORDER BY sf.relpath""").fetchall()
    if only:
        rows = [r for r in rows if fnmatch.fnmatch(r[1], only)]
    return rows


def load_provisions_for_file(cx, instrument_id, instrument_version_id,
                             framework_code, text, is_rules) -> int:
    triples = split_provisions(text, is_rules)
    n = 0
    for number, heading, body in triples:
        ptype = "RULE" if is_rules else "SECTION"
        pid = "PV-{}-{}".format(instrument_id, slug(number, 12))
        exists = cx.execute("SELECT 1 FROM provision WHERE provision_id=?",
                            (pid,)).fetchone()
        if not exists:
            label = ("Rule " if is_rules else "Section ") + number
            cx.execute(
                "INSERT INTO provision (provision_id, instrument_id, parent_id, "
                "provision_type, number, heading, citation_label, path, depth, "
                "sort_key) VALUES (?,?,NULL,?,?,?,?,?,0,?)",
                (pid, instrument_id, ptype, number, heading, label, number,
                 number.rjust(6, "0")))

        ptid = "PT-OCR-{}".format(pid)
        cx.execute(
            "INSERT OR REPLACE INTO provision_text (provision_text_id, "
            "provision_id, instrument_version_id, language, sibling_ordinal, "
            "body, char_count, text_sha256, extraction_method, created_at) "
            "VALUES (?,?,?,?,1,?,?,?,?,?)",
            (ptid, pid, instrument_version_id, "ENGLISH", body, len(body),
             sha(body), "OCR", now_iso()))

        cid = "CH-OCR-{}".format(pid)
        cx.execute(
            "INSERT OR REPLACE INTO chunk (chunk_id, source_chunk_id, "
            "provision_text_id, provision_id, instrument_version_id, "
            "framework_code, kb_version_id, language, body, char_count, "
            "token_count, citation_label, heading, created_at) "
            "VALUES (?,NULL,?,?,?,?,?,?,?,?,?,?,?,?)",
            (cid, ptid, pid, instrument_version_id, framework_code, KB_VERSION,
             "ENGLISH", body, len(body), max(1, len(body) // 4),
             ("Rule " if is_rules else "Section ") + number, heading, now_iso()))
        n += 1
    return n


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=str(ROOT / "data/ayurip.db"))
    ap.add_argument("--only", help="glob filter on relpath, e.g. 'Design/Rules/*'")
    ap.add_argument("--dpi", type=int, default=300)
    args = ap.parse_args()

    if not TESSDATA_DIR.exists():
        print("tessdata dir missing: {}".format(TESSDATA_DIR))
        return 1

    cx = sqlite3.connect(args.db)
    cx.execute("PRAGMA foreign_keys = ON")
    targets = find_ocr_targets(cx, args.only)
    print("OCR targets: {}".format(len(targets)))
    OCR_OUT.mkdir(parents=True, exist_ok=True)

    completed, provisions_total, failed = 0, 0, []

    for i, (sfid, relpath, page_count, ivid, iid, tier, framework) in enumerate(targets, 1):
        src = DATA_CORPUS_ROOT / relpath
        t0 = time.time()
        print("[{:2d}/{}] OCR  {:>3}p  {}".format(i, len(targets), page_count, relpath))
        if not src.exists():
            print("        MISSING: {}".format(src))
            failed.append((relpath, "file not found"))
            continue

        try:
            text, per_page = ocr_pdf(src)
        except Exception as exc:  # noqa: BLE001
            print("        OCR FAILED: {}".format(exc))
            failed.append((relpath, str(exc)))
            continue

        sig = quality_signals(text)
        pages_with_text = sum(1 for c in per_page if c > 40)
        chars_per_page = round(len(text) / page_count, 1) if page_count else 0.0
        dt = time.time() - t0

        out_path = OCR_OUT / (slug(relpath, 200) + ".txt")
        out_path.write_text(text, encoding="utf-8")

        # A file that OCR'd to noise is not marked complete.
        status = "OCR_COMPLETED" if sig["quality"] in ("GOOD", "DEGRADED",
                                                        "NON_LATIN_UNVERIFIED") else "FAILED"
        cx.execute(
            "UPDATE source_file SET extraction_status=?, text_char_count=?, "
            "chars_per_page=?, pages_with_text=?, text_quality=?, "
            "function_word_ratio=?, devanagari_share=?, detected_language=?, "
            "ingest_error=NULL WHERE source_file_id=?",
            (status, len(text), chars_per_page, pages_with_text, sig["quality"],
             sig["function_word_ratio"], sig["devanagari_share"], sig["language"],
             sfid))

        print("        {:>7.0f} c/p  {:<9} lang={:<16} fw={:.3f}  {:.1f}s -> {}".format(
            chars_per_page, sig["quality"], sig["language"],
            sig["function_word_ratio"], dt, status))

        if status != "OCR_COMPLETED":
            failed.append((relpath, "quality={}".format(sig["quality"])))
            cx.commit()
            continue
        completed += 1

        if tier in ("PRIMARY_LEGISLATION", "SUBORDINATE_LEGISLATION"):
            is_rules = tier == "SUBORDINATE_LEGISLATION"
            n = load_provisions_for_file(cx, iid, ivid, framework, text, is_rules)
            provisions_total += n
            print("        extracted {} provisions ({})".format(
                n, "Rule" if is_rules else "Section"))

        cx.commit()

    print("\n" + "=" * 78)
    print("OCR complete: {}/{} files, {} provisions loaded, {} failed".format(
        completed, len(targets), provisions_total, len(failed)))
    if failed:
        print("failed / low quality:")
        for relpath, reason in failed:
            print("  {:<70} {}".format(relpath[:70], reason))

    remaining = cx.execute(
        "SELECT count(*) FROM source_file WHERE extraction_status='NO_TEXT_LAYER'"
    ).fetchone()[0]
    print("source_file rows still NO_TEXT_LAYER: {}".format(remaining))
    cx.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
