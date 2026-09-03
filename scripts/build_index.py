"""
Build the dense embedding index over ingested legal chunks.

Usage:
    python scripts/build_index.py

Writes data/indices/dense.npy. Safe to re-run: the cache is reused when its
shape matches the corpus. BM25 is built in-process at startup and needs no
persistence.
"""

from __future__ import annotations

import logging
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

os.environ.setdefault("AYURIP_MODEL_CACHE", str(Path("D:/ayurip-env/models")))

from app.rag.embeddings import get_embedder  # noqa: E402
from app.rag.retriever import LegalRetriever, load_chunks  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def main() -> int:
    chunks_path = ROOT / "data" / "processed" / "chunks.jsonl"
    chunks = load_chunks(chunks_path)
    if not chunks:
        print(f"No chunks at {chunks_path}. Run scripts/ingest_kb.py first.")
        return 1
    print(f"corpus: {len(chunks)} chunks")

    t0 = time.time()
    embedder = get_embedder()
    if embedder is None:
        print("Dense embedder unavailable. System will run BM25-only.")
        return 1
    print(f"embedder: {embedder.name} dim={embedder.dim} (loaded in {time.time()-t0:.1f}s)")

    retriever = LegalRetriever(chunks, embedder)
    t1 = time.time()
    ok = retriever.build_dense(cache_path=ROOT / "data" / "indices" / "dense.npy")
    if not ok:
        print("Dense index build failed.")
        return 1
    print(f"dense index built in {time.time()-t1:.1f}s -> data/indices/dense.npy")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
