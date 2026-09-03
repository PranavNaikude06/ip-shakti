"""
Live demonstration of the citation validator.

Takes the most recent stored analysis, then runs three doctored narratives
through the same validator that guards every real response:

    1. a claim citing an evidence ID that does not exist
    2. a claim attributing the wrong Section to real evidence
    3. a claim invoking an Act that is nowhere in the evidence set

Each is caught and labelled. This is the layer that guarantees the system
cannot present invented law as verified -- shown by construction, live.

Usage:  python scripts/demo_validator.py [analysis_id]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.models.core import AnalysisResult, Explanation  # noqa: E402
from app.services.citations import validate  # noqa: E402


def load_latest() -> AnalysisResult:
    analyses = sorted((ROOT / "data" / "analyses").glob("ANL-*.json"),
                      key=lambda p: p.stat().st_mtime, reverse=True)
    if len(sys.argv) > 1:
        path = ROOT / "data" / "analyses" / f"{sys.argv[1]}.json"
    elif analyses:
        path = analyses[0]
    else:
        raise SystemExit("No stored analyses. Run scripts/run_demo.py first.")
    return AnalysisResult.model_validate_json(path.read_text(encoding="utf-8"))


def show(title: str, narrative: str, registry) -> None:
    print("=" * 72)
    print(title)
    print("-" * 72)
    report = validate(Explanation(available=True, narrative=narrative), registry)
    for claim in report.claims:
        print(f"  [{claim.verdict.value:20s}] {claim.claim[:70]}")
        print(f"    -> {claim.reason}")
    print(f"  RESULT: passed={report.passed}  "
          f"({report.verified} verified, {report.fabricated} fabricated, "
          f"{report.unsupported} unsupported)")
    if not report.passed:
        print("  => narrative WITHHELD from the user; structured findings stand alone.")
    print()


def main() -> None:
    result = load_latest()
    registry = result.evidence_by_id()
    print(f"\nValidating against analysis {result.analysis_id} "
          f"({len(registry)} evidence items)\n")

    if result.explanation.available and result.explanation.narrative:
        report = validate(result.explanation, registry)
        print("=" * 72)
        print("1. THE REAL LLM NARRATIVE (as returned by the pipeline)")
        print("-" * 72)
        print(f"  {report.verified}/{report.total_claims} claims verified, "
              f"{report.fabricated} fabricated -> passed={report.passed}\n")

    show(
        "2. DOCTORED: citation to evidence that does not exist",
        "This product is unpatentable due to the traditional knowledge "
        "exclusion in Section 3(p) [EVID-R-099].",
        registry,
    )
    show(
        "3. DOCTORED: wrong Section attributed to real evidence",
        "The formulation is excluded as a computer programme per se under "
        "Section 3(k) of the Patents Act [EVID-R-001].",
        registry,
    )
    show(
        "4. DOCTORED: legislation that is not in the evidence set at all",
        "Sale of this product additionally requires registration under the "
        "Consumer Protection Act, 2019 [EVID-R-008].",
        registry,
    )


if __name__ == "__main__":
    main()
