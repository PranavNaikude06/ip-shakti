# AYUR-IP Database Design

This document explains the schema in `backend/app/db/schema.sql` and
`backend/app/db/integrity.sql`. Every non-obvious decision is traced to a
measurement of the actual corpus. Nothing here is designed against an imagined
dataset.

Reproduce the measurements:

```bash
python scripts/profile_corpus.py "<path>/DATA"   # measures 110 PDFs
python scripts/analyze_corpus.py                 # turns them into findings
python scripts/build_corpus_db.py --force        # builds and verifies the DB
```

---

## 1. What the data actually is

The DATA corpus is 110 PDFs, 4,411 pages, 125 MB of Indian intellectual
property and AYUSH regulatory material, arranged in folders by domain and by
document class.

| Domain | Files | Pages | No text layer | Hindi or bilingual |
|---|---:|---:|---:|---:|
| Patents | 62 | 2,433 | 25 | 10 |
| Trade Marks | 16 | 851 | 3 | 2 |
| Copyright | 10 | 321 | 1 | 2 |
| Designs | 10 | 324 | 3 | 2 |
| Geographical Indications | 9 | 422 | 0 | 3 |
| AYUSH (ITRA, NCH, NCISM) | 3 | 60 | 0 | 0 |

It is not a clean corpus. Profiling found six specific problems, and the schema
exists to survive each of them.

### 1.1 Filenames are unreliable

Eight filenames assert a language their content contradicts. Two examples:

- `Design Rules, 2001 HINDI.pdf` contains the English Gazette text and zero
  Devanagari characters.
- `Patent Amendments Rules 2024 - Published on 15.03.2024 English.pdf` is
  roughly half Devanagari.

Worse, a filename can misstate the document's identity. `The Patents Act 1970
English.pdf` is byte-for-byte identical to `The Patents (Amendment) Act - 25
June 20021.pdf`, and neither is the 2002 Amendment Act. Both are the Patents
Act as amended in 1999, effective 1 January 1995.

**Design response.** `source_file` stores `asserted_language` (parsed from the
name) separately from `detected_language` (measured from the bytes), plus a
`language_conflict` flag. Titles derived from filenames are written with
`last_verified_on` left NULL and a note recording that the title is unverified.
The folder a file sits in is recorded, but the framework it belongs to is a
separate, correctable relationship.

### 1.2 Roughly a third of the corpus has no text

32 files yield under 200 characters per page and are scans. They include the
Hindi Patents Act, several Designs amendment rules, and 20 stakeholder comment
letters.

**Design response.** `source_file.extraction_status` distinguishes
`TEXT_EXTRACTED`, `NO_TEXT_LAYER`, `OCR_REQUIRED` and `OCR_COMPLETED`. A file
with no text produces no `provision_text` and therefore no `chunk`. The
`ingestion_gap` view reports the backlog and its reason, so the gap is visible
rather than silently absent.

Character count alone is not enough. `Trade Marks Rules 2002, Forms & Fee
(HINDI).pdf` passes a raw character threshold while its first pages read
`RIG!). NO DL.-33004/99`. `source_file.text_quality` is therefore derived from
English function-word density, which separates real prose from a broken text
layer.

### 1.3 The same bytes appear under different names

Six groups of byte-identical files exist. One group spans two domains: the Jan
Vishwas (Amendment of Provisions) Act 2023 is filed under both Patents and
Geographical Indications, because it amends both.

**Design response.** The physical file and the logical instrument are separate
tables. `source_file` keeps every copy with `is_canonical` and
`duplicate_of_file_id`; `legal_instrument` holds one row per legal thing. A
trigger refuses to attach an `instrument_version` to a non-canonical file, so a
citation never depends on which filename happened to be ingested first.

Because an instrument can amend several statutes at once,
`instrument_framework` is many-to-many. A single `domain` column would have
forced the Jan Vishwas Act to lie about itself.

### 1.4 Sixteen files are bilingual, not Hindi

Indian Gazette notifications print the Hindi and English text of the same rule
in one document. Measuring Devanagari share alone misclassifies them; measuring
Devanagari share *and* English function-word density identifies them correctly.

**Design response.** Language lives on `provision_text`, not on the document.
One provision can carry an English row and a Hindi row, both pointing at the
same `provision_id`. A Hindi query and an English query resolve to the same
citable address.

### 1.5 Commentary sits alongside law

The Patents `Manuals` folder contains 24 stakeholder comment letters from 2008,
filed next to the official Manual of Patent Office Practice and Procedure.
Letters from Microsoft, Ranbaxy, and a retired Supreme Court judge are not law.
Eleven further files are drafts published for objection.

This is the most dangerous property of the corpus. A retrieval system that
indexes the folder wholesale will happily quote a pharmaceutical company's
lobbying letter as though it were a statutory provision.

**Design response.** `instrument_version.authority_tier` classifies every
version as `PRIMARY_LEGISLATION`, `SUBORDINATE_LEGISLATION`, `OFFICE_PRACTICE`,
`DRAFT_OR_NOTICE` or `NON_NORMATIVE_COMMENT`. The `authority_weight` view
assigns drafts and commentary a weight of zero, and a trigger on
`analysis_evidence` rejects any attempt to cite them. The material stays
searchable for context; it can never support a finding.

### 1.6 One instrument has several coexisting versions

The corpus holds three consolidations of the Patents Act 1970: as effective in
1995, incorporating amendments to 11 March 2015, and incorporating amendments
to 1 August 2024. Retrieving from the wrong one yields superseded law.

**Design response.** `instrument_version` carries `consolidated_to`,
`in_force_from`, `in_force_to`, `status` and `is_current`, with a partial unique
index allowing at most one current version per instrument per language. The
`amendment` table records what an amending instrument did to a specific
provision, so "what does Section 3 say today" is answerable from stored
operations rather than from inference.

---

## 2. The defect the schema exposed

Loading the existing knowledge base into the schema failed on a unique
constraint. The failure was correct, and it revealed a live correctness bug.

In `data/processed/chunks.jsonl`, **144 chunk identifiers are not unique**,
covering 405 of the 2,891 chunks. In 141 of those cases the repeated identifier
carries *different text*.

The cause is that the chunker flattens nested sub-clauses onto their parent.
Section 52 of the Copyright Act has clauses (a) to (zc), and several of those
clauses contain their own sub-clauses (i), (ii), (iii). All ten of those
sub-clauses are addressed as `CR-ACT-1957_S52_i` and labelled "Section 52(i)":

```
Section 52(i)  -> "private or personal use, including research;"
Section 52(i)  -> "in order to utilise the computer programme..."
Section 52(i)  -> "by a teacher or a pupil in the course of instruction; or"
   ... seven more, all citing the same provision label
```

`chunk_id` is the retrieval key and the token the citation validator resolves.
When it is ambiguous, span-level validation can confirm a claim against text
from an unrelated part of the statute.

This is not theoretical. Eleven evidence rows across all six stored analyses
cite an ambiguous identifier: Section 25(d) and Section 140(c) of the Patents
Act each resolve to two different fragments, and Section 64(b) to three.

**Design response.** The schema represents the problem instead of hiding it.
`provision.address_status` is `RESOLVED` or `AMBIGUOUS`. `provision_text.
sibling_ordinal` distinguishes fragments the source could only address
identically. `chunk.source_chunk_id` preserves the original colliding
identifier so old citations remain traceable. The `ambiguous_citation` view
lists every affected address, and `citable_chunk` carries `address_status`
through to the retrieval layer so the citation formatter can decline to present
an ambiguous address as a precise citation.

The underlying fix belongs in the chunker: sub-clause depth must be part of the
address. The schema makes that fix verifiable, because after it lands
`ambiguous_citation` should be empty.

---

## 3. Structure of the schema

Six layers, 53 tables. Each layer depends only on the ones above it.

```
  reference     framework, authority, kb_version
       |
  corpus        corpus_source, source_file                (physical bytes)
       |
  instrument    legal_instrument, instrument_framework,
                instrument_version, instrument_relation   (the legal thing)
       |
  structure     provision, provision_text                 (citable address)
       |
  retrieval     chunk, chunk_embedding, embedding_model
       |
  application   product, analysis, finding, assessment,
                recommendation, graph_*, audit_log
```

### Why the instrument and the file are separate

A file is a delivery mechanism. An instrument is a legal thing. The corpus
proves they are not one-to-one in either direction: one instrument arrives as
four files (Patents Act consolidations), and one file carries two instruments'
worth of amendments (Jan Vishwas). Collapsing them, which the current
`documents.csv` does, makes both facts unrepresentable.

### Why the provision belongs to the instrument, not the version

`provision` hangs off `legal_instrument`; `provision_text` hangs off both the
provision and the version. This single decision buys three things:

1. **Amendments.** Section 3(p) is one address whose text changes over time.
2. **Multilingual.** The Hindi and English renderings share an address.
3. **Stable citations.** A finding that cites Section 3(p) stays resolvable
   when a newer consolidation is ingested.

### Why embeddings are a separate table

`chunk_embedding` is keyed by `(chunk_id, embedding_model_id)`. Re-embedding
with a new model adds rows rather than destroying the old index, so an analysis
run against the previous model stays reproducible. The spec requires recording
the embedding model per analysis; this is what makes that record meaningful.

### Why forms and fees are tables

The Trade Marks Rules and the Patent Rules carry form and fee schedules.
Modelling them as prose chunks turns "what does this filing cost" into a
retrieval problem with a plausible-sounding wrong answer. `official_form` and
`fee_item` make it a query, with `applicant_category` covering the
startup and small-entity distinctions that materially change the amount.

---

## 4. Integrity as a database concern

The README states four honesty rules. Three were enforced only in application
code, which means a future change can break them silently. `integrity.sql`
moves them into the database.

| Rule | Mechanism |
|---|---|
| A finding cannot exist without evidence | deferred constraint trigger on `finding` |
| Evidence cannot cite a draft or commentary | trigger on `analysis_evidence` against `authority_weight` |
| A completed analysis cannot contain a fabricated citation | trigger on `analysis` status transition |
| Completed analyses are immutable | trigger blocking substantive updates |
| The audit trail is append-only | trigger blocking UPDATE and DELETE |
| A version cannot cite a duplicate file | trigger on `instrument_version` |

`scripts/build_corpus_db.py` tests each of these by attempting the violation
and requiring the database to refuse it. All four negative tests currently
pass, including an attempt to attach a 2008 stakeholder comment letter to a
real analysis as evidence.

---

## 5. Deployment shape

The specification calls for PostgreSQL, Qdrant, Neo4j and a BM25 index. For
9,200 chunks that is four services to keep consistent with each other.

The recommendation is to make **PostgreSQL the system of record** and treat
everything else as a derived index that can be rebuilt from it:

- **Vectors.** `pgvector` handles this corpus comfortably. The phase-1 dense
  index is about 10 MB at 384 dimensions. Qdrant becomes worthwhile at a scale
  this corpus is nowhere near; if it is adopted later, `chunk_embedding` is the
  source it is rebuilt from.
- **Lexical.** A `tsvector` column with a GIN index covers the keyword half of
  hybrid retrieval without a second service.
- **Graph.** The per-analysis graph is small (216 nodes and 414 edges across
  six analyses) and is already derived from the evidence. `graph_node`,
  `graph_edge` and `graph_signal` store it for replay. Neo4j earns its place
  only when the graph spans analyses and needs traversal queries that SQL makes
  awkward.

This satisfies the spec's actual concern, which is that one store should not be
asked to do every job badly. Here one store is authoritative and the others are
projections, so they cannot drift out of sync.

The schema is dialect-portable. `scripts/build_corpus_db.py` materialises it in
SQLite for offline verification; the substitutions it applies are listed
explicitly in `SQLITE_SUBSTITUTIONS` and printed with `--show-translation`.

---

## 6. What the loaded database contains

```
source_file           110      every PDF, with its measured quality
legal_instrument      110      104 from DATA, 6 from India Code
instrument_version    110      tiered by authority
provision           2,858      144 marked AMBIGUOUS
provision_text      2,891
chunk               2,891      indexed for 6 frameworks
analysis                6      with 103 evidence rows and 54 findings
audit_log              17      including 11 ambiguous-citation resolutions
```

Answers the database gives directly:

- **Ingestion backlog:** 71 files ready, 30 needing OCR, 6 duplicates, 3
  needing translation.
- **Citable proportion:** 75 of 110 versions carry non-zero authority weight;
  35 are drafts or commentary and carry none.
- **Coverage gap:** Geographical Indications (9 versions) and AYUSH regulatory
  (3 versions) are present in the corpus and absent from the index. Both are
  directly relevant to Ayurvedic products, and both are clean, English,
  extractable primary legislation.

---

## 7. Recommended sequence

1. **Fix the chunker's sub-clause addressing.** This is a correctness bug that
   currently affects live citations. Verify with `ambiguous_citation`.
2. **Ingest AYUSH and Geographical Indications.** Twelve files covering two
   frameworks the system reasons about but has no text for. All twelve have an
   extractable text layer and none needs OCR: the three AYUSH Acts are plain
   English, and of the nine Geographical Indications files six are English, two
   are bilingual gazettes and one is Hindi only.
3. **Extend the `Framework` enum** in `backend/app/models/core.py` to include
   `GEOGRAPHICAL_INDICATION` and `AYUSH_REGULATORY`. The database already
   carries them; the API contract does not.
4. **Ingest office practice with the tier attached,** particularly the 2025
   Guidelines for Examination of Ayush Related Inventions, which is the single
   most relevant document in the corpus to this project.
5. **OCR the 30 scanned files,** starting with the Designs amendment rules.
6. **Model amendments** for the Patents Act chain, so point-in-time questions
   are answerable.
