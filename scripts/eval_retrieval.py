"""
Retrieval evaluation against the gold set.

Usage:
    python scripts/eval_retrieval.py            # hybrid if dense index exists
    python scripts/eval_retrieval.py --bm25     # lexical only, for ablation

Reports Recall@1/5/10, MRR, and section-level accuracy, broken down by question
type. Numbers printed here are computed from the actual corpus at run time --
none are hard-coded, and the script is the only source for any retrieval metric
quoted about this project.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

os.environ.setdefault("AYURIP_MODEL_CACHE", str(Path("D:/ayurip-env/models")))

from app.rag.embeddings import get_embedder  # noqa: E402
from app.rag.retriever import LegalRetriever, load_chunks, load_document_names  # noqa: E402


def matches(chunk, q: dict) -> bool:
    """A hit requires the right document AND the right section.

    Subsection is checked only when the gold answer specifies one, so a
    question about section 21 generally is satisfied by any of its clauses.
    """
    if chunk.document_id != q["expected_document"]:
        return False
    if (chunk.section or "").lower() != str(q["expected_section"]).lower():
        return False
    want_sub = q.get("expected_subsection")
    if want_sub:
        return (chunk.subsection or "").lower() == str(want_sub).lower()
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bm25", action="store_true", help="Disable dense retrieval (ablation)")
    parser.add_argument("--k", type=int, default=10)
    args = parser.parse_args()

    gold = json.loads((ROOT / "data" / "evaluation" / "retrieval_gold.json").read_text(encoding="utf-8"))
    questions = gold["questions"]

    chunks = load_chunks(ROOT / "data" / "processed" / "chunks.jsonl")
    if not chunks:
        print("No corpus. Run scripts/ingest_kb.py first.")
        return 1

    embedder = None if args.bm25 else get_embedder()
    retriever = LegalRetriever(chunks, embedder)
    retriever.set_document_names(load_document_names(ROOT / "data" / "processed" / "documents.json"))

    dense_ok = False
    if embedder is not None:
        dense_ok = retriever.build_dense(cache_path=ROOT / "data" / "indices" / "dense.npy")

    mode = "HYBRID (BM25 + dense)" if dense_ok else "BM25 only"
    print(f"corpus : {len(chunks)} chunks")
    print(f"mode   : {mode}")
    print(f"gold   : {len(questions)} questions\n")

    ranks: list[int | None] = []
    by_type: dict[str, list[int | None]] = defaultdict(list)
    failures: list[tuple[str, str]] = []

    for q in questions:
        results = retriever.search(q["question"], top_k=args.k)
        rank: int | None = None
        for i, (chunk, _score, _m) in enumerate(results, start=1):
            if matches(chunk, q):
                rank = i
                break
        ranks.append(rank)
        by_type[q["type"]].append(rank)
        status = f"@{rank}" if rank else "MISS"
        if rank is None or rank > 3:
            top = results[0][0] if results else None
            got = f"{top.document_id} {top.provision}" if top else "nothing"
            failures.append((q["id"], f"{status:5s} {q['question'][:58]!r} -> got {got}"))
        print(f"  {q['id']} {status:5s} {q['type']:18s} {q['question'][:52]}")

    def recall_at(n: int, rs: list[int | None]) -> float:
        return sum(1 for r in rs if r is not None and r <= n) / max(len(rs), 1)

    def mrr(rs: list[int | None]) -> float:
        return sum(1.0 / r for r in rs if r is not None) / max(len(rs), 1)

    print("\n" + "=" * 62)
    print(f"MODE          : {mode}")
    print(f"Recall@1      : {recall_at(1, ranks):.3f}")
    print(f"Recall@5      : {recall_at(5, ranks):.3f}")
    print(f"Recall@10     : {recall_at(10, ranks):.3f}")
    print(f"MRR           : {mrr(ranks):.3f}")
    print("-" * 62)
    for qtype, rs in sorted(by_type.items()):
        print(f"  {qtype:20s} n={len(rs):2d}  R@5={recall_at(5, rs):.2f}  MRR={mrr(rs):.2f}")
    if failures:
        print("-" * 62)
        print("Below rank 3:")
        for qid, detail in failures:
            print(f"  {qid} {detail}")
    print("=" * 62)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
