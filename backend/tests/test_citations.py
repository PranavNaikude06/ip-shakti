from app.models.core import CitationVerdict, Evidence, Explanation, Framework, RetrievalMethod
from app.services.citations import validate


def _evidence(eid: str, provision: str, text: str, doc: str = "The Patents Act, 1970",
              doc_id: str = "PAT-ACT-1970") -> Evidence:
    return Evidence(
        evidence_id=eid, chunk_id=f"c-{eid}", document_id=doc_id, document_name=doc,
        domain=Framework.PATENT, provision=provision, page=9, text=text,
        retrieval_method=RetrievalMethod.CURATED,
    )


REGISTRY = {
    "EVID-R-001": _evidence(
        "EVID-R-001",
        "Section 3(p)",
        "Section 3. The following are not inventions within the meaning of this Act: "
        "(p) an invention which, in effect, is traditional knowledge or which is an "
        "aggregation or duplication of known properties of traditionally known components.",
    ),
}


def _explain(narrative: str) -> Explanation:
    return Explanation(available=True, narrative=narrative)


def test_verified_claim_passes():
    report = validate(_explain(
        "The product may fall within the traditional knowledge exclusion because Section 3(p) "
        "excludes inventions that are an aggregation of known properties of traditionally known "
        "components [EVID-R-001]."
    ), REGISTRY)
    assert report.total_claims == 1
    assert report.claims[0].verdict == CitationVerdict.VERIFIED
    assert report.passed


def test_nonexistent_evidence_id_is_fabricated():
    report = validate(_explain(
        "Section 3(p) excludes traditional knowledge inventions [EVID-R-999]."
    ), REGISTRY)
    assert report.claims[0].verdict == CitationVerdict.FABRICATED_CITATION
    assert not report.passed


def test_wrong_provision_against_cited_evidence():
    report = validate(_explain(
        "The invention is excluded under Section 3(k) as a computer programme [EVID-R-001]."
    ), REGISTRY)
    assert report.claims[0].verdict == CitationVerdict.FABRICATED_CITATION
    assert not report.passed


def test_foreign_act_is_fabricated():
    report = validate(_explain(
        "This is also prohibited by the Consumer Protection Act, 2019 [EVID-R-001]."
    ), REGISTRY)
    assert report.claims[0].verdict == CitationVerdict.FABRICATED_CITATION


def test_uncited_legal_statement_is_unsupported():
    report = validate(_explain(
        "The approval of the patent authority is required before any commercial sale."
    ), REGISTRY)
    assert report.claims[0].verdict == CitationVerdict.UNSUPPORTED


def test_offline_mode_passes_trivially():
    report = validate(Explanation(available=False), REGISTRY)
    assert report.passed and report.total_claims == 0
