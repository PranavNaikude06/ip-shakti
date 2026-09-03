# AYUR-IP — UI/UX Product Description

## 1. Overall Design Direction

**AYUR-IP — IP & Compliance Intelligence** is designed as an enterprise-grade AI platform for AYUSH startups, Ayurvedic manufacturers, researchers, IP professionals, and government facilitators.

The product should feel like a combination of:

* Legal-tech platform
* Enterprise compliance dashboard
* Intellectual-property management system
* Regulatory intelligence platform
* AI decision-support system

It should **not look like a chatbot application**. The primary interface is structured analysis, evidence, compliance status, and actionable recommendations. AI explanation is secondary and exists mainly to clarify the analysis — it should never take the form of a persistent conversation thread.

### Visual Personality

The visual language should be:

* Premium
* Professional
* Trustworthy
* Clean
* Data-driven
* Indian healthcare-inspired without using stereotypical Ayurveda graphics
* Suitable for a national-level hackathon
* Realistic enough to become a production React/Next.js application

Use:

* Warm off-white / white backgrounds
* Deep navy for structural elements and text
* Warm orange as the primary accent
* Amber/orange shades for active states
* Coral as a secondary accent
* Rose/pink for warnings, emphasis, and selected analytical states
* Very light peach/rose backgrounds for highlighted cards
* Soft shadows
* Thin borders
* Rounded 10–16px cards
* Generous whitespace

### New Accent Color Direction

The accent system should move **from orange shades toward pink shades**, rather than using one blended "orange-pink" color.

Suggested hierarchy:

| Purpose              | Color Direction  |
| -------------------- | ---------------- |
| Primary action       | Deep warm orange |
| Active navigation    | Orange           |
| Secondary accent     | Amber            |
| Analytical highlight | Coral            |
| Warning / attention  | Warm rose        |
| Critical status      | Deep rose        |
| Background highlight | Very pale peach  |
| Background warning   | Pale blush       |
| Main text            | Deep navy        |
| Secondary text       | Slate            |
| Page background      | Warm off-white   |

The orange should remain the dominant brand accent, while pink/rose appears progressively in analytical states and warnings.

---

# LEFT SIDEBAR NAVIGATION

The sidebar remains narrow and professional.

At the top:

**AYUR-IP**

**IP & Compliance Intelligence**

The active page is indicated using an orange accent bar, subtle warm-orange background, and an orange icon.

Navigation:

1. Dashboard
2. New Product Analysis
3. My Analyses
4. IP Assessment
5. ABS Compliance
6. Regulatory Pathway
7. Knowledge Graph
8. Sources
9. Human Expert Escalation

At the bottom, include a small account/status area showing:

* User type
* Organisation
* Recent activity
* Settings

---

# 2. DASHBOARD

### Purpose

The Dashboard is the user's central command center.

It should immediately answer:

> "What is happening with my Ayurvedic products and IP?"

### Header

**Welcome back**

**Your Ayurveda IP & Compliance Overview**

Small supporting text:

> Monitor product assessments, intellectual property, regulatory obligations, biodiversity requirements and expert reviews from one workspace.

### Top Metrics

Use five compact enterprise metric cards:

**Active Products**

Number of products currently being assessed or monitored.

**IP Assets**

Number of patents, trademarks, designs or other registered assets connected to the account.

**Expiring Soon**

Number of IP assets approaching expiry.

**Compliance Reviews**

Number of assessments requiring attention.

**Expert Escalations**

Number of cases currently with or awaiting human review.

Use small trend indicators where appropriate.

### Priority Alerts

A large card titled:

**Priority Actions**

Example alerts:

* Patent approaching expiry
* ABS assessment required
* Traditional knowledge overlap detected
* Regulatory classification requires review
* Prior-art assessment incomplete

Each alert has:

* Severity
* Product name
* Reason
* Recommended action
* Open button

### Recent Analyses

A table showing:

* Product
* Analysis date
* Classification
* Patentability
* ABS status
* Regulatory status
* Confidence
* Actions

### Quick Actions

Large buttons:

**Analyze New Product**

**View IP Portfolio**

**Check ABS Compliance**

**Generate Report**

The Dashboard should make the platform feel like an **enterprise control center**, not an AI chat application.

---

# 3. NEW PRODUCT ANALYSIS

This is the primary AI workflow.

### Page Header

**Analyze your Ayurvedic Product**

Subtitle:

> Get an evidence-backed IP, biodiversity and regulatory assessment.

### Product Information Card

Fields:

**Product / Formulation Name**

Example:

> Ashwagandha Advanced Extract

**Ingredients / Biological Resources**

Allow multiple ingredient tags.

Example:

* Ashwagandha
* Water
* Botanical extract
* Other biological resources

**Formulation Description**

Large text area describing the formulation.

**Source of Formulation**

Three selectable options:

* Classical Text
* Proprietary
* Novel

**Manufacturing / Extraction Process**

Text area for manufacturing methodology.

**Intended Use / Claims**

Describe therapeutic, wellness, cosmetic or other intended claims.

**Target Market**

Toggle:

* India
* International

### Document Upload

A bordered upload area:

**Upload formulation / specification document**

Supported examples:

* PDF
* DOCX
* Technical specification

### Primary CTA

Large orange button:

**Analyze Product →**

---

# 4. IP INSIGHT PANEL

The IP Insight Panel is positioned beside or within the Product Analysis experience, as a compact side panel — not a chat window.

It surfaces AI explanation as **structured, evidence-linked answer cards**, not a scrolling conversation thread. There is no "User:" / "AI:" turn-taking, no message bubbles, and no persistent chat history — each query produces one self-contained answer card that replaces or stacks beneath the previous one, styled identically to the rest of the assessment UI (same card, border, and typography system as the Assessment Overview cards).

### Header

**IP Insight Panel**

Badge:

**Evidence-grounded AI**

### Panel States

Instead of a conversational exchange, the panel shows the analysis pipeline as a **status checklist**, always visible at the top:

✓ Product information extracted

✓ Relevant regulations retrieved

✓ Prior-art search completed

⚠ ABS assessment required

Beneath the checklist, a summary line states the finding in plain language, e.g.:

> This formulation has been analyzed against available IP, traditional-knowledge and regulatory sources. One item requires review before filing.

### Query Field

Below the summary, a single-line **inline query field** (styled as a search/filter input, not a chat composer):

**Ask about this analysis…**

Submitting a query does not open a chat thread. It returns a single structured **Answer Card** directly beneath the field, containing:

* A short direct answer
* The specific evidence/source it draws from (linked to the Sources page)
* A "View full evidence" action

Only the current question and its answer card are shown at once; there is no scrollable message log. This keeps the panel functioning as an evidence lookup tool rather than a chatbot.

---

# 5. MY ANALYSES

This page stores the user's previous product assessments.

### Header

**My Analyses**

Subtitle:

> Review previous product assessments and continue unresolved compliance workflows.

### Analysis Table

Columns:

* Product
* Analysis ID
* Classification
* Patentability
* TK Status
* ABS Status
* Regulatory Pathway
* Confidence
* Last Updated
* Status

Example statuses:

**Completed**

**Review Required**

**Expert Review**

**Draft**

### Filters

Allow filtering by:

* Product type
* Date
* Jurisdiction
* Risk level
* Analysis status
* Regulatory pathway

### Analysis Detail

Selecting an analysis opens the complete assessment.

Include:

* Product classification
* Patentability
* Traditional Knowledge
* ABS
* Regulatory pathway
* Prior art
* Evidence
* Recommendations
* AI explanation
* Expert review status

---

# 6. IP ASSESSMENT

This section focuses specifically on intellectual property.

### Header

**IP Assessment**

Subtitle:

> Evaluate potential intellectual-property protection and existing rights associated with your Ayurvedic innovation.

### IP Categories

Create separate assessment cards:

**Patent**

* Novelty
* Inventive step
* Industrial applicability
* Prior art
* Traditional knowledge considerations

**Trademark**

* Brand/name assessment
* Potential conflicts
* Classification considerations

**Geographical Indication**

* Geographic association
* Product characteristics
* Existing GI considerations

**Design**

* Product appearance
* Packaging
* Visual features

**Copyright**

* Documentation
* Software
* Literature
* Artistic/creative components

**Trade Secret**

* Confidential formulation/process information

### IP Risk Summary

Use a visual risk meter:

**Low**

**Moderate**

**High**

**Review Required**

The system should clearly explain *why* a risk level was assigned.

---

# 7. ABS COMPLIANCE

ABS stands for **Access and Benefit Sharing**.

This page should feel like a dedicated compliance workflow rather than a generic legal page.

### Header

**ABS & Biodiversity Compliance**

Subtitle:

> Identify biological-resource and associated traditional-knowledge considerations relevant to your product.

### Biological Resource Identification

Display detected resources.

Example:

**Ashwagandha**

Biological resource detected.

Then show:

* Scientific name
* Common name
* Source
* Geographic origin
* Intended use
* Associated traditional knowledge

### ABS Assessment

Create a structured checklist:

**Biological resource identified**

✓

**Traditional knowledge association detected**

⚠

**Source/geographic origin identified**

✓

**Applicable ABS framework reviewed**

⚠

**Further assessment required**

⚠

### Compliance Status

Large status card:

**Review Required**

With a warm orange/rose warning treatment.

### Next Action

**Start ABS Assessment →**

The system should explain which evidence triggered the ABS review.

---

# 8. REGULATORY PATHWAY

This section determines how the product should be treated from a regulatory perspective.

### Header

**Regulatory Pathway**

Subtitle:

> Determine the likely regulatory category and identify product-specific compliance requirements.

### Classification Engine

Show:

**Product Classification**

> Proprietary Ayurvedic Medicine

**Confidence**

> 91%

**Status**

> Likely

### Possible Categories

The system can evaluate:

* Classical Ayurvedic medicine
* Proprietary Ayurvedic medicine
* New / non-classical drug
* Phytopharmaceutical
* Ayurveda-Aahar / nutraceutical
* Cosmetic
* Other applicable category

### Regulatory Assessment

Cards can display:

**Manufacturing Requirements**

**Labeling Requirements**

**Claims / Advertising**

**Licensing Requirements**

**Product Standards**

**Market-Specific Requirements**

### Decision Explanation

A prominent section:

**Why this classification?**

Show the evidence and rules responsible for the classification.

---

# 9. KNOWLEDGE GRAPH

This is one of the most technically impressive sections for the hackathon.

### Header

**Knowledge Graph**

Subtitle:

> Explore relationships between ingredients, traditional knowledge, patents, regulations and legal provisions.

### Graph

Center node:

**Ashwagandha Formulation**

Connected nodes:

* Ashwagandha
* Traditional Knowledge
* Patent A
* Patent B
* Patents Act
* ABS
* AYUSH Regulation

Different node styles represent different entity types.

### Node Categories

**Ingredient**

Botanical/biological icon.

**Patent**

Document icon.

**Law**

Legal/document icon.

**Regulation**

Government/building icon.

**Traditional Knowledge**

Book/knowledge icon.

**Biological Resource**

Leaf/biological icon.

### Relationship Panel

On the right:

**Top Relevant Connections**

Example:

**Similar patent formulation**

82% relevance

**Traditional knowledge reference**

78% relevance

**Patents Act §3(p)**

94% relevance

**Biodiversity / ABS regulation**

89% relevance

### Technical Visualization

Use subtle lines and relationship labels.

Avoid a chaotic "AI graph."

The graph should communicate that AYUR-IP understands **relationships between legal, scientific and traditional-knowledge entities**.

---

# 10. SOURCES

This page is critical because AYUR-IP is an **evidence-backed intelligence platform**.

### Header

**Evidence & Sources**

Subtitle:

> Review the authoritative sources supporting each assessment.

At the top:

**Evidence-backed response**

Use an orange/rose verification badge.

### Source Table

Columns:

* Source Authority
* Document
* Section / Rule
* Jurisdiction
* Effective Date
* Status
* View Source

Example records:

**Patents Act**

Section 3(p)

**Biological Diversity Act**

Relevant provision

**AYUSH regulation**

Relevant rule/provision

### Source Status

Use badges:

**Official**

**Verified**

**Current**

**Historical**

### Evidence Detail

Selecting a source opens:

**Evidence ID**

EVID-001

**Source**

Patents Act

**Provision**

Section 3(p)

**Effective Version**

Current applicable version

**Supporting Evidence**

Display the relevant excerpt or structured evidence.

**Used For**

Patentability / Traditional Knowledge assessment

This is where the platform's **citation-grounded architecture** becomes visible to the user.

---

# 11. REPORTS

The Reports section converts the analysis into a professional deliverable.

### Header

**Reports**

Subtitle:

> Generate structured IP and compliance reports for internal review, filing preparation and expert consultation.

### Report Types

Cards:

**Full Product Assessment**

Includes:

* Product classification
* IP assessment
* Prior art
* Traditional knowledge
* ABS
* Regulatory pathway
* Evidence

**Patentability Report**

Focused on IP and prior art.

**ABS Compliance Report**

Focused on biological resources and benefit-sharing considerations.

**Regulatory Assessment**

Focused on product classification and applicable regulatory pathway.

### Report Status

Show:

* Draft
* Generating
* Completed
* Expert Reviewed

### CTA

**Generate Detailed Report**

---

# 12. HUMAN EXPERT ESCALATION

This is important for making the product credible.

AI should not pretend to replace lawyers, patent professionals or regulatory experts.

### Header

**Human Expert Escalation**

Subtitle:

> Request review from an appropriate IP, regulatory or compliance professional.

### Escalation Categories

**Patent / IP Review**

**ABS / Biodiversity Review**

**Traditional Knowledge Review**

**Regulatory Review**

**Multi-domain Review**

### Case Summary

Before escalation, automatically prepare:

* Product information
* Analysis result
* Detected risks
* Relevant provisions
* Evidence
* Prior-art results
* Questions requiring human review

### CTA

**Submit for Expert Review**

Show status:

**Pending**

**Assigned**

**Under Review**

**Resolved**

---

# 13. TOP NAVIGATION

The top navigation remains persistent.

### Left

AYUR-IP logo

**IP & Compliance Intelligence**

### Center

* Dashboard
* Product Analysis
* Knowledge Base
* Reports

### Right

**Jurisdiction**

INDIA | INTERNATIONAL

**Language**

English | हिंदी | मराठी

**User**

Profile icon + organisation

The India/International toggle should be visually prominent because legal applicability changes by jurisdiction.

---

# 14. KNOWLEDGE BASE

The Knowledge Base is the foundation of the platform.

### Header

**Knowledge Base**

Subtitle:

> Explore the legal, regulatory, scientific and traditional-knowledge corpus powering AYUR-IP.

### Categories

**Indian IP Law**

* Patents
* Trademarks
* GI
* Designs
* Copyright
* Plant Variety Protection

**Biodiversity & ABS**

**AYUSH Regulations**

**Traditional Knowledge**

**International Frameworks**

**Case Law**

**Patent & Registry Records**

### Search

Large search bar:

> Search provisions, patents, regulations, ingredients or traditional knowledge…

### Filters

* Jurisdiction
* Source type
* Date
* Legal domain
* Current / historical
* Authority

---

# 15. ASSESSMENT OVERVIEW

Within Product Analysis, the most important visual section is:

**Assessment Overview**

Use five large cards.

### Product Classification

**Proprietary Ayurvedic Medicine**

Confidence:

**91%**

Status:

**Likely**

### Patentability

**Medium Risk**

Display a horizontal risk indicator.

Explanation:

> Novel extraction process may require prior-art assessment.

### Traditional Knowledge

**Potential Overlap**

Explanation:

> Traditional-use references detected.

### ABS / Biodiversity

**Review Required**

Explanation:

> Biological resource identified.

### Regulatory Pathway

**AYUSH**

Explanation:

> Further product-specific compliance checks required.

The cards should use orange/amber/coral/rose states rather than the original green-heavy palette.

---

# 16. RELEVANT KNOWLEDGE & PRIOR ART

Create a wide horizontal section.

### Left

Knowledge graph centered around:

**Ashwagandha Formulation**

### Right

**Top Relevant Connections**

1. Similar patent formulation — 82%
2. Traditional knowledge reference — 78%
3. Patents Act §3(p) — 94%
4. Biodiversity / ABS regulation — 89%

Each percentage can have a subtle relevance bar.

This section visually communicates that the platform is combining:

**RAG + Knowledge Graph + Prior Art + Legal Rules + AI**

rather than simply generating chatbot answers.

---

# 17. EVIDENCE & SOURCES

Below the graph, display a large structured evidence table.

Each row should contain:

**Authority**

**Document**

**Provision**

**Effective Date**

**Status**

**View Source**

Example:

Patents Act

Section 3(p)

Official / Verified

Biological Diversity Act

Relevant provision

Official / Verified

AYUSH Regulation

Relevant provision

Official / Verified

At the top-right:

**Evidence-backed response**

---

# 18. RECOMMENDED NEXT STEPS

Use a prominent final card.

### Recommended Next Steps

**01 — Conduct detailed prior-art search**

**02 — Verify traditional knowledge overlap**

**03 — Complete applicable ABS assessment**

**04 — Confirm AYUSH regulatory classification**

**05 — Consult an IP facilitator before filing**

Buttons:

**Generate Detailed Report**

Primary orange CTA.

**Escalate to Human Expert**

Secondary outlined CTA.

---

# 19. FOOTER / TRUST AREA

The footer should remain subtle but visible.

Left:

> AI-generated information for decision support. Not legal advice.

Center:

> Knowledge Base Last Updated: 02 Sep 2026

Next:

> Sources: Official / Verified

Right:

> Confidence: High

This reinforces that the system is **decision support**, not an autonomous legal authority.

---

# 20. COLOR SYSTEM — ORANGE TO PINK DIRECTION

The new visual identity should avoid the previous green-dominant Ayurveda aesthetic.

Instead:

### Primary

**Deep Warm Orange**

Used for:

* Main CTA
* Active navigation
* Primary highlights
* Selected controls

### Secondary Orange

**Amber / Golden Orange**

Used for:

* Medium-risk indicators
* Secondary actions
* Important analytical highlights

### Transitional Accent

**Coral**

Used for:

* Knowledge graph highlights
* Relevance indicators
* Interactive states

### Pink/Rose

**Warm Rose**

Used for:

* Warnings
* Review-required states
* Traditional-knowledge overlap
* Compliance attention

### Deep Rose

Used sparingly for:

* High-risk states
* Critical alerts

### Important Rule

Do **not** make the entire UI pink.

The interface should still be approximately:

**70–80% neutral white/off-white**

with:

**10–15% navy/charcoal structural elements**

and:

**5–10% orange/coral/rose accents.**

This keeps the product looking like a serious enterprise legal-tech platform.

---

# 21. FINAL PRODUCT EXPERIENCE

The complete AYUR-IP workflow should feel like:

**Login**

↓

**Dashboard**

↓

**New Product Analysis**

↓

**Product Information**

↓

**AI/NLP Classification**

↓

**Hybrid RAG Retrieval**

↓

**Prior-Art Search**

↓

**Knowledge Graph**

↓

**Rule Engine**

↓

**ABS Assessment**

↓

**Regulatory Classification**

↓

**Evidence Validation**

↓

**AI Explanation**

↓

**Assessment Overview**

↓

**Recommended Actions**

↓

**Detailed Report**

↓

**Human Expert Escalation**

The fundamental design principle is:

> **AYUR-IP is an evidence-first IP and compliance intelligence platform with AI assistance — not an AI chatbot with some legal features.**

The structured assessment, evidence, legal provisions, regulatory classification, IP risks, ABS status and recommended actions should always occupy more visual importance than any AI explanation interface — and no part of the product should be built around a conversation thread, message bubbles, or open-ended chat composer.
