# AYUR-IP — Full Enterprise Application Plan

## Context

Build AYUR-IP from scratch: a multi-page enterprise IP & compliance intelligence platform for Ayurvedic/AYUSH startups. The product spec (`src/imports/AYUR-IP_UI_UX_Product_Description.md`) defines 11 pages, a persistent shell, and a detailed color system. The current codebase is a blank Vite + React 19 + Tailwind CSS v4 shell with no components.

The core design principle: **evidence-first legal-tech platform, not a chatbot.** No conversation threads, no message bubbles anywhere.

---

## Design Decisions

**Aesthetic stance:** Legal-tech enterprise — premium, professional, data-dense. Full commitment to the spec's palette.

**Font pairing (Google Fonts, installed via `@import` in `src/index.css`):**
- `DM Serif Display` — display headings (authoritative, editorial weight)
- `Inter` (400/500/600/700) — body and UI text
- `JetBrains Mono` (400/500) — IDs, confidence %, evidence citations

**Color system (Tailwind v4 `@theme {}` tokens):**
| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#FAF9F7` | Page background |
| `--color-card` | `#FFFFFF` | Cards/panels |
| `--color-muted` | `#F5F3F0` | Subdued surfaces |
| `--color-border` | `#E8E4E0` | Hairline borders |
| `--color-navy` | `#1A2340` | Sidebar, headings, structural |
| `--color-navy-light` | `#2A3560` | Sidebar user area |
| `--color-orange` | `#E8621A` | Primary CTA, active nav, primary accent |
| `--color-orange-light` | `#FEF0E7` | Orange bg tint |
| `--color-amber` | `#D97706` | Medium risk, secondary accents |
| `--color-amber-light` | `#FFFBEB` | Amber bg tint |
| `--color-coral` | `#E85D4A` | Knowledge graph, relevance indicators |
| `--color-coral-light` | `#FEF2F0` | Coral bg tint |
| `--color-rose` | `#E8476A` | Warnings, review-required states |
| `--color-rose-light` | `#FFF0F3` | Rose bg tint |
| `--color-deep-rose` | `#C2185B` | Critical alerts (use sparingly) |
| `--color-slate` | `#64748B` | Secondary text |
| `--font-display` | `'DM Serif Display', Georgia, serif` |
| `--font-body` | `'Inter', system-ui, sans-serif` |
| `--font-mono` | `'JetBrains Mono', monospace` |

**Routing:** `useState<PageId>` in `App.tsx` — no react-router needed.

**Knowledge Graph:** Pure SVG with static coordinates — no D3 or physics library.

---

## File Structure

```
src/
  data/mockData.ts              — All typed interfaces + realistic Indian legal/product data
  components/
    ui/
      StatusBadge.tsx           — Colored pill badge for all status/label variants
      MetricCard.tsx            — Dashboard metric card with trend indicator
      RiskMeter.tsx             — Horizontal 4-segment risk level bar
    layout/
      Sidebar.tsx               — Fixed 240px navy sidebar with 9 nav items
      TopNav.tsx                — Persistent top bar with jurisdiction/language toggles
      PageFooter.tsx            — Disclaimer + KB date + confidence footer
    pages/
      Dashboard.tsx
      NewProductAnalysis.tsx    — Most complex: form → analyzing → result phases
      MyAnalyses.tsx
      IPAssessment.tsx
      ABSCompliance.tsx
      RegulatoryPathway.tsx
      KnowledgeGraph.tsx        — exports default (full page) + KnowledgeGraphMini
      Sources.tsx
      HumanExpertEscalation.tsx
      KnowledgeBase.tsx
      Reports.tsx
  App.tsx                       — Layout shell + renderPage() switch
  index.css                     — Google Fonts @import + @theme tokens + base styles
guidelines/Guidelines.md        — Design system reference
```

---

## Implementation Order

### 1. `src/index.css`
Google Fonts `@import` statements **first** (before `@import 'tailwindcss'`), then `@theme {}` block with all color and font tokens, then base `body` styles.

### 2. `src/data/mockData.ts`
All TypeScript interfaces and typed mock data:
- `PageId` union type (11 page IDs)
- `RiskLevel`, `AnalysisStatus`, `SourceStatus`, `EscalationStatus` types
- `MetricData[]`, `PriorityAlert[]`, `AnalysisRecord[]`, `SourceRecord[]`, `KGNode[]`, `KGEdge[]`
- Realistic Indian data: Patents Act §3(p), BDA 2002, TKDL TK-AW-0234, IN202311045231, etc.

### 3. Reusable UI Components
- `StatusBadge.tsx` — variant map covering all badge types; uses inline style for custom colors
- `MetricCard.tsx` — white card with icon, label, large value, trend arrow
- `RiskMeter.tsx` — 4-segment horizontal bar (Low/Moderate/High/Review Required)

### 4. Layout Shell
- `Sidebar.tsx` — navy bg, DM Serif Display logo, 9 nav items with inline SVG icons, active item has orange left border + orange-light/10 bg, bottom user area
- `TopNav.tsx` — white, h-14, jurisdiction segmented toggle (India/International), language `<select>`, avatar circle
- `PageFooter.tsx` — 3-column flex with disclaimer, KB date, confidence indicator
- `App.tsx` — full layout grid (sidebar + right column), renderPage() switch, top-level jurisdiction/language state

### 5. Pages (in this order)
1. **Dashboard** — 5 metric cards, Priority Actions list, Recent Analyses table, Quick Actions buttons
2. **MyAnalyses** — filterable table with status pills, row-click detail panel
3. **Sources** — evidence table with row-click detail panel; "Evidence-backed response" badge
4. **IPAssessment** — overall RiskMeter, 6 IP category cards (Patent/Trademark/GI/Design/Copyright/Trade Secret)
5. **ABSCompliance** — biological resource display, compliance checklist, status card
6. **RegulatoryPathway** — classification engine result, 6 regulatory assessment cards, "Why?" section
7. **Reports** — 4 report type cards with mock generation progress
8. **HumanExpertEscalation** — 5 category cards, auto case summary, 4-step status tracker
9. **KnowledgeBase** — search bar, category filter pills, accordion-style content sections
10. **KnowledgeGraph** — SVG graph (full page + mini export), right panel with relevance bars
11. **NewProductAnalysis** — 3-phase state machine (form → analyzing → result)

---

## Key Implementation Details

### NewProductAnalysis Phase Machine
```
Phase 'form'     → product info form card
Phase 'analyzing' → pipeline checklist animates (6 steps × 700ms each via useEffect/setTimeout chain)
Phase 'result'   → Assessment Overview (5 cards) + IP Insight Panel + Evidence table + Recommended Next Steps
```
IP Insight Panel: single inline query → one Answer Card at a time (no chat history, no bubbles).

### Knowledge Graph SVG Coordinates (viewBox "0 0 800 560")
| Node | Type | x | y | r |
|---|---|---|---|---|
| center (Ashwagandha Formulation) | product | 400 | 280 | 44 |
| Ashwagandha (Withania somnifera) | ingredient | 210 | 150 | 30 |
| Traditional Knowledge (TKDL) | tk | 595 | 150 | 30 |
| Patent IN202311045231 | patent | 160 | 300 | 28 |
| Patent US10123456B2 | patent | 190 | 420 | 28 |
| Patents Act §3(p) | law | 600 | 380 | 28 |
| Biological Diversity Act | law | 660 | 265 | 28 |
| AYUSH Regulation | regulation | 400 | 460 | 28 |

Draw `<line>` edges first, then `<g>` nodes on top. Mini version exports at 500×320 viewBox with scaled coordinates.

### Tailwind v4 Notes
- `--color-navy` in `@theme {}` auto-generates `bg-navy`, `text-navy`, `border-navy`, etc.
- `--font-display` generates `font-display` class
- `bg-navy/10` uses CSS color-mix() — works for custom tokens

---

## Verification

After implementation, navigate to each of the 11 pages in the preview panel and verify:
1. Sidebar active state highlights correctly per page
2. Dashboard metric cards, priority alerts, and table render with realistic data
3. New Product Analysis: form → analyzing animation → result panel completes correctly
4. Knowledge Graph SVG renders all nodes and edges; mini version appears in analysis result
5. Top nav jurisdiction toggle (India/International) updates visually
6. All status badges render in correct colors
7. No chat UI, message bubbles, or conversation threads appear anywhere
8. Footer appears on every page with disclaimer text
