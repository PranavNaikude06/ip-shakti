# AYUR-IP — Backend, ML & AI Engineering Specification

**Project:** AYUR-IP  
**Purpose:** AI-powered Ayurveda Intellectual Property, Traditional Knowledge, Biodiversity/ABS and Regulatory Compliance Decision-Support Platform  
**Document Type:** Backend + ML + AI Engineering Specification  
**Status:** Hackathon / Proof-of-Concept  
**Primary Goal:** Build a working, evidence-grounded end-to-end analysis pipeline rather than a generic chatbot.

---

# 1. PROJECT OVERVIEW

AYUR-IP is a domain-specific AI decision-support platform for Ayurveda practitioners, researchers, startups/MSMEs, innovators and organizations working with Ayurvedic products, formulations, biological resources and traditional knowledge.

The platform helps users understand potential:

1. Intellectual Property implications
2. Traditional Knowledge / prior-art overlap
3. Biodiversity and Access-and-Benefit-Sharing (ABS) considerations
4. Indian regulatory pathways
5. International IP/regulatory considerations
6. Recommended next steps
7. Situations requiring human/legal expert review

The platform must be **evidence-grounded**.

It must NOT behave like:

```text
User → Question → LLM → Legal Answer
```

Instead, the core architecture is:

```text
User Input
    ↓
Structured Product Intake
    ↓
Entity Extraction / NLP
    ↓
Product Classification
    ↓
Hybrid Evidence Retrieval
    ↓
Knowledge Graph
    ↓
Rule Engine
    ↓
GNN / Graph Intelligence
    ↓
Structured Findings
    ↓
Grounded LLM Explanation
    ↓
Citation / Evidence Validation
    ↓
Final Analysis
    ↓
Frontend Dashboard / Report
```

The LLM is an explanation and synthesis component.

It is NOT the authoritative source of law.

---

# 2. PRIMARY ENGINEERING PRINCIPLES

The implementation must follow these principles.

## 2.1 Evidence First

Every important legal/regulatory finding should be connected to evidence.

Example:

```text
Finding:
Potential patent exclusion

Evidence:
EVID-001

Document:
Patents Act, 1970

Provision:
Section 3(p)

Page:
12
```

The system should be able to answer:

> "Why did you flag this?"

with an evidence-backed response.

## 2.2 Do Not Hallucinate Law

The system must NEVER invent:

- laws
- sections
- subsections
- regulations
- authorities
- dates
- legal requirements
- citations
- case law
- patent numbers
- source documents

If evidence is unavailable:

```text
UNKNOWN / INSUFFICIENT EVIDENCE
```

should be returned.

Do not fill gaps using LLM knowledge.

## 2.3 Rules Are Deterministic

Legal/compliance logic should be represented as deterministic rules wherever possible.

Example:

```python
if biological_resource_detected:
    trigger("BIODIVERSITY_REVIEW")
```

The LLM must not independently decide whether a legal requirement applies.

## 2.4 ML Provides Signals

ML models can provide:

- entity extraction
- classification
- similarity
- ranking
- graph relationship prediction
- confidence estimates

ML outputs are signals.

They should not be presented as legally authoritative conclusions.

## 2.5 Human Escalation

The system should flag cases requiring human review.

Examples:

- low confidence
- conflicting evidence
- missing evidence
- novel formulation
- unclear classification
- interaction between multiple legal frameworks
- international jurisdiction ambiguity

---

# 3. TECHNOLOGY STACK

## Backend

- Python
- FastAPI
- Pydantic
- PostgreSQL
- SQLAlchemy
- Uvicorn

## AI / ML

- Python
- PyTorch
- Hugging Face Transformers
- PyTorch Geometric
- scikit-learn where appropriate

## RAG

- Qdrant
- BM25
- Cross-Encoder reranker
- Local embeddings where practical

## Knowledge Graph

- Neo4j
- Cypher

## Workflow

- LangGraph

Use LangGraph for controlled orchestration.

Do NOT build uncontrolled autonomous agents.

## LLM

Preferred hackathon architecture:

- Groq inference
- Open-weight model available through Groq
- Prefer a strong available model such as GPT-OSS 120B if available under the configured/free usage tier
- Fallback to a smaller model if necessary

Alternative:

- Ollama
- Qwen / Gemma or another capable local model

The code must abstract the LLM provider behind a service interface so it can be replaced.

---

# 4. HIGH-LEVEL ARCHITECTURE

```text
                         ┌──────────────────────┐
                         │      FRONTEND        │
                         │     Next.js/UI       │
                         └──────────┬───────────┘
                                    │
                                    │ REST API
                                    ▼
                         ┌──────────────────────┐
                         │       FASTAPI        │
                         │       BACKEND        │
                         └──────────┬───────────┘
                                    │
                              Analysis Request
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     LANGGRAPH        │
                         │  Analysis Workflow   │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌─────────────┐      ┌──────────────┐      ┌──────────────┐
       │ NLP / ML    │      │ Hybrid RAG   │      │ Knowledge    │
       │             │      │              │      │ Graph        │
       │ Entities    │      │ Qdrant       │      │ Neo4j        │
       │ Classifier  │      │ BM25         │      │              │
       └──────┬──────┘      │ Reranker     │      └──────┬───────┘
              │             └──────┬───────┘             │
              │                    │                     │
              └────────────────────┼─────────────────────┘
                                   ▼
                            ┌─────────────┐
                            │    R-GCN    │
                            │ Graph Signal│
                            └──────┬──────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │ Rule Engine │
                            └──────┬──────┘
                                   │
                                   ▼
                         ┌────────────────────┐
                         │ Structured Findings│
                         └──────────┬─────────┘
                                    │
                                    ▼
                         ┌────────────────────┐
                         │       LLM          │
                         │ Explanation only    │
                         └──────────┬─────────┘
                                    │
                                    ▼
                         ┌────────────────────┐
                         │ Citation Validator │
                         └──────────┬─────────┘
                                    │
                                    ▼
                         ┌────────────────────┐
                         │ Final API Response │
                         └────────────────────┘
```

---

# 5. KNOWLEDGE BASE

The Knowledge Base is one of the most important parts of AYUR-IP.

The project currently has downloaded authoritative documents covering areas including:

- Patents
- Designs
- Trademarks
- Copyright

Additional domains should be added where available:

- Geographical Indications
- Plant Variety Protection / PPV&FR
- Biological Diversity / ABS
- AYUSH regulatory framework
- Drugs and Cosmetics framework
- FSSAI / Ayurveda-Aahar
- Traditional Knowledge
- International IP
- TRIPS
- CBD
- Nagoya Protocol
- WIPO
- PCT
- Madrid
- Hague
- Budapest
- Relevant export-market requirements

Do not fabricate documents.

Only index documents actually provided or verified from authoritative sources.

---

# 6. KNOWLEDGE BASE DIRECTORY

Recommended structure:

```text
knowledge_base/

    india/

        patents/
            acts/
            rules/
            manuals/
            guidelines/

        trademarks/
            acts/
            rules/
            manuals/
            guidelines/

        designs/
            acts/
            rules/
            manuals/
            guidelines/

        copyright/
            acts/
            rules/
            manuals/
            guidelines/

        geographical_indications/

        plant_variety/

        biodiversity_abs/

        ayush_regulatory/

        food_fssai/

    international/

        trips/
        cbd/
        nagoya/
        wipo/
        pct/
        madrid/
        hague/
        budapest/
```

---

# 7. DOCUMENT METADATA

Every document must have metadata.

Example:

```json
{
  "document_id": "PAT-ACT-1970",
  "document_name": "Patents Act, 1970",
  "document_type": "ACT",
  "domain": "PATENT",
  "jurisdiction": "INDIA",
  "authority": "Official Authority",
  "publication_date": null,
  "effective_date": null,
  "version": "CURRENT_AVAILABLE_VERSION",
  "status": "ACTIVE",
  "source_url": null,
  "file_name": "patents_act.pdf",
  "last_verified": null
}
```

Never invent metadata.

Use `null` when unknown.

---

# 8. DOCUMENT INVENTORY

Create:

```text
knowledge_base/documents.csv
```

Columns:

```text
document_id
document_name
document_type
domain
jurisdiction
authority
publication_date
effective_date
version
status
source_url
file_name
sha256
last_verified
```

The SHA-256 hash should be calculated for each document.

This allows future document-change detection.

---

# 9. PDF INGESTION PIPELINE

Build:

```text
PDF
 ↓
Parser
 ↓
Text Extraction
 ↓
Header/Footer Cleanup
 ↓
Page Preservation
 ↓
Legal Structure Detection
 ↓
Metadata Attachment
 ↓
Legal Chunking
 ↓
Embedding
 ↓
Qdrant
 ↓
BM25 Index
```

Do not blindly split documents into fixed-size chunks.

---

# 10. LEGAL-AWARE CHUNKING

Legal documents should preserve hierarchy.

Example:

```text
Act
 └── Chapter
      └── Section
           └── Subsection
                └── Clause
```

A chunk should contain enough context to understand the provision.

Example:

```json
{
  "chunk_id": "PATENTS_ACT_3_P_001",
  "document_id": "PAT-ACT-1970",
  "domain": "PATENT",
  "jurisdiction": "INDIA",
  "chapter": null,
  "section": "3",
  "subsection": "p",
  "page_start": 12,
  "page_end": 12,
  "heading": "...",
  "text": "...",
  "status": "ACTIVE"
}
```

Keep page numbers.

Keep section numbers.

Keep the original text.

---

# 11. EVIDENCE OBJECT

Every retrievable legal chunk should be convertible into an Evidence object.

Example:

```json
{
  "evidence_id": "EVID-001",
  "document_id": "PAT-ACT-1970",
  "document_name": "Patents Act, 1970",
  "domain": "PATENT",
  "jurisdiction": "INDIA",
  "provision": "Section 3(p)",
  "page": 12,
  "text": "...",
  "source_url": null,
  "status": "ACTIVE"
}
```

Evidence IDs must be stable within an analysis.

---

# 12. HYBRID RAG

AYUR-IP must use hybrid retrieval.

Do not rely only on embeddings.

Use:

```text
Query
  │
  ├──────────────→ Dense Vector Search
  │                       │
  │                       ▼
  │                     Qdrant
  │
  └──────────────→ BM25 Keyword Search
                          │
                          ▼
                       Keyword Index

             Both results
                  ↓
              Fusion
                  ↓
          Cross Encoder
             Reranker
                  ↓
          Top Evidence
```

Why?

Legal queries often require exact terms.

Example:

```text
"Section 3(p)"
```

BM25 can strongly help with exact section retrieval.

Semantic embeddings help when users paraphrase the requirement.

---

# 13. RETRIEVAL OUTPUT

Retriever should return:

```json
{
  "query": "...",
  "results": [
    {
      "evidence_id": "EVID-001",
      "score": 0.91,
      "retrieval_method": "HYBRID",
      "document": "Patents Act, 1970",
      "provision": "Section 3(p)",
      "page": 12,
      "text": "..."
    }
  ]
}
```

Never return only raw text.

Always preserve provenance.

---

# 14. RETRIEVAL EVALUATION

Create a test dataset:

```text
tests/retrieval_questions.json
```

Example:

```json
{
  "question": "Which provision concerns traditional knowledge in patent exclusions?",
  "expected_document": "Patents Act",
  "expected_section": "3(p)"
}
```

Measure:

- Recall@5
- Recall@10
- MRR
- citation correctness
- section retrieval accuracy

The goal is not just to say "RAG works".

We should demonstrate that the correct evidence is retrieved.

---

# 15. ENTITY EXTRACTION

The NLP pipeline should extract structured entities from product descriptions.

Possible entities:

```text
INGREDIENT
BIOLOGICAL_RESOURCE
FORMULATION
PROCESS
EXTRACTION_METHOD
TRADITIONAL_KNOWLEDGE
PRODUCT_TYPE
THERAPEUTIC_CLAIM
MARKETING_CLAIM
TARGET_MARKET
JURISDICTION
IP_CONCEPT
```

Example input:

```text
I developed an Ashwagandha formulation using a modified extraction
process for stress management and want to sell it in India.
```

Expected structure:

```json
{
  "ingredients": [
    "Ashwagandha"
  ],
  "biological_resources": [
    "Ashwagandha"
  ],
  "processes": [
    "modified extraction process"
  ],
  "claims": [
    "stress management"
  ],
  "target_markets": [
    "India"
  ]
}
```

---

# 16. PRODUCT CLASSIFICATION

Create a classifier that provides a preliminary product category.

Possible classes:

```text
CLASSICAL_AYURVEDIC_MEDICINE
PROPRIETARY_AYURVEDIC_MEDICINE
NEW_DRUG
PHYTOPHARMACEUTICAL
AYURVEDA_AAHAR
COSMETIC
UNKNOWN
```

The classifier must return:

```json
{
  "label": "PROPRIETARY_AYURVEDIC_MEDICINE",
  "confidence": 0.87,
  "alternatives": [
    {
      "label": "CLASSICAL_AYURVEDIC_MEDICINE",
      "confidence": 0.08
    }
  ]
}
```

This is a triage/classification signal.

Do not represent it as an official legal determination.

---

# 17. KNOWLEDGE GRAPH

Use Neo4j.

The graph should model relationships between:

```text
PRODUCT
INGREDIENT
BIOLOGICAL_RESOURCE
FORMULATION
TRADITIONAL_KNOWLEDGE
PATENT
IP_RIGHT
LAW
SECTION
RULE
REGULATION
AUTHORITY
PRODUCT_TYPE
JURISDICTION
CLAIM
```

---

# 18. GRAPH RELATIONSHIPS

Initial relationships:

```text
CONTAINS
DERIVED_FROM
HAS_TK_OVERLAP
SIMILAR_TO
RELATED_TO
REGULATED_BY
REQUIRES
CITES
OVERLAPS_WITH
APPLIES_IN
ISSUED_BY
HAS_SECTION
HAS_RULE
HAS_CLAIM
```

Example:

```text
Product
  └── CONTAINS → Ashwagandha
                     │
                     ├── HAS_TK_OVERLAP → TK Record
                     │
                     └── RELATED_TO → Patent
```

Another:

```text
Patent
   └── REGULATED_BY → Patents Act
                           │
                           └── HAS_SECTION → Section 3(p)
```

---

# 19. GRAPH DATA MUST NOT BE FABRICATED

For the proof of concept:

- Use real data from the provided corpus where possible.
- If a relationship is manually curated for demonstration, mark it as curated/demo data.
- Never present synthetic relationships as discovered legal facts.

Metadata should distinguish:

```text
source = OFFICIAL
source = CURATED
source = DEMO
```

---

# 20. GNN

Use a Relational Graph Convolutional Network (R-GCN) if there is sufficient graph data.

Why R-GCN?

The graph contains multiple relation types.

Example:

```text
Product --CONTAINS--> Ingredient

Ingredient --RELATED_TO--> Patent

Patent --REGULATED_BY--> Law

Law --HAS_SECTION--> Section
```

A standard graph model does not distinguish these relationships as naturally as a relational GNN.

---

# 21. GNN RESPONSIBILITY

The GNN should generate signals such as:

```text
graph similarity
related entities
candidate relationships
node embeddings
risk/similarity signal
```

It must NOT output:

```text
"This product is legally patentable."
```

Instead:

```json
{
  "graph_signal": 0.78,
  "related_entities": [
    "PAT-019",
    "TK-042"
  ],
  "signal_type": "GRAPH_SIMILARITY"
}
```

Then deterministic rules and evidence determine the final assessment.

---

# 22. GNN FALLBACK

If there is insufficient graph data to train a meaningful R-GCN:

Do NOT fabricate training results.

Use:

- graph embeddings
- similarity metrics
- GraphSAGE
- simple node embeddings
- NetworkX-based relationship analysis

and keep R-GCN as an advanced extension.

The architecture should remain R-GCN compatible.

---

# 23. RULE ENGINE

Create:

```text
app/services/rules/
```

Rules should be modular.

Example:

```python
def biodiversity_review(product, entities, graph):
    if entities.biological_resources:
        return {
            "triggered": True,
            "rule_id": "BIO-001",
            "status": "REVIEW_REQUIRED"
        }

    return {
        "triggered": False,
        "rule_id": "BIO-001"
    }
```

Do not hard-code all rules into one giant function.

---

# 24. RULE OUTPUT

Every rule should return structured information.

Example:

```json
{
  "rule_id": "PAT-003",
  "framework": "PATENT",
  "triggered": true,
  "status": "REVIEW_REQUIRED",
  "reason": "...",
  "evidence_ids": [
    "EVID-001"
  ],
  "confidence": 0.81
}
```

---

# 25. MULTIPLE LEGAL FRAMEWORKS

A single product may trigger multiple frameworks.

Example:

```text
Ashwagandha Product
       │
       ├── Patent
       │
       ├── Traditional Knowledge
       │
       ├── Biodiversity / ABS
       │
       └── AYUSH Regulation
```

The backend MUST support multiple simultaneous assessments.

Do NOT implement:

```text
one product → one law
```

Implement:

```text
one product
    ↓
multiple frameworks
    ↓
multiple provisions
    ↓
combined findings
```

---

# 26. CONFLICTING FRAMEWORKS

If two frameworks appear to interact or conflict:

Do not automatically decide which law overrides the other unless the evidence explicitly establishes it.

Return:

```json
{
  "status": "LEGAL_INTERACTION_REVIEW_REQUIRED",
  "frameworks": [
    "FRAMEWORK_A",
    "FRAMEWORK_B"
  ],
  "reason": "...",
  "escalation_required": true
}
```

---

# 27. LANGGRAPH WORKFLOW

Implement the analysis as a controlled workflow.

Recommended nodes:

```text
START
  ↓
validate_input
  ↓
extract_entities
  ↓
classify_product
  ↓
retrieve_ip_evidence
  ↓
retrieve_tk_evidence
  ↓
retrieve_abs_evidence
  ↓
retrieve_regulatory_evidence
  ↓
query_knowledge_graph
  ↓
run_gnn
  ↓
run_rules
  ↓
aggregate_findings
  ↓
generate_grounded_explanation
  ↓
validate_citations
  ↓
calculate_confidence
  ↓
check_escalation
  ↓
END
```

Do not allow agents to randomly call each other.

The workflow must be deterministic and inspectable.

---

# 28. STRUCTURED ANALYSIS OBJECT

The workflow should produce something similar to:

```json
{
  "analysis_id": "ANL-001",

  "product": {
    "name": "...",
    "classification": "...",
    "classification_confidence": 0.87
  },

  "entities": {},

  "assessments": {

    "patent": {
      "status": "REVIEW_REQUIRED",
      "confidence": 0.81,
      "findings": [],
      "evidence_ids": []
    },

    "traditional_knowledge": {
      "status": "POTENTIAL_OVERLAP",
      "confidence": 0.76,
      "findings": [],
      "evidence_ids": []
    },

    "biodiversity_abs": {
      "status": "REVIEW_REQUIRED",
      "confidence": 0.72,
      "findings": [],
      "evidence_ids": []
    },

    "regulatory": {
      "status": "REVIEW_REQUIRED",
      "confidence": 0.84,
      "findings": [],
      "evidence_ids": []
    },

    "international": {
      "status": "NOT_ASSESSED",
      "findings": [],
      "evidence_ids": []
    }
  },

  "graph_signals": [],

  "recommendations": [],

  "evidence": [],

  "escalation": {
    "required": false,
    "reasons": []
  }
}
```

---

# 29. LLM SERVICE

Create an abstraction:

```python
class LLMService:
    async def generate_grounded_explanation(
        self,
        findings,
        evidence,
        product_context
    ):
        ...
```

The rest of the application must not depend directly on Groq.

This allows:

```text
Groq
 ↓
OpenAI-compatible interface

or

Ollama
 ↓
Local model

or

Another provider
```

without rewriting the system.

---

# 30. LLM PROMPT RULES

The LLM receives:

```text
PRODUCT INFORMATION
+
STRUCTURED FINDINGS
+
EVIDENCE
+
CONFIDENCE
+
RECOMMENDATIONS
```

It must be instructed:

1. Use only supplied evidence.
2. Never invent legal sources.
3. Never invent section numbers.
4. Never invent citations.
5. Never change the meaning of source evidence.
6. Clearly distinguish evidence from inference.
7. State uncertainty.
8. Never present ML confidence as legal certainty.
9. Recommend human review when required.
10. Do not provide definitive legal advice.

---

# 31. CITATION VALIDATOR

After LLM generation:

```text
LLM output
    ↓
Extract citations
    ↓
Check Evidence IDs
    ↓
Check evidence existence
    ↓
Check source/provision match
    ↓
Check unsupported claims
```

Example:

```json
{
  "claim": "Potential exclusion under Section 3(p)",
  "citation": "EVID-001",
  "valid": true
}
```

If invalid:

```text
REGENERATE
```

or:

```text
FLAG_FOR_REVIEW
```

Never silently allow unsupported citations.

---

# 32. CONFIDENCE MODEL

Do not treat one model's probability as the final confidence.

Create a combined confidence signal from:

```text
classification confidence
+
retrieval quality
+
rule certainty
+
graph signal
+
evidence availability
+
source consistency
```

Example:

```json
{
  "overall_confidence": 0.79,
  "confidence_level": "MEDIUM"
}
```

Suggested labels:

```text
HIGH
MEDIUM
LOW
```

---

# 33. ESCALATION ENGINE

Human review should be triggered when:

```text
confidence < threshold
```

OR:

```text
evidence missing
```

OR:

```text
conflicting sources
```

OR:

```text
multiple frameworks interact
```

OR:

```text
novel/unknown classification
```

OR:

```text
international issue not confidently supported
```

Example:

```json
{
  "required": true,
  "priority": "HIGH",
  "reasons": [
    "Conflicting regulatory evidence",
    "Low classification confidence"
  ]
}
```

---

# 34. API DESIGN

## POST /api/analyze

Request:

```json
{
  "product_name": "Ashwagandha Stress Formula",
  "ingredients": [
    "Ashwagandha"
  ],
  "description": "Modified extraction process...",
  "claims": [
    "stress management"
  ],
  "source": "traditional",
  "target_markets": [
    "India"
  ]
}
```

Response:

```json
{
  "analysis_id": "ANL-001",
  "status": "COMPLETED",
  "result": {}
}
```

## GET /api/analysis/{analysis_id}

Returns stored analysis.

## GET /api/analysis/{analysis_id}/evidence

Returns evidence.

## GET /api/analysis/{analysis_id}/graph

Returns graph nodes and relationships.

## POST /api/analysis/{analysis_id}/report

Generates report.

## GET /api/health

Returns:

```json
{
  "status": "ok"
}
```

---

# 35. DATABASE RESPONSIBILITIES

PostgreSQL should store application state.

Examples:

```text
users
products
analyses
analysis_findings
recommendations
reports
audit_logs
```

Qdrant stores:

```text
legal document embeddings
```

BM25 stores:

```text
keyword retrieval index
```

Neo4j stores:

```text
legal/domain relationships
```

Do not put everything into one database.

---

# 36. AUDITABILITY

Every analysis should have:

```text
analysis_id
timestamp
input
model versions
retrieved evidence IDs
rules executed
graph signals
LLM model
final findings
escalation decision
```

This allows the demo to show:

> "How did AYUR-IP reach this result?"

---

# 37. MODEL VERSIONING

Store:

```json
{
  "nlp_model": "...",
  "classifier_version": "...",
  "gnn_version": "...",
  "embedding_model": "...",
  "reranker_model": "...",
  "llm_model": "...",
  "knowledge_base_version": "..."
}
```

---

# 38. KNOWLEDGE BASE VERSIONING

Every analysis should record the KB version.

Example:

```text
KB_VERSION = 2026.09.02
```

When documents are updated:

```text
new documents
      ↓
new chunks
      ↓
new embeddings
      ↓
updated Qdrant
      ↓
updated graph
      ↓
new KB version
```

Do not silently overwrite history.

---

# 39. LEGAL UPDATE ARCHITECTURE

Future architecture:

```text
Official Sources
      ↓
Scheduled Monitor
      ↓
Document Hash
      ↓
Change Detection
      ↓
Semantic Diff
      ↓
Amendment Detection
      ↓
Human Review
      ↓
KB Version Update
      ↓
Qdrant Refresh
      ↓
Neo4j Refresh
```

For the hackathon, this can be implemented as a roadmap feature rather than fully automated.

---

# 40. MULTILINGUAL SUPPORT

Initial target:

```text
English
Hindi
Marathi
```

Architecture:

```text
User Language
      ↓
Language Detection
      ↓
Entity Extraction
      ↓
Evidence Retrieval
      ↓
Authoritative Source Language Preserved
      ↓
Explanation Translation
```

Important:

**Never modify or translate the authoritative legal evidence itself when displaying the source citation.**

The system may provide a translated explanation alongside the original evidence.

---

# 41. SAMPLE END-TO-END CASE

Use this as the primary demo scenario:

```text
Product:
Ashwagandha Stress Formula

Ingredients:
Ashwagandha

Process:
Modified extraction process

Claim:
Stress management

Source:
Traditional knowledge / Ayurvedic formulation

Target Market:
India
```

Pipeline:

```text
Input
 ↓
Extract Ashwagandha
 ↓
Detect biological resource
 ↓
Detect modified extraction
 ↓
Detect claim
 ↓
Classify product
 ↓
Patent retrieval
 ↓
Traditional Knowledge retrieval
 ↓
Biodiversity/ABS retrieval
 ↓
Regulatory retrieval
 ↓
Neo4j relationship analysis
 ↓
GNN similarity signal
 ↓
Rules
 ↓
Evidence-backed findings
 ↓
LLM explanation
 ↓
Citation validation
 ↓
Dashboard
```

Do NOT hard-code the final legal conclusion.

The actual result must depend on the available evidence.

---

# 42. FRONTEND CONTRACT

The frontend team is developing the UI independently.

Backend must provide stable JSON contracts.

The frontend should never need to know whether a result came from:

```text
Qdrant
Neo4j
R-GCN
Rule Engine
LLM
```

It only consumes structured results.

Example:

```json
{
  "framework": "PATENT",
  "status": "REVIEW_REQUIRED",
  "confidence": 0.81,
  "summary": "...",
  "evidence_ids": [
    "EVID-001"
  ],
  "recommended_actions": [
    "Conduct prior-art search"
  ]
}
```

---

# 43. RECOMMENDATION ENGINE

Recommendations should be generated from structured findings.

Examples:

```text
Potential patent issue
→ Conduct prior-art search

Potential TK overlap
→ Review traditional knowledge source and protection implications

Potential biodiversity/ABS issue
→ Review applicable biodiversity/ABS requirements

Low confidence
→ Escalate to expert
```

Do not allow the LLM to invent arbitrary recommendations.

Recommendations should preferably map to:

```text
finding
→ rule
→ evidence
→ recommended action
```

---

# 44. SECURITY

At minimum:

- validate input
- sanitize uploaded files
- restrict file types
- limit file sizes
- avoid executing uploaded files
- protect API keys
- store secrets in environment variables
- do not expose LLM API keys to frontend
- validate all API inputs with Pydantic

Never commit:

```text
.env
API keys
passwords
tokens
```

---

# 45. LOGGING

Use structured logs.

Example:

```text
analysis_id=ANL-001
stage=RETRIEVAL
domain=PATENT
results=8
```

Important events:

```text
analysis_started
entity_extraction_completed
classification_completed
retrieval_completed
graph_query_completed
rules_completed
llm_completed
citation_validation_completed
analysis_completed
escalation_triggered
```

---

# 46. ERROR HANDLING

The system must degrade gracefully.

Example:

If Neo4j is unavailable:

```text
graph_status = unavailable
```

Do not crash the entire analysis if graph intelligence is optional.

If LLM unavailable:

```text
structured findings still returned
```

If Qdrant unavailable:

```text
analysis_status = evidence_unavailable
```

Do not generate unsupported legal conclusions.

---

# 47. PROJECT DIRECTORY

Recommended:

```text
ayur-ip/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── analyze.py
│   │   │   ├── evidence.py
│   │   │   ├── graph.py
│   │   │   └── reports.py
│   │   │
│   │   ├── models/
│   │   │   ├── product.py
│   │   │   ├── analysis.py
│   │   │   └── evidence.py
│   │   │
│   │   ├── services/
│   │   │   ├── nlp.py
│   │   │   ├── classifier.py
│   │   │   ├── retrieval.py
│   │   │   ├── graph.py
│   │   │   ├── gnn.py
│   │   │   ├── rules.py
│   │   │   ├── llm.py
│   │   │   ├── citations.py
│   │   │   └── escalation.py
│   │   │
│   │   ├── rag/
│   │   │   ├── embeddings.py
│   │   │   ├── qdrant.py
│   │   │   ├── bm25.py
│   │   │   └── reranker.py
│   │   │
│   │   ├── knowledge/
│   │   │   ├── ingestion.py
│   │   │   ├── parser.py
│   │   │   ├── chunker.py
│   │   │   ├── metadata.py
│   │   │   └── inventory.py
│   │   │
│   │   ├── workflows/
│   │   │   └── analysis_graph.py
│   │   │
│   │   └── db/
│   │       ├── postgres.py
│   │       └── neo4j.py
│   │
│   ├── tests/
│   │   ├── retrieval/
│   │   ├── rules/
│   │   ├── api/
│   │   └── integration/
│   │
│   └── requirements.txt
│
├── knowledge_base/
│   ├── india/
│   └── international/
│
├── data/
│   ├── processed/
│   ├── embeddings/
│   └── evaluation/
│
├── docs/
│   └── AYUR_IP_BACKEND_AI_SPEC.md
│
└── README.md
```

---

# 48. DEVELOPMENT PHASES

## PHASE 1 — Knowledge Base

Priority: VERY HIGH

Implement:

```text
PDF ingestion
Document inventory
Metadata
Legal-aware chunking
Qdrant
BM25
Retrieval API
```

Success condition:

```text
Question
 ↓
Correct legal section
 ↓
Correct page
 ↓
Evidence ID
```

## PHASE 2 — Backend

Implement:

```text
FastAPI
PostgreSQL
Analysis model
API contracts
Mock analysis endpoint
```

Success condition:

Frontend can call:

```text
POST /api/analyze
```

## PHASE 3 — Knowledge Graph

Implement:

```text
Neo4j
Ontology
Entities
Relationships
Graph query API
```

Success condition:

The system can explain relationships such as:

```text
Product
→ Ingredient
→ TK
→ Patent
→ Law
→ Section
```

## PHASE 4 — Rules

Implement:

```text
Patent rules
TK rules
ABS rules
Regulatory rules
International rules
```

Only implement rules supported by the actual corpus.

## PHASE 5 — ML

Implement:

```text
Entity extraction
Product classification
Similarity
Graph signals
```

Prioritize working models over complicated model training.

## PHASE 6 — GNN

Implement:

```text
R-GCN
```

only once the graph has enough meaningful data.

If data is insufficient:

```text
graph embeddings / similarity
```

are acceptable for the hackathon.

## PHASE 7 — LLM

Implement:

```text
Grounded explanation
Structured output
Citation references
Uncertainty
```

The LLM should receive already-processed evidence.

## PHASE 8 — Citation Validation

Implement:

```text
Claim
 ↓
Evidence ID
 ↓
Evidence exists?
 ↓
Provision matches?
 ↓
Supported?
```

## PHASE 9 — Integration

Connect:

```text
Frontend
 ↓
FastAPI
 ↓
LangGraph
 ↓
NLP
 ↓
RAG
 ↓
Neo4j
 ↓
GNN
 ↓
Rules
 ↓
LLM
 ↓
Citation Validator
 ↓
Frontend
```

---

# 49. PRIORITY SYSTEM

## P0 — MUST WORK

```text
Product Intake
Entity Extraction
Basic Classification
Hybrid Retrieval
Real Evidence
Rule Engine
FastAPI
Structured Analysis
Citation Display
Frontend Integration
```

## P1 — HIGH VALUE

```text
Neo4j
Knowledge Graph UI
Reranker
Citation Validator
Recommendations
Confidence
Human Escalation
Report Generation
```

## P2 — ADVANCED

```text
R-GCN
Multilingual
Automatic Legal Updates
Advanced Graph Reasoning
Model Routing
Advanced Analytics
```

Never sacrifice P0 functionality for P2 features.

---

# 50. TESTING STRATEGY

Create tests for:

## Retrieval

```text
Does Section X retrieve correctly?
```

## Entity extraction

```text
Does Ashwagandha get detected?
```

## Classification

```text
Does the classifier return a valid class?
```

## Rules

```text
Does a biological resource trigger biodiversity review?
```

## Graph

```text
Does Product → Ingredient relationship exist?
```

## Citation validation

```text
Does invalid evidence get rejected?
```

## End-to-end

```text
Product
→ analysis
→ evidence
→ findings
→ recommendations
```

---

# 51. IMPORTANT: NO FAKE AI

Do not create fake outputs like:

```text
GNN confidence = 94%
```

unless the model actually produced that result.

Do not create fake:

```text
patent similarity = 91%
```

Do not create fake legal citations.

If a component is a demonstration/mock:

```json
{
  "source": "DEMO"
}
```

or clearly label it as such.

Authenticity is more valuable than impressive-looking fake AI.

---

# 52. HACKATHON OPTIMIZATION

The goal is NOT to build a complete production LegalTech platform in one day.

The goal is:

```text
ONE REAL END-TO-END VERTICAL SLICE
```

Example:

```text
Ashwagandha Product
       ↓
Entity Extraction
       ↓
Classification
       ↓
Real Legal Retrieval
       ↓
Real Evidence
       ↓
Graph Relationships
       ↓
Rule Evaluation
       ↓
GNN Signal
       ↓
Grounded LLM Explanation
       ↓
Citation Validation
       ↓
Beautiful UI
```

If this works reliably, the architecture can be presented as scalable.

---

# 53. ANTIGRAVITY / AI CODING AGENT INSTRUCTIONS

The coding agent must treat this document as the engineering source of truth.

Before implementing anything:

1. Inspect the existing repository.
2. Inspect the current frontend API expectations.
3. Do not overwrite working code unnecessarily.
4. Do not create duplicate implementations.
5. Reuse existing utilities.
6. Keep services modular.
7. Add tests for important functionality.
8. Keep configuration in environment variables.
9. Never hard-code API keys.
10. Never fabricate legal information.
11. Never fabricate dataset results.
12. Never fabricate model metrics.
13. Never fabricate citations.
14. Use clear type definitions.
15. Keep API contracts stable.

When requirements are ambiguous:

```text
Prefer the simplest implementation that satisfies this specification.
Do not invent complex architecture without need.
```

---

# 54. AGENT TASK EXECUTION RULE

Do NOT attempt to implement the entire project in one operation.

Work in small milestones.

For each milestone:

```text
1. Inspect
2. Plan
3. Implement
4. Test
5. Report files changed
6. Report how to run
7. Report remaining issues
```

Do not proceed to a new major subsystem if the current subsystem is broken.

---

# 55. FIRST TASK FOR THE CODING AGENT

The first implementation task should be:

```text
Build the Knowledge Base ingestion foundation.

Requirements:

1. Inspect the repository.
2. Locate all available legal PDFs.
3. Create document inventory.
4. Calculate SHA-256 hashes.
5. Extract text while preserving page numbers.
6. Detect legal structure where possible.
7. Create metadata.
8. Create legal-aware chunks.
9. Store processed JSON.
10. Do NOT generate embeddings yet unless the ingestion output is verified.
11. Create tests for chunking.
12. Produce a sample processed document.
```

Expected output:

```text
knowledge_base/
data/processed/
tests/
```

with a working ingestion command.

---

# 56. SECOND TASK

After ingestion is verified:

```text
Implement Qdrant + BM25 hybrid retrieval.

Requirements:

1. Create embedding service.
2. Create Qdrant collection.
3. Index legal chunks.
4. Create BM25 index.
5. Implement hybrid retrieval.
6. Implement optional reranking.
7. Return Evidence objects.
8. Preserve document/section/page metadata.
9. Create retrieval evaluation tests.
```

---

# 57. THIRD TASK

Implement FastAPI:

```text
POST /api/analyze
GET /api/analysis/{id}
GET /api/analysis/{id}/evidence
GET /api/analysis/{id}/graph
POST /api/analysis/{id}/report
GET /api/health
```

---

# 58. FOURTH TASK

Implement:

```text
NLP
+
Classification
+
Rules
+
Neo4j
```

Then integrate them through LangGraph.

---

# 59. FIFTH TASK

Implement:

```text
GNN signal
+
Grounded LLM
+
Citation validator
+
Escalation
```

---

# 60. FINAL SUCCESS CRITERIA

The backend/AI system is considered successful when the following works:

```text
POST /api/analyze
```

with:

```json
{
  "product_name": "Ashwagandha Stress Formula",
  "ingredients": ["Ashwagandha"],
  "description": "Modified extraction process",
  "claims": ["stress management"],
  "target_markets": ["India"]
}
```

produces:

```text
✓ Structured entities
✓ Product classification
✓ Patent assessment
✓ Traditional Knowledge assessment
✓ Biodiversity/ABS assessment
✓ Regulatory assessment
✓ Evidence IDs
✓ Real source documents
✓ Section/provision references
✓ Knowledge graph relationships
✓ Graph intelligence signal
✓ Deterministic rule results
✓ Grounded explanation
✓ Citation validation
✓ Confidence
✓ Recommendations
✓ Human escalation when appropriate
```

The final product should feel like:

```text
DOMAIN-SPECIFIC LEGAL / REGULATORY
DECISION SUPPORT
```

and NOT:

```text
GENERIC AI CHATBOT
```

---

# 61. CORE PRODUCT PHILOSOPHY

AYUR-IP's main innovation is not:

```text
"we use an LLM"
```

or:

```text
"we use a GNN"
```

or:

```text
"we use RAG"
```

The innovation is:

```text
Ayurveda Domain Ontology
        +
Legal / Regulatory Knowledge Base
        +
Traditional Knowledge
        +
Biodiversity / ABS
        +
Hybrid Retrieval
        +
Knowledge Graph
        +
Graph Intelligence
        +
Deterministic Rules
        +
Grounded LLM
        +
Evidence / Citation Validation
        +
Human Escalation
```

This combination creates an evidence-grounded Ayurveda IP and compliance decision-support system.

---

# 62. GOLDEN RULE

When in doubt:

```text
Evidence > LLM knowledge

Deterministic rule > LLM legal reasoning

Real data > fabricated demo data

Traceability > flashy output

Working vertical slice > unfinished advanced features
```

Build AYUR-IP as a system that can explain:

> **WHAT it found, WHY it found it, WHICH source supports it, HOW confident it is, and WHEN a human expert should review it.**
