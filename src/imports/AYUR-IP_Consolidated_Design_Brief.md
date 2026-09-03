# AYUR-IP — Consolidated Design Brief (Gap-Filled & Reconciled)

This document merges `Redesign_the_existing_AYUR-IP_enter.md` (the detailed, final design spec) with `goal.md` (project context) and the "Current state" notes pasted in chat. Where sources disagreed, the most recent/most detailed source wins — those decisions are called out explicitly in **Section 0**.

---

## 0. Reconciling Conflicts (older notes vs. final direction)

The "Current state" notes you pasted describe an **earlier** stage of the project. Three points in it are now superseded by later decisions in `goal.md` and the redesign prompt. Flagging these so nothing outdated leaks back in:

| Old note said | Final decision (keep this) |
|---|---|
| "Professional **government-tech** + legal-tech appearance" | Explicitly rejected — must NOT feel like a government portal |
| "**Material**/enterprise SaaS styling" | Explicitly rejected — no Material Design, no generic SaaS grid |
| "**Ask AYUR-IP**" as the assistant screen name | Renamed **AYUR-IP Intelligence** — and must not look like a chatbot at all (no message bubbles, no avatar) |
| "New Assessment" screen name | Renamed **Product Analysis** |
| "Assessment Results" screen | Folded into **Assessment Detail / Evidence-backed Result** (final screen #10) |
| Dark UI considered | Settled: light UI, surfaces ~1–2 tones darker than a washed-out default |

Everything below reflects the **final, current** direction only.

---

## 1. Product Identity

AYUR-IP is an Indian Ayurvedic intellectual-property, biodiversity, traditional-knowledge (TK) and regulatory assessment platform for IP managers, researchers, and legal/regulatory professionals.

**Feels like:** Indian research publication + legal intelligence workbench + modern enterprise application.

**Must NOT feel like:** generic SaaS, fintech, healthcare startup, government portal, generic AI chatbot, beauty/wellness product, generic "AI dashboard," cyber-security dashboard, futuristic neon interface.

**Communicates:** precision, evidence, legal authority, research depth, Indian context, professional credibility.

### Core differentiator (why this isn't "just an LLM wrapper")
Most hackathon AI projects: `USER → CHATBOT → AI ANSWER`

AYUR-IP:
```
PRODUCT → CLASSIFICATION → LEGAL FRAMEWORKS → KNOWLEDGE GRAPH →
EVIDENCE → RISK ANALYSIS → AI REASONING → RECOMMENDATION → REPORT
```
The Knowledge Graph, Evidence Explorer, Legal Library and structured Intelligence workspace exist specifically to make this pipeline *visible* — the AI is one layer inside a larger system, not the whole product.

---

## 2. Visual Direction & Color System

Progression: **Warm Cream → Peach → Orange → Coral → Rose-Red**

- Orange = primary brand/action color
- Coral = attention / review
- Rose-red = significant concern / TK overlap
- Deep red = critical escalation only

**Never:** navy, blue, cyan, purple, blue-gray, dark wine/burgundy as a dominant color, neon gradients.

### Tokens
| Token | Hex | Use |
|---|---|---|
| Page | `#FCEBE3` | Page background |
| Secondary surface | `#F7DDD5` | Section backgrounds |
| Card | `#FDF2EC` | Card/content surfaces |
| Peach | `#F3CEC4` | Active state bg, accents |
| Border | `#DFC0B7` | Dividers, borders |
| Primary orange | `#E95F26` | Primary actions, active states |
| Coral | `#DF4F58` | Attention/review |
| Rose-red | `#BD385C` | Significant concern / TK overlap |
| Critical red | `#922D3E` | Critical escalation only |
| Primary text | `#30211F` | Body/headings |
| Muted text | warm brown-gray derived from `#30211F` | Secondary text |
| Positive | muted green | Compliant/positive states only |

**Balance:** ~70% warm light surfaces, 15% peach, 10% orange, 5% coral/rose-red. Light surfaces should read ~1–2 tones darker/richer than a washed-out default — keep contrast clear between page, section, card, and input surfaces without going muddy.

---

## 3. Typography

Exactly three typefaces — never more, never mixed randomly:

| Font | Use |
|---|---|
| **DM Serif Display** | Major page headings and editorial section intros only (e.g. "Analyse Your Ayurvedic Product," "Knowledge Graph," "Evidence Explorer," "AYUR-IP Intelligence") |
| **Manrope** | Navigation, labels, body text, buttons, forms, tables, controls, status labels, descriptions |
| **IBM Plex Mono** | Analysis IDs, Evidence IDs, Patent IDs, legal reference numbers, timestamps, regulatory references (e.g. `AN-2026-0891`) |

No serif everywhere, no decorative/handwritten fonts.

---

## 4. Navigation

**Horizontal top navigation only** — no sidebar, no vertical rail, ever.

- **Left:** AYUR-IP wordmark
- **Center/nav:** Dashboard · Product Analysis · Assessments · Evidence · Knowledge Graph · Legal Library · Reports · Intelligence
- **Right:** Search · Jurisdiction · Notifications · Profile
- **Active state:** orange/coral accent, subtle peach background, stronger Manrope weight, small underline/accent indicator

Keep it compact so content stays the visual focus.

---

## 5. Global UI Language

Avoid the repetitive card/card/card/card pattern. Combine: editorial sections, data tables, open content areas, compact cards (each with a reason to exist), evidence rows, thin warm dividers, structured information blocks, research workspaces, graphs, document-style layouts.

- **Radius:** structural/data components 4–6px · buttons/status/true cards 8–10px
- **Shadows:** subtle warm shadows only
- **Never:** glassmorphism, backdrop blur, glow, neon, floating glass cards, excessive gradients, giant rounded containers

---

## 6. Button System

| Type | Style |
|---|---|
| Primary | Orange fill + white text |
| Secondary | Warm card + orange/coral border + dark text |
| Tertiary | Orange/coral text, optional arrow |
| Attention | Coral fill + white text |
| Significant concern | Rose-red |
| Critical | Deep red |
| Disabled | Muted warm beige |

Hover shifts naturally within the warm spectrum: orange → deeper orange/coral, coral → rose-red. Never blue or purple.

---

## 7. Status & Risk Semantics

- **Orange** — active / important / in progress
- **Amber-orange** — moderate risk
- **Coral** — review / warning
- **Rose-red** — significant concern / TK overlap
- **Deep red** — critical / escalation
- **Muted green** — compliant / positive

Don't apply status pills to every piece of metadata — reserve them for meaningful states.

---

## 8. Charts & Iconography

**Charts:** orange → coral → rose → rose-red progression; warm cream/peach backgrounds; warm-toned gridlines. Use for risk distribution, evidence confidence, framework contribution, assessment trends, relationship strength. No decorative charts.

**Icons:** restrained line icons, 1.5–2px stroke, in warm charcoal/orange/coral/rose-red. No 3D, gradient, AI-sparkle, decorative botanical, or excessive iconography.

---

## 9. Indian Identity

Comes from color, typography, subject matter, legal/regulatory content, Ayurvedic terminology, research structure, and biodiversity/TK relationships — **not** decoration. No lotus illustrations, mandalas, decorative Sanskrit, stock herb imagery, or ornamental patterns. It should feel Indian because the *product* is Indian.

---

## 10. Layout Rhythm

`Heading → Explanatory text → Open content → Structured data → Divider → Highlighted intelligence → Action`

Dense but elegant. Avoid excessive whitespace, giant hero sections, endless cards, oversized widgets, generic SaaS grids.

---

## 11. Complete Screen Set (final — 10 screens)

1. **Dashboard**
2. **Product Analysis**
3. **My Analyses / Assessments**
4. **IP Assessment**
5. **Evidence Explorer**
6. **Knowledge Graph**
7. **Legal Library**
8. **Reports**
9. **AYUR-IP Intelligence**
10. **Assessment Detail / Evidence-backed Result**

All screens share one design system — do not redesign each page independently. Existing Figma screens (Dashboard, Product Analysis, My Analyses, IP Assessment) are the foundation to **refine and extend**, not replace.

---

### 11.1 Dashboard
Header: **"AYUR-IP Intelligence"**
Subtext: "Monitor intellectual-property, biodiversity and traditional-knowledge assessments."

- **Overview stats:** Total Assessments · High-Risk Products · Pending Reviews · Evidence Requiring Verification
- **Priority Actions** (examples: TK overlap detected — review TK references · ABS assessment required — biological resource relationship identified · Patentability review — prior-art similarity detected · Regulatory classification — confidence requires verification)
- **Recent Analyses** table — columns: Product, Analysis ID, Classification, Risk, Evidence, Last Updated, Status
- **Intelligence snapshot:** Patent Conflicts · TK Overlaps · Biological Resources · Regulatory Issues

Should feel like an IP manager's daily workbench.

### 11.2 Product Analysis
Title: **"Analyse Your Ayurvedic Product"**

Fields: Product/Formulation Name · Category · Ingredients · Description · Source of Formulation · Target Market

**Source & Provenance** group: Traditional Knowledge Source · Biological Resource Origin · Documentation Status

**Jurisdiction:** India / International

Primary action: **"Analyse Product"** — the UI should clearly signal this launches a multi-layer legal/IP assessment, not a generic AI answer.

### 11.3 My Analyses / Assessments
Analysis table with risk/status information and analysis records — history of prior analyses.

### 11.4 IP Assessment
Header: **"IP Assessment"**, showing **Overall IP Risk** (e.g. Moderate) with a visual breakdown:

- **Patent** — patentability risk, prior-art similarity, novelty concerns, inventive-step concerns, relevant patents
- **Trademark** — similar marks, classification, conflict indicators
- **Geographical Indication** — geographic relevance, existing GI relationships, origin concerns

Use orange → coral → rose-red to communicate increasing concern.

### 11.5 Evidence Explorer
Title: **"Evidence Explorer"** · Subtitle: "Trace every assessment finding back to its underlying source."

Filters: Framework · Evidence Type · Confidence · Risk · Jurisdiction

Table columns: Evidence ID (mono) · Source · Framework · Section · Confidence · Finding · Status

Example rows: `EVID-001` Patent record / Patent / Section 3 / 94% / Prior-art similarity · `EVID-014` TK source / TK / — / 89% / TK overlap · `EVID-021` Biodiversity source / ABS / Rule 4 / 91% / Biological-resource relationship

Should feel like a legal research database, not a citation list.

### 11.6 Knowledge Graph
Center node example: **Ashwagandha Stress Relief Capsule**, connected to: Ashwagandha · Biological Resource · Traditional Knowledge · Patent · Prior Art · Patent Act · Biodiversity Act · ABS Rules · AYUSH Regulations · Research Papers

Relationship labels: Contains · Derived From · References · Protected By · Applies To · Conflicts With · Requires

Warm palette only — no cyber-blue/Neo4j-style graph styling.

**Graph Insights panel:** "4 significant relationships detected" (2 potential TK overlaps, 1 prior-art relationship, 1 biodiversity dependency) · Most Influential Framework: Biodiversity Act · Relationship Confidence: 91% · Risk Contribution: +18

Should visually communicate GNN/relationship-analysis capability.

### 11.7 Legal Library
Categories: Patent Law · Biodiversity · Traditional Knowledge · AYUSH · Regulatory Frameworks

Document/research rows (not repetitive cards), each showing: Source · Jurisdiction · Effective Date · Last Verified · Reference ID

Examples: Patents Act / India / Current / Verified / `PAT-ACT-1970` · Biodiversity Act / India / Current / Verified / `BIO-ACT-2002` · ABS Rules / India / Current / Verified / `ABS-RULE-2014`

### 11.8 AYUR-IP Intelligence
**Not a chatbot** — no message bubbles, no avatar.

Title: **"AYUR-IP Intelligence"** · Subtitle: "Ask a question. Trace the reasoning. Review the evidence."

Example question: "Can my Ashwagandha formulation be patented?"

Main analysis structured as: **Finding → Applicable Framework → Evidence → Reasoning → Recommendation**, headed by a status like "Patentability Assessment — Moderate Concern."

**Right panel:** Evidence Used (`EVID-001`, `EVID-014`, `EVID-021`) · Applicable Law (Patent Act, Biodiversity Act, ABS Rules) · Confidence (91%) · Recommendation text.

Reads as an evidence-backed legal research workspace.

### 11.9 Reports
Example: "Assessment Report — Ashwagandha Stress Relief Capsule — `AN-2026-0891`"

Sections: Executive Summary · Product Classification · IP Assessment · Biodiversity Assessment · Traditional Knowledge Assessment · Regulatory Framework · Evidence & Citations · Recommendations · Risk Summary

Actions: Download Report · Export Evidence · Share Assessment

Should resemble a professional research/legal document.

### 11.10 Assessment Detail / Evidence-backed Result
The drill-down view reached from a row in **My Analyses / Assessments** or **Recent Analyses** — combines classification, applicable frameworks, findings, risk score, evidence, and recommendations for a single analysis in one evidence-backed detail page (distinct from the Reports export, though it shares structure).

---

## 12. Global Quality Bar

Every screen must look like part of one product: consistent spacing, typography, radius, borders, warm surfaces, orange → coral → rose-red semantics, navigation, button states, evidence-ID formatting, and status language. Do not redesign pages independently. Prioritize product intelligence over decorative UI — this should read as a mature enterprise legal-intelligence platform deliberately designed by a product team, not an AI-generated SaaS template.

---

## Appendix: Gaps found & filled in this pass

- Added **Category** and **Jurisdiction (India/International)** fields to Product Analysis, and the **Source & Provenance** sub-group — present in the redesign spec but not itemized in `goal.md`'s field list.
- Added **Assessment Detail / Evidence-backed Result** as an explicit 10th screen (was implied but not named as distinct from Reports in `goal.md`).
- Folded in concrete example content (evidence IDs, graph insights numbers, legal library entries, report ID format) from the redesign spec, which `goal.md` described only structurally.
- Carried forward the **button system**, **radius rules**, **color balance percentages**, and **layout rhythm** — all present in the redesign spec but absent from `goal.md`.
- Resolved the three naming/style conflicts from the older "Current state" notes (see Section 0) in favor of the final direction.
