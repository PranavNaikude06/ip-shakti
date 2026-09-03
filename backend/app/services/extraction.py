"""
Entity extraction over the Ayurvedic domain lexicon.

A generic English NER model does not know that "Ashwagandha" is Withania
somnifera, that "arishta" implies fermentation, or that "rasayana" is a claim
category. Extraction here is gazetteer-driven instead: longest-match-first
matching over a curated synonym lexicon (Sanskrit, botanical and trade names),
which is deterministic, explainable and testable.

Every extracted entity keeps its character span and the lexicon entry that
produced it. When an ingredient is a botanical/mineral entry it is also emitted
as a BIOLOGICAL_RESOURCE, which is what the Biodiversity Act assessors key on.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from app.models.core import AnalysisRequest, ExtractedEntity, ExtractionResult

_LEXICON_PATH = Path(__file__).resolve().parent.parent / "knowledge" / "lexicon.json"


@lru_cache(maxsize=1)
def load_lexicon() -> dict:
    return json.loads(_LEXICON_PATH.read_text(encoding="utf-8"))


class _Matcher:
    """Longest-match-first phrase matcher with word boundaries."""

    def __init__(self, entries: list[dict], entity_type: str) -> None:
        self.entity_type = entity_type
        self._by_synonym: dict[str, dict] = {}
        phrases: list[str] = []
        for entry in entries:
            for synonym in entry.get("synonyms", []):
                key = synonym.lower().strip()
                if key and key not in self._by_synonym:
                    self._by_synonym[key] = entry
                    phrases.append(key)
        phrases.sort(key=len, reverse=True)
        if phrases:
            pattern = "|".join(re.escape(p) for p in phrases)
            self._regex = re.compile(rf"(?<![a-z0-9])(?:{pattern})(?![a-z0-9])", re.IGNORECASE)
        else:
            self._regex = None

    def find(self, text: str) -> list[ExtractedEntity]:
        if not text or self._regex is None:
            return []
        found: list[ExtractedEntity] = []
        taken: list[tuple[int, int]] = []
        for match in self._regex.finditer(text):
            span = (match.start(), match.end())
            if any(s < span[1] and span[0] < e for s, e in taken):
                continue
            taken.append(span)
            entry = self._by_synonym[match.group(0).lower()]
            found.append(
                ExtractedEntity(
                    text=match.group(0),
                    entity_type=self.entity_type,
                    normalized=entry.get("canonical"),
                    botanical_name=entry.get("botanical"),
                    start=span[0],
                    end=span[1],
                    source="LEXICON",
                    metadata={
                        k: v for k, v in entry.items()
                        if k not in {"canonical", "synonyms", "botanical"} and v is not None
                    },
                )
            )
        return found


@lru_cache(maxsize=1)
def _matchers() -> dict[str, _Matcher]:
    lex = load_lexicon()
    return {
        "herbs": _Matcher(lex["herbs"], "INGREDIENT"),
        "formulations": _Matcher(lex["classical_formulations"], "CLASSICAL_FORMULATION"),
        "processes": _Matcher(lex["processes"], "PROCESS"),
        "claims": _Matcher(lex["claims"], "THERAPEUTIC_CLAIM"),
        "dosage_forms": _Matcher(lex["dosage_forms"], "DOSAGE_FORM"),
        "markets": _Matcher(lex["markets"], "TARGET_MARKET"),
    }


def _dedupe(entities: list[ExtractedEntity]) -> list[ExtractedEntity]:
    seen: set[str] = set()
    unique: list[ExtractedEntity] = []
    for entity in entities:
        key = (entity.normalized or entity.text).lower()
        if key not in seen:
            seen.add(key)
            unique.append(entity)
    return unique


def _as_bio_resource(entity: ExtractedEntity) -> ExtractedEntity:
    clone = entity.model_copy(deep=True)
    clone.entity_type = "BIOLOGICAL_RESOURCE"
    return clone


def extract(request: AnalysisRequest) -> ExtractionResult:
    """Extract entities from both the structured fields and the free text."""
    matchers = _matchers()
    text_fields = " \n ".join(
        filter(None, [request.description, request.process_description, request.product_type or ""])
    )

    ingredients: list[ExtractedEntity] = []
    # Structured ingredient list first: user-declared, then lexicon-normalised.
    for raw in request.ingredients:
        hits = matchers["herbs"].find(raw)
        if hits:
            for hit in hits:
                hit.source = "STRUCTURED_INPUT"
                ingredients.append(hit)
        else:
            ingredients.append(
                ExtractedEntity(text=raw, entity_type="INGREDIENT", normalized=raw, source="STRUCTURED_INPUT")
            )
    ingredients.extend(matchers["herbs"].find(text_fields))
    ingredients = _dedupe(ingredients)

    claims: list[ExtractedEntity] = []
    for raw in request.claims:
        hits = matchers["claims"].find(raw)
        if hits:
            for hit in hits:
                hit.source = "STRUCTURED_INPUT"
                claims.append(hit)
        else:
            claims.append(
                ExtractedEntity(text=raw, entity_type="THERAPEUTIC_CLAIM", normalized=raw, source="STRUCTURED_INPUT")
            )
    claims.extend(matchers["claims"].find(text_fields))
    claims = _dedupe(claims)

    markets: list[ExtractedEntity] = []
    for raw in request.target_markets:
        hits = matchers["markets"].find(raw)
        if hits:
            for hit in hits:
                hit.source = "STRUCTURED_INPUT"
                markets.append(hit)
        else:
            markets.append(
                ExtractedEntity(text=raw, entity_type="TARGET_MARKET", normalized=raw, source="STRUCTURED_INPUT")
            )
    markets.extend(matchers["markets"].find(text_fields))
    markets = _dedupe(markets)

    processes = _dedupe(matchers["processes"].find(text_fields))
    dosage_forms = _dedupe(matchers["dosage_forms"].find(text_fields))
    product_types = _dedupe(
        matchers["formulations"].find(text_fields + " " + request.product_name)
    )

    # A botanical or mineral ingredient is, by definition here, a biological
    # resource candidate for Biodiversity Act analysis. Only lexicon-confirmed
    # entries qualify; free-text unknowns are not presumed biological.
    bio_resources = _dedupe(
        [_as_bio_resource(e) for e in ingredients if e.botanical_name or e.metadata.get("kind") in {"PLANT", "MINERAL"}]
    )

    return ExtractionResult(
        ingredients=ingredients,
        biological_resources=bio_resources,
        processes=processes,
        therapeutic_claims=claims,
        product_types=product_types,
        target_markets=markets,
        dosage_forms=dosage_forms,
    )
