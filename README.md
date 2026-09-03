# AYUR-IP

Evidence-grounded decision support for Ayurvedic product IP, traditional
knowledge, biodiversity/ABS and regulatory analysis. Not a chatbot: a
neuro-symbolic pipeline in which every conclusion is anchored to real statutory
text, the LLM only narrates findings it is handed, and a citation validator
sits between the LLM and the user.

## What is real here

- **Knowledge base**: 6 Central Acts ingested from India Code
  (indiacode.gov.in, official Government of India source) at **section and
  clause granularity** — 2,891 chunks with section numbers, page numbers,
  repeal status and official URIs from the authority itself. No PDF-parsing
  guesswork.
- **Hybrid retrieval**: BM25 + ONNX dense embeddings (bge-small, no PyTorch),
  Reciprocal Rank Fusion, provision-aware tokenisation, exact-provision
  metadata boosting, per-framework domain scoping.
- **Measured retrieval quality** (`scripts/eval_retrieval.py`, 20-question
  gold set verified against the corpus): numbers are computed at run time,
  never hard-coded.
- **Deterministic rule engine**: declarative rule pack; every rule anchored to
  provisions by structured metadata lookup. Missing law → INSUFFICIENT_EVIDENCE,
  never a fabricated finding.
- **Knowledge graph**: per-analysis NetworkX graph; personalised PageRank ranks
  provisions by structural relevance; reasoning paths extracted for the UI.
- **One grounded LLM call** (Groq, optional) followed by **span-level citation
  validation**: fabricated citations fail the narrative, which is then withheld.
- **Honest degradation**: no dense index → BM25-only (DEGRADED, reported); no
  LLM key → structured findings without narrative; no corpus for a framework →
  INSUFFICIENT_EVIDENCE + human escalation.

## Quickstart

```bash
# 1. Environment (venv lives on D: because C: is nearly full)
python -m venv D:/ayurip-env
D:/ayurip-env/Scripts/pip install -r backend/requirements.txt

# 2. Knowledge base (fetches official section text from indiacode.gov.in)
D:/ayurip-env/Scripts/python scripts/ingest_kb.py

# 3. Dense index (optional but recommended; ~15 min on a slow CPU, cached)
D:/ayurip-env/Scripts/python scripts/build_index.py

# 4. Retrieval evaluation
D:/ayurip-env/Scripts/python scripts/eval_retrieval.py           # hybrid
D:/ayurip-env/Scripts/python scripts/eval_retrieval.py --bm25    # ablation

# 5. Tests
cd backend && D:/ayurip-env/Scripts/python -m pytest tests/ -q

# 6. Run the API  (set GROQ_API_KEY in .env for the narrative layer)
D:/ayurip-env/Scripts/uvicorn app.main:app --app-dir backend --port 8000

# 7. Flagship demo
D:/ayurip-env/Scripts/python scripts/run_demo.py          # against the server
D:/ayurip-env/Scripts/python scripts/run_demo.py --local  # in-process
```

Environment variables: see `.env.example`. The system runs fully without a
`GROQ_API_KEY`; the narrative stage reports itself DEGRADED and the structured
findings stand alone.

## API

| Endpoint | Purpose |
|---|---|
| `POST /api/analyze` | Run the full pipeline on a product intake |
| `GET /api/analysis/{id}` | Stored analysis |
| `GET /api/analysis/{id}/evidence` | Evidence with provenance |
| `GET /api/analysis/{id}/graph` | Graph nodes/edges/signals for visualisation |
| `GET /api/kb/stats` | Knowledge-base inventory |
| `GET /api/health` | Liveness + component status |

## Layout

```
backend/app/
  models/core.py            # the API contract; every schema in one place
  knowledge/                # India Code source adapter, legal-aware chunker, lexicon
  rag/                      # embeddings (ONNX), hybrid retriever
  rules/                    # declarative rule pack + engine
  graph/                    # NetworkX graph build + PageRank signals
  services/                 # extraction, classifier, assessment, LLM, citations
  workflows/pipeline.py     # stage orchestration with per-stage timing
  main.py                   # FastAPI app
  db/schema.sql             # relational schema (PostgreSQL); 53 tables, 6 views
  db/integrity.sql          # the honesty rules, enforced as triggers
backend/tests/              # 27 tests, all offline
scripts/                    # ingest_kb, build_index, eval_retrieval, run_demo
scripts/profile_corpus.py   # measure a raw PDF corpus before ingesting it
scripts/analyze_corpus.py   # turn that profile into schema-shaping findings
scripts/build_corpus_db.py  # build the schema, load the real data, verify it
data/processed/             # chunks.jsonl, documents.json (generated)
data/profiling/             # corpus_profile.json, corpus_findings.json (generated)
knowledge_base/documents.csv# document inventory with hashes (generated)
docs/DATABASE_DESIGN.md     # why the schema looks the way it does
```

## Database

The schema is designed against a measured profile of the source corpus rather
than an assumed one. `docs/DATABASE_DESIGN.md` traces every non-obvious column
to the property of the data that forced it: scanned files with no text layer,
byte-identical documents filed under contradictory names, bilingual gazette
notifications, stakeholder comment letters sitting beside official manuals, and
three coexisting consolidations of the Patents Act.

```bash
python scripts/profile_corpus.py "<path>/DATA"   # measure the PDFs
python scripts/analyze_corpus.py                 # findings that shape the schema
python scripts/build_corpus_db.py --force        # build, load and verify
```

The last step is not a smoke test. It creates the schema, loads the profiled
corpus, the full knowledge base and every stored analysis, then attempts each
forbidden operation and requires the database to refuse it.

## Honesty rules baked into the code

- No fabricated provisions, citations, metrics, or model confidence.
- The classifier is a transparent weighted-feature scorer and says so in its
  own output (`method: WEIGHTED_FEATURES` + feature list + disclaimer).
- Graph signals name their algorithm (`personalized_pagerank`, `shortest_path`).
- Confidence is a disclosed weighted formula over disclosed components, and is
  labelled as evidence coverage, not legal probability.
- `INSUFFICIENT_EVIDENCE` is a first-class result and triggers human escalation.
