from app.models.core import Framework
from app.rag.retriever import parse_provisions, tokenize
from tests.conftest import requires_corpus


def test_tokenizer_emits_provision_tokens():
    tokens = tokenize("What does Section 3(p) say?")
    assert "s3" in tokens and "sec3p" in tokens


def test_parse_provisions():
    assert parse_provisions("under Section 3(p) and section 6") == [("3", "p"), ("6", None)]
    assert parse_provisions("nothing legal here") == []


@requires_corpus
def test_exact_section_query_hits_first(retriever):
    results = retriever.search("Section 3(p)", top_k=3)
    top = results[0][0]
    assert top.document_id == "PAT-ACT-1970"
    assert top.section == "3" and top.subsection == "p"


@requires_corpus
def test_tk_paraphrase_retrieves_3p_in_topk(retriever):
    results = retriever.search(
        "traditional knowledge patent exclusion aggregation of known properties", top_k=5
    )
    hits = [(c.document_id, c.section, c.subsection) for c, _s, _m in results]
    assert ("PAT-ACT-1970", "3", "p") in hits


@requires_corpus
def test_domain_scoping(retriever):
    results = retriever.search("benefit sharing", top_k=5, domains=[Framework.BIODIVERSITY_ABS])
    assert results
    assert all(c.domain == Framework.BIODIVERSITY_ABS for c, _s, _m in results)


@requires_corpus
def test_evidence_objects_carry_provenance(retriever):
    results = retriever.search("Section 3(p)", top_k=1)
    evidence = retriever.to_evidence(results)[0]
    assert evidence.evidence_id == "EVID-001"
    assert evidence.provision == "Section 3(p)"
    assert evidence.page is not None
    assert evidence.document_name == "The Patents Act, 1970"
    assert evidence.text
