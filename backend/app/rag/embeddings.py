"""
Embedding layer.

Deliberately built on `fastembed` (ONNX Runtime) rather than
sentence-transformers: it avoids a multi-gigabyte PyTorch dependency, runs on
CPU, and loads in about a second. The concrete implementation sits behind the
`Embedder` protocol so it can be replaced without touching the retriever.

Dense retrieval is treated as an *enhancement*, never a requirement. If the
model cannot be loaded (no network on first run, disk full, incompatible
runtime), `get_embedder()` returns None and the retriever runs BM25-only in a
clearly reported DEGRADED state rather than failing the analysis.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Protocol, runtime_checkable

import numpy as np

logger = logging.getLogger(__name__)

DEFAULT_MODEL = os.getenv("AYURIP_EMBED_MODEL", "BAAI/bge-small-en-v1.5")


@runtime_checkable
class Embedder(Protocol):
    """Minimal contract the retriever depends on."""

    name: str
    dim: int

    def encode(self, texts: list[str], is_query: bool = False) -> np.ndarray:
        """Return L2-normalised embeddings, shape (len(texts), dim)."""
        ...


class FastEmbedEmbedder:
    """ONNX-backed dense embedder."""

    def __init__(self, model_name: str = DEFAULT_MODEL, cache_dir: str | Path | None = None) -> None:
        from fastembed import TextEmbedding

        self.name = model_name
        cache = str(cache_dir) if cache_dir else os.getenv("AYURIP_MODEL_CACHE")
        self._model = TextEmbedding(model_name=model_name, cache_dir=cache)
        probe = next(iter(self._model.embed(["dimension probe"])))
        self.dim = int(np.asarray(probe).shape[-1])

    def encode(self, texts: list[str], is_query: bool = False) -> np.ndarray:
        if not texts:
            return np.zeros((0, self.dim), dtype=np.float32)
        # BGE models are trained with an instruction prefix on the query side only.
        if is_query and "bge" in self.name.lower():
            texts = [f"Represent this sentence for searching relevant passages: {t}" for t in texts]
        vectors = np.asarray(list(self._model.embed(texts, batch_size=16)), dtype=np.float32)
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        return vectors / np.clip(norms, 1e-9, None)


def get_embedder(model_name: str = DEFAULT_MODEL, cache_dir: str | Path | None = None) -> Embedder | None:
    """Load the dense embedder, or return None if unavailable.

    Returning None is a supported operating mode, not an error path.
    """
    mode = os.getenv("AYURIP_DENSE_ENABLED", "auto").lower()
    if mode in {"0", "false", "off", "no"}:
        logger.info("Dense retrieval disabled by configuration.")
        return None
    try:
        embedder = FastEmbedEmbedder(model_name, cache_dir)
        logger.info("Dense embedder ready: %s (dim=%d)", embedder.name, embedder.dim)
        return embedder
    except Exception as exc:
        logger.warning("Dense embedder unavailable (%s: %s); BM25-only retrieval.", type(exc).__name__, exc)
        return None
