-- ===========================================================================
-- AYUR-IP integrity layer (PostgreSQL)
--
-- The README states four honesty rules. Three of them are currently enforced
-- only by application code, which means a bug or a future contributor can
-- break them silently. This file moves them into the database, where they
-- cannot be bypassed.
--
--   1. A finding may not exist without evidence.
--   2. Evidence may not come from a draft or from stakeholder commentary.
--   3. An analysis may not be marked COMPLETED while any of its claims cite
--      evidence that does not exist (a fabricated citation).
--   4. Completed analyses are append-only; corrections create a new analysis.
--
-- Run after schema.sql.
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Evidence must be citable
--
-- The corpus contains 24 stakeholder comment letters and 12 drafts filed
-- alongside official manuals. They stay in the KB because they are useful
-- context, but nothing may cite them as law.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_evidence_is_citable()
RETURNS TRIGGER AS $$
DECLARE
    v_tier   TEXT;
    v_draft  BOOLEAN;
    v_weight NUMERIC;
BEGIN
    SELECT iv.authority_tier, iv.is_draft, w.weight
      INTO v_tier, v_draft, v_weight
      FROM chunk c
      JOIN instrument_version iv
        ON iv.instrument_version_id = c.instrument_version_id
      LEFT JOIN authority_weight w
        ON w.authority_tier = iv.authority_tier
     WHERE c.chunk_id = NEW.chunk_id;

    IF v_tier IS NULL THEN
        RAISE EXCEPTION
            'evidence % references unknown chunk %', NEW.evidence_id, NEW.chunk_id;
    END IF;

    IF v_draft OR COALESCE(v_weight, 0) = 0 THEN
        RAISE EXCEPTION
            'evidence % cites non-normative material (tier=%, draft=%); '
            'drafts and stakeholder comments cannot support a finding',
            NEW.evidence_id, v_tier, v_draft;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analysis_evidence_citable
    BEFORE INSERT OR UPDATE ON analysis_evidence
    FOR EACH ROW EXECUTE FUNCTION assert_evidence_is_citable();

-- ---------------------------------------------------------------------------
-- 2. A finding must carry evidence
--
-- Checked at COMMIT rather than at INSERT, because a finding and its evidence
-- links are written in the same transaction.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_finding_has_evidence()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM finding_evidence fe
                    WHERE fe.finding_id = NEW.finding_id) THEN
        RAISE EXCEPTION
            'finding % has no evidence; every conclusion must carry the '
            'evidence that produced it', NEW.finding_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER finding_requires_evidence
    AFTER INSERT ON finding
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION assert_finding_has_evidence();

-- ---------------------------------------------------------------------------
-- 3. A completed analysis may not contain a fabricated citation
--
-- The citation validator already detects these. This makes storing one an
-- error rather than a field the UI has to remember to check.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_no_fabricated_citations()
RETURNS TRIGGER AS $$
DECLARE
    v_bad INTEGER;
BEGIN
    IF NEW.status <> 'COMPLETED' THEN
        RETURN NEW;
    END IF;

    SELECT count(*) INTO v_bad
      FROM validated_claim vc
     WHERE vc.analysis_id = NEW.analysis_id
       AND vc.verdict = 'FABRICATED_CITATION';

    IF v_bad > 0 THEN
        RAISE EXCEPTION
            'analysis % cannot be COMPLETED: % claim(s) carry fabricated '
            'citations; the narrative must be withheld and the analysis '
            'marked PARTIAL', NEW.analysis_id, v_bad;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analysis_no_fabricated_citations
    BEFORE UPDATE ON analysis
    FOR EACH ROW EXECUTE FUNCTION assert_no_fabricated_citations();

-- ---------------------------------------------------------------------------
-- 4. Completed analyses are immutable
--
-- Spec section 38: do not silently overwrite history. Status may still move
-- forward, and a reviewer may still acknowledge an escalation, but the
-- substance is frozen.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_analysis_immutable()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('COMPLETED', 'PARTIAL', 'FAILED')
       AND (NEW.product_id        IS DISTINCT FROM OLD.product_id
         OR NEW.kb_version_id     IS DISTINCT FROM OLD.kb_version_id
         OR NEW.overall_confidence IS DISTINCT FROM OLD.overall_confidence
         OR NEW.product_class     IS DISTINCT FROM OLD.product_class) THEN
        RAISE EXCEPTION
            'analysis % is finalised (%); re-run the pipeline to create a new '
            'analysis instead of editing this one', OLD.analysis_id, OLD.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analysis_immutable
    BEFORE UPDATE ON analysis
    FOR EACH ROW EXECUTE FUNCTION assert_analysis_immutable();

-- ---------------------------------------------------------------------------
-- 5. Audit trail is append-only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reject_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_append_only
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();

-- ---------------------------------------------------------------------------
-- 6. A duplicate file may not be the basis of an instrument version
--
-- Six groups of byte-identical files exist under different names. Exactly one
-- copy is canonical; versions must point at that one, so a citation never
-- depends on which filename happened to be ingested first.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_source_file_canonical()
RETURNS TRIGGER AS $$
DECLARE
    v_canonical BOOLEAN;
BEGIN
    IF NEW.source_file_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT is_canonical INTO v_canonical
      FROM source_file WHERE source_file_id = NEW.source_file_id;

    IF v_canonical IS FALSE THEN
        RAISE EXCEPTION
            'instrument_version % points at a duplicate file %; point it at '
            'the canonical copy', NEW.instrument_version_id, NEW.source_file_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instrument_version_canonical_file
    BEFORE INSERT OR UPDATE ON instrument_version
    FOR EACH ROW EXECUTE FUNCTION assert_source_file_canonical();

COMMIT;
