import { useState } from 'react'
import { legalEntries } from '@/data/mockData'
import type { LegalEntry } from '@/data/mockData'

const S = '0 1px 3px rgba(23, 63, 42, 0.07)'

type Category = LegalEntry['category'] | 'All'
const categories: Category[] = ['All', 'Patent Law', 'Biodiversity', 'Traditional Knowledge', 'AYUSH', 'Regulatory']

const catColors: Record<string, { color: string; bg: string; border: string }> = {
  'Patent Law':          { color: '#173F2A', bg: '#FCEAE5', border: '#F0B5A8' },
  'Biodiversity':        { color: '#6B8F71', bg: '#E5EEE6', border: '#B8D4BB' },
  'Traditional Knowledge': { color: '#A94350', bg: '#FCEAE5', border: '#F0B5A8' },
  'AYUSH':               { color: '#173F2A', bg: '#FCEAE5', border: '#F0B5A8' },
  'Regulatory':          { color: '#CF5A3D', bg: '#FCEAE5', border: '#F2B8BC' },
}

export default function LegalLibrary() {
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = legalEntries.filter(e => {
    const catMatch = activeCategory === 'All' || e.category === activeCategory
    const q = search.toLowerCase()
    const textMatch = !q || e.title.toLowerCase().includes(q) || e.reference.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) || e.keyProvision.toLowerCase().includes(q)
    return catMatch && textMatch
  })

  const grouped = categories.slice(1).reduce((acc, cat) => {
    const items = filtered.filter(e => e.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {} as Record<string, LegalEntry[]>)

  const displayEntries = activeCategory === 'All' ? null : filtered

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '30px', color: '#173F2A', margin: '0 0 4px', fontWeight: 400, letterSpacing: '-0.02em' }}>
          Legal Library
        </h1>
        <p style={{ fontSize: '13px', color: '#4A5E51', margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>
          Authoritative legal frameworks, statutes, and regulatory sources underlying every IP-SAKTI assessment.
        </p>
      </div>

      {/* Search + category filters */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 0 280px' }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#7A9285" strokeWidth="1.5" />
            <path d="M10 10l2.5 2.5" stroke="#7A9285" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search statutes, provisions, references…"
            style={{
              width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #DFC0B7',
              borderRadius: '6px', fontSize: '12.5px', color: '#173F2A',
              backgroundColor: '#FDF2EC', fontFamily: 'Manrope, system-ui, sans-serif',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '5px 12px', borderRadius: '5px',
                border: activeCategory === cat ? '1px solid #173F2A' : '1px solid #DFC0B7',
                background: activeCategory === cat ? '#173F2A' : '#FDF2EC',
                color: activeCategory === cat ? '#FFFFFF' : '#4A5E51',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                fontFamily: 'Manrope, system-ui, sans-serif', transition: 'all 0.12s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#7A9285', fontFamily: 'Manrope, system-ui, sans-serif' }}>
          {filtered.length} documents
        </span>
      </div>

      {/* Content — grouped if "All", flat if filtered */}
      {activeCategory === 'All' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(grouped).map(([cat, entries]) => {
            const cc = catColors[cat] ?? { color: '#4A5E51', bg: '#F3C9BD', border: '#DFC0B7' }
            return (
              <div key={cat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '4px',
                    backgroundColor: cc.bg, color: cc.color, border: `1px solid ${cc.border}`,
                    letterSpacing: '0.03em', fontFamily: 'Manrope, system-ui, sans-serif',
                  }}>
                    {cat}
                  </span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#DFC0B7' }} />
                  <span style={{ fontSize: '11px', color: '#7A9285', fontFamily: 'Manrope, system-ui, sans-serif' }}>{entries.length} documents</span>
                </div>
                <LegalTable entries={entries} expanded={expanded} onToggle={setExpanded} />
              </div>
            )
          })}
          {Object.keys(grouped).length === 0 && (
            <p style={{ textAlign: 'center', color: '#7A9285', fontSize: '13px', padding: '40px 0', fontFamily: 'Manrope, system-ui, sans-serif' }}>
              No documents match your search.
            </p>
          )}
        </div>
      ) : (
        <LegalTable entries={displayEntries!} expanded={expanded} onToggle={setExpanded} />
      )}
    </div>
  )
}

function LegalTable({ entries, expanded, onToggle }: {
  entries: LegalEntry[]
  expanded: string | null
  onToggle: (id: string | null) => void
}) {
  if (!entries.length) {
    return (
      <p style={{ textAlign: 'center', color: '#7A9285', fontSize: '13px', padding: '32px 0', fontFamily: 'Manrope, system-ui, sans-serif' }}>
        No documents match the selected filters.
      </p>
    )
  }

  return (
    <div style={{ background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(23, 63, 42, 0.07)' }}>
      {entries.map((entry, i) => {
        const isExpanded = expanded === entry.id
        const cc = catColors[entry.category] ?? { color: '#4A5E51', bg: '#F3C9BD', border: '#DFC0B7' }
        return (
          <div key={entry.id} style={{ borderBottom: i < entries.length - 1 ? '1px solid #F2DDD7' : 'none' }}>
            {/* Row */}
            <div
              onClick={() => onToggle(isExpanded ? null : entry.id)}
              style={{
                padding: '13px 20px', display: 'flex', alignItems: 'center', gap: '16px',
                cursor: 'pointer', transition: 'background 0.1s',
                backgroundColor: isExpanded ? '#F7EDE5' : 'transparent',
              }}
              onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F7EDE5' }}
              onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#173F2A', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    {entry.title}
                  </span>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '3px',
                    backgroundColor: cc.bg, color: cc.color, border: `1px solid ${cc.border}`,
                    fontFamily: 'Manrope, system-ui, sans-serif',
                  }}>
                    {entry.category}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: '#7A9285', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  <span>{entry.jurisdiction}</span>
                  <span>Effective {entry.effectiveDate}</span>
                  <span>Verified {entry.lastVerified}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px',
                  color: '#173F2A', fontWeight: 500, whiteSpace: 'nowrap',
                }}>
                  {entry.reference}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                  backgroundColor: '#DCE8DF', color: '#718A78', border: '1px solid #B8CFC0',
                  fontFamily: 'Manrope, system-ui, sans-serif',
                }}>
                  {entry.status}
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', color: '#7A9285', flexShrink: 0 }}
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div style={{ padding: '0 20px 18px 20px', backgroundColor: '#F7EDE5', borderTop: '1px solid #DFC0B7' }}>
                <div style={{ paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                      Summary
                    </div>
                    <p style={{ fontSize: '13px', color: '#173F2A', lineHeight: 1.6, margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>
                      {entry.summary}
                    </p>
                  </div>
                  <div style={{ padding: '10px 14px', background: '#FFFDF8', borderRadius: '5px', border: '1px solid #DFC0B7' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '3px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                      Key Provision
                    </div>
                    <p style={{ fontSize: '13px', color: '#173F2A', fontWeight: 500, margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>
                      {entry.keyProvision}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      padding: '7px 14px', background: '#173F2A', border: 'none', borderRadius: '5px',
                      color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'Manrope, system-ui, sans-serif',
                    }}>
                      View Full Text
                    </button>
                    <button style={{
                      padding: '7px 14px', background: '#FDF2EC', border: '1px solid #DFC0B7', borderRadius: '5px',
                      color: '#4A5E51', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'Manrope, system-ui, sans-serif',
                    }}>
                      View Evidence ({entry.reference})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
