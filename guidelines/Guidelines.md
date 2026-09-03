# AYUR-IP Design System

## Overview

AYUR-IP is a premium enterprise legal-tech platform for Ayurvedic IP and compliance intelligence. The visual language is data-dense, trustworthy, and professional — 70–80% neutral white/off-white surfaces with 10–15% navy structural elements and 5–10% orange/coral/rose accents.

---

## Color System

| Token | Value | Tailwind Class | Usage |
|---|---|---|---|
| `--color-bg` | `#FAF9F7` | `bg-bg` | Page background |
| `--color-card` | `#FFFFFF` | `bg-card` | Card / panel surfaces |
| `--color-muted` | `#F5F3F0` | `bg-muted` | Subdued surfaces |
| `--color-border` | `#E8E4E0` | `border-border` | Hairline dividers |
| `--color-navy` | `#1A2340` | `bg-navy`, `text-navy` | Sidebar, headings, structural |
| `--color-navy-light` | `#2A3560` | `bg-navy-light` | Sidebar user area |
| `--color-orange` | `#E8621A` | `bg-orange`, `text-orange` | Primary CTA, active nav |
| `--color-orange-light` | `#FEF0E7` | `bg-orange-light` | Orange tint backgrounds |
| `--color-amber` | `#D97706` | `bg-amber`, `text-amber` | Medium risk, secondary actions |
| `--color-amber-light` | `#FFFBEB` | `bg-amber-light` | Amber tint backgrounds |
| `--color-coral` | `#E85D4A` | `bg-coral`, `text-coral` | Knowledge graph, relevance |
| `--color-coral-light` | `#FEF2F0` | `bg-coral-light` | Coral tint backgrounds |
| `--color-rose` | `#E8476A` | `bg-rose`, `text-rose` | Warnings, review-required |
| `--color-rose-light` | `#FFF0F3` | `bg-rose-light` | Rose tint backgrounds |
| `--color-deep-rose` | `#C2185B` | `bg-deep-rose` | Critical alerts (sparingly) |
| `--color-slate` | `#64748B` | `bg-slate`, `text-slate` | Secondary text |

### Color Rule
**Do not make the UI pink.** Orange is the dominant brand accent. Coral and rose appear only in analytical states and warnings.

---

## Typography

| Token | Family | Usage |
|---|---|---|
| `--font-display` (`font-display`) | DM Serif Display, Georgia, serif | Page headings (h1, h2) |
| `--font-body` (`font-body`) | Inter, system-ui, sans-serif | All UI text, labels, body |
| `--font-mono` (`font-mono`) | JetBrains Mono, Courier New, monospace | IDs, confidence %, evidence citations |

Fonts are loaded via Google Fonts `@import` in `src/index.css`.

---

## Spacing & Layout

- **Page padding**: 32px (`p-8`)
- **Card gap**: 20px between major cards, 16px within grids
- **Card padding**: 20–24px
- **Border radius**: 10–12px for cards, 6–8px for inputs and buttons
- **Sidebar**: 240px fixed width, full height, navy background
- **Top nav**: 56px height, white background, `border-b`

---

## Component Patterns

### Cards
White (`#FFFFFF`), 1px `#E8E4E0` border, 12px radius, subtle shadow.
Top-border accent variant: `border-top: 3px solid [accent-color]`.

### Status Badges
Rounded pill (`border-radius: 20px`), 11–12px font, matching bg/text/border triplet.

### Risk Meter
4-segment horizontal bar: Low (green) → Moderate (amber) → High (coral) → Review Required (rose). Active segments filled, inactive in `#F5F3F0`.

### Tables
`border-collapse: collapse`, header in `#FAF9F7` with `#94A3B8` uppercase 11px labels. Rows with `#F5F3F0` bottom dividers. Hover: `#FAF9F7` background.

### Buttons
- **Primary**: `#E8621A` fill, white text, 8–10px radius
- **Secondary**: white fill, `#E8621A` border and text
- **Destructive/Review**: `#E8476A` fill or rose treatment
- **Ghost**: transparent, `#64748B` text, `#E8E4E0` border

---

## Design Principles

1. **Evidence-first**: Assessment cards, data tables, and evidence citations occupy more visual prominence than any AI explanation.
2. **Not a chatbot**: No conversation threads, no message bubbles, no persistent chat history anywhere in the product.
3. **IP Insight Panel**: Structured answer cards responding to a single query — one answer visible at a time, styled identically to other assessment cards.
4. **Knowledge Graph**: SVG-based static graph visualising entity relationships (ingredient → patent → law → regulation → TK). Clean, legible, not chaotic.
5. **Footer**: Every page includes the footer with legal disclaimer and confidence indicator.
