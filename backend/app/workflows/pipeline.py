"""
The AYUR-IP analysis pipeline.

    intake -> extraction -> classification -> rules(anchoring) ->
    retrieval augmentation -> graph -> assessments -> confidence ->
    escalation -> LLM narrative -> citation validation

Each stage is a pure function over the shared context; the orchestrator only
sequences them and records per-stage timing/status into the result's
`pipeline` list, so the caller (and the UI) can see exactly what ran, what
degraded, and how long it took. A stage failure marks the stage ERROR and the
pipeline continues where downstream stages can still be meaningful.

There is exactly one LLM call, at the end, and the citation validator sits
between it and the response.
"""

from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass, field

from app.graph.service import build_analysis_graph, compute_signals, to_payload
from app.models.core import (
    AnalysisRequest,
    AnalysisResult,
    Evidence,
    Framework,
    PipelineStage,
)
from app.rag.retriever import LegalRetriever
from app.rules.engine import AnchorResolver, evaluate_rules
from app.services import assessment as asm
from app.services.citations import validate as validate_citations
from app.services.classifier import classify
from app.services.extraction import extract
from app.services.llm import generate_explanation

logger = logging.getLogger(__name__)

# Frameworks that get retrieval augmentation beyond rule anchors, with the
# query template used for each.
_AUGMENT_QUERIES: dict[Framework, str] = {
    Framework.PATENT: "patentability exclusions for {ingredients} formulation {process}",
    Framework.BIODIVERSITY_ABS: "obligations for use of biological resource {ingredients} commercial utilisation",
    Framework.REGULATORY: "requirements for manufacture and sale of Ayurvedic drug {claims}",
}


@dataclass
class PipelineDeps:
    """Shared singletons, constructed once at startup."""
    retriever: LegalRetriever
    resolver: AnchorResolver
    kb_documents: int
    kb_chunks: int


@dataclass
class _Ctx:
    request: AnalysisRequest
    result: AnalysisResult
    evidence_registry: dict[str, Evidence] = field(default_factory=dict)
    facts: dict[str, bool] = field(default_factory=dict)


def _stage(ctx: _Ctx, name: str):
    """Context manager recording stage duration and status."""
    class _Recorder:
        def __enter__(self):
            self.start = time.perf_counter()
            return self

        def __exit__(self, exc_type, exc, tb):
            duration = (time.perf_counter() - self.start) * 1000
            if exc is not None:
                logger.exception("Stage %s failed", name)
                ctx.result.pipeline.append(
                    PipelineStage(name=name, status="ERROR", duration_ms=round(duration, 1),
                                  detail=f"{exc_type.__name__}: {exc}")
                )
                return True  # continue pipeline
            ctx.result.pipeline.append(
                PipelineStage(name=name, status=getattr(self, "status", "OK"),
                              duration_ms=round(duration, 1), detail=getattr(self, "detail", None))
            )
            return False

    return _Recorder()


def run_analysis(request: AnalysisRequest, deps: PipelineDeps) -> AnalysisResult:
    analysis_id = f"ANL-{uuid.uuid4().hex[:10].upper()}"
    ctx = _Ctx(request=request, result=AnalysisResult(analysis_id=analysis_id, request=request))
    result = ctx.result
    result.kb_stats = {
        "documents": deps.kb_documents,
        "chunks": deps.kb_chunks,
        "dense_retrieval": deps.retriever.dense_enabled,
    }

    with _stage(ctx, "entity_extraction"):
        result.entities = extract(request)

    with _stage(ctx, "classification"):
        result.classification = classify(request, result.entities)

    with _stage(ctx, "rule_engine"):
        outcomes, ctx.facts = evaluate_rules(
            request, result.entities, deps.resolver, ctx.evidence_registry
        )
        result.rules_evaluated = outcomes

    with _stage(ctx, "hybrid_retrieval") as rec:
        triggered_frameworks = {o.framework for o in result.rules_evaluated if o.triggered}
        ingredients = ", ".join(e.normalized or e.text for e in result.entities.ingredients) or request.product_name
        claims = ", ".join(e.normalized or e.text for e in result.entities.therapeutic_claims)
        process = ", ".join(e.normalized or e.text for e in result.entities.processes)
        added = 0
        registered_chunks = {ev.chunk_id for ev in ctx.evidence_registry.values()}
        for framework, template in _AUGMENT_QUERIES.items():
            if framework not in triggered_frameworks:
                continue
            query = template.format(ingredients=ingredients, claims=claims, process=process)
            hits = deps.retriever.search(query, top_k=3, domains=[framework])
            for chunk, score, method in hits:
                if chunk.chunk_id in registered_chunks:
                    continue
                eid = f"EVID-S-{len(ctx.evidence_registry) + 1:03d}"
                ev = deps.retriever.to_evidence([(chunk, score, method)], prefix="EVID-S",
                                                start_index=len(ctx.evidence_registry) + 1)[0]
                ev.evidence_id = eid
                ctx.evidence_registry[eid] = ev
                registered_chunks.add(chunk.chunk_id)
                added += 1
        rec.detail = (
            f"{added} contextual evidence items added; dense={'on' if deps.retriever.dense_enabled else 'off'}"
        )
        if not deps.retriever.dense_enabled:
            rec.status = "DEGRADED"

    with _stage(ctx, "knowledge_graph"):
        graph = build_analysis_graph(
            request.product_name, result.entities, result.rules_evaluated, ctx.evidence_registry
        )
        signals = compute_signals(graph)
        result.graph = to_payload(graph, signals)

    with _stage(ctx, "findings_assembly"):
        result.findings = asm.build_findings(result.rules_evaluated)
        result.assessments = asm.build_assessments(result.findings, ctx.facts)
        result.interactions = asm.detect_interactions(result.findings, ctx.evidence_registry)
        result.recommendations = asm.build_recommendations(result.rules_evaluated)
        result.evidence = list(ctx.evidence_registry.values())

    with _stage(ctx, "confidence"):
        result.confidence = asm.build_confidence(
            result.entities,
            result.findings,
            result.rules_evaluated,
            deps.retriever.dense_enabled,
            deps.kb_documents,
        )

    with _stage(ctx, "escalation"):
        result.escalation = asm.build_escalation(
            result.confidence, result.interactions, result.assessments
        )

    with _stage(ctx, "llm_explanation") as rec:
        result.explanation = generate_explanation(
            request, result.findings, ctx.evidence_registry, result.confidence, result.recommendations
        )
        if not result.explanation.available:
            rec.status = "DEGRADED"
            rec.detail = result.explanation.offline_reason

    with _stage(ctx, "citation_validation") as rec:
        result.citation_report = validate_citations(result.explanation, ctx.evidence_registry)
        if result.explanation.available:
            rec.detail = (
                f"{result.citation_report.verified}/{result.citation_report.total_claims} claims verified; "
                f"{result.citation_report.fabricated} fabricated"
            )
            # A narrative that fails validation is withheld, not displayed.
            if not result.citation_report.passed:
                rec.status = "DEGRADED"
                result.explanation.available = False
                result.explanation.offline_reason = (
                    "Narrative failed citation validation and was withheld; "
                    "structured findings remain fully evidence-backed."
                )

    return result
