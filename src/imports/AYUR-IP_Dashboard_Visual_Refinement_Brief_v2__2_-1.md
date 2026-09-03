# AYUR-IP Dashboard — Visual Refinement Brief (v2)

Refine the existing AYUR-IP dashboard visually. Do NOT redesign the information architecture, remove functionality, invent new sections, or change the existing content.

The goal is to make the interface feel like a deliberately designed, production-grade Indian enterprise legal-tech/compliance product — human, warm, and considered, not like a generated AI SaaS template.

IMPORTANT:
Keep the existing layout and components, but improve typography, visual hierarchy, density, spacing, color usage, surface character, and component character.

---

## 1. STRONGER ORANGE BRAND IDENTITY (WITH A ROSE UNDERTONE)

Make warm orange significantly more present throughout the interface.

AYUR-IP's primary brand accent is warm orange, not green.

Use a deep warm orange for:
- Primary CTAs
- Active navigation
- Selected tabs
- Important interactive controls
- Key highlights
- Important icons
- Progress/relevance indicators
- Selected states
- Small emphasis elements

Use amber/orange for medium-risk and attention states.

Use coral/rose for warnings, traditional-knowledge overlap, review-required states, and critical states — **and** let a warm rose undertone appear in a few non-alert, decorative touches so the palette reads as orange-with-a-pink-warmth rather than orange-with-red-alerts-bolted-on:
- Active-nav underline/indicator can carry a faint rose warmth at its edge, not pure flat orange
- Hover states on interactive elements
- The secondary color in any chart/data-viz (the "Quick Stats" donut, relevance bars, etc.)
- Selected-row or selected-tab background tint

Do NOT turn the whole UI orange. Do NOT let rose creep into positive/compliant states — those stay a restrained semantic green.
Do NOT use a generic orange-to-purple AI gradient.
Do NOT use excessive pink.

The visual impression should be:
**NAVY + WARM WHITE + ORANGE, WARMED BY ROSE**

with coral/rose appearing both semantically (warnings) and as a quiet brand warmth (accents, hovers, secondary chart color).

The current UI feels too white, too cool, and slightly green-heavy. Correct that.

---

## 2. INCREASE TYPOGRAPHY SIZE AND INFORMATION DENSITY

Increase text sizes moderately, especially:
- Page titles
- Section headings
- Important metric values
- Product names
- Status labels
- Primary navigation labels
- Table headers where appropriate

Do NOT simply increase every font size.

Create a stronger hierarchy:

Page title: large and prominent
Section headings: clearly visible
Important values: large and bold
Supporting text: smaller and quieter
Metadata: compact

The dashboard currently has too much unused visual space around some content. Reduce unnecessary padding and increase the amount of meaningful information visible within the same viewport.

Do NOT fill empty space with decorative elements.

Instead, use the recovered space to make existing information more readable and prominent.

---

## 3. MAKE THE DASHBOARD FEEL LESS "AI GENERATED" — NO BLUR, NO GLASS, EVER

This is a hard rule, not a preference: **no blur, no frosted/translucent panels, no backdrop-blur, no glass surfaces, no glow, and no soft gradient overlays anywhere in the interface.** Every surface should be opaque, matte, and flat-lit — the kind of material a printed compliance report or a well-made stationery product would have, not a digital glass panel.

Also do NOT add:
- floating blobs
- excessive glassmorphism
- unnecessary animations
- decorative AI patterns
- excessive pill-shaped elements
- uniform, identical rounded cards everywhere
- purple AI aesthetics
- random charts
- decorative illustrations

The interface should communicate PRODUCT and DOMAIN KNOWLEDGE rather than "AI."

AYUR-IP is an IP, regulatory and compliance intelligence platform.

The strongest visual elements should therefore be:
- compliance status
- evidence
- regulatory pathway
- IP risk
- product status
- recommended actions
- source authority
- expert review

AI should remain secondary.

---

## 4. HUMAN & ORGANIC SURFACE CHARACTER

This is what separates a "designed" product from a generated one — achieved through consistent, deliberate craftsmanship, never through randomness, asymmetry, or visible imperfection. Every property below is a fixed system decision applied uniformly, not a one-off flourish. Apply these consistently:

- **Warm-tinted shadows**, not flat neutral gray — a very subtle brown/amber cast, like light falling on paper, never a cool blue-gray drop shadow.
- **Restrained radius system, not one universal radius** — use slightly sharper radii for structural/data-heavy components such as tables and metric containers, and softer radii for interactive controls and status elements. Variation should be subtle and systematic, not random.
- **Matte, not glossy** surfaces — avoid any sheen, gradient fill, or glassy highlight on cards, buttons, or icons.
- **Editorial typographic confidence** — page titles and key metric numbers can carry slightly more character (tighter tracking, a touch more weight contrast) than default UI-kit type, closer to a premium annual report or legal gazette than a generic dashboard template.
- **Restrained, intentional iconography** — avoid generic filled-circle AI icons; icons should feel like they belong to a compliance/legal product (documents, seals, ledgers, checklists) rather than a generic tech icon set.
- **Subtle material texture is optional but welcome** — if used, an extremely faint paper-like grain or warmth in large background areas (barely perceptible, never decorative or attention-grabbing) reinforces the "printed document" feel over "screen glass" feel.

The aim is warmth and craftsmanship, not literal organic shapes — nothing should look hand-drawn, wobbly, asymmetric, or "imperfect on purpose." It should look like a human designer made a small number of deliberate, defensible decisions and applied them with total consistency — see Section 15 for how to judge every choice against this.

---

## 5. REDUCE THE "EVERYTHING IS A CARD" LOOK

Keep cards where they provide meaningful grouping.

However, not every piece of information needs to look like an isolated floating card.

Use:
- subtle section dividers
- tables
- structured rows
- stronger typography
- compact information groups
- restrained borders

Some areas should visually connect instead of being surrounded by individual rounded rectangles.

Cards should feel like functional containers, not decoration.

---

## 6. IMPROVE THE METRIC CARDS

Keep the five existing metrics:

Active Products
IP Assets
Expiring Soon
Compliance Reviews
Expert Escalations

Make the metric number the strongest element. Increase the metric number size. Reduce excessive internal padding. Make the metric label smaller but clearer. Make trend information compact. Use orange (warmed by rose per Section 1) as the primary visual accent rather than green.

Example visual hierarchy:

```
ACTIVE PRODUCTS
12
↑ 14%
vs last month
```

The number should immediately attract attention.

Do not make all five cards visually identical in importance. Allow the most important metric/action to have slightly stronger visual emphasis.

---

## 7. IMPROVE PRIORITY ACTIONS

Priority Actions is one of the most important sections. Make it visually stronger than the generic metric cards.

Use warm orange/peach as the primary attention background. Use orange, amber, coral and rose according to severity.

Make alert title, product, reason, and recommended action easy to scan horizontally.

The "Open" action should look like a real enterprise action control rather than a generic outlined button.

---

## 8. MAKE THE TABLE MORE HUMAN AND PRODUCT-LIKE

Keep the Recent Analyses table. Increase row readability slightly. Use stronger typography for product names. Reduce excessive empty cell space. Use subtle separators rather than making every row feel like an independent card.

Status should be immediately scannable. Confidence should have a restrained visual indicator. Actions should remain compact.

The table should feel like something an IP manager could actually use every day.

---

## 9. IMPROVE SIDEBAR CHARACTER

Keep the dark navy sidebar. Make the orange active state more distinctive: orange vertical indicator, subtle warm-orange background, orange icon, strong white label.

Do not make the entire sidebar glow orange.

Increase navigation text slightly so it feels confident and readable. Keep the sidebar dense and professional.

The sidebar should feel like enterprise software, not a template.

---

## 10. TYPOGRAPHY

Use a confident modern sans-serif for the application UI. Increase heading weight and size. Avoid excessive use of tiny text. Avoid making everything bold.

Create clear contrast between: title, section heading, body, metadata, status, numerical values.

The UI should remain readable at normal desktop viewing distance.

---

## 11. SPACING

Do NOT simply add more whitespace. The existing design already has sufficient whitespace. Instead, use intentional spacing.

Reduce: oversized card padding, unnecessary gaps between related elements, excessive vertical whitespace.

Increase: readability between hierarchy levels, separation between unrelated sections, visual prominence of important information.

The goal is higher INFORMATION DENSITY, not a crowded UI.

---

## 12. MAKE IT FEEL SPECIFIC TO AYUR-IP

Preserve and emphasize domain-specific terminology such as:

Patent approaching expiry, ABS assessment required, Traditional knowledge overlap, Regulatory classification review, Prior-art assessment, Biological resource detected, Evidence-grounded AI, Biological Diversity Act, Patents Act, AYUSH, Human Expert Escalation.

These details are what make the interface feel like a real product instead of a generic AI dashboard. Do not replace domain terminology with generic SaaS terminology.

---

## 13. VISUAL CHARACTER

The final result should feel: premium, serious, Indian, enterprise, legal-tech, regulatory, evidence-driven, warm, human, organic, confident, practical.

It should NOT feel: futuristic AI, cyberpunk, generic SaaS, startup landing page, chatbot, glassy/blurred, overly minimalist, overly colorful, overly rounded.

---

## 14. FINAL COLOR BALANCE

Target approximately:

**70–80%** warm white / neutral
**10–15%** navy / charcoal
**5–10%** orange / amber / coral / rose

Within that 5–10% accent budget, orange remains dominant (roughly two-thirds of the accent presence), with rose/coral making up the rest — present both as semantic warning color and as the brand's quiet pink warmth (hovers, active-state edges, secondary chart color).

Make the orange visually prominent through strategic placement rather than increasing its raw area. Orange should be the color users associate with AYUR-IP; rose should be the color that makes it feel warm rather than corporate-cold.

Do not introduce green as a major brand color. Green may only appear where it has semantic meaning, such as a compliant/positive status.

Do not change the existing content or information architecture.

This is a visual refinement pass, not a redesign.

---

## 15. FINAL DESIGN JUDGMENT

Do not make the interface intentionally imperfect or quirky to make it look human.

"Human-designed" means intentional hierarchy, product-specific decisions, restrained visual language, and meaningful variation — NOT random asymmetry or visual imperfections.

Every visual decision should have a functional or brand reason.

Prioritize, in order:

1. Information hierarchy
2. Readability
3. Enterprise usability
4. AYUR-IP brand identity
5. Domain-specific visual language
6. Visual warmth
7. A restrained amount of visual personality

If a choice makes the interface look more "AI futuristic," remove it.

If a choice makes it look more like a generic SaaS template, reconsider it.

If a choice makes the product feel like a serious IP/compliance workspace designed specifically for AYUR-IP, prefer it.

Use this section as the tiebreaker for every other section in this brief: when a rule elsewhere seems to allow for a decorative or "organic" flourish, this priority order overrides it. Warmth (item 6) and personality (item 7) are the last two priorities, not the first two — they should only ever be the byproduct of getting 1–5 right, never pursued at their expense.
