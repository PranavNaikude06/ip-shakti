"""
Run the flagship demo analysis against a running backend (or in-process if
--local) and pretty-print the result. Also writes the full JSON to
data/analyses/ so the frontend team has a real payload to build against.

Usage:
    python scripts/run_demo.py           # POST to http://localhost:8000
    python scripts/run_demo.py --local   # run pipeline in-process, no server
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

DEMO_REQUEST = {
    "product_name": "Ashwagandha Stress Formula",
    "description": (
        "I developed an Ashwagandha formulation using a modified extraction process "
        "for stress management and want to sell it in India. Contains standardized "
        "Withania somnifera root extract and tulsi."
    ),
    "ingredients": ["Ashwagandha"],
    "claims": ["stress management"],
    "source": "traditional",
    "target_markets": ["India"],
}


def show(result: dict) -> None:
    print(f"\nANALYSIS {result['analysis_id']}")
    print("=" * 66)
    print("PIPELINE")
    for stage in result["pipeline"]:
        detail = f"  {stage['detail']}" if stage.get("detail") else ""
        print(f"  {stage['name']:22s} {stage['status']:9s} {stage['duration_ms']:8.1f}ms{detail}")
    print("\nASSESSMENTS")
    for name, assessment in result["assessments"].items():
        print(f"  {name:22s} {assessment['status']:24s} confidence={assessment['confidence_level']}")
    print(f"\nFINDINGS ({len(result['findings'])})")
    for finding in result["findings"]:
        evidence = ", ".join(finding["evidence_ids"])
        print(f"  {finding['finding_id']} [{finding['framework']}] {finding['statement'][:80]}...")
        print(f"        evidence: {evidence}")
    print(f"\nEVIDENCE ({len(result['evidence'])})")
    for ev in result["evidence"][:12]:
        print(f"  {ev['evidence_id']:12s} {ev['document_name'][:34]:34s} {str(ev['provision']):16s} p.{ev['page']}")
    print("\nGRAPH SIGNALS")
    for signal in result["graph"]["signals"][:6]:
        print(f"  [{signal['signal_type']}] {signal['description'][:88]}")
    print(f"\nCONFIDENCE  {result['confidence']['overall']} ({result['confidence']['level']})")
    for c in result["confidence"]["components"]:
        print(f"  {c['name']:20s} {c['value']:.2f} x{c['weight']:.2f}  {c['rationale'][:60]}")
    esc = result["escalation"]
    print(f"\nESCALATION  required={esc['required']} priority={esc['priority']}")
    for reason in esc["reasons"]:
        print(f"  - {reason}")
    exp = result["explanation"]
    if exp["available"]:
        print(f"\nEXPLANATION ({exp['model']})")
        print(f"  {exp['summary']}")
        cr = result["citation_report"]
        print(f"\nCITATION VALIDATION: {cr['verified']}/{cr['total_claims']} verified, "
              f"{cr['fabricated']} fabricated, passed={cr['passed']}")
    else:
        print(f"\nEXPLANATION: offline ({exp['offline_reason']})")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--local", action="store_true")
    parser.add_argument("--url", default="http://localhost:8000")
    args = parser.parse_args()

    if args.local:
        os.environ.setdefault("AYURIP_MODEL_CACHE", "D:/ayurip-env/models")
        from app.models.core import AnalysisRequest
        from app.rag.embeddings import get_embedder
        from app.rag.retriever import LegalRetriever, load_chunks, load_document_names
        from app.rules.engine import AnchorResolver
        from app.workflows.pipeline import PipelineDeps, run_analysis

        chunks = load_chunks(ROOT / "data" / "processed" / "chunks.jsonl")
        names = load_document_names(ROOT / "data" / "processed" / "documents.json")
        retriever = LegalRetriever(chunks, get_embedder())
        retriever.set_document_names(names)
        retriever.build_dense(cache_path=ROOT / "data" / "indices" / "dense.npy")
        deps = PipelineDeps(retriever=retriever, resolver=AnchorResolver(chunks, names),
                            kb_documents=len(names), kb_chunks=len(chunks))
        result = run_analysis(AnalysisRequest(**DEMO_REQUEST), deps).model_dump(mode="json")
    else:
        import httpx

        response = httpx.post(f"{args.url}/api/analyze", json=DEMO_REQUEST, timeout=120)
        response.raise_for_status()
        result = response.json()["result"]

    out = ROOT / "data" / "analyses" / f"{result['analysis_id']}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=1, ensure_ascii=False), encoding="utf-8")
    show(result)
    print(f"\nfull JSON: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
