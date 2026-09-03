UPDATE THE EXISTING KNOWLEDGE GRAPH — INTERACTION + EDGE LABEL REFINEMENT

IMPORTANT:
The Knowledge Graph page is already designed and functional.

Do NOT redesign the graph.
Do NOT change the existing nodes, relationships, labels, data, legend, layout structure, or navigation.

Only improve:
1. Edge-label orientation
2. Responsiveness
3. Hover interaction
4. Click interaction
5. Visual clarity

==================================================
1. EDGE / RELATIONSHIP TEXT — PARALLEL TO LINES
==================================================

Currently, the relationship labels between nodes are mostly horizontal.

Change this.

Every relationship/edge label should follow the angle of the connecting line.

For example:

If the relationship line is horizontal:
    documented in →

the text remains horizontal.

If the relationship line slopes upward:
    the label should rotate slightly upward
    so that it is PARALLEL to the line.

If the relationship line slopes downward:
    the label should rotate slightly downward
    so that it remains parallel to the line.

The label should visually sit along the corresponding edge.

IMPORTANT:
- Calculate the angle of each edge dynamically.
- Rotate the label to match the edge angle.
- Keep the text readable.
- Do NOT rotate text upside-down.
- If an edge angle would make the text difficult to read, flip the label orientation so it is still readable from left-to-right.
- Maintain a small gap between the label and the line.
- Prevent labels from touching node circles.

The relationship text should feel physically attached to its connecting line.

Example:

Node ────── documented in ────── Node

Node
  \
   \ contains
    \
     Node

Node
    / governed by
   /
Node

==================================================
2. RESPONSIVE GRAPH BEHAVIOR
==================================================

Make the graph slightly more responsive and interactive.

The graph should respond smoothly to:
- mouse movement
- node hover
- node click
- viewport resizing

Do NOT make the interaction exaggerated.

The graph should still feel like a professional enterprise/legal intelligence visualization.

==================================================
3. NODE HOVER INTERACTION
==================================================

When the user hovers over a node:

Slightly enlarge the node.

Scale:
approximately 1.06–1.10x

Use a smooth animation.

Recommended:
150–220ms
ease-out

Also slightly increase:
- visual prominence
- node opacity
- outer glow/ring
- label clarity

Do NOT dramatically enlarge the node.

Do NOT cause surrounding nodes to jump.

The graph should feel responsive, not playful.

==================================================
4. NODE CLICK INTERACTION
==================================================

When the user clicks a node:

Enlarge it slightly MORE than the hover state.

Scale:
approximately 1.12–1.18x

Use a smooth transition.

The selected node should become visually prominent.

Add a subtle selected-state treatment such as:
- slightly stronger outer ring
- subtle Deep Green emphasis
- slightly stronger shadow/glow
- clearer node label

Do NOT completely change the node's color.

Do NOT open a new page.

Do NOT alter the graph structure.

==================================================
5. HOVER VS CLICK HIERARCHY
==================================================

Interaction hierarchy should be:

NORMAL
    ↓
HOVER
    → approximately 1.06–1.10x

CLICK / SELECTED
    → approximately 1.12–1.18x

The difference should be visible but subtle.

If the mouse leaves the node without clicking:
return smoothly to normal size.

If a node is selected:
keep its selected state until another node is clicked or the selection is cleared.

==================================================
6. EDGE BEHAVIOR DURING INTERACTION
==================================================

When a node is hovered:

Its directly connected edges may become slightly more visible.

Its connected relationship labels may become slightly clearer.

Unrelated edges can become subtly less prominent.

Do NOT completely hide unrelated relationships.

The purpose is to help the user understand:

"What is connected to this entity?"

When a node is clicked:

Highlight the node's direct relationships.

Keep the rest of the graph visible but visually secondary.

==================================================
7. RESPONSIVE LAYOUT
==================================================

Make the Knowledge Graph responsive to different screen sizes.

On desktop:
- preserve the current spacious graph
- nodes should use the available canvas effectively
- maintain readable relationship labels

On smaller screens:
- scale/reposition the graph intelligently
- prevent nodes from being clipped
- prevent relationship labels from overflowing outside the graph
- maintain readable spacing

Do NOT simply shrink everything proportionally until the labels become unreadable.

The graph should adapt its positioning while maintaining relationships.

==================================================
8. LABEL COLLISION / READABILITY
==================================================

Improve label positioning so that:

- relationship labels don't overlap node circles
- relationship labels don't overlap each other unnecessarily
- labels remain close to their corresponding edge
- labels remain readable at different edge angles

If two labels are close together, slightly offset them while keeping each label visually associated with its correct edge.

Do not remove relationship labels.

==================================================
9. MAINTAIN EXISTING COLOR SYSTEM
==================================================

Keep the existing IP-SAKTI color language.

Use:

Deep Green:
#173F2A

Ivory:
#FBF6E9

Warm White:
#FFFDF8

Soft Cream:
#F7EDE5

Coral:
#E96B57

Sage:
#DCE8DF

Maintain the existing semantic colors for:

Product / Formulation
Ingredient
Traditional Knowledge
Patent
Law
Regulation

Do NOT recolor the entire graph.

Deep Green should be used for interaction emphasis and selected states rather than replacing all existing node category colors.

==================================================
10. VISUAL FEEL
==================================================

The Knowledge Graph should feel:

- intelligent
- analytical
- precise
- interactive
- professional
- evidence-oriented
- enterprise-grade

It should NOT feel like:
- a game
- a social network
- a decorative bubble chart
- a generic AI visualization

Keep animations subtle and purposeful.

==================================================
FINAL RESULT
==================================================

The graph should behave like a professional interactive intelligence map.

NORMAL:
Nodes and relationships are calm and readable.

HOVER:
Node subtly enlarges and its connected relationships become slightly more prominent.

CLICK:
Node enlarges a little more and becomes clearly selected, with its connected relationships emphasized.

MOST IMPORTANT VISUAL CHANGE:

Relationship text must follow the direction of its connecting line.

The text should be visually PARALLEL to the edge it describes.

Do not change the existing graph's information architecture or content.
Only improve orientation, responsiveness, interaction and readability.