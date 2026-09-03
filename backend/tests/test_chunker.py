from app.knowledge.chunker import chunk_section, split_clauses
from app.knowledge.indiacode_source import SectionRecord, clean_html
from app.models.core import Framework

SECTION_3_STYLE = """The following are not inventions within the meaning of this Act,--
  (a) an invention which is frivolous or contrary to natural laws;
  1[(b) an invention contrary to public order or morality;]
  (e) a substance obtained by a mere admixture resulting only in the aggregation of the properties of the components thereof;
  (p) an invention which, in effect, is traditional knowledge or which is an aggregation or duplication of known properties of traditionally known component or components.]"""


def _record(text: str, section: str = "3") -> SectionRecord:
    return SectionRecord(
        act_id="TEST", act_name="The Patents Act, 1970", act_year="1970", act_number="39",
        section_number=section, title="What are not inventions.", text=text,
        footnote=None, page=9, repealed=False, uri=None, order=1,
    )


def test_split_clauses_finds_all_markers():
    stem, clauses = split_clauses(SECTION_3_STYLE)
    assert "not inventions" in stem
    assert [m for m, _ in clauses] == ["a", "b", "e", "p"]


def test_split_handles_amendment_brackets():
    _, clauses = split_clauses(SECTION_3_STYLE)
    marker_b = dict(clauses)["b"]
    assert "public order" in marker_b


def test_chunk_section_emits_clause_chunks_with_provenance():
    chunks = chunk_section(_record(SECTION_3_STYLE), "PAT-ACT-1970", Framework.PATENT)
    by_id = {c.chunk_id: c for c in chunks}
    p = by_id["PAT-ACT-1970_S3_p"]
    assert p.section == "3" and p.subsection == "p"
    assert p.page_start == 9
    assert p.provision == "Section 3(p)"
    assert "traditional knowledge" in p.text
    # Each clause chunk is self-contained: carries the operative stem.
    assert "not inventions" in p.text


def test_short_section_stays_whole():
    chunks = chunk_section(_record("Short provision text.", section="99"), "PAT-ACT-1970", Framework.PATENT)
    assert len(chunks) == 1
    assert chunks[0].subsection is None


def test_repealed_status_propagates():
    record = _record("Some repealed text with enough length to matter.", section="5")
    record.repealed = True
    chunks = chunk_section(record, "PAT-ACT-1970", Framework.PATENT)
    assert all(c.status == "REPEALED" for c in chunks)


def test_clean_html_preserves_line_structure():
    html = "Intro text<br/>  (a) first clause<br/>  (b) second clause"
    text = clean_html(html)
    assert text.splitlines()[1].strip().startswith("(a)")
