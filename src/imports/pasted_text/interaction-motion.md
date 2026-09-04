==================================================
INTERACTION & MOTION SYSTEM
==================================================

IMPORTANT:

The application should feel highly interactive and responsive.

Use subtle micro-interactions throughout the entire application.

However:

DASHBOARD:
Can use both subtle entrance animation AND interaction animation.

ALL OTHER PAGES:
Use interaction-based micro-animations only.
Do NOT use decorative page-load animations or animated backgrounds.

The interface should respond naturally to the user's cursor and actions.

==================================================
BUTTON INTERACTIONS
==================================================

ALL BUTTONS MUST FEEL CLICKABLE.

On hover:
- slightly enlarge, approximately 1.02–1.04x
- subtly deepen the primary coral-orange color
- slightly increase shadow/elevation
- transition smoothly in approximately 150–200ms

On press:
- briefly scale down to approximately 0.98x
- then return to normal

Primary buttons may have a very subtle upward movement of 1–2px on hover.

Do NOT make buttons dramatically grow.

Do NOT use bounce animations.

Example:

Analyse Product
→ hover → slightly larger + deeper coral-orange + subtle elevation

==================================================
TEXT HOVER INTERACTIONS
==================================================

Interactive text should visually respond when the cursor moves over it.

For clickable navigation/text links:

Normal:
warm charcoal text

Hover:
- transition toward #E9684F
- slightly stronger font weight
- optional subtle underline
- underline should animate from left to right

For links containing an arrow:

View Evidence →

On hover:

View Evidence → 
with the arrow moving approximately 2–4px to the right.

Do NOT animate ordinary body text.

Only interactive text should react.

==================================================
NAVIGATION INTERACTION
==================================================

Navigation items should feel responsive.

Hover:
- subtle warm-peach background
- text shifts toward primary coral-orange
- smooth 150–200ms transition

Active:
- warm peach background
- coral-orange accent
- subtle underline/accent indicator

The active indicator can smoothly move when changing navigation items.

==================================================
CARDS
==================================================

Only cards that are interactive should animate.

Interactive card hover:

- translate upward 1–2px
- slightly increase elevation
- border becomes slightly more visible
- subtle warm accent emphasis

Transition:
150–220ms.

Static information cards remain completely still.

Do NOT make every card float.

==================================================
TABLE INTERACTIONS
==================================================

Tables should feel highly usable.

On row hover:

- subtle warm-peach background
- smooth transition
- action controls become slightly more visible
- clickable rows may show a small arrow or affordance

When clicking a row:

Open the relevant detail page/panel.

Do NOT animate every table row continuously.

==================================================
INPUTS & FORMS
==================================================

On focus:

- border transitions to #E9684F
- subtle warm focus ring
- label can transition slightly toward the accent

Focus transition:
150ms.

Inputs should never use the browser's default blue focus state.

For search fields:

Show a subtle clear/search interaction when appropriate.

==================================================
TABS
==================================================

Tabs should have an animated active indicator.

When changing tabs:

- active underline smoothly moves to the selected tab
- text transitions toward the primary accent

Keep the movement subtle.

==================================================
DROPDOWNS / SELECTS
==================================================

Dropdowns should open with a short:

fade + 2–4px vertical movement.

Selected options should transition subtly.

Do not use large menus flying across the screen.

==================================================
STATUS / RISK INDICATORS
==================================================

Status indicators should NOT constantly pulse.

When a status first changes:

allow a very subtle highlight transition.

Example:

Moderate
→ Review Required

The status color can transition smoothly.

No continuous flashing or pulsing.

==================================================
TOOLTIPS
==================================================

Where an unfamiliar icon or control exists:

show a small tooltip on hover.

Tooltip:

- warm dark text
- cream/peach surface
- warm border
- subtle fade-in
- approximately 150ms

Use tooltips sparingly.

==================================================
ICONS
==================================================

Interactive icons should respond to hover.

Examples:

Search
Filter
Download
External Link
Settings
Notifications

On hover:

- icon shifts toward #E9684F
- optionally scale very slightly to 1.05x
- subtle transition

Do NOT animate decorative icons.

==================================================
MODALS / PANELS
==================================================

Functional overlays can use:

fade + slight scale/vertical movement.

Keep the transition approximately 200–250ms.

Panels should feel like they are entering the workspace naturally.

==================================================
DASHBOARD — ADDITIONAL MOTION
==================================================

The Dashboard is the ONLY page allowed to have meaningful entrance animation.

On Dashboard load:

1. KPI values gently fade/slide into position.

2. Priority Actions appear with a very short stagger.

3. Main intelligence/chart area reveals subtly.

4. Recent Analyses appears as one section.

5. Charts may animate once when rendered.

Do NOT continuously animate dashboard metrics.

Do NOT make the dashboard flashy.

==================================================
NO DECORATIVE MOTION
==================================================

Do NOT use:

- floating objects
- animated backgrounds
- animated gradients
- parallax
- glowing borders
- neon effects
- bouncing elements
- excessive scaling
- continuous pulsing
- rotating decorative objects
- AI sparkle animations
- random particle effects

Motion must always communicate:

INTERACTION
STATE
FEEDBACK
HIERARCHY

==================================================
MOTION HIERARCHY
==================================================

Use these approximate timings:

Micro interaction:
120–180ms

Button hover:
150–200ms

Card/table hover:
150–220ms

Dropdown:
180–220ms

Modal/panel:
200–250ms

Dashboard entrance:
250–400ms

Use smooth ease-out transitions.

Keep movement subtle.

The UI should feel responsive when the user moves the mouse across it, but it should never feel like an animated showcase website.

==================================================
FINAL PRINCIPLE
==================================================

The user should constantly receive subtle visual feedback when interacting with the application:

"I hovered over it → it responded."

"I clicked it → it responded."

"I focused the field → it responded."

"I selected something → it responded."

"I opened something → it transitioned."

But:

"I am simply looking at the page → the page remains calm."

Dashboard:
MORE ALIVE.

Other pages:
INTERACTIVE BUT CALM.

Overall:
PREMIUM, RESPONSIVE, PROFESSIONAL.