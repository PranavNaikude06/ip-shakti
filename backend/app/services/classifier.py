"""
Product triage classification.

There is no labelled training corpus for Ayurvedic product categories in this
project, so there is no trained model here -- and the output never pretends
otherwise (`method: WEIGHTED_FEATURES`, features exposed, disclaimer attached).
A transparent weighted-feature scorer beats an untrained neural network that
would emit fabricated confidence.

The categories mirror the regulatory landscape (classical vs proprietary
Ayurvedic medicine, Ayurveda-Aahar, cosmetic, phytopharmaceutical) and the
classifier's job is triage: pick the most plausible pathway and show its work.
"""

from __future__ import annotations

from app.models.core import (
    AnalysisRequest,
    ClassificationFeature,
    ClassificationResult,
    ExtractionResult,
    ProductClass,
)


def classify(request: AnalysisRequest, entities: ExtractionResult) -> ClassificationResult:
    scores: dict[ProductClass, float] = {c: 0.0 for c in ProductClass}
    features: list[ClassificationFeature] = []

    def feature(name: str, triggered: bool, rationale: str, contributions: dict[ProductClass, float]) -> None:
        features.append(
            ClassificationFeature(
                name=name,
                weight=max(abs(w) for w in contributions.values()) if contributions else 0.0,
                triggered=triggered,
                rationale=rationale,
            )
        )
        if triggered:
            for cls, weight in contributions.items():
                scores[cls] += weight

    classical_named = bool(entities.product_types)
    feature(
        "classical_formulation_named",
        classical_named,
        "A classical formulation name (e.g. an arishta or churna from the classical texts) was detected."
        if classical_named else "No classical formulation name detected.",
        {ProductClass.CLASSICAL_AYURVEDIC_MEDICINE: 3.0},
    )

    traditional_source = request.source == "traditional"
    feature(
        "declared_traditional_source",
        traditional_source,
        "The intake declares a traditional source." if traditional_source else "Source not declared traditional.",
        {ProductClass.CLASSICAL_AYURVEDIC_MEDICINE: 1.0, ProductClass.PROPRIETARY_AYURVEDIC_MEDICINE: 1.5},
    )

    novel_process = any((e.metadata or {}).get("novelty") in {"CLAIMED_NOVEL", "MODERN"} for e in entities.processes)
    feature(
        "modern_or_novel_process",
        novel_process,
        "A modern or claimed-novel process was detected, pointing away from a purely classical preparation."
        if novel_process else "No modern/novel process detected.",
        {
            ProductClass.PROPRIETARY_AYURVEDIC_MEDICINE: 2.0,
            ProductClass.PHYTOPHARMACEUTICAL: 1.0,
            ProductClass.CLASSICAL_AYURVEDIC_MEDICINE: -2.0,
        },
    )

    herbs = [e for e in entities.ingredients if e.botanical_name]
    feature(
        "botanical_ingredients",
        bool(herbs),
        f"{len(herbs)} lexicon-confirmed botanical ingredient(s)." if herbs else "No confirmed botanical ingredients.",
        {ProductClass.PROPRIETARY_AYURVEDIC_MEDICINE: 1.0, ProductClass.CLASSICAL_AYURVEDIC_MEDICINE: 0.5},
    )

    claim_classes = {(e.metadata or {}).get("claim_class") for e in entities.therapeutic_claims}
    cosmetic_only = claim_classes and claim_classes <= {"COSMETIC"}
    feature(
        "cosmetic_claims_only",
        bool(cosmetic_only),
        "All detected claims are cosmetic." if cosmetic_only else "Claims are not exclusively cosmetic.",
        {ProductClass.COSMETIC: 2.5},
    )

    wellness = "WELLNESS" in claim_classes or "THERAPEUTIC" in claim_classes
    feature(
        "health_claims_present",
        wellness,
        "Wellness/therapeutic claims present, indicating a medicine rather than a food or cosmetic."
        if wellness else "No wellness/therapeutic claims detected.",
        {ProductClass.PROPRIETARY_AYURVEDIC_MEDICINE: 1.0, ProductClass.AYURVEDA_AAHAR: -1.0},
    )

    food_words = any(w in (request.description + " " + (request.product_type or "")).lower()
                     for w in ("food", "aahar", "nutraceutical", "dietary", "supplement drink", "beverage"))
    feature(
        "food_context",
        food_words,
        "Food/nutraceutical context detected in the description." if food_words else "No food context detected.",
        {ProductClass.AYURVEDA_AAHAR: 2.5},
    )

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    top_class, top_score = ranked[0]
    if top_score <= 0:
        top_class, top_score = ProductClass.UNKNOWN, 0.0

    positive_total = sum(v for _c, v in ranked if v > 0) or 1.0
    normalized = round(max(top_score, 0.0) / positive_total, 3)

    return ClassificationResult(
        label=top_class,
        score=normalized,
        method="WEIGHTED_FEATURES",
        alternatives=[
            {"label": cls.value, "score": round(max(val, 0.0) / positive_total, 3)}
            for cls, val in ranked[1:3]
            if val > 0
        ],
        features=features,
    )
