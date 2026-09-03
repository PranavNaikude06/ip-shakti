"""
Citation validation: the trust gate between the LLM and the user.

Every sentence of LLM output is checked against the evidence registry:

1. **Existence** - every cited [EVID-*] token must resolve to real evidence.
2. **Provision fidelity** - any "Section X(y)" the sentence mentions must
   actually appear in the evidence it cites; naming a section that exists
   nowhere in the evidence set is flagged as a fabricated citation.
3. **Statute fidelity** - any Act name mentioned must be one of the documents
   in the evidence set.
4. **Support** - a lexical overlap score between the claim and its cited
   evidence text separates VERIFIED from WEAKLY_SUPPORTED.
5. **Coverage** - a legal-sounding sentence with no citation at all is
   UNSUPPORTED.

Verdicts are per-claim and the report never hides a failure: a fabricated
citation fails the whole report (`passed = False`), and the UI is expected to
show the failure rather than the narrative.
"""

from __future__ import annotations

import re

from app.models.core import (
    CitationReport,
    CitationVerdict,
    Evidence,
    Explanation,
    ValidatedClaim,
)

_EVID_RE = re.compile(r"\[([A-Z]+-[A-Z0-9-]*\d+(?:\s*,\s*[A-Z]+-[A-Z0-9-]*\d+)*)\]")
_SECTION_RE = re.compile(r"\bSection\s+(\d{1,3}[A-Z]{0,3})\s*(?:\((\w{1,4})\))?", re.IGNORECASE)
_ACT_RE = re.compile(r"\b(?:The\s+)?([A-Z][A-Za-z ]{2,40}?\s(?:Act|Rules|Regulation[s]?)),?\s*(\d{4})?", )
_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z\[])")

_LEGAL_MARKERS = re.compile(
    r"\b(section|act|approval|require[sd]?|prohibit|exclusion|excluded|misbrand|"
    r"authority|licen[cs]e|regulation|patentab|provision|statut)e?\w*\b",
    re.IGNORECASE,
)

_STOPWORDS = frozenset(
    "a an the of to in for and or is are be been this that with under on as by it its "
    "may can shall which who whose not no any such other than from at was were will "
    "would should could has have had do does did their there where when while these those".split()
)
SUPPORT_THRESHOLD = 0.28


def _content_words(text: str) -> set[str]:
    return {
        w for w in re.findall(r"[a-z]{3,}", text.lower())
        if w not in _STOPWORDS
    }


def _split_sentences(text: str) -> list[str]:
    parts = _SENTENCE_RE.split(text.replace("\n", " ").strip())
    return [p.strip() for p in parts if len(p.strip()) > 15]


def _cited_ids(sentence: str) -> list[str]:
    ids: list[str] = []
    for group in _EVID_RE.findall(sentence):
        ids.extend(x.strip() for x in group.split(","))
    return ids


def _provision_in_evidence(num: str, sub: str | None, ev: Evidence) -> bool:
    hay = f"{ev.provision or ''} {ev.text}".lower()
    if sub:
        return f"section {num}".lower() in hay and f"({sub.lower()})" in hay
    return f"section {num}".lower() in hay


def validate(explanation: Explanation, registry: dict[str, Evidence]) -> CitationReport:
    if not explanation.available:
        return CitationReport(passed=True, notes=["No LLM narrative to validate (offline mode)."])

    text_blocks = [b for b in (explanation.summary, explanation.narrative) if b]
    sentences = [s for block in text_blocks for s in _split_sentences(block)]

    known_docs = {ev.document_name.lower() for ev in registry.values()}
    claims: list[ValidatedClaim] = []
    notes: list[str] = []

    for sentence in sentences:
        cited = _cited_ids(sentence)
        provisions = [(m.group(1), m.group(2)) for m in _SECTION_RE.finditer(sentence)]
        detected_provisions = [
            f"Section {num}({sub})" if sub else f"Section {num}" for num, sub in provisions
        ]

        # 1) Non-existent evidence IDs are an automatic fabrication.
        unknown_ids = [eid for eid in cited if eid not in registry]
        if unknown_ids:
            claims.append(
                ValidatedClaim(
                    claim=sentence,
                    cited_evidence_ids=cited,
                    verdict=CitationVerdict.FABRICATED_CITATION,
                    reason=f"Cited evidence ID(s) do not exist: {', '.join(unknown_ids)}.",
                    detected_provisions=detected_provisions,
                )
            )
            continue

        cited_evidence = [registry[eid] for eid in cited]

        # 2) Act names that are not in the evidence set.
        foreign_acts = []
        for match in _ACT_RE.finditer(sentence):
            act_name = match.group(0).rstrip(", ").lower().removeprefix("the ").strip()
            if act_name and not any(act_name in doc or doc in act_name for doc in known_docs):
                foreign_acts.append(match.group(0).strip())
        if foreign_acts:
            claims.append(
                ValidatedClaim(
                    claim=sentence,
                    cited_evidence_ids=cited,
                    verdict=CitationVerdict.FABRICATED_CITATION,
                    reason=f"References legislation absent from the evidence set: {', '.join(foreign_acts)}.",
                    detected_provisions=detected_provisions,
                )
            )
            continue

        # 3) Provision fidelity.
        bad_provision = None
        for num, sub in provisions:
            in_cited = any(_provision_in_evidence(num, sub, ev) for ev in cited_evidence)
            in_registry = any(_provision_in_evidence(num, sub, ev) for ev in registry.values())
            if not in_cited:
                bad_provision = (f"Section {num}({sub})" if sub else f"Section {num}", in_registry)
                break
        if bad_provision:
            label, exists_somewhere = bad_provision
            verdict = CitationVerdict.UNSUPPORTED if exists_somewhere else CitationVerdict.FABRICATED_CITATION
            claims.append(
                ValidatedClaim(
                    claim=sentence,
                    cited_evidence_ids=cited,
                    verdict=verdict,
                    reason=(
                        f"{label} is not contained in the evidence this sentence cites"
                        + ("" if exists_somewhere else " and does not appear anywhere in the evidence set")
                        + "."
                    ),
                    detected_provisions=detected_provisions,
                )
            )
            continue

        legal_sounding = bool(_LEGAL_MARKERS.search(sentence)) or bool(provisions)

        # 4) Legal-sounding sentence with no citation.
        if legal_sounding and not cited:
            claims.append(
                ValidatedClaim(
                    claim=sentence,
                    cited_evidence_ids=[],
                    verdict=CitationVerdict.UNSUPPORTED,
                    reason="Legal statement carries no evidence citation.",
                    detected_provisions=detected_provisions,
                )
            )
            continue

        if not cited:
            # Non-legal narrative glue; nothing to validate.
            continue

        # 5) Lexical support between claim and cited evidence.
        claim_words = _content_words(sentence)
        evidence_words: set[str] = set()
        for ev in cited_evidence:
            evidence_words |= _content_words(ev.text)
        overlap = len(claim_words & evidence_words) / max(len(claim_words), 1)
        supported = overlap >= SUPPORT_THRESHOLD or bool(provisions)

        claims.append(
            ValidatedClaim(
                claim=sentence,
                cited_evidence_ids=cited,
                verdict=CitationVerdict.VERIFIED if supported else CitationVerdict.WEAKLY_SUPPORTED,
                reason=(
                    f"Evidence exists, provisions match, lexical support {overlap:.2f}."
                    if supported
                    else f"Evidence exists but lexical support is weak ({overlap:.2f} < {SUPPORT_THRESHOLD})."
                ),
                support_score=round(overlap, 3),
                detected_provisions=detected_provisions,
            )
        )

    verified = sum(1 for c in claims if c.verdict == CitationVerdict.VERIFIED)
    weak = sum(1 for c in claims if c.verdict == CitationVerdict.WEAKLY_SUPPORTED)
    unsupported = sum(1 for c in claims if c.verdict == CitationVerdict.UNSUPPORTED)
    fabricated = sum(1 for c in claims if c.verdict == CitationVerdict.FABRICATED_CITATION)

    passed = fabricated == 0 and (unsupported <= max(1, len(claims) // 5))
    if fabricated:
        notes.append("Fabricated citations detected; narrative must not be displayed as verified.")
    if not claims:
        notes.append("Narrative contained no verifiable claims.")

    return CitationReport(
        total_claims=len(claims),
        verified=verified,
        weakly_supported=weak,
        unsupported=unsupported,
        fabricated=fabricated,
        claims=claims,
        passed=passed,
        notes=notes,
    )
