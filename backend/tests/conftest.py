import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

# Tests never depend on network, the dense model, or an LLM key.
os.environ["AYURIP_DENSE_ENABLED"] = "off"
os.environ["AYURIP_LLM_ENABLED"] = "false"

from app.rag.retriever import LegalRetriever, load_chunks, load_document_names  # noqa: E402
from app.rules.engine import AnchorResolver  # noqa: E402

CHUNKS_PATH = ROOT / "data" / "processed" / "chunks.jsonl"
DOCS_PATH = ROOT / "data" / "processed" / "documents.json"

requires_corpus = pytest.mark.skipif(
    not CHUNKS_PATH.exists(),
    reason="Knowledge base not ingested; run scripts/ingest_kb.py",
)


@pytest.fixture(scope="session")
def corpus():
    chunks = load_chunks(CHUNKS_PATH)
    names = load_document_names(DOCS_PATH)
    return chunks, names


@pytest.fixture(scope="session")
def retriever(corpus):
    chunks, names = corpus
    r = LegalRetriever(chunks, embedder=None)
    r.set_document_names(names)
    return r


@pytest.fixture(scope="session")
def resolver(corpus):
    chunks, names = corpus
    return AnchorResolver(chunks, names)


@pytest.fixture()
def demo_request():
    from app.models.core import AnalysisRequest

    return AnalysisRequest(
        product_name="Ashwagandha Stress Formula",
        description=(
            "Ashwagandha formulation using a modified extraction process for stress "
            "management, to be sold in India. Contains standardized withania somnifera "
            "root extract and tulsi."
        ),
        ingredients=["Ashwagandha"],
        claims=["stress management"],
        source="traditional",
        target_markets=["India"],
    )
