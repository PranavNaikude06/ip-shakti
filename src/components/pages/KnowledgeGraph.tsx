import { useState } from 'react'
import { kgNodes, kgEdges, kgNodesMini, kgEdgesMini, nodeColors, relevantConnections } from '@/data/mockData'
import type { KGNode, KGEdge } from '@/data/mockData'

interface GraphSVGProps {
  nodes: KGNode[]
  edges: KGEdge[]
  width: number
  height: number
  compact?: boolean
  selectedNode?: string | null
  onSelectNode?: (id: string | null) => void
}

function getNodeById(nodes: KGNode[], id: string) {
  return nodes.find(n => n.id === id)
}

function isConnected(edges: KGEdge[], nodeId: string, targetId: string) {
  return edges.some(e => (e.from === nodeId && e.to === targetId) || (e.from === targetId && e.to === nodeId))
}

function edgeInvolvesNode(edge: KGEdge, nodeId: string) {
  return edge.from === nodeId || edge.to === nodeId
}

function GraphSVG({ nodes, edges, width, height, compact = false, selectedNode, onSelectNode }: GraphSVGProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const activeNode = hoveredNode ?? selectedNode ?? null

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Edges */}
      {edges.map((edge, i) => {
        const from = getNodeById(nodes, edge.from)
        const to = getNodeById(nodes, edge.to)
        if (!from || !to) return null

        const dx = to.x - from.x
        const dy = to.y - from.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Shorten line endpoints so they don't overlap node circles
        const fromR = from.r + 3
        const toR = to.r + 3
        const ux = dx / dist
        const uy = dy / dist

        const x1 = from.x + ux * fromR
        const y1 = from.y + uy * fromR
        const x2 = to.x - ux * toR
        const y2 = to.y - uy * toR

        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2

        // Angle for label — keep text right-side-up
        let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI)
        if (angleDeg > 90) angleDeg -= 180
        if (angleDeg < -90) angleDeg += 180

        const edgeActive = activeNode ? edgeInvolvesNode(edge, activeNode) : false
        const edgeSelected = selectedNode ? edgeInvolvesNode(edge, selectedNode) : false
        const dimmed = activeNode !== null && !edgeActive

        const edgeOpacity = dimmed ? 0.18 : edgeSelected ? 1 : edgeActive ? 0.85 : 0.6
        const strokeWidth = edgeSelected ? 2 : edgeActive ? 1.8 : 1.5
        const strokeColor = edgeSelected ? '#173F2A' : edgeActive ? '#4A5E51' : '#DFC0B7'
        const labelOpacity = dimmed ? 0.1 : edgeActive ? 1 : 0.75

        return (
          <g key={i}>
            <line
              x1={x1} y1={y1}
              x2={x2} y2={y2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={edgeOpacity}
              style={{ transition: 'opacity 180ms ease-out, stroke 180ms ease-out, stroke-width 180ms ease-out' }}
            />
            {!compact && edge.label && (
              <g
                transform={`translate(${mx}, ${my}) rotate(${angleDeg})`}
                opacity={labelOpacity}
                style={{ transition: 'opacity 180ms ease-out' }}
              >
                <rect
                  x={-edge.label.length * 3.1}
                  y={-8}
                  width={edge.label.length * 6.2}
                  height={12}
                  rx={3}
                  fill="#FBF6E9"
                  fillOpacity={0.82}
                />
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={8.5}
                  fill={edgeActive ? '#173F2A' : '#7A9285'}
                  fontFamily="Manrope, system-ui, sans-serif"
                  fontWeight={edgeActive ? 600 : 400}
                  style={{ transition: 'fill 180ms ease-out' }}
                >
                  {edge.label}
                </text>
              </g>
            )}
          </g>
        )
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const color = nodeColors[node.type]
        const isSelected = selectedNode === node.id
        const isHovered = hoveredNode === node.id
        const isCenter = node.id === 'center'
        const dimmed = activeNode !== null && !isHovered && !isSelected && !isConnected(edges, node.id, activeNode)
        const lines = node.label.split('\n')
        const lineHeight = compact ? 10 : 11
        const fontSize = isCenter ? (compact ? 9 : 10) : (compact ? 8 : 9)
        const totalTextHeight = lines.length * lineHeight

        const scale = isSelected ? 1.15 : isHovered ? 1.08 : 1
        const glowR = node.r + (isSelected ? 14 : isHovered ? 11 : 8)
        const glowOpacity = isSelected ? 0.28 : isHovered ? 0.2 : 0.1
        const nodeOpacity = dimmed ? 0.28 : 1

        return (
          <g
            key={node.id}
            style={{
              cursor: onSelectNode ? 'pointer' : 'default',
              transformOrigin: `${node.x}px ${node.y}px`,
              transform: `scale(${scale})`,
              transition: 'transform 200ms ease-out, opacity 200ms ease-out',
              opacity: nodeOpacity,
            }}
            onClick={() => onSelectNode?.(isSelected ? null : node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Outer glow ring */}
            <circle
              cx={node.x} cy={node.y}
              r={glowR}
              fill={color}
              fillOpacity={glowOpacity}
              style={{ transition: 'r 200ms ease-out, fill-opacity 200ms ease-out' }}
            />
            {/* Deep green selection ring */}
            {isSelected && (
              <circle
                cx={node.x} cy={node.y}
                r={node.r + 5}
                fill="none"
                stroke="#173F2A"
                strokeWidth={1.5}
                strokeOpacity={0.55}
              />
            )}
            {/* Main circle */}
            <circle
              cx={node.x} cy={node.y}
              r={node.r}
              fill={color}
              stroke={isSelected ? '#FFFFFF' : isHovered ? 'rgba(255,255,255,0.5)' : 'none'}
              strokeWidth={isSelected ? 2 : isHovered ? 1 : 0}
            />
            {/* Node text */}
            {lines.map((line, li) => (
              <text
                key={li}
                x={node.x}
                y={node.y - totalTextHeight / 2 + li * lineHeight + lineHeight / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#FFFFFF"
                fontSize={fontSize}
                fontFamily="Manrope, system-ui, sans-serif"
                fontWeight={isCenter || isSelected ? 600 : 500}
              >
                {line}
              </text>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

const nodeTypeLabels: Record<KGNode['type'], string> = {
  product: 'Product',
  ingredient: 'Ingredient',
  patent: 'Patent',
  law: 'Law',
  regulation: 'Regulation',
  tk: 'Traditional Knowledge',
  biological: 'Biological Resource',
}

export function KnowledgeGraphMini() {
  return (
    <div style={{ width: '100%', height: '220px', backgroundColor: '#FBF6E9', borderRadius: '10px', overflow: 'hidden', border: '1px solid #DFC0B7' }}>
      <GraphSVG
        nodes={kgNodesMini}
        edges={kgEdgesMini}
        width={500}
        height={320}
        compact={true}
      />
    </div>
  )
}

export default function KnowledgeGraph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const selected = kgNodes.find(n => n.id === selectedNode)

  const legendItems: { type: KGNode['type']; label: string }[] = [
    { type: 'product', label: 'Product / Formulation' },
    { type: 'ingredient', label: 'Ingredient' },
    { type: 'tk', label: 'Traditional Knowledge' },
    { type: 'patent', label: 'Patent' },
    { type: 'law', label: 'Law' },
    { type: 'regulation', label: 'Regulation' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', color: '#173F2A', marginBottom: '6px', fontWeight: 400 }}>
          Knowledge Graph
        </h1>
        <p style={{ fontSize: '14px', color: '#4A5E51' }}>
          Explore relationships between ingredients, traditional knowledge, patents, regulations and legal provisions.
        </p>
      </div>

      {/* Graph + Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        {/* Graph Card */}
        <div
          style={{
            background: '#FFFDF8',
            border: '1px solid #DFC0B7',
            borderRadius: '12px',
            boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F7EDE5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#173F2A' }}>Ashwagandha Formulation — Entity Graph</span>
              <span style={{ fontSize: '12px', color: '#A89590', marginLeft: '10px' }}>Hover to explore · Click to inspect</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {legendItems.map(item => (
                <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: nodeColors[item.type] }} />
                  <span style={{ fontSize: '10px', color: '#4A5E51' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: '440px', padding: '16px', backgroundColor: '#FBF6E9' }}>
            <GraphSVG
              nodes={kgNodes}
              edges={kgEdges}
              width={800}
              height={560}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Relevant Connections */}
          <div
            style={{
              background: '#FFFDF8',
              border: '1px solid #DFC0B7',
              borderRadius: '12px',
              boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #F7DED5' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#173F2A', margin: 0 }}>Top Relevant Connections</h3>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {relevantConnections.map(conn => (
                <div key={conn.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#173F2A' }}>{conn.label}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 600, color: conn.color }}>{conn.relevance}%</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: '#F7EDE5', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${conn.relevance}%`, height: '100%', backgroundColor: conn.color, borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Node Inspector */}
          {selected ? (
            <div
              style={{
                background: '#FFFDF8',
                border: '1px solid #DFC0B7',
                borderRadius: '12px',
                boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #F7EDE5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: `${nodeColors[selected.type]}12`,
                }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: nodeColors[selected.type], flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#173F2A' }}>{selected.label.replace('\n', ' ')}</span>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#A89590', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>Entity Type</div>
                  <div style={{ fontSize: '13px', color: '#173F2A' }}>{nodeTypeLabels[selected.type]}</div>
                </div>
                {selected.id !== 'center' && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#A89590', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>Connections</div>
                    <div style={{ fontSize: '12px', color: '#4A5E51' }}>
                      {kgEdges.filter(e => e.from === selected.id || e.to === selected.id).map(e => {
                        const otherId = e.from === selected.id ? e.to : e.from
                        const other = kgNodes.find(n => n.id === otherId)
                        return (
                          <div key={`${e.from}-${e.to}`} style={{ marginBottom: '3px' }}>
                            {'→'} {other?.label.replace('\n', ' ')} ({e.label})
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setSelectedNode(null)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#F7DED5',
                    color: '#4A5E51',
                    border: '1px solid #DFC0B7',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'Manrope, system-ui, sans-serif',
                    alignSelf: 'flex-start',
                  }}
                >
                  Clear selection
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#FBF6E9',
                border: '1px solid #DFC0B7',
                borderRadius: '12px',
                padding: '16px 18px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '12px', color: '#7A9285', margin: 0 }}>
                Click any node in the graph to inspect its entity details and connections.
              </p>
            </div>
          )}

          {/* Graph Insights */}
          <div
            style={{
              background: '#FFFDF8',
              border: '1px solid #DFC0B7',
              borderRadius: '12px',
              boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '13px 18px', borderBottom: '1px solid #DFC0B7', backgroundColor: '#F7DED5' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#173F2A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Graph Insights</div>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ borderLeft: '3px solid #173F2A', paddingLeft: '10px' }}>
                <div style={{ fontSize: '11px', color: '#A89590', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Significant Relationships</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '22px', fontWeight: 600, color: '#173F2A', lineHeight: 1 }}>4</div>
                <div style={{ fontSize: '11px', color: '#4A5E51', marginTop: '4px', lineHeight: 1.4 }}>
                  2 TK overlaps · 1 prior-art link · 1 biodiversity dependency
                </div>
              </div>
              <div style={{ height: '1px', backgroundColor: '#DFC0B7' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#A89590', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Most Influential Framework</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#173F2A' }}>Biodiversity Act</div>
                  <div style={{ fontSize: '11px', color: '#4A5E51' }}>Biological Diversity Act, 2002</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ backgroundColor: '#FBF6E9', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '17px', fontWeight: 600, color: '#173F2A' }}>91%</div>
                    <div style={{ fontSize: '10px', color: '#A89590', marginTop: '2px' }}>Rel. confidence</div>
                  </div>
                  <div style={{ backgroundColor: '#FBF6E9', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '17px', fontWeight: 600, color: '#A94350' }}>+18</div>
                    <div style={{ fontSize: '10px', color: '#7A9285', marginTop: '2px' }}>Risk contribution</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
