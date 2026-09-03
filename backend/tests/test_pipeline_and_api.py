import pytest

from app.models.core import AnalysisRequest, AssessmentStatus, ConfidenceLevel
from tests.conftest import requires_corpus


@requires_corpus
def test_full_pipeline_offline(demo_request, retriever, resolver, corpus):
    from app.workflows.pipeline import PipelineDeps, run_analysis

    chunks, names = corpus
    deps = PipelineDeps(retriever=retriever, resolver=resolver,
                        kb_documents=len(names), kb_chunks=len(chunks))
    result = run_analysis(demo_request, deps)

    stage_status = {s.name: s.status for s in result.pipeline}
    assert stage_status["entity_extraction"] == "OK"
    assert stage_status["rule_engine"] == "OK"
    assert stage_status["knowledge_graph"] == "OK"
    assert stage_status["llm_explanation"] == "DEGRADED"  # no key in tests

    # Multi-framework: all four Indian frameworks assessed with findings.
    assert result.assessments["patent"].status == AssessmentStatus.REVIEW_REQUIRED
    assert result.assessments["biodiversity_abs"].status == AssessmentStatus.REVIEW_REQUIRED
    assert result.assessments["traditional_knowledge"].status == AssessmentStatus.POTENTIAL_OVERLAP
    assert result.assessments["regulatory"].status == AssessmentStatus.LIKELY_APPLICABLE
    assert result.assessments["international"].status == AssessmentStatus.NOT_ASSESSED

    # Every finding is evidence-backed and every evidence id resolves.
    registry = result.evidence_by_id()
    assert result.findings
    for finding in result.findings:
        assert finding.evidence_ids
        for eid in finding.evidence_ids:
            assert eid in registry

    # The statutory interaction (BDA s.6 vs patent filing) is detected.
    assert any(i.escalation_required for i in result.interactions)
    assert result.escalation.required

    # Graph carries the reasoning chain.
    node_types = {n.type for n in result.graph.nodes}
    assert {"PRODUCT", "INGREDIENT", "BIOLOGICAL_RESOURCE", "SECTION", "FRAMEWORK"} <= node_types
    assert any(s.signal_type == "PROVISION_RELEVANCE" for s in result.graph.signals)
    assert any(s.signal_type == "REASONING_PATH" for s in result.graph.signals)

    # Confidence is transparent: components and weights are present.
    assert result.confidence.level in ConfidenceLevel
    assert result.confidence.components


@requires_corpus
def test_export_product_gets_insufficient_evidence(retriever, resolver, corpus):
    from app.workflows.pipeline import PipelineDeps, run_analysis

    chunks, names = corpus
    deps = PipelineDeps(retriever=retriever, resolver=resolver,
                        kb_documents=len(names), kb_chunks=len(chunks))
    request = AnalysisRequest(
        product_name="Ashwagandha Export Capsules",
        description="Ashwagandha capsules for the US market.",
        ingredients=["Ashwagandha"],
        source="traditional",
        target_markets=["USA"],
    )
    result = run_analysis(request, deps)
    intl = result.assessments["international"]
    assert intl.status == AssessmentStatus.INSUFFICIENT_EVIDENCE
    assert result.escalation.required
    assert any("Insufficient evidence" in r for r in result.escalation.reasons)


@requires_corpus
def test_api_endpoints(tmp_path, monkeypatch):
    monkeypatch.setenv("AYURIP_DENSE_ENABLED", "off")
    from fastapi.testclient import TestClient

    import app.main as main
    monkeypatch.setattr(main, "ANALYSES_DIR", tmp_path)

    with TestClient(main.app) as client:
        health = client.get("/api/health").json()
        assert health["status"] == "ok"
        assert health["kb_chunks"] > 0

        payload = {
            "product_name": "Ashwagandha Stress Formula",
            "description": "Modified extraction process for stress management in India.",
            "ingredients": ["Ashwagandha"],
            "claims": ["stress management"],
            "source": "traditional",
            "target_markets": ["India"],
        }
        response = client.post("/api/analyze", json=payload)
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "COMPLETED"
        analysis_id = body["analysis_id"]

        stored = client.get(f"/api/analysis/{analysis_id}")
        assert stored.status_code == 200

        evidence = client.get(f"/api/analysis/{analysis_id}/evidence").json()
        assert evidence["evidence"]

        graph = client.get(f"/api/analysis/{analysis_id}/graph").json()
        assert graph["nodes"] and graph["edges"]

        assert client.get("/api/analysis/NOPE-123/evidence").status_code == 404
        assert client.post("/api/analyze", json={"product_name": ""}).status_code == 422
