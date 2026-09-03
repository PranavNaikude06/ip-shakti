"""
Knowledge graph layer.

In-process NetworkX rather than a graph database: the per-analysis graph has
tens of nodes, reasoning must be deterministic during a live demo, and the
algorithms needed (personalised PageRank, path extraction) are natively
available. The construction is behind this module's API, so a Neo4j adapter can
replace the storage without touching callers.

Honesty constraint: every node and edge is derived from something real --
the intake, the lexicon, a triggered rule, or an anchored provision. Nothing
is invented to make the picture denser.

Graph signals produced:
- **Personalised PageRank** seeded at the product and its ingredients, ranking
  legal provisions by structural proximity. Deterministic and explainable:
  the ranking can be read off the edge structure.
- **Framework paths**: the chain Product -> Ingredient -> BiologicalResource ->
  TK -> Provision that the demo renders.
"""

from __future__ import annotations

import networkx as nx

from app.models.core import (
    Evidence,
    ExtractionResult,
    Framework,
    GraphEdge,
    GraphNode,
    GraphPayload,
    GraphSignal,
    RuleOutcome,
)

_DOC_SHORT = {
    "PAT-ACT-1970": "Patents Act",
    "BDA-ACT-2002": "Biodiversity Act",
    "DCA-ACT-1940": "Drugs & Cosmetics Act",
    "TM-ACT-1999": "Trade Marks Act",
    "CR-ACT-1957": "Copyright Act",
    "DES-ACT-2000": "Designs Act",
}

_FRAMEWORK_LABELS = {
    Framework.PATENT: "Patent Law",
    Framework.TRADITIONAL_KNOWLEDGE: "Traditional Knowledge",
    Framework.BIODIVERSITY_ABS: "Biodiversity / ABS",
    Framework.REGULATORY: "AYUSH Regulatory",
    Framework.TRADEMARK: "Trade Mark Law",
    Framework.COPYRIGHT: "Copyright Law",
    Framework.DESIGN: "Design Law",
    Framework.INTERNATIONAL: "International IP",
}


def build_analysis_graph(
    product_name: str,
    entities: ExtractionResult,
    outcomes: list[RuleOutcome],
    evidence_registry: dict[str, Evidence],
) -> nx.DiGraph:
    g = nx.DiGraph()
    product_id = "product"
    g.add_node(product_id, label=product_name, type="PRODUCT")

    # Product composition, from extraction.
    for ing in entities.ingredients:
        ing_id = f"ing:{(ing.normalized or ing.text).lower()}"
        g.add_node(ing_id, label=ing.normalized or ing.text, type="INGREDIENT")
        g.add_edge(product_id, ing_id, type="CONTAINS")
        if ing.botanical_name:
            bio_id = f"bio:{ing.botanical_name.lower()}"
            g.add_node(bio_id, label=ing.botanical_name, type="BIOLOGICAL_RESOURCE")
            g.add_edge(ing_id, bio_id, type="DERIVED_FROM")

    # Traditional-knowledge overlap: only for lexicon-confirmed traditional herbs.
    for ing in entities.ingredients:
        if ing.botanical_name:
            tk_id = f"tk:{(ing.normalized or ing.text).lower()}"
            g.add_node(tk_id, label=f"Traditional use of {ing.normalized or ing.text}", type="TRADITIONAL_KNOWLEDGE")
            g.add_edge(f"ing:{(ing.normalized or ing.text).lower()}", tk_id, type="HAS_TK_OVERLAP")

    for proc in entities.processes:
        proc_id = f"proc:{(proc.normalized or proc.text).lower()}"
        g.add_node(proc_id, label=proc.normalized or proc.text, type="PROCESS",
                   novelty=(proc.metadata or {}).get("novelty"))
        g.add_edge(product_id, proc_id, type="USES_PROCESS")

    for claim in entities.therapeutic_claims:
        claim_id = f"claim:{(claim.normalized or claim.text).lower()}"
        g.add_node(claim_id, label=claim.normalized or claim.text, type="CLAIM")
        g.add_edge(product_id, claim_id, type="HAS_CLAIM")

    for market in entities.target_markets:
        m_id = f"juris:{(market.normalized or market.text).lower()}"
        g.add_node(m_id, label=market.normalized or market.text, type="JURISDICTION")
        g.add_edge(product_id, m_id, type="TARGETS")

    # Legal layer, from triggered rules and their anchored evidence.
    for outcome in outcomes:
        if not outcome.triggered:
            continue
        fw_id = f"fw:{outcome.framework.value}"
        g.add_node(fw_id, label=_FRAMEWORK_LABELS[outcome.framework], type="FRAMEWORK")
        rule_id = f"rule:{outcome.rule_id}"
        g.add_node(rule_id, label=outcome.title, type="RULE")
        g.add_edge(rule_id, fw_id, type="BELONGS_TO")
        g.add_edge(product_id, rule_id, type="TRIGGERS")

        for eid in outcome.evidence_ids:
            ev = evidence_registry.get(eid)
            if not ev:
                continue
            doc_id = f"law:{ev.document_id}"
            g.add_node(doc_id, label=ev.document_name, type="LAW")
            sec_id = f"sec:{ev.document_id}:{ev.provision or ev.chunk_id}"
            doc_short = _DOC_SHORT.get(ev.document_id, ev.document_id)
            g.add_node(
                sec_id,
                label=f"{doc_short} {ev.provision or ev.chunk_id}",
                type="SECTION",
                evidence_id=eid,
                page=ev.page,
            )
            g.add_edge(rule_id, sec_id, type="CITES")
            g.add_edge(doc_id, sec_id, type="HAS_SECTION")
            g.add_edge(sec_id, fw_id, type="APPLIES_IN")

    # Cross-links that give PageRank its legal semantics: TK connects to the
    # TK exclusion provision when that provision is actually cited.
    tk_nodes = [n for n, d in g.nodes(data=True) if d.get("type") == "TRADITIONAL_KNOWLEDGE"]
    s3p = next((n for n, d in g.nodes(data=True)
                if d.get("type") == "SECTION" and "3(p)" in d.get("label", "")), None)
    if s3p:
        for tk in tk_nodes:
            g.add_edge(tk, s3p, type="RELEVANT_TO")

    bio_nodes = [n for n, d in g.nodes(data=True) if d.get("type") == "BIOLOGICAL_RESOURCE"]
    bda_secs = [n for n, d in g.nodes(data=True)
                if d.get("type") == "SECTION" and "BDA-ACT-2002" in n]
    for bio in bio_nodes:
        for sec in bda_secs:
            g.add_edge(bio, sec, type="RELEVANT_TO")

    return g


def compute_signals(g: nx.DiGraph) -> list[GraphSignal]:
    """Run the graph algorithms and package explainable signals."""
    signals: list[GraphSignal] = []
    if g.number_of_nodes() == 0:
        return signals

    seeds = {
        n: 1.0
        for n, d in g.nodes(data=True)
        if d.get("type") in {"PRODUCT", "INGREDIENT", "BIOLOGICAL_RESOURCE"}
    }
    if seeds:
        undirected = g.to_undirected(as_view=False)
        ranks = nx.pagerank(undirected, personalization=seeds, alpha=0.85)
        provision_ranks = sorted(
            ((n, r) for n, r in ranks.items() if g.nodes[n].get("type") == "SECTION"),
            key=lambda kv: kv[1],
            reverse=True,
        )
        for node, rank in provision_ranks[:5]:
            signals.append(
                GraphSignal(
                    signal_type="PROVISION_RELEVANCE",
                    algorithm="personalized_pagerank(alpha=0.85, seeds=product+ingredients)",
                    description=(
                        f"{g.nodes[node].get('label')} ranks among the most structurally "
                        "connected provisions for this product's composition."
                    ),
                    nodes=[node],
                    score=round(float(rank), 5),
                )
            )

    # Explanatory paths: Product -> ... -> Section, shortest path per cited section.
    product = next((n for n, d in g.nodes(data=True) if d.get("type") == "PRODUCT"), None)
    if product:
        undirected = g.to_undirected(as_view=False)
        for section in [n for n, d in g.nodes(data=True) if d.get("type") == "SECTION"][:6]:
            try:
                path = nx.shortest_path(undirected, product, section)
            except nx.NetworkXNoPath:
                continue
            if len(path) >= 3:
                signals.append(
                    GraphSignal(
                        signal_type="REASONING_PATH",
                        algorithm="shortest_path",
                        description=" -> ".join(g.nodes[n].get("label", n) for n in path),
                        nodes=path,
                        path=path,
                        score=round(1.0 / (len(path) - 1), 3),
                    )
                )

    return signals


def to_payload(g: nx.DiGraph, signals: list[GraphSignal]) -> GraphPayload:
    relevance: dict[str, float] = {}
    for signal in signals:
        if signal.signal_type == "PROVISION_RELEVANCE" and signal.nodes:
            relevance[signal.nodes[0]] = signal.score

    nodes = [
        GraphNode(
            id=node,
            label=data.get("label", node),
            type=data.get("type", "UNKNOWN"),
            properties={k: v for k, v in data.items() if k not in {"label", "type"} and v is not None},
            relevance=relevance.get(node, 0.0),
        )
        for node, data in g.nodes(data=True)
    ]
    edges = [
        GraphEdge(source=u, target=v, type=data.get("type", "RELATED_TO"))
        for u, v, data in g.edges(data=True)
    ]
    return GraphPayload(nodes=nodes, edges=edges, signals=signals)
