"""
Build the AYUR-IP knowledge base from India Code (official Government of India source).

Usage:
    python scripts/ingest_kb.py                 # ingest all configured Acts
    python scripts/ingest_kb.py --only PATENT   # one domain
    python scripts/ingest_kb.py --list          # show configured targets

Outputs:
    data/processed/chunks.jsonl        legal-aware chunks, one JSON per line
    data/processed/documents.json      document inventory with provenance
    knowledge_base/documents.csv       human-readable inventory

Acts that cannot be resolved are reported as UNAVAILABLE and skipped. They are
never replaced with placeholder text.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.knowledge.chunker import chunk_section  # noqa: E402
from app.knowledge.indiacode_source import IndiaCodeClient  # noqa: E402
from app.models.core import DocumentMeta, Framework  # noqa: E402

# Ordered by importance to the flagship analysis. The first three carry the
# patent-exclusion, ABS and AYUSH-licensing provisions the demo depends on;
# without them the corresponding assessments correctly return
# INSUFFICIENT_EVIDENCE.
TARGETS: list[dict] = [
    {
        "document_id": "PAT-ACT-1970",
        "act_name": "The Patents Act, 1970",
        "domain": Framework.PATENT,
        "document_type": "ACT",
        "authority": "Department for Promotion of Industry and Internal Trade",
    },
    {
        "document_id": "BDA-ACT-2002",
        "act_name": "The Biological Diversity Act, 2002",
        "domain": Framework.BIODIVERSITY_ABS,
        "document_type": "ACT",
        "authority": "Ministry of Environment, Forest and Climate Change",
    },
    {
        "document_id": "DCA-ACT-1940",
        "act_name": "The Drugs and Cosmetics Act, 1940",
        "domain": Framework.REGULATORY,
        "document_type": "ACT",
        "authority": "Ministry of Health and Family Welfare",
    },
    {
        "document_id": "TM-ACT-1999",
        "act_name": "The Trade Marks Act, 1999",
        "domain": Framework.TRADEMARK,
        "document_type": "ACT",
        "authority": "Department for Promotion of Industry and Internal Trade",
    },
    {
        "document_id": "CR-ACT-1957",
        "act_name": "The Copyright Act, 1957",
        "domain": Framework.COPYRIGHT,
        "document_type": "ACT",
        "authority": "Department for Promotion of Industry and Internal Trade",
    },
    {
        "document_id": "DES-ACT-2000",
        "act_name": "The Designs Act, 2000",
        "domain": Framework.DESIGN,
        "document_type": "ACT",
        "authority": "Department for Promotion of Industry and Internal Trade",
    },
]

PROCESSED_DIR = ROOT / "data" / "processed"
KB_DIR = ROOT / "knowledge_base"


def content_hash(chunks: list[dict]) -> str:
    """Stable hash of a document's ingested content, for change detection."""
    h = hashlib.sha256()
    for c in sorted(chunks, key=lambda x: x["chunk_id"]):
        h.update(c["chunk_id"].encode())
        h.update(c["text"].encode())
    return h.hexdigest()


def ingest(only: str | None = None) -> int:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    KB_DIR.mkdir(parents=True, exist_ok=True)

    targets = [t for t in TARGETS if not only or t["domain"].value == only.upper()]
    if not targets:
        print(f"No targets match domain {only!r}")
        return 1

    all_chunks: list[dict] = []
    documents: list[DocumentMeta] = []
    unavailable: list[str] = []
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    with IndiaCodeClient() as client:
        for target in targets:
            name = target["act_name"]
            print(f"\n[{target['document_id']}] {name}")
            try:
                fetched = client.fetch_act(name)
            except Exception as exc:
                print(f"  ERROR  {type(exc).__name__}: {exc}")
                unavailable.append(f"{target['document_id']} (fetch error)")
                continue

            if not fetched:
                print("  UNAVAILABLE  no matching Act found on India Code")
                unavailable.append(f"{target['document_id']} (not found)")
                continue

            act_id, canonical, sections = fetched
            usable = [s for s in sections if (s.text or "").strip()]
            print(f"  act_id      {act_id}")
            print(f"  sections    {len(sections)} returned, {len(usable)} with text")

            doc_chunks: list[dict] = []
            pages: list[int] = []
            for section in usable:
                for chunk in chunk_section(
                    section,
                    document_id=target["document_id"],
                    domain=target["domain"],
                ):
                    doc_chunks.append(chunk.model_dump(mode="json"))
                if section.page:
                    pages.append(section.page)

            if not doc_chunks:
                print("  UNAVAILABLE  no usable section text")
                unavailable.append(f"{target['document_id']} (empty)")
                continue

            repealed = sum(1 for c in doc_chunks if c["status"] == "REPEALED")
            years = {s.act_year for s in usable if s.act_year}
            sample = next((s for s in usable if s.uri), None)

            documents.append(
                DocumentMeta(
                    document_id=target["document_id"],
                    document_name=canonical,
                    document_type=target["document_type"],
                    domain=target["domain"],
                    jurisdiction="INDIA",
                    authority=target["authority"],
                    publication_date=min(years) if years else None,
                    effective_date=None,
                    version=f"indiacode:{act_id}",
                    status="ACTIVE",
                    source_url=sample.uri if sample else None,
                    file_name=None,
                    sha256=content_hash(doc_chunks),
                    page_count=max(pages) if pages else None,
                    last_verified=now,
                )
            )
            all_chunks.extend(doc_chunks)
            print(f"  chunks      {len(doc_chunks)} ({repealed} from repealed provisions)")

    if not all_chunks:
        print("\nNo chunks produced. Knowledge base not written.")
        return 1

    chunks_path = PROCESSED_DIR / "chunks.jsonl"
    with chunks_path.open("w", encoding="utf-8") as fh:
        for chunk in all_chunks:
            fh.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    docs_path = PROCESSED_DIR / "documents.json"
    docs_path.write_text(
        json.dumps([d.model_dump(mode="json") for d in documents], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    csv_path = KB_DIR / "documents.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(DocumentMeta.model_fields.keys()))
        writer.writeheader()
        for d in documents:
            writer.writerow(d.model_dump(mode="json"))

    print("\n" + "=" * 62)
    print(f"documents ingested : {len(documents)}")
    print(f"chunks written     : {len(all_chunks)}")
    print(f"chunks.jsonl       : {chunks_path.relative_to(ROOT)}")
    print(f"documents.csv      : {csv_path.relative_to(ROOT)}")
    if unavailable:
        print(f"UNAVAILABLE        : {', '.join(unavailable)}")
    print("=" * 62)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest Indian Acts from India Code.")
    parser.add_argument("--only", help="Limit to one domain, e.g. PATENT")
    parser.add_argument("--list", action="store_true", help="List configured targets")
    args = parser.parse_args()

    if args.list:
        for t in TARGETS:
            print(f"{t['document_id']:14s} {t['domain'].value:22s} {t['act_name']}")
        return 0
    return ingest(args.only)


if __name__ == "__main__":
    raise SystemExit(main())
