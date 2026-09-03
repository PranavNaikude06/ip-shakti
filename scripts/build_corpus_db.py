"""
Build the AYUR-IP database and load it with the real data, then verify it.

This exists so the schema in backend/app/db/schema.sql is not a drawing. It is
created, filled with the actual corpus, the actual knowledge base and the
actual stored analyses, and then interrogated. If a design decision does not
survive the real data, this script fails.

What it loads:
  corpus layer   110 profiled PDFs from data/profiling/corpus_profile.json
  KB layer       6 instruments and 2,891 chunks from data/processed/
  app layer      every analysis in data/analyses/

The target is SQLite, so the schema can be exercised with no server. The
authoritative DDL is PostgreSQL; the differences applied here are listed in
SQLITE_SUBSTITUTIONS and printed with --show-translation.

Usage:
    python scripts/build_corpus_db.py
    python scripts/build_corpus_db.py --db data/ayurip.db --force
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import sys
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from analyze_corpus import classify_tier  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "backend/app/db/schema.sql"
PROFILE = ROOT / "data/profiling/corpus_profile.json"
DOCUMENTS = ROOT / "data/processed/documents.json"
CHUNKS = ROOT / "data/processed/chunks.jsonl"
ANALYSES = ROOT / "data/analyses"
DEFAULT_DB = ROOT / "data/ayurip.db"

KB_VERSION = "2026.09.03"
DATA_CORPUS_ROOT = "C:/Users/ADMIN/Downloads/DATA-20260903T053355Z-1-001/DATA"

# --------------------------------------------------------------------------
# PostgreSQL -> SQLite. Every difference is listed, none is hidden.
# --------------------------------------------------------------------------
SQLITE_SUBSTITUTIONS = [
    (r"CREATE EXTENSION[^;]*;", "", "pgvector is PostgreSQL-only"),
    (r"\bTIMESTAMPTZ\b", "TEXT", "SQLite has no timestamp type; ISO-8601 UTC text"),
    (r"\bJSONB\b", "TEXT", "SQLite stores JSON as text"),
    (r"\bBIGSERIAL PRIMARY KEY\b", "INTEGER PRIMARY KEY AUTOINCREMENT",
     "SQLite autoincrement spelling"),
    (r"\bvector\(384\)", "BLOB", "dense vectors as bytes without pgvector"),
    (r"\btsvector\b", "TEXT", "no built-in full-text column; FTS5 used separately"),
    (r"::jsonb", "", "no cast syntax"),
    (r"\bnow\(\)", "CURRENT_TIMESTAMP", "SQLite spelling"),
    (r"CREATE INDEX chunk_search_idx[^;]*;", "", "GIN index is PostgreSQL-only"),
    (r"CREATE UNIQUE INDEX kb_version_one_current\s+ON kb_version \(\(TRUE\)\) WHERE is_current;",
     "CREATE UNIQUE INDEX kb_version_one_current ON kb_version (is_current) WHERE is_current;",
     "SQLite partial index cannot key on a constant expression"),
]

# SQLite cannot alias VALUES columns, so this one view is written twice.
AUTHORITY_WEIGHT_PG = re.compile(
    r"CREATE VIEW authority_weight AS.*?\) AS t\(authority_tier, weight\);",
    re.S)
AUTHORITY_WEIGHT_SQLITE = """CREATE VIEW authority_weight AS
    SELECT 'PRIMARY_LEGISLATION'     AS authority_tier, 1.00 AS weight
    UNION ALL SELECT 'SUBORDINATE_LEGISLATION', 0.90
    UNION ALL SELECT 'OFFICE_PRACTICE',         0.60
    UNION ALL SELECT 'DRAFT_OR_NOTICE',         0.00
    UNION ALL SELECT 'NON_NORMATIVE_COMMENT',   0.00;"""

# The integrity rules from integrity.sql, in SQLite trigger syntax.
SQLITE_INTEGRITY = """
-- Evidence may never cite a draft or stakeholder commentary.
CREATE TRIGGER analysis_evidence_citable
BEFORE INSERT ON analysis_evidence
FOR EACH ROW
WHEN (SELECT COALESCE(w.weight, 0) = 0 OR iv.is_draft
        FROM chunk c
        JOIN instrument_version iv
          ON iv.instrument_version_id = c.instrument_version_id
        LEFT JOIN authority_weight w ON w.authority_tier = iv.authority_tier
       WHERE c.chunk_id = NEW.chunk_id)
BEGIN
    SELECT RAISE(ABORT, 'evidence cites non-normative material: drafts and stakeholder comments cannot support a finding');
END;

-- Completed analyses are append-only in substance.
CREATE TRIGGER analysis_immutable
BEFORE UPDATE OF product_id, kb_version_id, overall_confidence, product_class
ON analysis
FOR EACH ROW
WHEN OLD.status IN ('COMPLETED', 'PARTIAL', 'FAILED')
BEGIN
    SELECT RAISE(ABORT,
      'analysis is finalised; re-run the pipeline instead of editing it');
END;

-- The audit trail cannot be rewritten.
CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

-- An instrument version must point at the canonical copy of a duplicated file.
CREATE TRIGGER instrument_version_canonical_file
BEFORE INSERT ON instrument_version
FOR EACH ROW
WHEN NEW.source_file_id IS NOT NULL
 AND (SELECT is_canonical FROM source_file
       WHERE source_file_id = NEW.source_file_id) = 0
BEGIN
    SELECT RAISE(ABORT,
      'instrument_version points at a duplicate file; use the canonical copy');
END;
"""

FRAMEWORKS = [
    ("PATENT", "Patents", 10),
    ("TRADEMARK", "Trade Marks", 20),
    ("COPYRIGHT", "Copyright", 30),
    ("DESIGN", "Designs", 40),
    ("GEOGRAPHICAL_INDICATION", "Geographical Indications", 50),
    ("PLANT_VARIETY", "Plant Variety Protection", 60),
    ("TRADITIONAL_KNOWLEDGE", "Traditional Knowledge", 70),
    ("BIODIVERSITY_ABS", "Biological Diversity and Access-Benefit Sharing", 80),
    ("AYUSH_REGULATORY", "AYUSH Regulatory", 90),
    ("REGULATORY", "Drugs and Cosmetics Regulatory", 100),
    ("FOOD_FSSAI", "Food Safety and Ayurveda Aahar", 110),
    ("INTERNATIONAL", "International Instruments", 120),
]

AUTHORITIES = [
    ("DPIIT", "Department for Promotion of Industry and Internal Trade", "DPIIT"),
    ("CGPDTM", "Office of the Controller General of Patents, Designs and Trade Marks",
     "CGPDTM"),
    ("MOEFCC", "Ministry of Environment, Forest and Climate Change", "MoEFCC"),
    ("MOHFW", "Ministry of Health and Family Welfare", "MoHFW"),
    ("MOA", "Ministry of Ayush", "Ayush"),
    ("MOL", "Ministry of Law and Justice", "MoLJ"),
]

# Which authority issued what, by framework. Recorded because "who says so"
# belongs next to every citation.
FRAMEWORK_AUTHORITY = {
    "PATENT": "CGPDTM", "TRADEMARK": "CGPDTM", "DESIGN": "CGPDTM",
    "GEOGRAPHICAL_INDICATION": "CGPDTM", "COPYRIGHT": "DPIIT",
    "BIODIVERSITY_ABS": "MOEFCC", "REGULATORY": "MOHFW",
    "AYUSH_REGULATORY": "MOA",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def slug(value: str, limit: int = 60) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-").upper()
    return s[:limit] or "UNTITLED"


# ==========================================================================
# schema
# ==========================================================================

def build_sqlite_schema(show: bool = False) -> str:
    sql = SCHEMA.read_text(encoding="utf-8")
    sql = AUTHORITY_WEIGHT_PG.sub(AUTHORITY_WEIGHT_SQLITE, sql)
    for pattern, replacement, why in SQLITE_SUBSTITUTIONS:
        sql, n = re.subn(pattern, replacement, sql)
        if show:
            print("  {:<3} {:<58} {}".format(n, pattern[:58], why))
    # SQLite runs each statement on its own; the file's explicit transaction
    # would nest inside executescript's.
    sql = sql.replace("BEGIN;", "").replace("COMMIT;", "")
    return sql + "\n" + SQLITE_INTEGRITY


# ==========================================================================
# loaders
# ==========================================================================

def seed_reference(cx: sqlite3.Connection) -> None:
    cx.executemany(
        "INSERT INTO framework (framework_code, display_name, sort_order) "
        "VALUES (?,?,?)", FRAMEWORKS)
    cx.executemany(
        "INSERT INTO authority (authority_id, name, short_name) VALUES (?,?,?)",
        AUTHORITIES)
    cx.execute(
        "INSERT INTO kb_version (kb_version_id, created_at, is_current, notes) "
        "VALUES (?,?,1,?)",
        (KB_VERSION, now_iso(),
         "India Code section-level ingest plus the profiled DATA corpus"))
    cx.execute(
        "INSERT INTO embedding_model (embedding_model_id, dimensions, runtime) "
        "VALUES (?,?,?)", ("BAAI/bge-small-en-v1.5", 384, "onnxruntime"))


def load_corpus_layer(cx: sqlite3.Connection) -> dict:
    """The 110 physical files, exactly as measured."""
    recs = json.loads(PROFILE.read_text(encoding="utf-8"))
    cx.execute(
        "INSERT INTO corpus_source (corpus_source_id, source_kind, label, "
        "origin_uri, received_at, file_count, notes) VALUES (?,?,?,?,?,?,?)",
        ("SRC-DATA-DROP", "FILE_DROP", "DATA (IP India / Ayush PDF drop)",
         DATA_CORPUS_ROOT, now_iso(), len(recs),
         "Profiled by scripts/profile_corpus.py"))
    cx.execute(
        "INSERT INTO corpus_source (corpus_source_id, source_kind, label, "
        "origin_uri, received_at, file_count, notes) VALUES (?,?,?,?,?,?,?)",
        ("SRC-INDIA-CODE", "INDIA_CODE_API", "India Code (indiacode.nic.in)",
         "https://www.indiacode.nic.in", now_iso(), 0,
         "Section-level text fetched from the authority"))

    # First occurrence of a hash is canonical; later ones point at it.
    first_by_hash: dict[str, str] = {}
    rows, file_ids = [], {}
    for i, r in enumerate(sorted(recs, key=lambda x: x["relpath"]), 1):
        fid = "SF-{:04d}".format(i)
        file_ids[r["relpath"]] = fid
        h = r["sha256"]
        dup_of = first_by_hash.get(h)
        if dup_of is None:
            first_by_hash[h] = fid

        name = r["file_name"]
        asserted = ("HINDI" if re.search(r"\bhindi\b", name, re.I)
                    else "ENGLISH" if re.search(r"\benglish\b", name, re.I)
                    else None)
        detected = r["language"]
        conflict = bool(asserted and detected and asserted != detected)

        status = ("NO_TEXT_LAYER" if not r["extractable"]
                  else "TEXT_EXTRACTED")

        rows.append((
            fid, "SRC-DATA-DROP", r["relpath"], name, "application/pdf",
            r["size_bytes"], r["sha256"], r["page_count"],
            status, r["text_chars"], r["chars_per_page"], r["pages_with_text"],
            r["text_quality"], r["function_word_ratio"], r["devanagari_share"],
            asserted, detected, int(conflict),
            int(dup_of is None), dup_of,
            r["pdf_title"], r["pdf_producer"], r["pdf_creation_date"],
            int(bool(r["has_outline"])) if r["has_outline"] is not None else None,
            r["outline_entries"], int(bool(r["encrypted"])),
            now_iso(), now_iso(), r["error"],
        ))

    cx.executemany(
        "INSERT INTO source_file (source_file_id, corpus_source_id, relpath, "
        "file_name, media_type, byte_size, content_sha256, page_count, "
        "extraction_status, text_char_count, chars_per_page, pages_with_text, "
        "text_quality, function_word_ratio, devanagari_share, "
        "asserted_language, detected_language, language_conflict, "
        "is_canonical, duplicate_of_file_id, pdf_title, pdf_producer, "
        "pdf_creation_date, has_outline, outline_entries, is_encrypted, "
        "profiled_at, ingested_at, ingest_error) "
        "VALUES (" + ",".join(["?"] * 29) + ")", rows)
    return {"records": recs, "file_ids": file_ids}


def load_data_instruments(cx: sqlite3.Connection, corpus: dict) -> int:
    """One instrument and one version per canonical DATA file.

    Titles come from the filename and are therefore unverified. The row says
    so: last_verified_on stays NULL and the note records the provenance of the
    title, so nothing downstream mistakes a filename for a citation.
    """
    recs, file_ids = corpus["records"], corpus["file_ids"]
    seen_hash: set[str] = set()
    n = 0
    for r in sorted(recs, key=lambda x: x["relpath"]):
        if r["sha256"] in seen_hash:
            continue                      # duplicate: one instrument only
        seen_hash.add(r["sha256"])

        framework = r["domain_from_path"]
        if not framework:
            continue
        tier = classify_tier(r["file_name"], r["doc_class_from_path"])
        stem = Path(r["file_name"]).stem
        is_draft = tier == "DRAFT_OR_NOTICE"

        inst_type = {
            "PRIMARY_LEGISLATION": "AMENDMENT_ACT" if "amendment" in stem.lower() else "ACT",
            "SUBORDINATE_LEGISLATION": "AMENDMENT_RULES" if "amendment" in stem.lower() else "RULES",
            "OFFICE_PRACTICE": "GUIDELINE" if r["doc_class_from_path"] == "GUIDELINE" else "MANUAL",
            "DRAFT_OR_NOTICE": "PUBLIC_NOTICE",
            "NON_NORMATIVE_COMMENT": "COMMENT",
            "UNCLASSIFIED": "OTHER",
        }[tier]

        # Long official titles truncate to the same slug, so the content hash
        # disambiguates. Without this, distinct GI rules collapse into one id.
        iid = "IN-{}-{}-{}".format(framework[:3], slug(stem, 44), r["sha256"][:6])
        vid = iid + "-V1"

        years = r["years_in_name"]
        cx.execute(
            "INSERT INTO legal_instrument (instrument_id, official_title, "
            "instrument_type, jurisdiction, authority_id, enacted_on, created_at) "
            "VALUES (?,?,?,?,?,?,?)",
            (iid, stem, inst_type, "INDIA",
             FRAMEWORK_AUTHORITY.get(framework), None, now_iso()))
        cx.execute(
            "INSERT INTO instrument_framework (instrument_id, framework_code, "
            "is_primary) VALUES (?,?,1)", (iid, framework))

        status = "PROPOSED" if is_draft else "UNKNOWN"
        cx.execute(
            "INSERT INTO instrument_version (instrument_version_id, "
            "instrument_id, source_file_id, version_label, language, "
            "authority_tier, is_draft, status, is_current, page_count, "
            "notes, created_at) VALUES (?,?,?,?,?,?,?,?,0,?,?,?)",
            (vid, iid, file_ids[r["relpath"]], "as-received",
             r["language"] or "ENGLISH", tier, int(is_draft), status,
             r["page_count"],
             "Title derived from the filename and not yet verified against the "
             "document; year hints {}".format(years or "none"),
             now_iso()))
        n += 1
    return n


def load_knowledge_base(cx: sqlite3.Connection) -> dict:
    """The India Code ingest: 6 instruments, their provisions and chunks."""
    docs = json.loads(DOCUMENTS.read_text(encoding="utf-8"))
    doc_version = {}

    for d in docs:
        iid = "IN-" + d["document_id"]
        cx.execute(
            "INSERT INTO legal_instrument (instrument_id, official_title, "
            "instrument_type, jurisdiction, authority_id, act_number, created_at) "
            "VALUES (?,?,?,?,?,?,?)",
            (iid, d["document_name"], "ACT", d["jurisdiction"],
             {"Department for Promotion of Industry and Internal Trade": "DPIIT",
              "Ministry of Environment, Forest and Climate Change": "MOEFCC",
              "Ministry of Health and Family Welfare": "MOHFW"}.get(d["authority"]),
             None, now_iso()))
        cx.execute(
            "INSERT INTO instrument_framework (instrument_id, framework_code, "
            "is_primary) VALUES (?,?,1)", (iid, d["domain"]))

        vid = iid + "-CURRENT"
        doc_version[d["document_id"]] = (iid, vid)
        cx.execute(
            "INSERT INTO instrument_version (instrument_version_id, "
            "instrument_id, source_file_id, version_label, language, "
            "authority_tier, is_draft, status, is_current, source_url, "
            "last_verified_on, page_count, notes, created_at) "
            "VALUES (?,?,NULL,?,?,?,0,?,1,?,?,?,?,?)",
            (vid, iid, d["version"] or "india-code-current", "ENGLISH",
             "PRIMARY_LEGISLATION", "IN_FORCE", d["source_url"],
             d["last_verified"], d["page_count"],
             "Section text fetched from India Code; sha256 {}".format(
                 (d.get("sha256") or "")[:16]),
             now_iso()))

    # provisions, provision_text and chunks, from the real chunk file
    provisions: dict[tuple[str, str], str] = {}
    prov_rows, text_rows, chunk_rows = [], [], []

    def ensure_provision(iid: str, parts: list[tuple[str, str]], heading):
        """Create the chain SECTION -> SUBSECTION -> CLAUSE as needed."""
        parent, path_parts = None, []
        pid = None
        for ptype, number in parts:
            path_parts.append(number)
            path = "/".join(path_parts)
            key = (iid, path)
            if key not in provisions:
                pid_new = "PV-{}-{}".format(iid, path.replace("/", "-"))
                label = "Section {}".format(path_parts[0])
                for extra in path_parts[1:]:
                    label += "({})".format(extra)
                provisions[key] = pid_new
                prov_rows.append((
                    pid_new, iid, parent, ptype, number,
                    heading if len(path_parts) == 1 else None,
                    label, path, len(path_parts) - 1,
                    "/".join(p.rjust(6, "0") for p in path_parts),
                ))
            pid = provisions[key]
            parent = pid
        return pid

    # The upstream ingest reuses a chunk_id for distinct fragments whenever it
    # flattens nested sub-clauses. Occurrences are numbered rather than
    # dropped, and the provision they hang off is marked AMBIGUOUS.
    occurrence: dict[str, int] = defaultdict(int)
    ambiguous_provisions: set[str] = set()
    chunk_alias: dict[str, str] = {}     # original id -> first loaded chunk_id

    for line in CHUNKS.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        c = json.loads(line)
        iid, vid = doc_version[c["document_id"]]
        parts = [("SECTION", c["section"] or "0")]
        if c.get("subsection"):
            parts.append(("SUBSECTION", c["subsection"]))
        if c.get("clause"):
            parts.append(("CLAUSE", c["clause"]))
        pid = ensure_provision(iid, parts, c.get("heading"))

        src_id = c["chunk_id"]
        occurrence[src_id] += 1
        n = occurrence[src_id]
        cid = src_id if n == 1 else "{}#{}".format(src_id, n)
        if n > 1:
            ambiguous_provisions.add(pid)
        chunk_alias.setdefault(src_id, cid)

        ptid = "PT-" + cid
        text_rows.append((
            ptid, pid, vid, "ENGLISH", n, c["text"], c.get("page_start"),
            c.get("page_end"), c.get("char_count") or len(c["text"]),
            sha(c["text"]), "API", now_iso()))
        chunk_rows.append((
            cid, src_id, ptid, pid, vid, c["domain"], KB_VERSION, "ENGLISH",
            c["text"], c.get("char_count") or len(c["text"]),
            max(1, len(c["text"]) // 4),
            provisions_label(provisions, iid, parts), c.get("heading"),
            c.get("page_start"), c.get("page_end"), now_iso()))

    cx.executemany(
        "INSERT INTO provision (provision_id, instrument_id, parent_id, "
        "provision_type, number, heading, citation_label, path, depth, sort_key) "
        "VALUES (?,?,?,?,?,?,?,?,?,?)", prov_rows)
    cx.executemany(
        "INSERT INTO provision_text (provision_text_id, provision_id, "
        "instrument_version_id, language, sibling_ordinal, body, page_start, "
        "page_end, char_count, text_sha256, extraction_method, created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", text_rows)
    cx.executemany(
        "INSERT INTO chunk (chunk_id, source_chunk_id, provision_text_id, "
        "provision_id, instrument_version_id, framework_code, kb_version_id, "
        "language, body, char_count, token_count, citation_label, heading, "
        "page_start, page_end, created_at) "
        "VALUES (" + ",".join(["?"] * 16) + ")", chunk_rows)

    if ambiguous_provisions:
        cx.executemany("UPDATE provision SET address_status='AMBIGUOUS' "
                       "WHERE provision_id=?",
                       [(p,) for p in ambiguous_provisions])

    cx.execute("UPDATE kb_version SET document_count=?, chunk_count=?, "
               "embedding_model=? WHERE kb_version_id=?",
               (len(docs), len(chunk_rows), "BAAI/bge-small-en-v1.5", KB_VERSION))
    return {"documents": len(docs), "provisions": len(prov_rows),
            "chunks": len(chunk_rows),
            "ambiguous_provisions": len(ambiguous_provisions),
            "colliding_ids": sum(1 for v in occurrence.values() if v > 1),
            "chunk_alias": chunk_alias}


def provisions_label(provisions, iid, parts) -> str:
    path = "/".join(n for _, n in parts)
    label = "Section {}".format(parts[0][1])
    for _, n in parts[1:]:
        label += "({})".format(n)
    return label


def load_rules(cx: sqlite3.Connection) -> int:
    pack = json.loads((ROOT / "backend/app/rules/rules.json").read_text(encoding="utf-8"))
    rules = pack["rules"]
    checksum = sha(json.dumps(rules, sort_keys=True))
    cx.execute("INSERT INTO rule_pack (rule_pack_id, version, checksum, "
               "loaded_at, notes) VALUES (?,?,?,?,?)",
               ("RP-1", "1.0.0", checksum, now_iso(),
                "backend/app/rules/rules.json"))
    for r in rules:
        cx.execute(
            "INSERT INTO rule (rule_id, rule_pack_id, framework_code, title, "
            "description, severity, recommended_action, definition) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (r["rule_id"], "RP-1", r["framework"], r["title"],
             r.get("statement"), r.get("severity", "ATTENTION"),
             r.get("recommended_action"), json.dumps(r.get("condition", {}))))
        for a in r.get("anchors", []):
            label = "Section {}".format(a.get("section"))
            if a.get("subsection"):
                label += "({})".format(a["subsection"])
            cx.execute(
                "INSERT OR IGNORE INTO rule_provision_anchor (rule_id, "
                "instrument_id, citation_label, is_required) VALUES (?,?,?,1)",
                (r["rule_id"], "IN-" + a["document_id"], label))
    return len(rules)


def load_analyses(cx: sqlite3.Connection, chunk_alias: dict) -> dict:
    files = sorted(ANALYSES.glob("*.json"))
    counts = defaultdict(int)

    for path in files:
        a = json.loads(path.read_text(encoding="utf-8"))
        aid = a["analysis_id"]
        req = a["request"]

        pid = "PRD-" + aid.split("-")[-1]
        cx.execute(
            "INSERT INTO product (product_id, product_name, description, "
            "source_origin, product_type, process_description, created_at) "
            "VALUES (?,?,?,?,?,?,?)",
            (pid, req["product_name"], req.get("description", ""),
             req.get("source", "unknown"), req.get("product_type"),
             req.get("process_description"), a["created_at"]))
        for i, ing in enumerate(req.get("ingredients", [])):
            cx.execute("INSERT INTO product_ingredient (product_id, ordinal, "
                       "raw_text) VALUES (?,?,?)", (pid, i, ing))
        for i, cl in enumerate(req.get("claims", [])):
            cx.execute("INSERT INTO product_claim (product_id, ordinal, "
                       "claim_text) VALUES (?,?,?)", (pid, i, cl))
        for m in req.get("target_markets", []):
            cx.execute("INSERT OR IGNORE INTO product_market (product_id, "
                       "market_code) VALUES (?,?)", (pid, m))

        cls = a.get("classification") or {}
        conf = a.get("confidence") or {}
        total_ms = sum(s.get("duration_ms", 0) for s in a.get("pipeline", []))
        cx.execute(
            "INSERT INTO analysis (analysis_id, product_id, kb_version_id, "
            "rule_pack_id, status, product_class, classification_score, "
            "classification_method, overall_confidence, confidence_level, "
            "dense_retrieval_enabled, started_at, completed_at, duration_ms) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (aid, pid, KB_VERSION, "RP-1", "RUNNING", cls.get("label"),
             cls.get("score"), cls.get("method"), conf.get("overall"),
             conf.get("level"), 0, a["created_at"], a["created_at"], total_ms))

        for component, model in (
                ("EMBEDDING", "BAAI/bge-small-en-v1.5"),
                ("RULE_PACK", "RP-1"),
                ("CLASSIFIER", cls.get("method") or "WEIGHTED_FEATURES"),
                ("LLM", (a.get("explanation") or {}).get("model") or "none")):
            cx.execute("INSERT INTO analysis_model_version (analysis_id, "
                       "component, model_id) VALUES (?,?,?)",
                       (aid, component, model))

        for i, st in enumerate(a.get("pipeline", [])):
            cx.execute("INSERT INTO analysis_stage (analysis_id, ordinal, "
                       "stage_name, status, duration_ms, detail) "
                       "VALUES (?,?,?,?,?,?)",
                       (aid, i, st["name"], st["status"],
                        st.get("duration_ms", 0), st.get("detail")))

        ent_n = 0
        for group, items in (a.get("entities") or {}).items():
            for e in items:
                ent_n += 1
                cx.execute(
                    "INSERT INTO analysis_entity (analysis_entity_id, "
                    "analysis_id, entity_type, surface_text, normalized, "
                    "char_start, char_end, extraction_source, metadata) "
                    "VALUES (?,?,?,?,?,?,?,?,?)",
                    ("{}-E{:03d}".format(aid, ent_n), aid, e["entity_type"],
                     e["text"], e.get("normalized"), e.get("start"),
                     e.get("end"), e.get("source", "LEXICON"),
                     json.dumps(e.get("metadata", {}))))

        ev_key = {}
        for rank, ev in enumerate(a.get("evidence", []), 1):
            gid = "{}:{}".format(aid, ev["evidence_id"])
            ev_key[ev["evidence_id"]] = gid
            src = ev["chunk_id"]
            resolved = chunk_alias.get(src, src)
            # The stored citation names an id that the upstream ingest reused
            # for several distinct fragments. It is resolved to the first
            # occurrence and the arbitrariness is recorded, not hidden.
            ambiguous = cx.execute(
                "SELECT p.address_status FROM chunk c JOIN provision p "
                "ON p.provision_id=c.provision_id WHERE c.chunk_id=?",
                (resolved,)).fetchone()
            if ambiguous and ambiguous[0] == "AMBIGUOUS":
                counts["evidence_with_ambiguous_citation"] += 1
                cx.execute(
                    "INSERT INTO audit_log (occurred_at, action, entity_type, "
                    "entity_id, analysis_id, detail) VALUES (?,?,?,?,?,?)",
                    (now_iso(), "AMBIGUOUS_CITATION_RESOLVED", "analysis_evidence",
                     gid, aid, json.dumps({
                         "cited_chunk_id": src, "resolved_to": resolved,
                         "provision": ev.get("provision"),
                         "note": "upstream chunk_id is not unique; first "
                                 "occurrence used"})))
            cx.execute(
                "INSERT INTO analysis_evidence (evidence_id, analysis_id, "
                "evidence_ref, chunk_id, rank, score, retrieval_method) "
                "VALUES (?,?,?,?,?,?,?)",
                (gid, aid, ev["evidence_id"], resolved, rank,
                 ev.get("score", 0), ev.get("retrieval_method", "HYBRID")))
            counts["evidence"] += 1

        for f in a.get("findings", []):
            fid = "{}:{}".format(aid, f["finding_id"])
            cx.execute(
                "INSERT INTO finding (finding_id, analysis_id, framework_code, "
                "rule_id, statement, detail, severity, confidence, "
                "confidence_level) VALUES (?,?,?,?,?,?,?,?,?)",
                (fid, aid, f["framework"], f.get("rule_id"), f["statement"],
                 f.get("detail"), f.get("severity", "ATTENTION"),
                 f.get("confidence", 0), f.get("confidence_level", "LOW")))
            for e in f.get("evidence_ids", []):
                if e in ev_key:
                    cx.execute("INSERT OR IGNORE INTO finding_evidence "
                               "(finding_id, evidence_id) VALUES (?,?)",
                               (fid, ev_key[e]))
            counts["findings"] += 1

        for key, asmt in (a.get("assessments") or {}).items():
            asid = "{}:AS-{}".format(aid, asmt["framework"])
            cx.execute(
                "INSERT INTO assessment (assessment_id, analysis_id, "
                "framework_code, status, confidence, confidence_level, summary) "
                "VALUES (?,?,?,?,?,?,?)",
                (asid, aid, asmt["framework"], asmt["status"],
                 asmt.get("confidence", 0), asmt.get("confidence_level", "LOW"),
                 asmt.get("summary")))
            for f in asmt.get("findings", []):
                cx.execute("INSERT OR IGNORE INTO assessment_finding "
                           "(assessment_id, finding_id) VALUES (?,?)",
                           (asid, "{}:{}".format(aid, f["finding_id"])))

        for i, inter in enumerate(a.get("interactions", []), 1):
            iid = "{}:INT-{:02d}".format(aid, i)
            cx.execute("INSERT INTO framework_interaction (interaction_id, "
                       "analysis_id, description, escalation_required) "
                       "VALUES (?,?,?,?)",
                       (iid, aid, inter["description"],
                        int(inter.get("escalation_required", True))))
            for fw in inter.get("frameworks", []):
                cx.execute("INSERT OR IGNORE INTO framework_interaction_member "
                           "(interaction_id, framework_code) VALUES (?,?)",
                           (iid, fw))
            for e in inter.get("evidence_ids", []):
                if e in ev_key:
                    cx.execute("INSERT OR IGNORE INTO "
                               "framework_interaction_evidence (interaction_id, "
                               "evidence_id) VALUES (?,?)", (iid, ev_key[e]))

        for r in a.get("recommendations", []):
            rid = "{}:{}".format(aid, r["recommendation_id"])
            cx.execute(
                "INSERT INTO recommendation (recommendation_id, analysis_id, "
                "framework_code, action, rationale, priority) "
                "VALUES (?,?,?,?,?,?)",
                (rid, aid, r.get("framework"), r["action"], r["rationale"],
                 r.get("priority", "MEDIUM")))
            for f in r.get("derived_from_findings", []):
                cx.execute("INSERT OR IGNORE INTO recommendation_finding "
                           "(recommendation_id, finding_id) VALUES (?,?)",
                           (rid, "{}:{}".format(aid, f)))

        for r in a.get("rules_evaluated", []):
            cx.execute(
                "INSERT INTO rule_execution (rule_execution_id, analysis_id, "
                "rule_id, triggered, reason, matched_on, anchors_resolved) "
                "VALUES (?,?,?,?,?,?,?)",
                ("{}:{}".format(aid, r["rule_id"]), aid, r["rule_id"],
                 int(r["triggered"]), r["reason"],
                 json.dumps(r.get("matched_on", [])), 1))

        g = a.get("graph") or {}
        for n in g.get("nodes", []):
            cx.execute("INSERT OR IGNORE INTO graph_node (analysis_id, node_id, "
                       "label, node_type, relevance, properties) "
                       "VALUES (?,?,?,?,?,?)",
                       (aid, n["id"], n["label"], n["type"],
                        n.get("relevance", 0), json.dumps(n.get("properties", {}))))
        for e in g.get("edges", []):
            cx.execute("INSERT OR IGNORE INTO graph_edge (analysis_id, "
                       "source_node_id, target_node_id, edge_type, properties) "
                       "VALUES (?,?,?,?,?)",
                       (aid, e["source"], e["target"], e["type"],
                        json.dumps(e.get("properties", {}))))
        for i, s in enumerate(g.get("signals", []), 1):
            cx.execute("INSERT INTO graph_signal (graph_signal_id, analysis_id, "
                       "signal_type, algorithm, description, score, node_ids, "
                       "path) VALUES (?,?,?,?,?,?,?,?)",
                       ("{}:GS-{:03d}".format(aid, i), aid, s["signal_type"],
                        s["algorithm"], s["description"], s.get("score", 0),
                        json.dumps(s.get("nodes", [])),
                        json.dumps(s.get("path", []))))

        ex = a.get("explanation") or {}
        cr = a.get("citation_report") or {}
        cx.execute(
            "INSERT INTO explanation (analysis_id, is_available, summary, "
            "narrative, uncertainties, llm_model, offline_reason, withheld) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (aid, int(ex.get("available", False)), ex.get("summary"),
             ex.get("narrative"), json.dumps(ex.get("uncertainties", [])),
             ex.get("model"), ex.get("offline_reason"),
             int(not cr.get("passed", True))))

        for i, c in enumerate(cr.get("claims", []), 1):
            cid = "{}:CL-{:03d}".format(aid, i)
            cx.execute(
                "INSERT INTO validated_claim (claim_id, analysis_id, ordinal, "
                "claim_text, verdict, reason, support_score, "
                "detected_provisions) VALUES (?,?,?,?,?,?,?,?)",
                (cid, aid, i, c["claim"], c["verdict"], c["reason"],
                 c.get("support_score", 0),
                 json.dumps(c.get("detected_provisions", []))))
            for e in c.get("cited_evidence_ids", []):
                if e in ev_key:
                    cx.execute("INSERT OR IGNORE INTO claim_evidence (claim_id, "
                               "evidence_id) VALUES (?,?)", (cid, ev_key[e]))

        for comp in (a.get("confidence") or {}).get("components", []):
            cx.execute("INSERT OR IGNORE INTO confidence_component (analysis_id, "
                       "component_name, value, weight, rationale) "
                       "VALUES (?,?,?,?,?)",
                       (aid, comp["name"], comp["value"], comp["weight"],
                        comp["rationale"]))

        esc = a.get("escalation") or {}
        cx.execute("INSERT INTO escalation (analysis_id, is_required, priority, "
                   "reasons, message) VALUES (?,?,?,?,?)",
                   (aid, int(esc.get("required", False)),
                    esc.get("priority", "LOW"),
                    json.dumps(esc.get("reasons", [])), esc.get("message")))

        cx.execute("INSERT INTO audit_log (occurred_at, action, entity_type, "
                   "entity_id, analysis_id, detail) VALUES (?,?,?,?,?,?)",
                   (a["created_at"], "ANALYSIS_LOADED", "analysis", aid, aid,
                    json.dumps({"source": path.name})))

        # Only now may the analysis be finalised: the fabricated-citation
        # trigger runs on this update.
        cx.execute("UPDATE analysis SET status='COMPLETED' WHERE analysis_id=?",
                   (aid,))
        counts["analyses"] += 1

    return dict(counts)


# ==========================================================================
# verification
# ==========================================================================

def q1(cx, sql, params=()):
    row = cx.execute(sql, params).fetchone()
    return row[0] if row else None


def verify(cx: sqlite3.Connection) -> bool:
    ok = True
    print("\n" + "=" * 78)
    print("VERIFICATION")
    print("=" * 78)

    print("\nrow counts")
    for table in ("framework", "authority", "corpus_source", "source_file",
                  "legal_instrument", "instrument_version", "provision",
                  "provision_text", "chunk", "rule", "rule_provision_anchor",
                  "product", "analysis", "analysis_evidence", "finding",
                  "finding_evidence", "assessment", "recommendation",
                  "rule_execution", "graph_node", "graph_edge", "graph_signal",
                  "validated_claim", "audit_log"):
        print("  {:<26} {:>7,}".format(table, q1(cx, f"SELECT count(*) FROM {table}")))

    print("\ncorpus integrity")
    checks = [
        ("files loaded", "SELECT count(*) FROM source_file", 110),
        ("duplicate files flagged non-canonical",
         "SELECT count(*) FROM source_file WHERE is_canonical=0", 6),
        ("files needing OCR",
         "SELECT count(*) FROM source_file WHERE extraction_status='NO_TEXT_LAYER'", 32),
        ("filename language conflicts",
         "SELECT count(*) FROM source_file WHERE language_conflict=1", 8),
        ("bilingual gazette files",
         "SELECT count(*) FROM source_file WHERE detected_language='BILINGUAL_HI_EN'", 16),
        ("KB chunks", "SELECT count(*) FROM chunk", 2891),
    ]
    for label, sql, expected in checks:
        got = q1(cx, sql)
        good = got == expected
        ok &= good
        print("  [{}] {:<40} {:>6} (expected {})".format(
            "ok" if good else "FAIL", label, got, expected))

    print("\nhonesty invariants")
    orphan_findings = q1(cx, """
        SELECT count(*) FROM finding f
         WHERE NOT EXISTS (SELECT 1 FROM finding_evidence fe
                            WHERE fe.finding_id = f.finding_id)""")
    print("  [{}] findings with no evidence: {}".format(
        "ok" if orphan_findings == 0 else "FAIL", orphan_findings))
    ok &= orphan_findings == 0

    non_citable = q1(cx, """
        SELECT count(*) FROM analysis_evidence ev
          JOIN chunk c  ON c.chunk_id = ev.chunk_id
          JOIN instrument_version iv
            ON iv.instrument_version_id = c.instrument_version_id
         WHERE iv.is_draft = 1 OR iv.authority_tier IN
               ('DRAFT_OR_NOTICE','NON_NORMATIVE_COMMENT')""")
    print("  [{}] evidence citing drafts or commentary: {}".format(
        "ok" if non_citable == 0 else "FAIL", non_citable))
    ok &= non_citable == 0

    fabricated = q1(cx, """
        SELECT count(*) FROM validated_claim vc
          JOIN analysis a ON a.analysis_id = vc.analysis_id
         WHERE vc.verdict='FABRICATED_CITATION' AND a.status='COMPLETED'""")
    print("  [{}] fabricated citations in completed analyses: {}".format(
        "ok" if fabricated == 0 else "FAIL", fabricated))
    ok &= fabricated == 0

    print("\ncitation precision (a data defect the schema exposes, not a schema failure)")
    amb_prov = q1(cx, "SELECT count(*) FROM provision WHERE address_status='AMBIGUOUS'")
    amb_chunks = q1(cx, """
        SELECT count(*) FROM chunk c JOIN provision p
          ON p.provision_id = c.provision_id
         WHERE p.address_status='AMBIGUOUS'""")
    amb_ev = q1(cx, """
        SELECT count(*) FROM analysis_evidence ev
          JOIN chunk c ON c.chunk_id = ev.chunk_id
          JOIN provision p ON p.provision_id = c.provision_id
         WHERE p.address_status='AMBIGUOUS'""")
    print("  provisions whose address does not identify one provision: {}".format(amb_prov))
    print("  chunks sitting on such an address:                        {}".format(amb_chunks))
    print("  stored evidence rows citing one:                          {}".format(amb_ev))
    for label, frags in cx.execute("""
        SELECT citation_label, fragment_count FROM ambiguous_citation
         ORDER BY fragment_count DESC LIMIT 5"""):
        print("     {:<20} resolves to {} different fragments".format(label, frags))

    print("\nconstraints actually fire")
    ok &= negative_test(
        cx, "cite a stakeholder comment as evidence",
        lambda: cite_non_normative(cx))
    ok &= negative_test(
        cx, "edit a completed analysis",
        lambda: cx.execute(
            "UPDATE analysis SET overall_confidence=0.99 WHERE analysis_id = "
            "(SELECT analysis_id FROM analysis WHERE status='COMPLETED' LIMIT 1)"))
    ok &= negative_test(
        cx, "delete an audit row",
        lambda: cx.execute("DELETE FROM audit_log"))
    ok &= negative_test(
        cx, "point an instrument version at a duplicate file",
        lambda: cx.execute(
            "INSERT INTO instrument_version (instrument_version_id, "
            "instrument_id, source_file_id, version_label, authority_tier) "
            "SELECT 'BAD-V', (SELECT instrument_id FROM legal_instrument LIMIT 1), "
            "source_file_id, 'x', 'PRIMARY_LEGISLATION' FROM source_file "
            "WHERE is_canonical=0 LIMIT 1"))

    print("\nquestions the design must answer")
    answer_questions(cx)
    return ok


def cite_non_normative(cx):
    """Try to attach a stakeholder comment letter to an analysis as evidence."""
    row = cx.execute("""
        SELECT iv.instrument_version_id FROM instrument_version iv
         WHERE iv.authority_tier='NON_NORMATIVE_COMMENT' LIMIT 1""").fetchone()
    if not row:
        raise RuntimeError("no commentary in the corpus to test with")
    vid = row[0]
    # a chunk must exist to reference; make one for the comment letter
    cx.execute("INSERT OR IGNORE INTO provision (provision_id, instrument_id, "
               "provision_type, number, citation_label, path, sort_key) "
               "SELECT 'PV-TEST', instrument_id, 'PARAGRAPH', '1', 'Para 1', "
               "'1', '000001' FROM instrument_version WHERE "
               "instrument_version_id=?", (vid,))
    cx.execute("INSERT OR IGNORE INTO provision_text (provision_text_id, "
               "provision_id, instrument_version_id, language, body, "
               "text_sha256) VALUES ('PT-TEST','PV-TEST',?, 'ENGLISH', "
               "'we suggest that clause 3 be reworded', 'x')", (vid,))
    cx.execute("INSERT OR IGNORE INTO chunk (chunk_id, provision_text_id, "
               "provision_id, instrument_version_id, framework_code, "
               "kb_version_id, language, body) VALUES ('CH-TEST','PT-TEST',"
               "'PV-TEST',?, 'PATENT', ?, 'ENGLISH', 'we suggest...')",
               (vid, KB_VERSION))
    cx.execute("INSERT INTO analysis_evidence (evidence_id, analysis_id, "
               "evidence_ref, chunk_id, rank, score) SELECT 'EV-TEST', "
               "analysis_id, 'E99', 'CH-TEST', 1, 1.0 FROM analysis LIMIT 1")


def negative_test(cx, label, fn) -> bool:
    sp = "sp_" + re.sub(r"\W+", "_", label)
    cx.execute(f"SAVEPOINT {sp}")
    try:
        fn()
    except sqlite3.IntegrityError as exc:
        cx.execute(f"ROLLBACK TO {sp}")
        cx.execute(f"RELEASE {sp}")
        print("  [ok]   rejected: {:<48} {}".format(label, str(exc)[:60]))
        return True
    except Exception as exc:  # noqa: BLE001
        cx.execute(f"ROLLBACK TO {sp}")
        cx.execute(f"RELEASE {sp}")
        print("  [ok]   rejected: {:<48} {}".format(label, str(exc)[:60]))
        return True
    cx.execute(f"ROLLBACK TO {sp}")
    cx.execute(f"RELEASE {sp}")
    print("  [FAIL] allowed:  {}".format(label))
    return False


def answer_questions(cx) -> None:
    print("\n  Q: which corpus files cannot be ingested yet, and why?")
    for blocker, n, pages in cx.execute("""
        SELECT blocker, count(*), COALESCE(sum(page_count),0)
          FROM ingestion_gap GROUP BY blocker ORDER BY count(*) DESC"""):
        print("       {:<20} {:>3} files {:>6} pages".format(blocker, n, pages))

    print("\n  Q: how much of the corpus may be cited as law?")
    for tier, n in cx.execute("""
        SELECT authority_tier, count(*) FROM instrument_version
         GROUP BY authority_tier ORDER BY count(*) DESC"""):
        w = cx.execute("SELECT weight FROM authority_weight WHERE "
                       "authority_tier=?", (tier,)).fetchone()
        print("       {:<26} {:>3} versions  weight {}".format(
            tier, n, w[0] if w else "n/a"))

    print("\n  Q: how did analysis X reach its first finding?")
    row = cx.execute("""
        SELECT analysis_id, statement, evidence_ref, citation_label,
               instrument_title, authority_tier, retrieval_method
          FROM analysis_provenance LIMIT 1""").fetchone()
    if row:
        print("       analysis   {}".format(row[0]))
        print("       finding    {}".format(row[1][:66] + "..."))
        print("       cites      {} = {} of {}".format(row[2], row[3], row[4]))
        print("       tier       {} via {}".format(row[5], row[6]))

    print("\n  Q: which frameworks does the KB actually cover?")
    for fw, docs, chunks in cx.execute("""
        SELECT framework_code, count(DISTINCT instrument_version_id), count(*)
          FROM chunk GROUP BY framework_code ORDER BY count(*) DESC"""):
        print("       {:<24} {} instrument(s) {:>6,} chunks".format(fw, docs, chunks))

    print("\n  Q: which frameworks does the DATA corpus add that the KB lacks?")
    for fw, n in cx.execute("""
        SELECT f.framework_code, count(*)
          FROM instrument_framework f
          JOIN instrument_version iv ON iv.instrument_id = f.instrument_id
         WHERE f.framework_code NOT IN (SELECT DISTINCT framework_code FROM chunk)
         GROUP BY f.framework_code ORDER BY count(*) DESC"""):
        print("       {:<26} {:>3} instrument versions, 0 chunks indexed".format(fw, n))


# ==========================================================================

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=str(DEFAULT_DB))
    ap.add_argument("--force", action="store_true", help="overwrite an existing db")
    ap.add_argument("--show-translation", action="store_true")
    args = ap.parse_args()

    db_path = Path(args.db)
    if db_path.exists():
        if not args.force:
            print("{} exists; pass --force to rebuild".format(db_path))
            return 1
        db_path.unlink()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    if args.show_translation:
        print("PostgreSQL -> SQLite substitutions applied:")
    schema_sql = build_sqlite_schema(show=args.show_translation)

    cx = sqlite3.connect(db_path)
    cx.execute("PRAGMA foreign_keys = ON")
    cx.executescript(schema_sql)
    print("schema created: {} tables, {} views, {} triggers".format(
        q1(cx, "SELECT count(*) FROM sqlite_master WHERE type='table'"),
        q1(cx, "SELECT count(*) FROM sqlite_master WHERE type='view'"),
        q1(cx, "SELECT count(*) FROM sqlite_master WHERE type='trigger'")))

    seed_reference(cx)
    corpus = load_corpus_layer(cx)
    print("corpus layer: {} files".format(len(corpus["records"])))
    n_inst = load_data_instruments(cx, corpus)
    print("DATA instruments: {}".format(n_inst))
    kb = load_knowledge_base(cx)
    print("knowledge base: {documents} instruments, {provisions} provisions, "
          "{chunks} chunks".format(**kb))
    print("  chunk ids reused by the upstream ingest: {} (marking {} provisions "
          "AMBIGUOUS)".format(kb["colliding_ids"], kb["ambiguous_provisions"]))
    n_rules = load_rules(cx)
    print("rule pack: {} rules".format(n_rules))
    app = load_analyses(cx, kb["chunk_alias"])
    print("app state: {}".format(dict(app)))
    cx.commit()

    ok = verify(cx)
    cx.commit()
    cx.close()

    print("\n{}".format("=" * 78))
    print("database written to {} ({:.1f} MB)".format(
        db_path, db_path.stat().st_size / 1e6))
    print("ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
