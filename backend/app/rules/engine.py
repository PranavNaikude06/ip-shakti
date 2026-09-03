"""
Deterministic rule engine.

The symbolic half of the neuro-symbolic design. Rules are declarative data
(rules.json); this module computes boolean facts from the extraction result,
evaluates conditions, and anchors every triggered rule to real statutory text.

Two properties are load-bearing:

1. **Anchor resolution is a metadata lookup, not a search.** A rule cites
   (document_id, section, subsection); the engine resolves that address against
   the ingested corpus. Retrieval ranking can never change which provision a
   rule cites.
2. **Missing law degrades honestly.** If an anchor provision is not in the
   corpus, the rule does not fire with an unsupported claim -- it reports
   INSUFFICIENT_EVIDENCE and says which provision is missing.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.models.core import (
    AnalysisRequest,
    Evidence,
    ExtractionResult,
    Framework,
    LegalChunk,
    RetrievalMethod,
    RuleOutcome,
)

_RULES_PATH = Path(__file__).resolve().parent / "rules.json"


@lru_cache(maxsize=1)
def load_rules() -> list[dict]:
    return json.loads(_RULES_PATH.read_text(encoding="utf-8"))["rules"]


# --------------------------------------------------------------------------
# Fact computation
# --------------------------------------------------------------------------

def compute_facts(request: AnalysisRequest, entities: ExtractionResult) -> dict[str, bool]:
    """Derive the boolean fact base every rule condition is evaluated against.

    Facts are computed once and returned with the outcome so the UI can show
    exactly which inputs made each rule fire.
    """
    claim_classes = {
        (e.metadata or {}).get("claim_class")
        for e in entities.therapeutic_claims
    }
    process_novelty = {
        (e.metadata or {}).get("novelty")
        for e in entities.processes
    }
    markets = {(e.normalized or e.text) for e in entities.target_markets}

    return {
        "biological_resource_detected": bool(entities.biological_resources),
        "traditional_herb_detected": any(
            e.botanical_name or (e.metadata or {}).get("kind") == "MINERAL"
            for e in entities.ingredients
        ),
        "multi_ingredient_formulation": len(entities.ingredients) > 1,
        "claimed_novel_process": "CLAIMED_NOVEL" in process_novelty or "MODERN" in process_novelty,
        "traditional_process_only": bool(process_novelty) and process_novelty <= {"TRADITIONAL"},
        "extract_based": any(
            "extract" in (e.normalized or e.text).lower()
            for e in entities.dosage_forms + entities.processes
        ),
        "wellness_claim": "WELLNESS" in claim_classes,
        "therapeutic_claim": "THERAPEUTIC" in claim_classes,
        "cosmetic_claim": "COSMETIC" in claim_classes,
        "unclassified_claim": any(
            not (e.metadata or {}).get("claim_class") for e in entities.therapeutic_claims
        ),
        "india_market": "India" in markets,
        "foreign_market": bool(markets - {"India"}),
        "source_traditional": request.source == "traditional",
        "classical_formulation_named": bool(entities.product_types),
    }


def _condition_met(condition: dict, facts: dict[str, bool]) -> tuple[bool, list[str]]:
    """Evaluate {all/any/none} against the fact base; return (met, facts_used)."""
    used: list[str] = []
    for fact in condition.get("all", []):
        if not facts.get(fact, False):
            return False, []
        used.append(fact)
    any_block = condition.get("any", [])
    if any_block:
        hits = [f for f in any_block if facts.get(f, False)]
        if not hits:
            return False, []
        used.extend(hits)
    for fact in condition.get("none", []):
        if facts.get(fact, False):
            return False, []
    return True, used


# --------------------------------------------------------------------------
# Anchor resolution
# --------------------------------------------------------------------------

class AnchorResolver:
    """Resolves (document_id, section[, subsection]) addresses to corpus chunks."""

    def __init__(self, chunks: list[LegalChunk], doc_names: dict[str, str]) -> None:
        self._doc_names = doc_names
        self._index: dict[tuple[str, str], list[LegalChunk]] = {}
        for chunk in chunks:
            if chunk.section:
                self._index.setdefault((chunk.document_id, chunk.section.lower()), []).append(chunk)

    def resolve(self, anchor: dict) -> LegalChunk | None:
        candidates = self._index.get((anchor["document_id"], str(anchor["section"]).lower()), [])
        if not candidates:
            return None
        want_sub = anchor.get("subsection")
        if want_sub:
            for chunk in candidates:
                if (chunk.subsection or "").lower() == str(want_sub).lower():
                    return chunk
            return None
        # Section-level anchor: prefer the stem, then subsection (1), then the
        # first chunk in the section.
        for chunk in candidates:
            if chunk.chunk_id.endswith("_STEM"):
                return chunk
        for chunk in candidates:
            if (chunk.subsection or "") == "1":
                return chunk
        return candidates[0]

    def to_evidence(self, chunk: LegalChunk, evidence_id: str) -> Evidence:
        return Evidence(
            evidence_id=evidence_id,
            chunk_id=chunk.chunk_id,
            document_id=chunk.document_id,
            document_name=self._doc_names.get(chunk.document_id, chunk.document_id),
            domain=chunk.domain,
            jurisdiction=chunk.jurisdiction,
            provision=chunk.provision,
            heading=chunk.heading,
            page=chunk.page_start,
            text=chunk.text,
            score=1.0,
            retrieval_method=RetrievalMethod.CURATED,
            status=chunk.status,
        )


# --------------------------------------------------------------------------
# Evaluation
# --------------------------------------------------------------------------

def evaluate_rules(
    request: AnalysisRequest,
    entities: ExtractionResult,
    resolver: AnchorResolver,
    evidence_registry: dict[str, Evidence],
    evidence_prefix: str = "EVID-R",
) -> tuple[list[RuleOutcome], dict[str, bool]]:
    """Evaluate the rule pack.

    Returns every rule outcome (triggered or not -- the UI shows both) and the
    computed fact base. Anchor evidence for triggered rules is added to
    `evidence_registry`, keyed by evidence_id, reusing IDs for chunks that are
    already registered so one provision cited by two rules appears once.
    """
    facts = compute_facts(request, entities)
    outcomes: list[RuleOutcome] = []
    chunk_to_eid = {ev.chunk_id: eid for eid, ev in evidence_registry.items()}

    for rule in load_rules():
        met, facts_used = _condition_met(rule["condition"], facts)
        framework = Framework(rule["framework"])

        if not met:
            outcomes.append(
                RuleOutcome(
                    rule_id=rule["rule_id"],
                    framework=framework,
                    triggered=False,
                    title=rule["title"],
                    reason="Conditions not met for this product.",
                    severity=rule.get("severity", "ATTENTION"),
                )
            )
            continue

        evidence_ids: list[str] = []
        missing: list[str] = []
        for anchor in rule["anchors"]:
            chunk = resolver.resolve(anchor)
            if chunk is None:
                label = f"{anchor['document_id']} s.{anchor['section']}"
                if anchor.get("subsection"):
                    label += f"({anchor['subsection']})"
                missing.append(label)
                continue
            if chunk.chunk_id in chunk_to_eid:
                evidence_ids.append(chunk_to_eid[chunk.chunk_id])
            else:
                eid = f"{evidence_prefix}-{len(evidence_registry) + 1:03d}"
                evidence_registry[eid] = resolver.to_evidence(chunk, eid)
                chunk_to_eid[chunk.chunk_id] = eid
                evidence_ids.append(eid)

        if missing and not evidence_ids:
            # Conditions met but the law is not in the corpus: honest degrade.
            outcomes.append(
                RuleOutcome(
                    rule_id=rule["rule_id"],
                    framework=framework,
                    triggered=False,
                    title=rule["title"],
                    reason=(
                        "INSUFFICIENT_EVIDENCE: conditions were met but the anchor "
                        f"provisions are not in the knowledge base ({', '.join(missing)})."
                    ),
                    matched_on=facts_used,
                    severity=rule.get("severity", "ATTENTION"),
                )
            )
            continue

        reason = rule["reason"]
        if missing:
            reason += f" (Note: anchor(s) not in knowledge base: {', '.join(missing)}.)"

        outcomes.append(
            RuleOutcome(
                rule_id=rule["rule_id"],
                framework=framework,
                triggered=True,
                title=rule["title"],
                reason=reason,
                matched_on=facts_used,
                evidence_ids=evidence_ids,
                recommended_action=rule.get("recommended_action"),
                severity=rule.get("severity", "ATTENTION"),
            )
        )

    return outcomes, facts


def rule_statement(rule_id: str) -> str:
    for rule in load_rules():
        if rule["rule_id"] == rule_id:
            return rule["statement"]
    return ""
