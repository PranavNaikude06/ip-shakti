-- ===========================================================================
-- AYUR-IP relational schema (PostgreSQL 15+)
--
-- Designed against a measured profile of the actual corpus, not an assumed
-- one. Every unusual column here exists because something in the real data
-- forced it. The measurements live in data/profiling/corpus_profile.json and
-- data/profiling/corpus_findings.json; the rationale is in
-- docs/DATABASE_DESIGN.md.
--
-- Measured facts that shaped this design (110 PDFs, 4,411 pages, 125 MB):
--   *  32 files carry no extractable text layer      -> extraction_status
--   *   6 groups of byte-identical files under different names
--                                                     -> source_file vs
--                                                        legal_instrument split
--   *   8 filenames assert a language their content contradicts
--                                                     -> asserted_ vs detected_
--   *  16 files are bilingual Hindi+English gazettes  -> language on text, not doc
--   *  24 files are stakeholder comment letters filed
--       alongside official manuals                    -> authority_tier
--   *   3 different consolidations of the Patents Act
--       1970 coexist (as-1995, to-2015, to-2024)      -> instrument_version
--   *  the Jan Vishwas Act 2023 sits in both the
--       Patents and the GI folders                    -> instrument_framework M:N
--
-- Conventions
--   *  Primary keys are meaningful TEXT ids, stable across index rebuilds.
--   *  Enumerations are TEXT + CHECK, so adding a value is a migration of one
--      line rather than an ALTER TYPE dance. Framework is a table, because it
--      is expected to grow.
--   *  Timestamps are TIMESTAMPTZ, stored UTC.
--   *  Nothing that the system asserts as a legal conclusion may exist without
--      a row linking it to evidence. See integrity.sql.
-- ===========================================================================

BEGIN;

-- pgvector is optional. Without it, dense vectors live in the filesystem
-- index exactly as they do today and chunk_embedding.vector stays NULL.
CREATE EXTENSION IF NOT EXISTS vector;

-- ===========================================================================
-- 1. REFERENCE DATA
-- ===========================================================================

-- A body of law the system can assess against. A table rather than an enum:
-- the corpus already forced two additions (GEOGRAPHICAL_INDICATION,
-- AYUSH_REGULATORY) that the original Framework enum did not have.
CREATE TABLE framework (
    framework_code   TEXT PRIMARY KEY,
    display_name     TEXT NOT NULL,
    description      TEXT,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order       INTEGER NOT NULL DEFAULT 100
);

-- The institution that issued a document. Kept separate so "who says so"
-- can be shown next to every citation.
CREATE TABLE authority (
    authority_id     TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    short_name       TEXT,
    jurisdiction     TEXT NOT NULL DEFAULT 'INDIA',
    parent_id        TEXT REFERENCES authority(authority_id),
    website          TEXT,
    UNIQUE (name, jurisdiction)
);

-- An immutable snapshot label for the whole knowledge base. Spec section 38:
-- analyses must be reproducible, so every chunk and every analysis names the
-- KB version it belongs to and old versions are never overwritten.
CREATE TABLE kb_version (
    kb_version_id    TEXT PRIMARY KEY,             -- e.g. '2026.09.03'
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_current       BOOLEAN NOT NULL DEFAULT FALSE,
    document_count   INTEGER NOT NULL DEFAULT 0,
    chunk_count      INTEGER NOT NULL DEFAULT 0,
    embedding_model  TEXT,
    notes            TEXT
);

-- Exactly one KB version may be current.
CREATE UNIQUE INDEX kb_version_one_current
    ON kb_version ((TRUE)) WHERE is_current;

-- ===========================================================================
-- 2. CORPUS LAYER  (physical files, exactly as received)
-- ===========================================================================

-- Where a batch of files came from. The two real sources today are the
-- India Code API ingest and the DATA drop profiled by scripts/profile_corpus.py.
CREATE TABLE corpus_source (
    corpus_source_id TEXT PRIMARY KEY,
    source_kind      TEXT NOT NULL
                     CHECK (source_kind IN ('INDIA_CODE_API', 'FILE_DROP',
                                            'MANUAL_UPLOAD', 'WEB_FETCH')),
    label            TEXT NOT NULL,
    origin_uri       TEXT,
    received_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    file_count       INTEGER NOT NULL DEFAULT 0,
    notes            TEXT
);

-- One physical file as received. This table records what was measured, never
-- what the filename claims. asserted_language is the filename's claim and is
-- kept only so the contradiction can be shown; detected_language is measured.
CREATE TABLE source_file (
    source_file_id       TEXT PRIMARY KEY,
    corpus_source_id     TEXT NOT NULL REFERENCES corpus_source(corpus_source_id),
    relpath              TEXT NOT NULL,
    file_name            TEXT NOT NULL,
    media_type           TEXT NOT NULL DEFAULT 'application/pdf',
    byte_size            BIGINT NOT NULL,
    content_sha256       CHAR(64) NOT NULL,
    page_count           INTEGER,

    -- measured extraction quality
    extraction_status    TEXT NOT NULL DEFAULT 'PENDING'
                         CHECK (extraction_status IN
                                ('PENDING', 'TEXT_EXTRACTED', 'NO_TEXT_LAYER',
                                 'OCR_REQUIRED', 'OCR_COMPLETED', 'FAILED')),
    text_char_count      INTEGER,
    chars_per_page       NUMERIC(10,1),
    pages_with_text      INTEGER,
    text_quality         TEXT
                         CHECK (text_quality IN
                                ('GOOD', 'DEGRADED', 'GARBLED',
                                 'NON_LATIN_UNVERIFIED', 'NO_TEXT_LAYER')),
    function_word_ratio  NUMERIC(6,4),   -- English-ness of the Latin text
    devanagari_share     NUMERIC(6,4),   -- Devanagari / (Devanagari + Latin)

    -- language: what the name says vs what the bytes say
    asserted_language    TEXT,           -- parsed from the filename, may be wrong
    detected_language    TEXT
                         CHECK (detected_language IN
                                ('ENGLISH', 'HINDI', 'BILINGUAL_HI_EN', 'OTHER')),
    language_conflict    BOOLEAN NOT NULL DEFAULT FALSE,

    -- deduplication: identical bytes filed under different names
    is_canonical         BOOLEAN NOT NULL DEFAULT TRUE,
    duplicate_of_file_id TEXT REFERENCES source_file(source_file_id),

    -- container metadata, recorded but never trusted
    pdf_title            TEXT,
    pdf_producer         TEXT,
    pdf_creation_date    TEXT,
    has_outline          BOOLEAN,
    outline_entries      INTEGER,
    is_encrypted         BOOLEAN,

    profiled_at          TIMESTAMPTZ,
    ingested_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    ingest_error         TEXT,

    UNIQUE (corpus_source_id, relpath),
    -- a file cannot be its own duplicate, and a canonical file has no target
    CHECK (duplicate_of_file_id IS NULL OR duplicate_of_file_id <> source_file_id),
    CHECK (is_canonical = (duplicate_of_file_id IS NULL))
);

CREATE INDEX source_file_sha_idx       ON source_file (content_sha256);
CREATE INDEX source_file_status_idx    ON source_file (extraction_status);
CREATE INDEX source_file_conflict_idx  ON source_file (language_conflict)
                                       WHERE language_conflict;
CREATE INDEX source_file_ocr_idx       ON source_file (source_file_id)
                                       WHERE extraction_status IN
                                             ('NO_TEXT_LAYER', 'OCR_REQUIRED');

-- ===========================================================================
-- 3. INSTRUMENT LAYER  (the logical legal thing)
-- ===========================================================================

-- One legal instrument, independent of how many files carry it. "The Patents
-- Act, 1970" is a single row even though the corpus holds three different
-- consolidations of it across four files.
CREATE TABLE legal_instrument (
    instrument_id    TEXT PRIMARY KEY,             -- e.g. 'IN-PAT-ACT-1970'
    official_title   TEXT NOT NULL,
    short_title      TEXT,
    instrument_type  TEXT NOT NULL
                     CHECK (instrument_type IN
                            ('ACT', 'AMENDMENT_ACT', 'RULES', 'AMENDMENT_RULES',
                             'REGULATION', 'NOTIFICATION', 'MANUAL', 'GUIDELINE',
                             'SOP', 'PUBLIC_NOTICE', 'TREATY', 'COMMENT',
                             'OTHER')),
    jurisdiction     TEXT NOT NULL DEFAULT 'INDIA',
    authority_id     TEXT REFERENCES authority(authority_id),
    -- statutory identity, null when genuinely unknown
    act_number       TEXT,                          -- '39 of 1970'
    gazette_number   TEXT,
    enacted_on       DATE,
    commenced_on     DATE,
    parent_instrument_id TEXT REFERENCES legal_instrument(instrument_id),
                                                    -- Rules -> their parent Act
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX legal_instrument_type_idx   ON legal_instrument (instrument_type);
CREATE INDEX legal_instrument_parent_idx ON legal_instrument (parent_instrument_id);

-- An instrument can belong to more than one framework. The Jan Vishwas
-- (Amendment of Provisions) Act 2023 amends the Patents, Trade Marks, GI and
-- Copyright Acts at once, which is why the same file appears in two folders.
CREATE TABLE instrument_framework (
    instrument_id    TEXT NOT NULL REFERENCES legal_instrument(instrument_id)
                     ON DELETE CASCADE,
    framework_code   TEXT NOT NULL REFERENCES framework(framework_code),
    is_primary       BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (instrument_id, framework_code)
);

CREATE INDEX instrument_framework_fw_idx ON instrument_framework (framework_code);

-- One concrete rendering of an instrument: a consolidation date, a language,
-- a file. Three rows exist for the Patents Act 1970 because the corpus holds
-- the as-effective-1995 text, the to-2015 consolidation and the to-2024
-- consolidation. Only one may be current, and retrieval must prefer it.
CREATE TABLE instrument_version (
    instrument_version_id TEXT PRIMARY KEY,
    instrument_id      TEXT NOT NULL REFERENCES legal_instrument(instrument_id)
                       ON DELETE CASCADE,
    source_file_id     TEXT REFERENCES source_file(source_file_id),
    version_label      TEXT NOT NULL,              -- 'consolidated-to-2024-08-01'
    language           TEXT NOT NULL DEFAULT 'ENGLISH'
                       CHECK (language IN ('ENGLISH', 'HINDI', 'BILINGUAL_HI_EN')),

    -- how much weight a citation from here may carry
    authority_tier     TEXT NOT NULL
                       CHECK (authority_tier IN
                              ('PRIMARY_LEGISLATION',      -- Acts
                               'SUBORDINATE_LEGISLATION',  -- Rules, regulations
                               'OFFICE_PRACTICE',          -- manuals, guidelines
                               'DRAFT_OR_NOTICE',          -- not yet law
                               'NON_NORMATIVE_COMMENT')),  -- stakeholder letters
    is_draft           BOOLEAN NOT NULL DEFAULT FALSE,

    -- temporal validity, so a question can be answered as at a date
    consolidated_to    DATE,
    in_force_from      DATE,
    in_force_to        DATE,
    status             TEXT NOT NULL DEFAULT 'UNKNOWN'
                       CHECK (status IN ('IN_FORCE', 'SUPERSEDED', 'REPEALED',
                                         'PROPOSED', 'UNKNOWN')),
    is_current         BOOLEAN NOT NULL DEFAULT FALSE,

    source_url         TEXT,
    published_on       DATE,
    last_verified_on   DATE,
    page_count         INTEGER,
    notes              TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (in_force_to IS NULL OR in_force_from IS NULL
           OR in_force_to >= in_force_from),
    -- a draft is never in force
    CHECK (NOT (is_draft AND status = 'IN_FORCE')),
    -- only an in-force version may be flagged current
    CHECK (NOT is_current OR status = 'IN_FORCE')
);

-- At most one current version per instrument per language.
CREATE UNIQUE INDEX instrument_version_current_idx
    ON instrument_version (instrument_id, language) WHERE is_current;
CREATE INDEX instrument_version_instrument_idx ON instrument_version (instrument_id);
CREATE INDEX instrument_version_tier_idx       ON instrument_version (authority_tier);
CREATE INDEX instrument_version_file_idx       ON instrument_version (source_file_id);

-- How instruments relate. Amendment chains, repeals, translations and the
-- draft-to-final path are all first-class, because the corpus is full of them.
CREATE TABLE instrument_relation (
    relation_id      TEXT PRIMARY KEY,
    from_version_id  TEXT NOT NULL REFERENCES instrument_version(instrument_version_id)
                     ON DELETE CASCADE,
    to_version_id    TEXT NOT NULL REFERENCES instrument_version(instrument_version_id)
                     ON DELETE CASCADE,
    relation_type    TEXT NOT NULL
                     CHECK (relation_type IN
                            ('AMENDS', 'REPEALS', 'SUPERSEDES', 'CONSOLIDATES',
                             'TRANSLATION_OF', 'DRAFT_OF', 'MADE_UNDER',
                             'COMMENTS_ON', 'DUPLICATE_OF')),
    effective_from   DATE,
    note             TEXT,
    UNIQUE (from_version_id, to_version_id, relation_type),
    CHECK (from_version_id <> to_version_id)
);

CREATE INDEX instrument_relation_to_idx   ON instrument_relation (to_version_id);
CREATE INDEX instrument_relation_type_idx ON instrument_relation (relation_type);

-- ===========================================================================
-- 4. STRUCTURE LAYER  (the citable address, independent of text)
-- ===========================================================================

-- A provision is an address in an instrument: Section 3(p), Rule 13, Chapter II,
-- the First Schedule. It hangs off the *instrument*, not off a version, so the
-- same citation survives across consolidations and languages. That is what
-- makes both amendment tracking and bilingual text possible.
CREATE TABLE provision (
    provision_id     TEXT PRIMARY KEY,
    instrument_id    TEXT NOT NULL REFERENCES legal_instrument(instrument_id)
                     ON DELETE CASCADE,
    parent_id        TEXT REFERENCES provision(provision_id) ON DELETE CASCADE,
    provision_type   TEXT NOT NULL
                     CHECK (provision_type IN
                            ('PART', 'CHAPTER', 'SECTION', 'RULE', 'SUBSECTION',
                             'CLAUSE', 'SUB_CLAUSE', 'PROVISO', 'EXPLANATION',
                             'SCHEDULE', 'FORM', 'PARAGRAPH')),
    number           TEXT,                          -- '3', '3A', 'p', 'II'
    heading          TEXT,
    citation_label   TEXT NOT NULL,                 -- 'Section 3(p)'
    -- materialised path for cheap subtree queries: '3/p'
    path             TEXT NOT NULL,
    depth            INTEGER NOT NULL DEFAULT 0,
    sort_key         TEXT NOT NULL,                 -- zero-padded, orders naturally

    -- Whether this address actually identifies one provision.
    -- The current India Code ingest flattens nested sub-clauses onto their
    -- parent, so ten different sub-clauses of the Copyright Act all resolve to
    -- "Section 52(i)". Such an address cannot be presented as a precise
    -- citation, and the schema refuses to pretend otherwise.
    address_status   TEXT NOT NULL DEFAULT 'RESOLVED'
                     CHECK (address_status IN ('RESOLVED', 'AMBIGUOUS')),

    -- lifecycle of the address itself
    inserted_by_version_id TEXT REFERENCES instrument_version(instrument_version_id),
    omitted_by_version_id  TEXT REFERENCES instrument_version(instrument_version_id),

    UNIQUE (instrument_id, path),
    CHECK (parent_id IS NULL OR parent_id <> provision_id)
);

CREATE INDEX provision_instrument_idx ON provision (instrument_id);
CREATE INDEX provision_parent_idx     ON provision (parent_id);
CREATE INDEX provision_citation_idx   ON provision (instrument_id, citation_label);
CREATE INDEX provision_sort_idx       ON provision (instrument_id, sort_key);

-- The words of one provision, in one version, in one language.
-- The bilingual gazette files produce two rows per provision with the same
-- provision_id and different language, which is precisely the point: a Hindi
-- query and an English query resolve to the same citable address.
CREATE TABLE provision_text (
    provision_text_id TEXT PRIMARY KEY,
    provision_id      TEXT NOT NULL REFERENCES provision(provision_id)
                      ON DELETE CASCADE,
    instrument_version_id TEXT NOT NULL
                      REFERENCES instrument_version(instrument_version_id)
                      ON DELETE CASCADE,
    language          TEXT NOT NULL
                      CHECK (language IN ('ENGLISH', 'HINDI')),
    -- Distinguishes fragments the source could only address identically.
    -- Anything above 1 means the parent provision is AMBIGUOUS.
    sibling_ordinal   INTEGER NOT NULL DEFAULT 1,
    body              TEXT NOT NULL,
    page_start        INTEGER,
    page_end          INTEGER,
    char_count        INTEGER NOT NULL DEFAULT 0,
    text_sha256       CHAR(64) NOT NULL,   -- change detection across versions
    extraction_method TEXT NOT NULL DEFAULT 'PDF_TEXT_LAYER'
                      CHECK (extraction_method IN
                             ('PDF_TEXT_LAYER', 'OCR', 'API', 'MANUAL')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (provision_id, instrument_version_id, language, sibling_ordinal),
    CHECK (sibling_ordinal >= 1),
    CHECK (page_end IS NULL OR page_start IS NULL OR page_end >= page_start)
);

CREATE INDEX provision_text_version_idx ON provision_text (instrument_version_id);
CREATE INDEX provision_text_hash_idx    ON provision_text (text_sha256);

-- ===========================================================================
-- 5. RETRIEVAL LAYER
-- ===========================================================================

CREATE TABLE embedding_model (
    embedding_model_id TEXT PRIMARY KEY,            -- 'BAAI/bge-small-en-v1.5'
    dimensions         INTEGER NOT NULL,
    runtime            TEXT,                        -- 'onnxruntime'
    normalised         BOOLEAN NOT NULL DEFAULT TRUE,
    added_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A retrievable unit. One chunk per provision text by default, which is what
-- makes every retrieval result a citable provision rather than a token window.
CREATE TABLE chunk (
    chunk_id          TEXT PRIMARY KEY,
    -- The id the upstream ingest gave this chunk. Kept because that id is not
    -- unique in the current pipeline (144 collisions across 2,891 chunks), and
    -- tracing an old citation back requires knowing what it said.
    source_chunk_id   TEXT,
    provision_text_id TEXT NOT NULL REFERENCES provision_text(provision_text_id)
                      ON DELETE CASCADE,
    -- denormalised for retrieval filtering; maintained by the ingest, never
    -- edited by hand
    provision_id      TEXT NOT NULL REFERENCES provision(provision_id),
    instrument_version_id TEXT NOT NULL
                      REFERENCES instrument_version(instrument_version_id),
    framework_code    TEXT NOT NULL REFERENCES framework(framework_code),
    kb_version_id     TEXT NOT NULL REFERENCES kb_version(kb_version_id),
    language          TEXT NOT NULL,
    body              TEXT NOT NULL,
    char_count        INTEGER NOT NULL DEFAULT 0,
    token_count       INTEGER,
    citation_label    TEXT,
    heading           TEXT,
    page_start        INTEGER,
    page_end          INTEGER,
    -- lexical index for the BM25 / keyword half of hybrid retrieval
    search_vector     tsvector,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (provision_text_id, kb_version_id)
);

CREATE INDEX chunk_kb_idx        ON chunk (kb_version_id);
CREATE INDEX chunk_framework_idx ON chunk (framework_code, kb_version_id);
CREATE INDEX chunk_version_idx   ON chunk (instrument_version_id);
CREATE INDEX chunk_provision_idx ON chunk (provision_id);
CREATE INDEX chunk_source_id_idx ON chunk (source_chunk_id);
CREATE INDEX chunk_search_idx    ON chunk USING GIN (search_vector);

-- Vectors live in their own table keyed by model, so re-embedding with a new
-- model adds rows instead of destroying the old index. Spec section 37 wants
-- the embedding model recorded per analysis; this is what makes that true.
CREATE TABLE chunk_embedding (
    chunk_id           TEXT NOT NULL REFERENCES chunk(chunk_id) ON DELETE CASCADE,
    embedding_model_id TEXT NOT NULL REFERENCES embedding_model(embedding_model_id),
    vector             vector(384),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chunk_id, embedding_model_id)
);

-- ===========================================================================
-- 6. AMENDMENT LAYER
-- ===========================================================================

-- What an amending instrument did to a specific provision. The corpus holds
-- amendment Acts and Rules for every domain, so "what does Section 3 say
-- today" is only answerable if the operations are recorded, not inferred.
CREATE TABLE amendment (
    amendment_id       TEXT PRIMARY KEY,
    amending_version_id TEXT NOT NULL
                       REFERENCES instrument_version(instrument_version_id)
                       ON DELETE CASCADE,
    target_provision_id TEXT NOT NULL REFERENCES provision(provision_id)
                       ON DELETE CASCADE,
    operation          TEXT NOT NULL
                       CHECK (operation IN ('INSERT', 'SUBSTITUTE', 'OMIT',
                                            'RENUMBER', 'AMEND_WORDS')),
    effective_from     DATE,
    -- the provision *in the amending instrument* that says so, so the claim
    -- carries its own citation
    authority_provision_id TEXT REFERENCES provision(provision_id),
    note               TEXT,
    verified_by        TEXT,          -- who confirmed this, null if unverified
    verified_at        TIMESTAMPTZ,

    UNIQUE (amending_version_id, target_provision_id, operation)
);

CREATE INDEX amendment_target_idx ON amendment (target_provision_id);

-- ===========================================================================
-- 7. STRUCTURED EXTRACTS  (forms and fees are tabular, not prose)
-- ===========================================================================

-- The Trade Marks Rules and the Patent Rules carry form and fee schedules.
-- Storing them as prose chunks would make "what does filing cost" a retrieval
-- problem instead of a query.
CREATE TABLE official_form (
    form_id            TEXT PRIMARY KEY,
    instrument_version_id TEXT NOT NULL
                       REFERENCES instrument_version(instrument_version_id)
                       ON DELETE CASCADE,
    framework_code     TEXT NOT NULL REFERENCES framework(framework_code),
    form_number        TEXT NOT NULL,               -- 'Form 1', 'TM-A'
    title              TEXT,
    purpose            TEXT,
    provision_id       TEXT REFERENCES provision(provision_id),
    page_start         INTEGER,
    UNIQUE (instrument_version_id, form_number)
);

CREATE TABLE fee_item (
    fee_item_id        TEXT PRIMARY KEY,
    form_id            TEXT REFERENCES official_form(form_id) ON DELETE CASCADE,
    instrument_version_id TEXT NOT NULL
                       REFERENCES instrument_version(instrument_version_id)
                       ON DELETE CASCADE,
    description        TEXT NOT NULL,
    applicant_category TEXT NOT NULL DEFAULT 'OTHERS'
                       CHECK (applicant_category IN
                              ('NATURAL_PERSON', 'STARTUP', 'SMALL_ENTITY',
                               'EDUCATIONAL_INSTITUTION', 'OTHERS')),
    filing_mode        TEXT NOT NULL DEFAULT 'ANY'
                       CHECK (filing_mode IN ('E_FILING', 'PHYSICAL', 'ANY')),
    amount             NUMERIC(12,2),
    currency           CHAR(3) NOT NULL DEFAULT 'INR',
    effective_from     DATE,
    provision_id       TEXT REFERENCES provision(provision_id),
    CHECK (amount IS NULL OR amount >= 0)
);

CREATE INDEX fee_item_form_idx ON fee_item (form_id);

-- ===========================================================================
-- 8. DOMAIN LEXICON  (currently a JSON file; a table makes it queryable)
-- ===========================================================================

CREATE TABLE ingredient (
    ingredient_id    TEXT PRIMARY KEY,
    canonical_name   TEXT NOT NULL UNIQUE,          -- 'Ashwagandha'
    botanical_name   TEXT,                          -- 'Withania somnifera'
    kind             TEXT NOT NULL DEFAULT 'PLANT'
                     CHECK (kind IN ('PLANT', 'MINERAL', 'ANIMAL', 'MARINE',
                                     'MICROBIAL', 'SYNTHETIC', 'UNKNOWN')),
    -- Biological Diversity Act exposure, the ABS trigger
    is_biological_resource BOOLEAN NOT NULL DEFAULT FALSE,
    is_normally_traded_commodity BOOLEAN NOT NULL DEFAULT FALSE,
    -- Traditional-knowledge exposure, the Section 3(p) trigger
    in_classical_texts BOOLEAN NOT NULL DEFAULT FALSE,
    tkdl_reference     TEXT,
    notes              TEXT
);

CREATE TABLE ingredient_synonym (
    ingredient_id    TEXT NOT NULL REFERENCES ingredient(ingredient_id)
                     ON DELETE CASCADE,
    synonym          TEXT NOT NULL,
    language         TEXT NOT NULL DEFAULT 'ENGLISH',
    PRIMARY KEY (ingredient_id, synonym, language)
);

CREATE INDEX ingredient_synonym_lookup_idx ON ingredient_synonym (lower(synonym));

-- ===========================================================================
-- 9. APPLICATION STATE
-- ===========================================================================

CREATE TABLE app_user (
    user_id          TEXT PRIMARY KEY,
    email            TEXT NOT NULL UNIQUE,
    display_name     TEXT,
    role             TEXT NOT NULL DEFAULT 'ANALYST'
                     CHECK (role IN ('ANALYST', 'REVIEWER', 'ADMIN', 'SERVICE')),
    organisation     TEXT,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The product intake. Kept separate from the analysis so the same product can
-- be re-analysed against a newer KB version and the results compared.
CREATE TABLE product (
    product_id       TEXT PRIMARY KEY,
    owner_user_id    TEXT REFERENCES app_user(user_id),
    product_name     TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    source_origin    TEXT NOT NULL DEFAULT 'unknown'
                     CHECK (source_origin IN ('traditional', 'modern',
                                              'hybrid', 'unknown')),
    product_type     TEXT,
    process_description TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_ingredient (
    product_id       TEXT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    ordinal          INTEGER NOT NULL,
    raw_text         TEXT NOT NULL,
    ingredient_id    TEXT REFERENCES ingredient(ingredient_id),  -- null if unmatched
    PRIMARY KEY (product_id, ordinal)
);

CREATE TABLE product_claim (
    product_id       TEXT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    ordinal          INTEGER NOT NULL,
    claim_text       TEXT NOT NULL,
    claim_class      TEXT CHECK (claim_class IN ('WELLNESS', 'THERAPEUTIC',
                                                 'DISEASE', 'COSMETIC', 'UNKNOWN')),
    PRIMARY KEY (product_id, ordinal)
);

CREATE TABLE product_market (
    product_id       TEXT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    market_code      TEXT NOT NULL,
    PRIMARY KEY (product_id, market_code)
);

-- One run of the pipeline. Immutable once COMPLETED: a re-run creates a new
-- analysis row, so history is never silently rewritten (spec section 38).
CREATE TABLE analysis (
    analysis_id      TEXT PRIMARY KEY,
    product_id       TEXT NOT NULL REFERENCES product(product_id),
    requested_by     TEXT REFERENCES app_user(user_id),
    kb_version_id    TEXT NOT NULL REFERENCES kb_version(kb_version_id),
    rule_pack_id     TEXT,
    status           TEXT NOT NULL DEFAULT 'RUNNING'
                     CHECK (status IN ('RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED')),
    -- classification is triage, and the schema says so in its own column names
    product_class    TEXT,
    classification_score NUMERIC(5,4),
    classification_method TEXT
                     CHECK (classification_method IN ('WEIGHTED_FEATURES',
                                                      'TRAINED_MODEL')),
    overall_confidence NUMERIC(5,4),
    confidence_level TEXT CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
    dense_retrieval_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at     TIMESTAMPTZ,
    duration_ms      NUMERIC(12,2),
    error            TEXT,
    CHECK (overall_confidence IS NULL
           OR (overall_confidence >= 0 AND overall_confidence <= 1))
);

CREATE INDEX analysis_product_idx ON analysis (product_id, started_at DESC);
CREATE INDEX analysis_kb_idx      ON analysis (kb_version_id);

-- Spec section 37: exactly which model produced this result.
CREATE TABLE analysis_model_version (
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    component        TEXT NOT NULL
                     CHECK (component IN ('EMBEDDING', 'RERANKER', 'CLASSIFIER',
                                          'GNN', 'LLM', 'RULE_PACK', 'CHUNKER',
                                          'LEXICON')),
    model_id         TEXT NOT NULL,
    version          TEXT,
    PRIMARY KEY (analysis_id, component)
);

CREATE TABLE analysis_stage (
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    ordinal          INTEGER NOT NULL,
    stage_name       TEXT NOT NULL,
    status           TEXT NOT NULL
                     CHECK (status IN ('OK', 'SKIPPED', 'DEGRADED', 'ERROR')),
    duration_ms      NUMERIC(12,2) NOT NULL DEFAULT 0,
    detail           TEXT,
    PRIMARY KEY (analysis_id, ordinal)
);

-- Entities the extractor found, with the span that produced them.
CREATE TABLE analysis_entity (
    analysis_entity_id TEXT PRIMARY KEY,
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    entity_type      TEXT NOT NULL,
    surface_text     TEXT NOT NULL,
    normalized       TEXT,
    ingredient_id    TEXT REFERENCES ingredient(ingredient_id),
    char_start       INTEGER,
    char_end         INTEGER,
    extraction_source TEXT NOT NULL
                     CHECK (extraction_source IN ('LEXICON', 'PATTERN',
                                                  'STRUCTURED_INPUT', 'LLM')),
    metadata         JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX analysis_entity_analysis_idx ON analysis_entity (analysis_id);

-- Retrieved evidence, frozen at analysis time. The chunk it points to lives in
-- a specific kb_version, so the citation stays resolvable even after the KB
-- moves on.
CREATE TABLE analysis_evidence (
    evidence_id      TEXT PRIMARY KEY,              -- globally unique
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    evidence_ref     TEXT NOT NULL,                 -- 'E1', the token the LLM cites
    chunk_id         TEXT NOT NULL REFERENCES chunk(chunk_id),
    rank             INTEGER NOT NULL,
    score            NUMERIC(10,6) NOT NULL DEFAULT 0,
    retrieval_method TEXT NOT NULL DEFAULT 'HYBRID'
                     CHECK (retrieval_method IN ('DENSE', 'BM25', 'HYBRID',
                                                 'CURATED')),
    query_text       TEXT,
    UNIQUE (analysis_id, evidence_ref)
);

CREATE INDEX analysis_evidence_chunk_idx ON analysis_evidence (chunk_id);

-- ---------------------------------------------------------------------------
-- Rules
-- ---------------------------------------------------------------------------

CREATE TABLE rule_pack (
    rule_pack_id     TEXT PRIMARY KEY,
    version          TEXT NOT NULL,
    checksum         CHAR(64),
    loaded_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes            TEXT,
    UNIQUE (version)
);

CREATE TABLE rule (
    rule_id          TEXT PRIMARY KEY,
    rule_pack_id     TEXT NOT NULL REFERENCES rule_pack(rule_pack_id) ON DELETE CASCADE,
    framework_code   TEXT NOT NULL REFERENCES framework(framework_code),
    title            TEXT NOT NULL,
    description      TEXT,
    severity         TEXT NOT NULL DEFAULT 'ATTENTION'
                     CHECK (severity IN ('INFO', 'ATTENTION', 'SIGNIFICANT')),
    recommended_action TEXT,
    definition       JSONB NOT NULL                 -- the declarative condition
);

-- A rule is anchored to the provisions it depends on. If the anchor is not in
-- the KB, the rule must return INSUFFICIENT_EVIDENCE rather than a finding.
CREATE TABLE rule_provision_anchor (
    rule_id          TEXT NOT NULL REFERENCES rule(rule_id) ON DELETE CASCADE,
    instrument_id    TEXT NOT NULL REFERENCES legal_instrument(instrument_id),
    citation_label   TEXT NOT NULL,                 -- 'Section 3(p)'
    is_required      BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (rule_id, instrument_id, citation_label)
);

CREATE TABLE rule_execution (
    rule_execution_id TEXT PRIMARY KEY,
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    rule_id          TEXT NOT NULL REFERENCES rule(rule_id),
    triggered        BOOLEAN NOT NULL,
    reason           TEXT NOT NULL,
    matched_on       JSONB NOT NULL DEFAULT '[]'::jsonb,
    anchors_resolved BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (analysis_id, rule_id)
);

-- ---------------------------------------------------------------------------
-- Findings, assessments, recommendations
-- ---------------------------------------------------------------------------

-- A structured conclusion. Produced by rules, never by the LLM. It may not
-- exist without evidence; integrity.sql enforces that.
CREATE TABLE finding (
    finding_id       TEXT PRIMARY KEY,
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    framework_code   TEXT NOT NULL REFERENCES framework(framework_code),
    rule_id          TEXT REFERENCES rule(rule_id),
    statement        TEXT NOT NULL,
    detail           TEXT,
    severity         TEXT NOT NULL DEFAULT 'ATTENTION'
                     CHECK (severity IN ('INFO', 'ATTENTION', 'SIGNIFICANT')),
    confidence       NUMERIC(5,4) NOT NULL DEFAULT 0,
    confidence_level TEXT NOT NULL DEFAULT 'LOW'
                     CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
    CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX finding_analysis_idx ON finding (analysis_id);

CREATE TABLE finding_evidence (
    finding_id       TEXT NOT NULL REFERENCES finding(finding_id) ON DELETE CASCADE,
    evidence_id      TEXT NOT NULL REFERENCES analysis_evidence(evidence_id)
                     ON DELETE CASCADE,
    PRIMARY KEY (finding_id, evidence_id)
);

CREATE TABLE assessment (
    assessment_id    TEXT PRIMARY KEY,
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    framework_code   TEXT NOT NULL REFERENCES framework(framework_code),
    status           TEXT NOT NULL
                     CHECK (status IN ('REVIEW_REQUIRED', 'POTENTIAL_OVERLAP',
                                       'LIKELY_APPLICABLE', 'LIKELY_NOT_APPLICABLE',
                                       'INSUFFICIENT_EVIDENCE', 'NOT_ASSESSED')),
    confidence       NUMERIC(5,4) NOT NULL DEFAULT 0,
    confidence_level TEXT NOT NULL DEFAULT 'LOW'
                     CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
    summary          TEXT,
    UNIQUE (analysis_id, framework_code)
);

CREATE TABLE assessment_finding (
    assessment_id    TEXT NOT NULL REFERENCES assessment(assessment_id)
                     ON DELETE CASCADE,
    finding_id       TEXT NOT NULL REFERENCES finding(finding_id) ON DELETE CASCADE,
    PRIMARY KEY (assessment_id, finding_id)
);

-- Two frameworks that both apply. The system reports the interaction and
-- escalates; it never resolves precedence between statutes itself.
CREATE TABLE framework_interaction (
    interaction_id   TEXT PRIMARY KEY,
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    description      TEXT NOT NULL,
    escalation_required BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE framework_interaction_member (
    interaction_id   TEXT NOT NULL REFERENCES framework_interaction(interaction_id)
                     ON DELETE CASCADE,
    framework_code   TEXT NOT NULL REFERENCES framework(framework_code),
    PRIMARY KEY (interaction_id, framework_code)
);

CREATE TABLE framework_interaction_evidence (
    interaction_id   TEXT NOT NULL REFERENCES framework_interaction(interaction_id)
                     ON DELETE CASCADE,
    evidence_id      TEXT NOT NULL REFERENCES analysis_evidence(evidence_id)
                     ON DELETE CASCADE,
    PRIMARY KEY (interaction_id, evidence_id)
);

CREATE TABLE recommendation (
    recommendation_id TEXT PRIMARY KEY,
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    framework_code   TEXT REFERENCES framework(framework_code),
    action           TEXT NOT NULL,
    rationale        TEXT NOT NULL,
    priority         TEXT NOT NULL DEFAULT 'MEDIUM'
                     CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW'))
);

CREATE TABLE recommendation_finding (
    recommendation_id TEXT NOT NULL REFERENCES recommendation(recommendation_id)
                      ON DELETE CASCADE,
    finding_id        TEXT NOT NULL REFERENCES finding(finding_id) ON DELETE CASCADE,
    PRIMARY KEY (recommendation_id, finding_id)
);

-- ---------------------------------------------------------------------------
-- Graph
-- ---------------------------------------------------------------------------

CREATE TABLE graph_node (
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    node_id          TEXT NOT NULL,
    label            TEXT NOT NULL,
    node_type        TEXT NOT NULL,
    relevance        NUMERIC(10,6) NOT NULL DEFAULT 0,
    properties       JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (analysis_id, node_id)
);

CREATE TABLE graph_edge (
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    source_node_id   TEXT NOT NULL,
    target_node_id   TEXT NOT NULL,
    edge_type        TEXT NOT NULL,
    properties       JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (analysis_id, source_node_id, target_node_id, edge_type),
    FOREIGN KEY (analysis_id, source_node_id)
        REFERENCES graph_node(analysis_id, node_id) ON DELETE CASCADE,
    FOREIGN KEY (analysis_id, target_node_id)
        REFERENCES graph_node(analysis_id, node_id) ON DELETE CASCADE
);

-- A graph signal must name the algorithm that produced it. No unattributed
-- scores.
CREATE TABLE graph_signal (
    graph_signal_id  TEXT PRIMARY KEY,
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    signal_type      TEXT NOT NULL,
    algorithm        TEXT NOT NULL,
    description      TEXT NOT NULL,
    score            NUMERIC(12,8) NOT NULL DEFAULT 0,
    node_ids         JSONB NOT NULL DEFAULT '[]'::jsonb,
    path             JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- ---------------------------------------------------------------------------
-- LLM narrative and citation validation
-- ---------------------------------------------------------------------------

CREATE TABLE explanation (
    analysis_id      TEXT PRIMARY KEY REFERENCES analysis(analysis_id)
                     ON DELETE CASCADE,
    is_available     BOOLEAN NOT NULL DEFAULT FALSE,
    summary          TEXT,
    narrative        TEXT,
    uncertainties    JSONB NOT NULL DEFAULT '[]'::jsonb,
    llm_model        TEXT,
    offline_reason   TEXT,
    -- a narrative that failed citation validation is stored but withheld
    withheld         BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (is_available = FALSE OR narrative IS NOT NULL)
);

CREATE TABLE validated_claim (
    claim_id         TEXT PRIMARY KEY,
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    ordinal          INTEGER NOT NULL,
    claim_text       TEXT NOT NULL,
    verdict          TEXT NOT NULL
                     CHECK (verdict IN ('VERIFIED', 'WEAKLY_SUPPORTED',
                                        'UNSUPPORTED', 'FABRICATED_CITATION')),
    reason           TEXT NOT NULL,
    support_score    NUMERIC(5,4) NOT NULL DEFAULT 0,
    detected_provisions JSONB NOT NULL DEFAULT '[]'::jsonb,
    UNIQUE (analysis_id, ordinal)
);

CREATE TABLE claim_evidence (
    claim_id         TEXT NOT NULL REFERENCES validated_claim(claim_id)
                     ON DELETE CASCADE,
    evidence_id      TEXT NOT NULL REFERENCES analysis_evidence(evidence_id)
                     ON DELETE CASCADE,
    PRIMARY KEY (claim_id, evidence_id)
);

-- ---------------------------------------------------------------------------
-- Confidence, escalation, audit
-- ---------------------------------------------------------------------------

CREATE TABLE confidence_component (
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    component_name   TEXT NOT NULL,
    value            NUMERIC(6,4) NOT NULL,
    weight           NUMERIC(6,4) NOT NULL,
    rationale        TEXT NOT NULL,
    PRIMARY KEY (analysis_id, component_name)
);

CREATE TABLE escalation (
    analysis_id      TEXT PRIMARY KEY REFERENCES analysis(analysis_id)
                     ON DELETE CASCADE,
    is_required      BOOLEAN NOT NULL DEFAULT FALSE,
    priority         TEXT NOT NULL DEFAULT 'LOW'
                     CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    reasons          JSONB NOT NULL DEFAULT '[]'::jsonb,
    message          TEXT,
    acknowledged_by  TEXT REFERENCES app_user(user_id),
    acknowledged_at  TIMESTAMPTZ
);

-- Append-only. Spec section 36: the demo must be able to answer "how did
-- AYUR-IP reach this result?" from stored rows alone.
CREATE TABLE audit_log (
    audit_id         BIGSERIAL PRIMARY KEY,
    occurred_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_user_id    TEXT REFERENCES app_user(user_id),
    action           TEXT NOT NULL,
    entity_type      TEXT NOT NULL,
    entity_id        TEXT NOT NULL,
    analysis_id      TEXT REFERENCES analysis(analysis_id),
    detail           JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX audit_log_entity_idx   ON audit_log (entity_type, entity_id);
CREATE INDEX audit_log_analysis_idx ON audit_log (analysis_id);
CREATE INDEX audit_log_time_idx     ON audit_log (occurred_at DESC);

CREATE TABLE report (
    report_id        TEXT PRIMARY KEY,
    analysis_id      TEXT NOT NULL REFERENCES analysis(analysis_id) ON DELETE CASCADE,
    format           TEXT NOT NULL CHECK (format IN ('PDF', 'HTML', 'JSON')),
    generated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    generated_by     TEXT REFERENCES app_user(user_id),
    storage_uri      TEXT NOT NULL,
    content_sha256   CHAR(64)
);

-- ===========================================================================
-- 10. VIEWS
-- ===========================================================================

-- The weight a citation from a given tier may carry. Drafts and stakeholder
-- comments are zero: they exist in the corpus and must remain searchable for
-- context, but they can never support a legal finding.
CREATE VIEW authority_weight AS
SELECT * FROM (VALUES
    ('PRIMARY_LEGISLATION',     1.00),
    ('SUBORDINATE_LEGISLATION', 0.90),
    ('OFFICE_PRACTICE',         0.60),
    ('DRAFT_OR_NOTICE',         0.00),
    ('NON_NORMATIVE_COMMENT',   0.00)
) AS t(authority_tier, weight);

-- Chunks that may legitimately back a finding. address_status travels with
-- the row so the citation layer can refuse to render an ambiguous address as
-- a precise citation.
CREATE VIEW citable_chunk AS
SELECT c.*,
       iv.authority_tier,
       iv.instrument_id,
       iv.is_current,
       p.address_status,
       w.weight AS authority_weight
FROM chunk c
JOIN instrument_version iv ON iv.instrument_version_id = c.instrument_version_id
JOIN provision         p  ON p.provision_id = c.provision_id
JOIN authority_weight  w  ON w.authority_tier = iv.authority_tier
WHERE w.weight > 0
  AND iv.is_draft = FALSE
  AND iv.status IN ('IN_FORCE', 'UNKNOWN');

-- Citations that cannot be trusted to point at one provision. Every row here
-- is a chunker defect to fix upstream, not a fact about the law.
CREATE VIEW ambiguous_citation AS
SELECT p.instrument_id,
       p.provision_id,
       p.citation_label,
       count(DISTINCT pt.provision_text_id) AS fragment_count,
       count(DISTINCT ch.chunk_id)          AS chunk_count
FROM provision p
JOIN provision_text pt ON pt.provision_id = p.provision_id
LEFT JOIN chunk ch     ON ch.provision_id = p.provision_id
WHERE p.address_status = 'AMBIGUOUS'
GROUP BY p.instrument_id, p.provision_id, p.citation_label;

-- The current text of every provision, in English, for a given instrument.
CREATE VIEW current_provision_text AS
SELECT p.instrument_id,
       p.provision_id,
       p.citation_label,
       p.heading,
       pt.body,
       pt.page_start,
       iv.instrument_version_id,
       iv.consolidated_to
FROM provision p
JOIN provision_text pt   ON pt.provision_id = p.provision_id
JOIN instrument_version iv
     ON iv.instrument_version_id = pt.instrument_version_id
WHERE iv.is_current
  AND pt.language = 'ENGLISH'
  AND p.omitted_by_version_id IS NULL;

-- Files the corpus holds but the KB cannot yet use, and why. This is the
-- ingestion backlog, kept honest.
CREATE VIEW ingestion_gap AS
SELECT sf.source_file_id,
       sf.relpath,
       sf.page_count,
       sf.detected_language,
       sf.text_quality,
       CASE
         -- ordered by which reason makes the file skippable first
         WHEN sf.is_canonical = FALSE           THEN 'DUPLICATE'
         WHEN sf.extraction_status IN ('NO_TEXT_LAYER', 'OCR_REQUIRED')
              THEN 'NEEDS_OCR'
         WHEN sf.text_quality = 'GARBLED'       THEN 'BAD_TEXT_LAYER'
         WHEN sf.detected_language = 'HINDI'    THEN 'NEEDS_TRANSLATION'
         ELSE 'READY'
       END AS blocker
FROM source_file sf;

-- Every fact behind one analysis, in one query. This is the "how did it reach
-- this result" view.
CREATE VIEW analysis_provenance AS
SELECT a.analysis_id,
       a.started_at,
       a.kb_version_id,
       f.finding_id,
       f.framework_code,
       f.statement,
       f.rule_id,
       ev.evidence_ref,
       ch.citation_label,
       li.official_title           AS instrument_title,
       iv.version_label,
       iv.authority_tier,
       ev.retrieval_method,
       ev.score
FROM analysis a
JOIN finding           f  ON f.analysis_id = a.analysis_id
JOIN finding_evidence  fe ON fe.finding_id = f.finding_id
JOIN analysis_evidence ev ON ev.evidence_id = fe.evidence_id
JOIN chunk             ch ON ch.chunk_id = ev.chunk_id
JOIN instrument_version iv ON iv.instrument_version_id = ch.instrument_version_id
JOIN legal_instrument  li ON li.instrument_id = iv.instrument_id;

COMMIT;
