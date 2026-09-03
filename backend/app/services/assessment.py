"""
Assessment assembly: rule outcomes -> findings, per-framework assessments,
framework interactions, recommendations, confidence and escalation.

Everything here is arithmetic over upstream outputs. No legal content
originates in this module; it only aggregates what the rules anchored to
statute, and its confidence numbers follow the declared formula below rather
than any model's self-reported probability.

Confidence formula (documented because it is shown to users):
    finding confidence = 0.85 if every anchor resolved, else 0.55
    overall = weighted mean of components listed in the ConfidenceReport
Thresholds: HIGH >= 0.75, MEDIUM >= 0.5, LOW below.
"""

from __future__ import annotations

from app.models.core import (
    AnalysisRequest,
    Assessment,
    AssessmentStatus,
    ConfidenceComponent,
    ConfidenceLevel,
    ConfidenceReport,
    Escalation,
    Evidence,
    ExtractionResult,
    Finding,
    Framework,
    FrameworkInteraction,
    Recommendation,
    RuleOutcome,
)
from app.rules.engine import rule_statement

_STATUS_BY_FRAMEWORK = {
    Framework.PATENT: AssessmentStatus.REVIEW_REQUIRED,
    Framework.TRADITIONAL_KNOWLEDGE: AssessmentStatus.POTENTIAL_OVERLAP,
    Framework.BIODIVERSITY_ABS: AssessmentStatus.REVIEW_REQUIRED,
    Framework.REGULATORY: AssessmentStatus.LIKELY_APPLICABLE,
}


def _level(value: float) -> ConfidenceLevel:
    if value >= 0.75:
        return ConfidenceLevel.HIGH
    if value >= 0.5:
        return ConfidenceLevel.MEDIUM
    return ConfidenceLevel.LOW


def build_findings(outcomes: list[RuleOutcome]) -> list[Finding]:
    findings: list[Finding] = []
    for i, outcome in enumerate((o for o in outcomes if o.triggered), start=1):
        anchors_resolved = bool(outcome.evidence_ids) and "not in knowledge base" not in outcome.reason
        confidence = 0.85 if anchors_resolved else 0.55
        findings.append(
            Finding(
                finding_id=f"F-{i:03d}",
                framework=outcome.framework,
                statement=rule_statement(outcome.rule_id) or outcome.title,
                detail=outcome.reason,
                rule_id=outcome.rule_id,
                evidence_ids=outcome.evidence_ids,
                severity=outcome.severity,
                confidence=confidence,
                confidence_level=_level(confidence),
            )
        )
    return findings


def build_assessments(
    findings: list[Finding],
    facts: dict[str, bool],
) -> dict[str, Assessment]:
    assessments: dict[str, Assessment] = {}

    for framework in (
        Framework.PATENT,
        Framework.TRADITIONAL_KNOWLEDGE,
        Framework.BIODIVERSITY_ABS,
        Framework.REGULATORY,
    ):
        fw_findings = [f for f in findings if f.framework == framework]
        if fw_findings:
            confidence = round(sum(f.confidence for f in fw_findings) / len(fw_findings), 3)
            evidence_ids = sorted({eid for f in fw_findings for eid in f.evidence_ids})
            assessments[framework.value.lower()] = Assessment(
                framework=framework,
                status=_STATUS_BY_FRAMEWORK[framework],
                confidence=confidence,
                confidence_level=_level(confidence),
                findings=fw_findings,
                evidence_ids=evidence_ids,
                summary=f"{len(fw_findings)} evidence-anchored finding(s) under this framework.",
            )
        else:
            assessments[framework.value.lower()] = Assessment(
                framework=framework,
                status=AssessmentStatus.LIKELY_NOT_APPLICABLE,
                confidence=0.6,
                confidence_level=ConfidenceLevel.MEDIUM,
                summary="No rule in the current pack was triggered for this framework.",
            )

    # International: the corpus contains no international instruments yet, so an
    # export product gets INSUFFICIENT_EVIDENCE rather than a made-up answer.
    if facts.get("foreign_market"):
        assessments["international"] = Assessment(
            framework=Framework.INTERNATIONAL,
            status=AssessmentStatus.INSUFFICIENT_EVIDENCE,
            confidence=0.0,
            confidence_level=ConfidenceLevel.LOW,
            summary=(
                "Foreign target markets were declared, but the knowledge base does not yet "
                "contain international instruments (TRIPS, CBD, Nagoya Protocol, PCT). "
                "This assessment requires human expert review."
            ),
        )
    else:
        assessments["international"] = Assessment(
            framework=Framework.INTERNATIONAL,
            status=AssessmentStatus.NOT_ASSESSED,
            summary="No foreign target market declared.",
        )
    return assessments


def detect_interactions(
    findings: list[Finding],
    evidence_registry: dict[str, Evidence],
) -> list[FrameworkInteraction]:
    """Report framework interactions without inventing a hierarchy between statutes."""
    interactions: list[FrameworkInteraction] = []
    frameworks = {f.framework for f in findings}

    if Framework.PATENT in frameworks and Framework.BIODIVERSITY_ABS in frameworks:
        # This interaction is itself statutory: BDA s.6 conditions IP filings
        # on NBA approval. Cite that provision if it is in the evidence set.
        s6 = [
            eid for eid, ev in evidence_registry.items()
            if ev.document_id == "BDA-ACT-2002" and (ev.provision or "").startswith("Section 6")
        ]
        interactions.append(
            FrameworkInteraction(
                frameworks=[Framework.PATENT, Framework.BIODIVERSITY_ABS],
                description=(
                    "The patent strategy and biodiversity obligations interact: an application "
                    "for intellectual property rights based on an Indian biological resource is "
                    "itself conditioned on National Biodiversity Authority approval. Sequencing "
                    "of approvals and filings should be reviewed by an expert."
                ),
                evidence_ids=s6,
                escalation_required=True,
            )
        )

    if Framework.PATENT in frameworks and Framework.TRADITIONAL_KNOWLEDGE in frameworks:
        s3p = [
            eid for eid, ev in evidence_registry.items()
            if ev.document_id == "PAT-ACT-1970" and ev.provision == "Section 3(p)"
        ]
        interactions.append(
            FrameworkInteraction(
                frameworks=[Framework.PATENT, Framework.TRADITIONAL_KNOWLEDGE],
                description=(
                    "Traditional-knowledge overlap operates directly on patentability through the "
                    "Section 3(p) exclusion: the same facts that document traditional use narrow "
                    "the space of patentable claims."
                ),
                evidence_ids=s3p,
                escalation_required=False,
            )
        )
    return interactions


def build_recommendations(outcomes: list[RuleOutcome]) -> list[Recommendation]:
    recommendations: list[Recommendation] = []
    seen: set[str] = set()
    i = 1
    for outcome in outcomes:
        if not outcome.triggered or not outcome.recommended_action:
            continue
        if outcome.recommended_action in seen:
            continue
        seen.add(outcome.recommended_action)
        recommendations.append(
            Recommendation(
                recommendation_id=f"REC-{i:03d}",
                action=outcome.recommended_action,
                rationale=outcome.title,
                framework=outcome.framework,
                derived_from_findings=[],
                evidence_ids=outcome.evidence_ids,
                priority="HIGH" if outcome.severity == "SIGNIFICANT" else "MEDIUM",
            )
        )
        i += 1
    return recommendations


def build_confidence(
    entities: ExtractionResult,
    findings: list[Finding],
    outcomes: list[RuleOutcome],
    dense_enabled: bool,
    kb_document_count: int,
) -> ConfidenceReport:
    components: list[ConfidenceComponent] = []

    lexicon_confirmed = [e for e in entities.ingredients if e.botanical_name]
    entity_conf = len(lexicon_confirmed) / max(len(entities.ingredients), 1)
    components.append(
        ConfidenceComponent(
            name="entity_grounding",
            value=round(entity_conf, 3),
            weight=0.25,
            rationale=f"{len(lexicon_confirmed)}/{len(entities.ingredients)} ingredients matched the curated botanical lexicon.",
        )
    )

    anchored = [f for f in findings if f.evidence_ids]
    anchor_conf = len(anchored) / max(len(findings), 1) if findings else 0.0
    components.append(
        ConfidenceComponent(
            name="evidence_anchoring",
            value=round(anchor_conf, 3),
            weight=0.35,
            rationale=f"{len(anchored)}/{len(findings)} findings carry resolved statutory anchors.",
        )
    )

    retrieval_conf = 0.9 if dense_enabled else 0.65
    components.append(
        ConfidenceComponent(
            name="retrieval_mode",
            value=retrieval_conf,
            weight=0.15,
            rationale="Hybrid dense+lexical retrieval active." if dense_enabled
            else "Lexical (BM25) retrieval only; dense index unavailable.",
        )
    )

    kb_conf = min(kb_document_count / 6.0, 1.0)
    components.append(
        ConfidenceComponent(
            name="corpus_coverage",
            value=round(kb_conf, 3),
            weight=0.15,
            rationale=f"{kb_document_count} of 6 configured statutes ingested.",
        )
    )

    insufficient = sum(1 for o in outcomes if "INSUFFICIENT_EVIDENCE" in o.reason)
    rule_conf = 1.0 - min(insufficient * 0.25, 0.75)
    components.append(
        ConfidenceComponent(
            name="rule_certainty",
            value=round(rule_conf, 3),
            weight=0.10,
            rationale="All triggered rules resolved their anchors." if insufficient == 0
            else f"{insufficient} rule(s) met their conditions but lacked anchor provisions.",
        )
    )

    overall = round(sum(c.value * c.weight for c in components) / sum(c.weight for c in components), 3)
    return ConfidenceReport(overall=overall, level=_level(overall), components=components)


def build_escalation(
    confidence: ConfidenceReport,
    interactions: list[FrameworkInteraction],
    assessments: dict[str, Assessment],
) -> Escalation:
    reasons: list[str] = []
    if any(i.escalation_required for i in interactions):
        reasons.append("Multiple legal frameworks interact (patent filing conditioned on biodiversity approval).")
    insufficient = [
        a.framework.value for a in assessments.values()
        if a.status == AssessmentStatus.INSUFFICIENT_EVIDENCE
    ]
    if insufficient:
        reasons.append(f"Insufficient evidence for: {', '.join(insufficient)}.")
    if confidence.level == ConfidenceLevel.LOW:
        reasons.append("Overall confidence is low.")

    if not reasons:
        return Escalation(required=False, priority="LOW", reasons=[])

    priority = "HIGH" if (insufficient or confidence.level == ConfidenceLevel.LOW) else "MEDIUM"
    return Escalation(
        required=True,
        priority=priority,
        reasons=reasons,
        message=(
            "AYUR-IP has identified aspects of this analysis that call for review by a "
            "qualified IP/regulatory professional. The findings and evidence above are "
            "intended to prepare and focus that review, not replace it."
        ),
    )
