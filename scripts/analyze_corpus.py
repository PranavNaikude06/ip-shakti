"""
Turn the raw corpus profile into the findings that drive schema design.

Reads data/profiling/corpus_profile.json (from profile_corpus.py) and reports:
  - filename claims that contradict measured content (language, identity)
  - duplicate groups and which copy to keep
  - normative vs non-normative material sitting in the same folders
  - per-domain volume, so index and storage sizing is measured, not guessed
  - overlap with the already-ingested India Code corpus

Writes data/profiling/corpus_findings.json.
"""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

PROFILE = Path("data/profiling/corpus_profile.json")
CHUNKS = Path("data/processed/chunks.jsonl")
OUT = Path("data/profiling/corpus_findings.json")

# A file whose name asserts a language.
NAME_HINDI = re.compile(r"\b(hindi)\b", re.I)
NAME_ENGLISH = re.compile(r"\b(english)\b", re.I)

# Material that is commentary or process, not enacted law. These must never be
# retrievable as a legal basis for a finding.
NON_NORMATIVE = re.compile(
    r"^\s*(comments?\s+of|comments\s+on|first\s+stake\s*holder|stakeholders?\s+meeting"
    r"|all\s+the\s+stakeholders|draft\s+revised\s+guidelines\s+for\s+computer\s+software"
    r"|wo\s+ga\s+\d+)", re.I)
DRAFT = re.compile(r"\bdraft\b|\bfor\s+objections?\b|inviting\s+comments|public\s+notice", re.I)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def classify_tier(file_name: str, doc_class: str | None) -> str:
    """How much weight material from this file may carry.

    Shared with scripts/build_corpus_db.py so the database and the analysis
    never disagree about what counts as law.
    """
    stem = Path(file_name).stem
    if NON_NORMATIVE.match(stem):
        return "NON_NORMATIVE_COMMENT"
    if doc_class == "ACT":
        return "DRAFT_OR_NOTICE" if DRAFT.search(stem) else "PRIMARY_LEGISLATION"
    if doc_class == "RULES":
        return "DRAFT_OR_NOTICE" if DRAFT.search(stem) else "SUBORDINATE_LEGISLATION"
    if doc_class in ("MANUAL", "GUIDELINE"):
        return "DRAFT_OR_NOTICE" if DRAFT.search(stem) else "OFFICE_PRACTICE"
    if re.search(r"_act_|\bact\b", stem, re.I):
        # AYUSH sits in per-institution folders (ITRA/NCH/NCISM) with no
        # acts/ subfolder, so the folder layout cannot classify it.
        return "PRIMARY_LEGISLATION"
    return "UNCLASSIFIED"


def main() -> int:
    if not PROFILE.exists():
        print("run scripts/profile_corpus.py first")
        return 1
    recs = load(PROFILE)
    findings: dict = {}

    # ---- 1. filename language claims vs measured content -------------------
    mismatches = []
    for r in recs:
        name = r["file_name"]
        claims_hi = bool(NAME_HINDI.search(name))
        claims_en = bool(NAME_ENGLISH.search(name))
        lang = r["language"]
        if lang is None or not (claims_hi or claims_en):
            continue
        contradicted = (
            (claims_hi and lang == "ENGLISH")
            or (claims_en and lang == "HINDI")
            or (claims_en and lang == "BILINGUAL_HI_EN")
            or (claims_hi and lang == "BILINGUAL_HI_EN")
        )
        if contradicted:
            mismatches.append({
                "relpath": r["relpath"],
                "name_claims": "HINDI" if claims_hi else "ENGLISH",
                "measured": lang,
                "devanagari_share": r["devanagari_share"],
                "function_word_ratio": r["function_word_ratio"],
            })
    findings["language_mismatches"] = mismatches
    findings["bilingual_files"] = sorted(
        r["relpath"] for r in recs if r["language"] == "BILINGUAL_HI_EN")

    # ---- 2. exact duplicates ----------------------------------------------
    by_hash = defaultdict(list)
    for r in recs:
        by_hash[r["sha256"]].append(r)
    dupes = []
    for h, group in by_hash.items():
        if len(group) > 1:
            # keep the copy whose name best matches; report all, decide by hand
            dupes.append({
                "sha256": h,
                "page_count": group[0]["page_count"],
                "language": group[0]["language"],
                "extractable": group[0]["extractable"],
                "copies": [g["relpath"] for g in group],
                "cross_domain": len({g["domain_from_path"] for g in group}) > 1,
            })
    findings["exact_duplicates"] = dupes
    findings["redundant_file_count"] = sum(len(d["copies"]) - 1 for d in dupes)

    # ---- 3. normative status ----------------------------------------------
    tiers = defaultdict(list)
    for r in recs:
        tier = classify_tier(r["file_name"], r["doc_class_from_path"])
        r["_tier"] = tier
        tiers[tier].append(r["relpath"])
    findings["authority_tiers"] = {k: len(v) for k, v in sorted(tiers.items())}
    findings["non_normative_files"] = sorted(tiers["NON_NORMATIVE_COMMENT"])
    findings["draft_files"] = sorted(tiers["DRAFT_OR_NOTICE"])

    # ---- 4. ingestion readiness by domain ---------------------------------
    per_domain = defaultdict(lambda: {
        "files": 0, "pages": 0, "mb": 0.0, "extractable_files": 0,
        "ocr_needed_files": 0, "ocr_needed_pages": 0, "english": 0, "hindi": 0,
        "est_chunks": 0, "text_chars": 0})
    for r in recs:
        d = per_domain[r["domain_from_path"] or "UNMAPPED"]
        d["files"] += 1
        d["pages"] += r["page_count"] or 0
        d["mb"] += r["size_bytes"] / 1e6
        if r["extractable"]:
            d["extractable_files"] += 1
            d["text_chars"] += r["text_chars"]
            d["est_chunks"] += max(r["probe_section_headings"], r["probe_subsection"])
        else:
            d["ocr_needed_files"] += 1
            d["ocr_needed_pages"] += r["page_count"] or 0
        if r["language"] == "ENGLISH":
            d["english"] += 1
        elif r["language"] in ("HINDI", "BILINGUAL_HI_EN"):
            d["hindi"] += 1
    for d in per_domain.values():
        d["mb"] = round(d["mb"], 1)
    findings["per_domain"] = dict(sorted(per_domain.items()))

    # ---- 5. what is actually ingestable right now -------------------------
    ready = [r for r in recs
             if r["extractable"]
             and r["language"] in ("ENGLISH", "BILINGUAL_HI_EN")
             and r["text_quality"] in ("GOOD", "DEGRADED")
             and r["_tier"] in ("PRIMARY_LEGISLATION", "SUBORDINATE_LEGISLATION",
                                "OFFICE_PRACTICE")]
    seen_hash = set()
    ready_unique = []
    for r in ready:
        if r["sha256"] in seen_hash:
            continue
        seen_hash.add(r["sha256"])
        ready_unique.append(r)
    findings["phase1_ingestable"] = {
        "files": len(ready_unique),
        "pages": sum(r["page_count"] or 0 for r in ready_unique),
        "text_chars": sum(r["text_chars"] for r in ready_unique),
        "est_chunks": sum(max(r["probe_section_headings"], r["probe_subsection"])
                          for r in ready_unique),
        "by_domain": dict(Counter(r["domain_from_path"] for r in ready_unique)),
        "by_tier": dict(Counter(r["_tier"] for r in ready_unique)),
    }
    findings["phase1_file_list"] = sorted(r["relpath"] for r in ready_unique)

    # ---- 6. overlap with the already-ingested India Code corpus -----------
    if CHUNKS.exists():
        docs = Counter()
        sections = defaultdict(set)
        for line in CHUNKS.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            c = json.loads(line)
            docs[c["document_id"]] += 1
            if c.get("section"):
                sections[c["document_id"]].add(c["section"])
        findings["existing_kb"] = {
            "chunks": sum(docs.values()),
            "documents": dict(docs),
            "distinct_sections": {k: len(v) for k, v in sections.items()},
        }
        findings["overlap_note"] = (
            "The India Code ingest already holds the consolidated bare Acts for "
            "PATENT, TRADEMARK, COPYRIGHT, DESIGN. The DATA corpus adds Rules, "
            "Manuals, Guidelines and Amendment Acts for those domains, plus "
            "GEOGRAPHICAL_INDICATION and AYUSH_REGULATORY which the KB lacks "
            "entirely. It does not cover BIODIVERSITY_ABS or REGULATORY "
            "(Drugs & Cosmetics), which India Code supplies."
        )

    # ---- 7. sizing for the vector store ----------------------------------
    total_chars = sum(r["text_chars"] for r in recs if r["extractable"])
    est_chunks_all = findings["phase1_ingestable"]["est_chunks"]
    findings["sizing"] = {
        "extractable_text_chars": total_chars,
        "approx_tokens": int(total_chars / 4),
        "phase1_est_chunks": est_chunks_all,
        "dense_index_mb_at_384d_float32": round(est_chunks_all * 384 * 4 / 1e6, 1),
        "existing_dense_index_mb": round(Path("data/indices/dense.npy").stat().st_size / 1e6, 1)
        if Path("data/indices/dense.npy").exists() else None,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(findings, indent=2, ensure_ascii=False), encoding="utf-8")

    # ---------------- print ----------------
    print("=" * 78)
    print("CORPUS FINDINGS")
    print("=" * 78)

    print("\n1. FILENAME LANGUAGE CLAIMS CONTRADICTED BY CONTENT ({}):".format(len(mismatches)))
    for m in mismatches:
        print("   name says {:<11} content is {:<7} (deva {:.2f})  {}".format(
            m["name_claims"], m["measured"], m["devanagari_share"], m["relpath"]))

    print("\n2. EXACT DUPLICATES ({} groups, {} redundant files):".format(
        len(dupes), findings["redundant_file_count"]))
    for d in dupes:
        tag = "  [CROSS-DOMAIN]" if d["cross_domain"] else ""
        print("   {}p{}".format(d["page_count"], tag))
        for c in d["copies"]:
            print("      {}".format(c))

    print("\n3. AUTHORITY TIERS:")
    for k, v in findings["authority_tiers"].items():
        print("   {:<24} {:>3}".format(k, v))

    print("\n4. PER DOMAIN:")
    hdr = "   {:<26} {:>5} {:>7} {:>7} {:>6} {:>6} {:>9}"
    print(hdr.format("domain", "files", "pages", "MB", "OCR", "hindi", "est_chunks"))
    for k, v in findings["per_domain"].items():
        print(hdr.format(k, v["files"], v["pages"], v["mb"],
                         v["ocr_needed_files"], v["hindi"], v["est_chunks"]))

    p1 = findings["phase1_ingestable"]
    print("\n5. INGESTABLE WITHOUT OCR OR TRANSLATION (dedup'd, normative only):")
    print("   files={}  pages={:,}  chars={:,}  est_chunks={:,}".format(
        p1["files"], p1["pages"], p1["text_chars"], p1["est_chunks"]))
    print("   by domain: {}".format(p1["by_domain"]))
    print("   by tier:   {}".format(p1["by_tier"]))

    if "existing_kb" in findings:
        print("\n6. EXISTING KB: {} chunks across {} documents".format(
            findings["existing_kb"]["chunks"], len(findings["existing_kb"]["documents"])))
        for k, v in findings["existing_kb"]["documents"].items():
            print("   {:<16} {:>5} chunks  {:>3} sections".format(
                k, v, findings["existing_kb"]["distinct_sections"].get(k, 0)))

    s = findings["sizing"]
    print("\n7. SIZING: {:,} extractable chars (~{:,} tokens); phase-1 dense index "
          "~{} MB at 384d".format(s["extractable_text_chars"], s["approx_tokens"],
                                  s["dense_index_mb_at_384d_float32"]))

    print("\nwrote {}".format(OUT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
