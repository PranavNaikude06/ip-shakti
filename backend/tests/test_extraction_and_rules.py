from app.models.core import AnalysisRequest
from app.rules.engine import compute_facts, evaluate_rules
from app.services.classifier import classify
from app.services.extraction import extract
from tests.conftest import requires_corpus


def test_extraction_finds_demo_entities(demo_request):
    result = extract(demo_request)
    ingredients = {e.normalized for e in result.ingredients}
    assert "Ashwagandha" in ingredients
    assert "Tulsi" in ingredients
    ash = next(e for e in result.ingredients if e.normalized == "Ashwagandha")
    assert ash.botanical_name == "Withania somnifera"
    assert result.biological_resources, "botanical ingredients must surface as biological resources"
    assert any((e.metadata or {}).get("novelty") == "CLAIMED_NOVEL" for e in result.processes)
    assert any(e.normalized == "stress management" for e in result.therapeutic_claims)


def test_extraction_unknown_ingredient_is_not_biological():
    request = AnalysisRequest(product_name="X", ingredients=["Unobtainium extract"])
    result = extract(request)
    assert result.ingredients and not result.biological_resources


def test_facts_for_demo_product(demo_request):
    facts = compute_facts(demo_request, extract(demo_request))
    assert facts["biological_resource_detected"]
    assert facts["traditional_herb_detected"]
    assert facts["claimed_novel_process"]
    assert facts["india_market"]
    assert not facts["foreign_market"]
    assert not facts["therapeutic_claim"]  # stress management is WELLNESS


def test_classifier_is_transparent(demo_request):
    result = classify(demo_request, extract(demo_request))
    assert result.method == "WEIGHTED_FEATURES"
    assert result.features, "features must be exposed"
    assert result.label.value == "PROPRIETARY_AYURVEDIC_MEDICINE"
    assert 0 <= result.score <= 1


@requires_corpus
def test_rules_fire_with_anchored_evidence(demo_request, resolver):
    registry = {}
    outcomes, _ = evaluate_rules(demo_request, extract(demo_request), resolver, registry)
    fired = {o.rule_id for o in outcomes if o.triggered}
    assert {"PAT-TK-EXCLUSION", "BDA-IPR-APPROVAL", "REG-ASU-PATHWAY"} <= fired
    # Every triggered rule carries resolved evidence.
    for outcome in outcomes:
        if outcome.triggered:
            assert outcome.evidence_ids, outcome.rule_id
            for eid in outcome.evidence_ids:
                assert eid in registry
    # The TK exclusion cites Section 3(p) specifically.
    tk = next(o for o in outcomes if o.rule_id == "PAT-TK-EXCLUSION")
    assert registry[tk.evidence_ids[0]].provision == "Section 3(p)"


@requires_corpus
def test_missing_anchor_degrades_to_insufficient_evidence(demo_request, resolver, monkeypatch):
    """A rule whose anchors are absent must not fire with an unsupported claim."""
    import app.rules.engine as engine

    broken = [dict(r) for r in engine.load_rules()]
    for rule in broken:
        if rule["rule_id"] == "PAT-TK-EXCLUSION":
            rule["anchors"] = [{"document_id": "NON-EXISTENT-ACT", "section": "999"}]
    monkeypatch.setattr(engine, "load_rules", lambda: broken)

    registry = {}
    outcomes, _ = engine.evaluate_rules(demo_request, extract(demo_request), resolver, registry)
    tk = next(o for o in outcomes if o.rule_id == "PAT-TK-EXCLUSION")
    assert not tk.triggered
    assert "INSUFFICIENT_EVIDENCE" in tk.reason
