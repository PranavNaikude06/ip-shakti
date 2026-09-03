"""
AYUR-IP backend API.

Run (from repo root):
    uvicorn app.main:app --app-dir backend --port 8000

Endpoints:
    POST /api/analyze                 full analysis pipeline
    GET  /api/analysis/{id}           stored analysis
    GET  /api/analysis/{id}/evidence  evidence list only
    GET  /api/analysis/{id}/graph     graph payload only
    GET  /api/kb/stats                knowledge-base inventory
    GET  /api/health                  liveness + component status
"""

from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Pick up GROQ_API_KEY and AYURIP_* settings from a repo-root .env, if present.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from app.models.core import AnalysisRequest, AnalysisResponse, AnalysisResult
from app.rag.embeddings import get_embedder
from app.rag.retriever import LegalRetriever, load_chunks, load_document_names
from app.rules.engine import AnchorResolver
from app.workflows.pipeline import PipelineDeps, run_analysis

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
logger = logging.getLogger("ayurip")

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.getenv("AYURIP_DATA_DIR", ROOT / "data"))
ANALYSES_DIR = DATA_DIR / "analyses"

_state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    chunks = load_chunks(DATA_DIR / "processed" / "chunks.jsonl")
    doc_names = load_document_names(DATA_DIR / "processed" / "documents.json")
    embedder = get_embedder()
    retriever = LegalRetriever(chunks, embedder)
    retriever.set_document_names(doc_names)
    if embedder is not None:
        retriever.build_dense(cache_path=DATA_DIR / "indices" / "dense.npy")
    _state["deps"] = PipelineDeps(
        retriever=retriever,
        resolver=AnchorResolver(chunks, doc_names),
        kb_documents=len(doc_names),
        kb_chunks=len(chunks),
    )
    ANALYSES_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(
        "AYUR-IP ready: %d chunks, %d documents, dense=%s",
        len(chunks), len(doc_names), retriever.dense_enabled,
    )
    yield
    _state.clear()


app = FastAPI(
    title="AYUR-IP",
    description="Evidence-grounded IP, TK, biodiversity and regulatory decision support for Ayurvedic products.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("AYURIP_CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _deps() -> PipelineDeps:
    deps = _state.get("deps")
    if deps is None:
        raise HTTPException(status_code=503, detail="Service still starting up.")
    return deps


def _store(result: AnalysisResult) -> None:
    path = ANALYSES_DIR / f"{result.analysis_id}.json"
    path.write_text(result.model_dump_json(indent=1), encoding="utf-8")


def _load(analysis_id: str) -> AnalysisResult:
    if not analysis_id.replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid analysis id.")
    path = ANALYSES_DIR / f"{analysis_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found.")
    return AnalysisResult.model_validate_json(path.read_text(encoding="utf-8"))


@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze(request: AnalysisRequest) -> AnalysisResponse:
    deps = _deps()
    try:
        result = run_analysis(request, deps)
    except Exception:
        logger.exception("Analysis pipeline failed")
        raise HTTPException(status_code=500, detail="Analysis failed; see server logs.")
    _store(result)
    errored = [s.name for s in result.pipeline if s.status == "ERROR"]
    return AnalysisResponse(
        analysis_id=result.analysis_id,
        status="PARTIAL" if errored else "COMPLETED",
        result=result,
    )


@app.get("/api/analysis/{analysis_id}", response_model=AnalysisResult)
def get_analysis(analysis_id: str) -> AnalysisResult:
    return _load(analysis_id)


@app.get("/api/analysis/{analysis_id}/evidence")
def get_evidence(analysis_id: str) -> dict:
    result = _load(analysis_id)
    return {"analysis_id": analysis_id, "evidence": [e.model_dump(mode="json") for e in result.evidence]}


@app.get("/api/analysis/{analysis_id}/graph")
def get_graph(analysis_id: str) -> dict:
    result = _load(analysis_id)
    return {"analysis_id": analysis_id, **result.graph.model_dump(mode="json")}


@app.get("/api/kb/stats")
def kb_stats() -> dict:
    deps = _deps()
    docs_path = DATA_DIR / "processed" / "documents.json"
    documents = json.loads(docs_path.read_text(encoding="utf-8")) if docs_path.exists() else []
    return {
        "documents": documents,
        "chunk_count": deps.kb_chunks,
        "dense_retrieval": deps.retriever.dense_enabled,
    }


@app.get("/api/health")
def health() -> dict:
    deps = _state.get("deps")
    return {
        "status": "ok" if deps else "starting",
        "kb_chunks": deps.kb_chunks if deps else 0,
        "kb_documents": deps.kb_documents if deps else 0,
        "dense_retrieval": bool(deps and deps.retriever.dense_enabled),
        "llm_configured": bool(os.getenv("GROQ_API_KEY", "").strip()),
    }
