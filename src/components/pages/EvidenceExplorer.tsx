import { useState } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import { evidenceRecords } from '@/data/mockData'
import type { EvidenceRecord } from '@/data/mockData'

const S = '0 1px 3px rgba(23, 63, 42, 0.07)'

const frameworks = ['All', 'Patent', 'Traditional Knowledge', 'ABS', 'AYUSH', 'Regulatory', 'Trademark']
const evidenceTypes = ['All', 'Prior Art', 'TK Reference', 'Biological Resource', 'Regulatory', 'Legal Statute']

const confidenceBg = (c: number) => c >= 90 ? '#173F2A' : c >= 80 ? '#173F2A' : '#CF5A3D'

const riskColors = {
  Low:      { color: '#6B8F71', bg: '#E5EEE6', border: '#B8D4BB' },
  Moderate: { color: '#173F2A', bg: '#FCEAE5', border: '#F0B5A8' },
  High:     { color: '#A94350', bg: '#FCEAE5', border: '#F0B5A8' },
  Critical: { color: '#A94350', bg: '#F5E0E5', border: '#DCA8B6' },
}

export default function EvidenceExplorer() {
  const [activeFramework, setActiveFramework] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<EvidenceRecord | null>(null)

  const filtered = evidenceRecords.filter(r => {
    const fwMatch = activeFramework === 'All' || r.framework === activeFramework
    const q = search.toLowerCase()
    const textMatch = !q || r.id.toLowerCase().includes(q) || r.source.toLowerCase().includes(q) ||
      r.finding.toLowerCase().includes(q) || r.product.toLowerCase().includes(q)
    return fwMatch && textMatch
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '30px', color: '#173F2A', margin: '0 0 4px', fontWeight: 400, letterSpacing: '-0.02em' }}>
          Evidence Explorer
        </h1>
        <p style={{ fontSize: '13px', color: '#4A5E51', margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>
          Trace every assessment finding back to its underlying source. Each evidence item is independently verified.
        </p>
      </div>

      {/* Search + filters row */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 0 300px' }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#7A9285" strokeWidth="1.5" />
            <path d="M10 10l2.5 2.5" stroke="#7A9285" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search evidence, sources, products…"
            style={{
              width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #DFC0B7',
              borderRadius: '6px', fontSize: '12.5px', color: '#173F2A',
              backgroundColor: '#FDF2EC', fontFamily: 'Manrope, system-ui, sans-serif',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {frameworks.map(fw => (
            <button
              key={fw}
              onClick={() => setActiveFramework(fw)}
              style={{
                padding: '5px 12px', borderRadius: '5px',
                border: activeFramework === fw ? '1px solid #173F2A' : '1px solid #DFC0B7',
                background: activeFramework === fw ? '#173F2A' : '#FDF2EC',
                color: activeFramework === fw ? '#FFFFFF' : '#4A5E51',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                fontFamily: 'Manrope, system-ui, sans-serif', transition: 'all 0.12s',
              }}
            >
              {fw}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#7A9285', fontFamily: 'Manrope, system-ui, sans-serif' }}>
          {filtered.length} records
        </span>
      </div>

      {/* Main two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '16px', alignItems: 'start' }}>

        {/* Table */}
        <div style={{ background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', boxShadow: S, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F7EDE5' }}>
                {['Evidence ID', 'Source', 'Framework', 'Section', 'Confidence', 'Finding', 'Risk', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700,
                    color: '#7A9285', letterSpacing: '0.06em', textTransform: 'uppercase',
                    whiteSpace: 'nowrap', borderBottom: '1px solid #DFC0B7',
                    fontFamily: 'Manrope, system-ui, sans-serif',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev, i) => {
                const isSelected = selected?.id === ev.id
                const risk = riskColors[ev.riskLevel]
                return (
                  <tr
                    key={ev.id}
                    onClick={() => setSelected(isSelected ? null : ev)}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #F2DDD7' : 'none',
                      transition: 'background 0.1s', cursor: 'pointer',
                      backgroundColor: isSelected ? '#F2DDD7' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#F7EDE5' }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent' }}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 500, color: '#173F2A', whiteSpace: 'nowrap' }}>
                      {ev.id}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12.5px', color: '#173F2A', fontWeight: 500, fontFamily: 'Manrope, system-ui, sans-serif', maxWidth: '180px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.source}</div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                        backgroundColor: '#F3C9BD', color: '#173F2A',
                        fontFamily: 'Manrope, system-ui, sans-serif',
                      }}>
                        {ev.framework}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#7A9285', whiteSpace: 'nowrap' }}>
                      {ev.section || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '28px', height: '3px', borderRadius: '2px', backgroundColor: '#F2DDD7', overflow: 'hidden', flexShrink: 0 }}>
                          <div style={{ width: `${ev.confidence}%`, height: '100%', borderRadius: '2px', backgroundColor: confidenceBg(ev.confidence) }} />
                        </div>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#173F2A', fontWeight: 500 }}>
                          {ev.confidence}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#4A5E51', fontFamily: 'Manrope, system-ui, sans-serif', maxWidth: '240px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.finding}</div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                        backgroundColor: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
                        fontFamily: 'Manrope, system-ui, sans-serif',
                      }}>
                        {ev.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <StatusBadge status={ev.status} />
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#7A9285', fontSize: '13px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    No evidence records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', boxShadow: S, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #DFC0B7', backgroundColor: '#F7EDE5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 500, color: '#173F2A' }}>
                  {selected.id}
                </span>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#173F2A', margin: '4px 0 0', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  {selected.source}
                </h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A9285', fontSize: '18px', lineHeight: 1, padding: '0 0 0 8px' }}>×</button>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Framework', value: selected.framework },
                { label: 'Section', value: selected.section || 'N/A', mono: true },
                { label: 'Jurisdiction', value: selected.jurisdiction },
                { label: 'Product', value: selected.product },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '3px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    {row.label}
                  </div>
                  <div style={{ fontSize: '13px', color: '#173F2A', fontFamily: row.mono ? "'IBM Plex Mono', monospace" : 'Manrope, system-ui, sans-serif' }}>
                    {row.value}
                  </div>
                </div>
              ))}

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '3px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  Finding
                </div>
                <p style={{ fontSize: '13px', color: '#173F2A', lineHeight: 1.5, margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  {selected.finding}
                </p>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  Confidence
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#F2DDD7', overflow: 'hidden' }}>
                    <div style={{ width: `${selected.confidence}%`, height: '100%', borderRadius: '3px', backgroundColor: confidenceBg(selected.confidence) }} />
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#173F2A' }}>
                    {selected.confidence}%
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                <button style={{
                  flex: 1, padding: '8px', background: '#173F2A', border: 'none', borderRadius: '6px',
                  color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Manrope, system-ui, sans-serif',
                }}>
                  View in Legal Library
                </button>
                <button style={{
                  flex: 1, padding: '8px', background: '#FDF2EC', border: '1px solid #173F2A', borderRadius: '6px',
                  color: '#173F2A', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Manrope, system-ui, sans-serif',
                }}>
                  Cite Evidence
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
