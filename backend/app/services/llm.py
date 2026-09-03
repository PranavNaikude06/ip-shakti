"""
Grounded LLM explanation service.

Position in the architecture: dead last, and optional. The pipeline's findings,
evidence, confidence and recommendations are complete before this module runs;
the LLM only narrates them. If the provider is unreachable or no key is
configured, the analysis ships without a narrative (`Explanation.available =
False`) -- it never ships with an invented one.

One LLM call per analysis. The model receives only the structured findings and
the evidence texts, must cite evidence IDs inline, and its output goes straight
to the citation validator, which is free to strike any sentence.
"""

from __future__ import annotations

import json
import logging
import os
import re

from app.models.core import (
    AnalysisRequest,
    ConfidenceReport,
    Evidence,
    Explanation,
    Finding,
    Recommendation,
)

logger = logging.getLogger(__name__)

DEFAULT_MODEL = os.getenv("AYURIP_LLM_MODEL", "openai/gpt-oss-120b")

_SYSTEM_PROMPT = """You are the explanation layer of AYUR-IP, an evidence-grounded decision-support system for Ayurvedic product IP and regulatory analysis.

You will receive structured findings that were produced by a deterministic rule engine, each anchored to real statutory evidence with an evidence ID. Your job is ONLY to explain these findings clearly to a non-lawyer.

STRICT RULES:
1. Use ONLY the findings and evidence provided. Do not add legal knowledge from your training.
2. Every sentence that states anything about the law MUST cite at least one evidence ID in square brackets, e.g. [EVID-R-001].
3. NEVER mention an Act, section, rule, authority, or legal requirement that is not present in the provided evidence.
4. Do not present findings as legal conclusions; they are review flags.
5. State uncertainty where the findings state it.
6. Do not give definitive legal advice; the analysis prepares an expert review.

Respond with JSON only, in exactly this shape:
{
  "summary": "2-3 sentence plain-language overview citing evidence IDs",
  "narrative": "a short explanation of the findings, one paragraph per framework, every legal statement citing evidence IDs",
  "uncertainties": ["explicit uncertainty 1", "..."]
}"""


def _build_user_prompt(
    request: AnalysisRequest,
    findings: list[Finding],
    evidence: dict[str, Evidence],
    confidence: ConfidenceReport,
    recommendations: list[Recommendation],
) -> str:
    payload = {
        "product": {
            "name": request.product_name,
            "description": request.description[:500],
            "ingredients": request.ingredients,
            "claims": request.claims,
            "source": request.source,
            "target_markets": request.target_markets,
        },
        "findings": [
            {
                "finding_id": f.finding_id,
                "framework": f.framework.value,
                "statement": f.statement,
                "evidence_ids": f.evidence_ids,
                "severity": f.severity,
                "confidence_level": f.confidence_level.value,
            }
            for f in findings
        ],
        "evidence": [
            {
                "evidence_id": eid,
                "document": ev.document_name,
                "provision": ev.provision,
                "page": ev.page,
                "text": ev.text[:900],
            }
            for eid, ev in evidence.items()
        ],
        "overall_confidence": confidence.level.value,
        "recommendations": [r.action for r in recommendations],
    }
    return json.dumps(payload, ensure_ascii=False, indent=1)


def _parse_response(raw: str) -> dict | None:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            return None
        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
    if not isinstance(data, dict):
        return None
    return data


def generate_explanation(
    request: AnalysisRequest,
    findings: list[Finding],
    evidence: dict[str, Evidence],
    confidence: ConfidenceReport,
    recommendations: list[Recommendation],
) -> Explanation:
    if os.getenv("AYURIP_LLM_ENABLED", "true").lower() in {"0", "false", "off"}:
        return Explanation(available=False, offline_reason="LLM disabled by configuration.")

    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return Explanation(
            available=False,
            offline_reason="No GROQ_API_KEY configured; structured findings returned without narrative.",
        )

    if not findings:
        return Explanation(
            available=False,
            offline_reason="No findings to explain.",
        )

    model = DEFAULT_MODEL
    try:
        from groq import Groq

        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model=model,
            temperature=0.2,
            max_tokens=1400,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(request, findings, evidence, confidence, recommendations)},
            ],
        )
        raw = completion.choices[0].message.content or ""
    except Exception as exc:
        logger.warning("LLM unavailable (%s: %s); returning findings without narrative.", type(exc).__name__, exc)
        return Explanation(
            available=False,
            offline_reason=f"LLM call failed ({type(exc).__name__}); structured findings returned without narrative.",
        )

    data = _parse_response(raw)
    if data is None:
        return Explanation(
            available=False,
            model=model,
            offline_reason="LLM returned unparseable output; structured findings returned without narrative.",
        )

    return Explanation(
        available=True,
        summary=str(data.get("summary") or "").strip() or None,
        narrative=str(data.get("narrative") or "").strip() or None,
        uncertainties=[str(u) for u in data.get("uncertainties", []) if str(u).strip()],
        model=model,
    )
