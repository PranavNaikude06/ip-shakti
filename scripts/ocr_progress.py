"""Show OCR batch progress. Safe to run at any time; read-only."""
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
db = ROOT / "data/ayurip.db"
cx = sqlite3.connect("file:{}?mode=ro".format(db), uri=True)

rows = dict(cx.execute(
    "SELECT extraction_status, count(*) FROM source_file GROUP BY 1").fetchall())
done = rows.get("OCR_COMPLETED", 0)
left = rows.get("NO_TEXT_LAYER", 0)
failed = rows.get("FAILED", 0)
total = done + left + failed

bar_w = 44
filled = int(bar_w * done / total) if total else 0
print("\nOCR  [{}{}]  {}/{} files".format(
    "#" * filled, "." * (bar_w - filled), done, total))
if failed:
    print("     {} failed / low quality".format(failed))

pages = cx.execute(
    "SELECT COALESCE(sum(page_count),0) FROM source_file "
    "WHERE extraction_status='OCR_COMPLETED'").fetchone()[0]
pages_left = cx.execute(
    "SELECT COALESCE(sum(page_count),0) FROM source_file "
    "WHERE extraction_status='NO_TEXT_LAYER'").fetchone()[0]
print("     {:,} pages done, {:,} pages remaining".format(pages, pages_left))

chunks = cx.execute(
    "SELECT count(*) FROM chunk WHERE chunk_id LIKE 'CH-OCR-%'").fetchone()[0]
print("     {} provisions extracted from OCR'd law".format(chunks))

recent = cx.execute(
    "SELECT relpath, page_count, text_quality, detected_language "
    "FROM source_file WHERE extraction_status='OCR_COMPLETED' "
    "ORDER BY relpath").fetchall()
if recent:
    print("\n  completed:")
    for relpath, pc, q, lang in recent[-8:]:
        print("    {:>3}p  {:<9} {:<16} {}".format(
            pc, q or "-", lang or "-", relpath[:58]))

nxt = cx.execute(
    "SELECT relpath, page_count FROM source_file "
    "WHERE extraction_status='NO_TEXT_LAYER' ORDER BY relpath LIMIT 1").fetchone()
if nxt:
    print("\n  in flight / next: {} ({}p)".format(nxt[0][:60], nxt[1]))
print()
