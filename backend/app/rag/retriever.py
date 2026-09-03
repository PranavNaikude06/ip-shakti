"""
Hybrid legal retrieval: BM25 + dense vectors, fused with Reciprocal Rank Fusion.

Why hybrid, concretely: a user asking about "traditional knowledge in patent
exclusions" needs semantic matching, while a user citing "Section 3(p)" needs
exact lexical matching. Neither retriever alone serves both, and legal work
depends on the exact case.

Three legal-specific behaviours distinguish this from a generic RAG retriever:

1. **Provision-aware tokenisation** - "Section 3(p)" also emits the tokens
   ``sec3p`` and ``s3``, so citation-style queries match the right chunk.
2. **Exact-provision boosting** - when a query names a provision, chunks whose
   structured ``section``/``subsection`` fields match are promoted. This is a
   metadata match, not a text heuristic.
3. **Domain scoping** - each legal framework retrieves only from its own
   corpus, so an ABS question is never answered with trade mark text.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Iterable

import numpy as np
from rank_bm25 import BM25Okapi

from app.models.core import Evidence, Framework, LegalChunk, RetrievalMethod
from app.rag.embeddings import Embedder

logger = logging.getLogger(__name__)

RRF_K = 60
_WORD_RE = re.compile(r"[a-z0-9]+")
# "Section 3(p)", "sec. 3", "s 3(1)(a)", "3(p)"
_PROVISION_RE = re.compile(
    r"(?:\b(?:section|sec\.?|s\.)\s*)?(?P<num>\d{1,3}[A-Z]{0,2})\s*(?:\((?P<sub>[a-z0-9]{1,4})\))?",
    re.IGNORECASE,
)
_EXPLICIT_PROVISION_RE = re.compile(
    r"\b(?:section|sec\.?|s\.)\s*(?P<num>\d{1,3}[A-Z]{0,2})\s*(?:\((?P<sub>[a-z0-9]{1,4})\))?",
    re.IGNORECASE,
)


def tokenize(text: str) -> list[str]:
    """Lexical tokens plus synthetic provision tokens for citation queries."""
    lowered = text.lower()
    tokens = _WORD_RE.findall(lowered)
    for match in _EXPLICIT_PROVISION_RE.finditer(text):
        num = (match.group("num") or "").lower()
        sub = (match.group("sub") or "").lower()
        if num:
            tokens.append(f"s{num}")
            if sub:
                tokens.append(f"sec{num}{sub}")
    return tokens


def parse_provisions(query: str) -> list[tuple[str, str | None]]:
    """Extract explicitly cited provisions, e.g. [('3', 'p')]."""
    found: list[tuple[str, str | None]] = []
    for match in _EXPLICIT_PROVISION_RE.finditer(query):
        num = match.group("num")
        sub = match.group("sub")
        if num:
            found.append((num.lower(), sub.lower() if sub else None))
    return found


class LegalRetriever:
    """In-process hybrid index over legal chunks.

    Sized for a hackathon corpus (thousands of chunks), where a NumPy matrix
    product is faster than a vector-database round trip and has no service
    dependency. `search` returns Evidence objects carrying full provenance.
    """

    def __init__(self, chunks: list[LegalChunk], embedder: Embedder | None = None) -> None:
        self.chunks = chunks
        self.embedder = embedder
        self._corpus_tokens = [tokenize(c.text) for c in chunks]
        self._bm25 = BM25Okapi(self._corpus_tokens) if chunks else None
        self._matrix: np.ndarray | None = None
        self._doc_names: dict[str, str] = {}

    # -- construction ----------------------------------------------------

    def set_document_names(self, mapping: dict[str, str]) -> None:
        self._doc_names = mapping

    @property
    def dense_enabled(self) -> bool:
        return self._matrix is not None and self.embedder is not None

    def build_dense(self, cache_path: Path | None = None, batch_size: int = 256) -> bool:
        """Embed the corpus, reusing a cached matrix when it matches."""
        if self.embedder is None or not self.chunks:
            return False

        if cache_path and cache_path.exists():
            try:
                cached = np.load(cache_path)
                if cached.shape[0] == len(self.chunks) and cached.shape[1] == self.embedder.dim:
                    self._matrix = cached
                    logger.info("Loaded cached embeddings %s", cached.shape)
                    return True
                logger.info("Embedding cache shape mismatch; rebuilding.")
            except Exception as exc:
                logger.warning("Could not load embedding cache: %s", exc)

        vectors: list[np.ndarray] = []
        for start in range(0, len(self.chunks), batch_size):
            batch = [c.text for c in self.chunks[start:start + batch_size]]
            vectors.append(self.embedder.encode(batch))
        self._matrix = np.vstack(vectors).astype(np.float32)

        if cache_path:
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            np.save(cache_path, self._matrix)
        logger.info("Built dense index %s", self._matrix.shape)
        return True

    # -- retrieval -------------------------------------------------------

    def _candidate_indices(self, domains: Iterable[Framework] | None) -> list[int] | None:
        if not domains:
            return None
        wanted = {d.value if isinstance(d, Framework) else str(d) for d in domains}
        return [i for i, c in enumerate(self.chunks) if c.domain.value in wanted]

    def search(
        self,
        query: str,
        top_k: int = 8,
        domains: Iterable[Framework] | None = None,
        candidate_pool: int = 50,
        include_repealed: bool = False,
    ) -> list[tuple[LegalChunk, float, RetrievalMethod]]:
        """Return ranked (chunk, score, method) triples for a query."""
        if not self.chunks or self._bm25 is None:
            return []

        allowed = self._candidate_indices(domains)
        allowed_set = set(allowed) if allowed is not None else None

        def permitted(idx: int) -> bool:
            if allowed_set is not None and idx not in allowed_set:
                return False
            if not include_repealed and self.chunks[idx].status == "REPEALED":
                return False
            return True

        # --- BM25 ranking
        bm25_scores = self._bm25.get_scores(tokenize(query))
        bm25_order = [i for i in np.argsort(bm25_scores)[::-1] if permitted(int(i))][:candidate_pool]
        bm25_rank = {int(idx): rank for rank, idx in enumerate(bm25_order)}

        # --- Dense ranking
        dense_rank: dict[int, int] = {}
        if self.dense_enabled:
            qvec = self.embedder.encode([query], is_query=True)[0]
            sims = self._matrix @ qvec
            dense_order = [i for i in np.argsort(sims)[::-1] if permitted(int(i))][:candidate_pool]
            dense_rank = {int(idx): rank for rank, idx in enumerate(dense_order)}

        # --- Reciprocal Rank Fusion
        fused: dict[int, float] = {}
        for idx, rank in bm25_rank.items():
            fused[idx] = fused.get(idx, 0.0) + 1.0 / (RRF_K + rank)
        for idx, rank in dense_rank.items():
            fused[idx] = fused.get(idx, 0.0) + 1.0 / (RRF_K + rank)

        # --- Exact provision boost (structured metadata match, not text match)
        for num, sub in parse_provisions(query):
            for idx, chunk in enumerate(self.chunks):
                if not permitted(idx):
                    continue
                if (chunk.section or "").lower() != num:
                    continue
                if sub is None or (chunk.subsection or "").lower() == sub:
                    fused[idx] = fused.get(idx, 0.0) + (0.5 if sub else 0.2)

        if not fused:
            return []

        ranked = sorted(fused.items(), key=lambda kv: kv[1], reverse=True)[:top_k]
        results: list[tuple[LegalChunk, float, RetrievalMethod]] = []
        for idx, score in ranked:
            in_bm25, in_dense = idx in bm25_rank, idx in dense_rank
            method = (
                RetrievalMethod.HYBRID if in_bm25 and in_dense
                else RetrievalMethod.DENSE if in_dense
                else RetrievalMethod.BM25
            )
            results.append((self.chunks[idx], float(score), method))
        return results

    def to_evidence(
        self,
        results: list[tuple[LegalChunk, float, RetrievalMethod]],
        start_index: int = 1,
        prefix: str = "EVID",
    ) -> list[Evidence]:
        """Convert ranked chunks into Evidence objects with stable IDs."""
        evidence: list[Evidence] = []
        for offset, (chunk, score, method) in enumerate(results):
            evidence.append(
                Evidence(
                    evidence_id=f"{prefix}-{start_index + offset:03d}",
                    chunk_id=chunk.chunk_id,
                    document_id=chunk.document_id,
                    document_name=self._doc_names.get(chunk.document_id, chunk.document_id),
                    domain=chunk.domain,
                    jurisdiction=chunk.jurisdiction,
                    provision=chunk.provision,
                    heading=chunk.heading,
                    page=chunk.page_start,
                    text=chunk.text,
                    score=round(score, 5),
                    retrieval_method=method,
                    status=chunk.status,
                )
            )
        return evidence


# --------------------------------------------------------------------------
# Loading
# --------------------------------------------------------------------------

def load_chunks(path: Path) -> list[LegalChunk]:
    if not path.exists():
        return []
    chunks: list[LegalChunk] = []
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                chunks.append(LegalChunk.model_validate_json(line))
    return chunks


def load_document_names(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    docs = json.loads(path.read_text(encoding="utf-8"))
    return {d["document_id"]: d["document_name"] for d in docs}
