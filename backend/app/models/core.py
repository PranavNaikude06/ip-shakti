"""
AYUR-IP core domain schema.

This module is the single source of truth for the API contract.
The frontend renders from these shapes; the pipeline produces them.

Design rule: every conclusion the system reaches carries the evidence that
produced it. No field in this schema asserts a legal outcome without an
accompanying evidence_ids list.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------
# Enumerations
# --------------------------------------------------------------------------

class Framework(str, Enum):
    """A body of law the system can assess a product against."""
    PATENT = "PATENT"
    TRADITIONAL_KNOWLEDGE = "TRADITIONAL_KNOWLEDGE"
    BIODIVERSITY_ABS = "BIODIVERSITY_ABS"
    REGULATORY = "REGULATORY"
    TRADEMARK = "TRADEMARK"
    COPYRIGHT = "COPYRIGHT"
    DESIGN = "DESIGN"
    INTERNATIONAL = "INTERNATIONAL"


class AssessmentStatus(str, Enum):
    """Outcome of assessing one framework.

    Deliberately excludes anything resembling a legal verdict.
    INSUFFICIENT_EVIDENCE is a first-class, correct result.
    """
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    POTENTIAL_OVERLAP = "POTENTIAL_OVERLAP"
    LIKELY_APPLICABLE = "LIKELY_APPLICABLE"
    LIKELY_NOT_APPLICABLE = "LIKELY_NOT_APPLICABLE"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    NOT_ASSESSED = "NOT_ASSESSED"


class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ProductClass(str, Enum):
    CLASSICAL_AYURVEDIC_MEDICINE = "CLASSICAL_AYURVEDIC_MEDICINE"
    PROPRIETARY_AYURVEDIC_MEDICINE = "PROPRIETARY_AYURVEDIC_MEDICINE"
    PHYTOPHARMACEUTICAL = "PHYTOPHARMACEUTICAL"
    NEW_DRUG = "NEW_DRUG"
    AYURVEDA_AAHAR = "AYURVEDA_AAHAR"
    COSMETIC = "COSMETIC"
    UNKNOWN = "UNKNOWN"


class CitationVerdict(str, Enum):
    """Result of validating one LLM claim against the evidence it cites."""
    VERIFIED = "VERIFIED"
    WEAKLY_SUPPORTED = "WEAKLY_SUPPORTED"
    UNSUPPORTED = "UNSUPPORTED"
    FABRICATED_CITATION = "FABRICATED_CITATION"


class RetrievalMethod(str, Enum):
    DENSE = "DENSE"
    BM25 = "BM25"
    HYBRID = "HYBRID"
    CURATED = "CURATED"


# --------------------------------------------------------------------------
# Knowledge base: documents, chunks, evidence
# --------------------------------------------------------------------------

class DocumentMeta(BaseModel):
    """Provenance for one source document. Unknown fields stay None, never guessed."""
    document_id: str
    document_name: str
    document_type: Literal["ACT", "RULES", "MANUAL", "GUIDELINE", "TREATY", "NOTIFICATION", "OTHER"]
    domain: Framework
    jurisdiction: str = "INDIA"
    authority: str | None = None
    publication_date: str | None = None
    effective_date: str | None = None
    version: str | None = None
    status: Literal["ACTIVE", "AMENDED", "REPEALED", "UNKNOWN"] = "UNKNOWN"
    source_url: str | None = None
    file_name: str | None = None
    sha256: str | None = None
    page_count: int | None = None
    last_verified: str | None = None


class LegalChunk(BaseModel):
    """A provision-scoped span of legal text with its structural address preserved.

    Chunks follow the document hierarchy (Act, Chapter, Section, Subsection,
    Clause) rather than a fixed token window, so a retrieved chunk is always a
    citable unit.
    """
    chunk_id: str
    document_id: str
    domain: Framework
    jurisdiction: str = "INDIA"
    chapter: str | None = None
    section: str | None = None
    subsection: str | None = None
    clause: str | None = None
    heading: str | None = None
    text: str
    page_start: int | None = None
    page_end: int | None = None
    char_count: int = 0
    status: str = "ACTIVE"

    @property
    def provision(self) -> str | None:
        """Human-readable citation, for example: Section 3(p)."""
        if not self.section:
            return None
        cite = f"Section {self.section}"
        if self.subsection:
            cite += f"({self.subsection})"
        if self.clause:
            cite += f"({self.clause})"
        return cite


class Evidence(BaseModel):
    """A retrieved chunk, bound to one analysis, with retrieval provenance.

    evidence_id is stable within an analysis and is the token the LLM must
    cite. The citation validator resolves these back to text to check support.
    """
    evidence_id: str
    chunk_id: str
    document_id: str
    document_name: str
    domain: Framework
    jurisdiction: str = "INDIA"
    provision: str | None = None
    heading: str | None = None
    page: int | None = None
    text: str
    score: float = 0.0
    retrieval_method: RetrievalMethod = RetrievalMethod.HYBRID
    source_url: str | None = None
    status: str = "ACTIVE"


class RetrievalResult(BaseModel):
    query: str
    results: list[Evidence] = Field(default_factory=list)
    dense_enabled: bool = False
    total_candidates: int = 0


# --------------------------------------------------------------------------
# Extraction and classification
# --------------------------------------------------------------------------

class ExtractedEntity(BaseModel):
    """One entity found in the product description, with the span that produced it."""
    text: str
    entity_type: str
    normalized: str | None = None
    botanical_name: str | None = None
    start: int | None = None
    end: int | None = None
    source: Literal["LEXICON", "PATTERN", "STRUCTURED_INPUT", "LLM"] = "LEXICON"
    metadata: dict[str, Any] = Field(default_factory=dict)


class ExtractionResult(BaseModel):
    ingredients: list[ExtractedEntity] = Field(default_factory=list)
    biological_resources: list[ExtractedEntity] = Field(default_factory=list)
    processes: list[ExtractedEntity] = Field(default_factory=list)
    therapeutic_claims: list[ExtractedEntity] = Field(default_factory=list)
    product_types: list[ExtractedEntity] = Field(default_factory=list)
    target_markets: list[ExtractedEntity] = Field(default_factory=list)
    dosage_forms: list[ExtractedEntity] = Field(default_factory=list)

    def all_entities(self) -> list[ExtractedEntity]:
        groups = (
            self.ingredients, self.biological_resources, self.processes,
            self.therapeutic_claims, self.product_types,
            self.target_markets, self.dosage_forms,
        )
        return [e for group in groups for e in group]


class ClassificationFeature(BaseModel):
    """One scoring signal, exposed so the classification is auditable, not opaque."""
    name: str
    weight: float
    triggered: bool
    rationale: str


class ClassificationResult(BaseModel):
    """Heuristic triage, not a legal determination.

    method is always reported so the UI can label this honestly. There is no
    trained model behind this yet and the schema does not pretend otherwise.
    """
    label: ProductClass
    score: float
    method: Literal["WEIGHTED_FEATURES", "TRAINED_MODEL"] = "WEIGHTED_FEATURES"
    alternatives: list[dict[str, Any]] = Field(default_factory=list)
    features: list[ClassificationFeature] = Field(default_factory=list)
    disclaimer: str = (
        "Preliminary triage classification, not an official legal or "
        "regulatory determination."
    )


# --------------------------------------------------------------------------
# Rules, findings, assessments
# --------------------------------------------------------------------------

class RuleOutcome(BaseModel):
    """The result of evaluating one deterministic rule."""
    rule_id: str
    framework: Framework
    triggered: bool
    title: str
    reason: str
    matched_on: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)
    recommended_action: str | None = None
    severity: Literal["INFO", "ATTENTION", "SIGNIFICANT"] = "ATTENTION"


class Finding(BaseModel):
    """A single structured conclusion. Produced by rules, never by the LLM."""
    finding_id: str
    framework: Framework
    statement: str
    detail: str | None = None
    rule_id: str | None = None
    evidence_ids: list[str] = Field(default_factory=list)
    graph_support: list[str] = Field(default_factory=list)
    severity: Literal["INFO", "ATTENTION", "SIGNIFICANT"] = "ATTENTION"
    confidence: float = 0.0
    confidence_level: ConfidenceLevel = ConfidenceLevel.LOW


class Assessment(BaseModel):
    framework: Framework
    status: AssessmentStatus
    confidence: float = 0.0
    confidence_level: ConfidenceLevel = ConfidenceLevel.LOW
    findings: list[Finding] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)
    summary: str | None = None


class FrameworkInteraction(BaseModel):
    """Two frameworks that both apply and may interact.

    The system deliberately does not resolve precedence between statutes.
    It reports the interaction and escalates.
    """
    frameworks: list[Framework]
    description: str
    evidence_ids: list[str] = Field(default_factory=list)
    escalation_required: bool = True


class Recommendation(BaseModel):
    """An action derived from a finding. Never free-form LLM invention."""
    recommendation_id: str
    action: str
    rationale: str
    framework: Framework | None = None
    derived_from_findings: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)
    priority: Literal["HIGH", "MEDIUM", "LOW"] = "MEDIUM"


# --------------------------------------------------------------------------
# Graph
# --------------------------------------------------------------------------

class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    properties: dict[str, Any] = Field(default_factory=dict)
    relevance: float = 0.0


class GraphEdge(BaseModel):
    source: str
    target: str
    type: str
    properties: dict[str, Any] = Field(default_factory=dict)


class GraphSignal(BaseModel):
    """A graph-derived signal. Named algorithm, reproducible, explainable.

    This is not a learned model output. algorithm states exactly what produced
    the score so it can be defended under questioning.
    """
    signal_type: str
    algorithm: str
    description: str
    nodes: list[str] = Field(default_factory=list)
    score: float = 0.0
    path: list[str] = Field(default_factory=list)


class GraphPayload(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)
    signals: list[GraphSignal] = Field(default_factory=list)


# --------------------------------------------------------------------------
# LLM output and citation validation
# --------------------------------------------------------------------------

class ValidatedClaim(BaseModel):
    """One sentence of LLM output, checked against the evidence it cites."""
    claim: str
    cited_evidence_ids: list[str] = Field(default_factory=list)
    verdict: CitationVerdict
    reason: str
    support_score: float = 0.0
    detected_provisions: list[str] = Field(default_factory=list)


class CitationReport(BaseModel):
    total_claims: int = 0
    verified: int = 0
    weakly_supported: int = 0
    unsupported: int = 0
    fabricated: int = 0
    claims: list[ValidatedClaim] = Field(default_factory=list)
    passed: bool = True
    notes: list[str] = Field(default_factory=list)


class Explanation(BaseModel):
    """Narrative layer. Absent in offline mode; findings still stand alone."""
    available: bool = False
    summary: str | None = None
    narrative: str | None = None
    uncertainties: list[str] = Field(default_factory=list)
    model: str | None = None
    offline_reason: str | None = None


# --------------------------------------------------------------------------
# Confidence and escalation
# --------------------------------------------------------------------------

class ConfidenceComponent(BaseModel):
    name: str
    value: float
    weight: float
    rationale: str


class ConfidenceReport(BaseModel):
    """Transparent aggregate. Presented as a support score, not a probability."""
    overall: float = 0.0
    level: ConfidenceLevel = ConfidenceLevel.LOW
    components: list[ConfidenceComponent] = Field(default_factory=list)
    disclaimer: str = (
        "Confidence reflects evidence coverage and rule certainty, "
        "not legal probability."
    )


class Escalation(BaseModel):
    required: bool = False
    priority: Literal["HIGH", "MEDIUM", "LOW"] = "LOW"
    reasons: list[str] = Field(default_factory=list)
    message: str | None = None


# --------------------------------------------------------------------------
# Request and response
# --------------------------------------------------------------------------

class AnalysisRequest(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=300)
    description: str = Field("", max_length=8000)
    ingredients: list[str] = Field(default_factory=list, max_length=100)
    claims: list[str] = Field(default_factory=list, max_length=50)
    source: Literal["traditional", "modern", "hybrid", "unknown"] = "unknown"
    target_markets: list[str] = Field(default_factory=list, max_length=30)
    product_type: str | None = Field(None, max_length=200)
    process_description: str | None = Field(None, max_length=4000)


class PipelineStage(BaseModel):
    """Per-stage timing and status, so the UI can show the pipeline actually running."""
    name: str
    status: Literal["OK", "SKIPPED", "DEGRADED", "ERROR"] = "OK"
    duration_ms: float = 0.0
    detail: str | None = None


class AnalysisResult(BaseModel):
    analysis_id: str
    created_at: datetime = Field(default_factory=_utcnow)
    request: AnalysisRequest
    entities: ExtractionResult = Field(default_factory=ExtractionResult)
    classification: ClassificationResult | None = None
    assessments: dict[str, Assessment] = Field(default_factory=dict)
    findings: list[Finding] = Field(default_factory=list)
    interactions: list[FrameworkInteraction] = Field(default_factory=list)
    recommendations: list[Recommendation] = Field(default_factory=list)
    evidence: list[Evidence] = Field(default_factory=list)
    graph: GraphPayload = Field(default_factory=GraphPayload)
    explanation: Explanation = Field(default_factory=Explanation)
    citation_report: CitationReport = Field(default_factory=CitationReport)
    confidence: ConfidenceReport = Field(default_factory=ConfidenceReport)
    escalation: Escalation = Field(default_factory=Escalation)
    rules_evaluated: list[RuleOutcome] = Field(default_factory=list)
    pipeline: list[PipelineStage] = Field(default_factory=list)
    kb_stats: dict[str, Any] = Field(default_factory=dict)

    def evidence_by_id(self) -> dict[str, Evidence]:
        return {e.evidence_id: e for e in self.evidence}


class AnalysisResponse(BaseModel):
    analysis_id: str
    status: Literal["COMPLETED", "PARTIAL", "FAILED"]
    result: AnalysisResult | None = None
    error: str | None = None
