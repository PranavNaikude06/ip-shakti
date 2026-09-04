import { useState } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import RiskMeter from '@/components/ui/RiskMeter'
import { analysisRecords } from '@/data/mockData'
import type { AnalysisStatus, AnalysisRecord, PageId } from '@/data/mockData'

const filterOptions: (AnalysisStatus | 'All')[] = ['All', 'Completed', 'Review Required', 'Expert Review', 'Draft']

function DetailPanel({ record, onClose, onViewDetail }: { record: AnalysisRecord; onClose: () => void; onViewDetail: () => void }) {
  return (
    <div
      style={{
        background: '#FFFDF8',
        border: '1px solid #DFC0B7',
        borderRadius: '12px',
        boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
        padding: '24px',
        marginTop: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', color: '#173F2A', margin: '0 0 4px', fontWeight: 400 }}>
            {record.product}
          </h2>
          <span style={{ fontSize: '12px', color: '#4A5E51', fontFamily: "'IBM Plex Mono', monospace" }}>{record.id}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StatusBadge status={record.status} size="md" />
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid #DFC0B7', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: '#4A5E51', fontFamily: 'Manrope, system-ui, sans-serif' }}
          >
            Close
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { label: 'Classification', value: record.classification },
          { label: 'Regulatory Pathway', value: record.regulatoryPathway },
          { label: 'Last Updated', value: record.lastUpdated },
          { label: 'TK Status', value: record.tkStatus },
          { label: 'ABS Status', value: record.absStatus },
          { label: 'Analysis Date', value: record.date },
        ].map(item => (
          <div key={item.label} style={{ backgroundColor: '#FBF6E9', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#A89590', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#173F2A' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#7A9285', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Patentability Risk</div>
        <div style={{ maxWidth: '200px' }}>
          <RiskMeter level={record.patentability} />
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#7A9285', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Confidence</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#F7DED5', overflow: 'hidden' }}>
            <div style={{ width: `${record.confidence}%`, height: '100%', backgroundColor: '#6B8F71', borderRadius: '3px' }} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#173F2A' }}>{record.confidence}%</span>
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={onViewDetail} className="btn-interact btn-green" style={{ padding: '8px 16px', backgroundColor: '#173F2A', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif' }}>
          View Full Assessment <span className="arr">{'→'}</span>
        </button>
        <button style={{ padding: '8px 16px', backgroundColor: '#FDF2EC', color: '#173F2A', border: '1px solid #173F2A', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif' }}>
          Generate Report
        </button>
        <button style={{ padding: '8px 16px', backgroundColor: '#FDF2EC', color: '#4A5E51', border: '1px solid #DFC0B7', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif' }}>
          Escalate to Expert
        </button>
      </div>
    </div>
  )
}

export default function MyAnalyses({ onNavigate }: { onNavigate?: (p: PageId) => void }) {
  const [filterStatus, setFilterStatus] = useState<AnalysisStatus | 'All'>('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = analysisRecords.filter(r => {
    const matchStatus = filterStatus === 'All' || r.status === filterStatus
    const q = search.trim().toLowerCase()
    const matchSearch = !q || r.product.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.classification.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })
  const selectedRecord = analysisRecords.find(r => r.id === selectedId) ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', color: '#173F2A', marginBottom: '6px', fontWeight: 400 }}>
          My Assessments
        </h1>
        <p style={{ fontSize: '14px', color: '#4A5E51' }}>
          Review previous product assessments and continue unresolved compliance workflows.
        </p>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative', maxWidth: '340px' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7A9285', pointerEvents: 'none' }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by product, ID or classification…"
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              border: '1px solid #DFC0B7', borderRadius: '6px',
              fontSize: '12.5px', fontFamily: 'Manrope, system-ui, sans-serif',
              color: '#173F2A', background: '#FDF2EC', outline: 'none',
              boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
            }}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#173F2A' }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#DFC0B7' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7A9285', padding: '2px', fontSize: '14px', lineHeight: 1 }}
            >×</button>
          )}
        </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {filterOptions.map(opt => (
          <button
            key={opt}
            onClick={() => setFilterStatus(opt)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: `1px solid ${filterStatus === opt ? '#173F2A' : '#DFC0B7'}`,
              backgroundColor: filterStatus === opt ? '#173F2A' : '#FDF2EC',
              color: filterStatus === opt ? '#FFFFFF' : '#4A5E51',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Manrope, system-ui, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {opt} {opt === 'All' ? `(${analysisRecords.length})` : `(${analysisRecords.filter(r => r.status === opt).length})`}
          </button>
        ))}
      </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DFC0B7',
          borderRadius: '12px',
          boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#FBF6E9' }}>
                {['Product', 'Analysis ID', 'Classification', 'Patentability', 'TK Status', 'ABS Status', 'Pathway', 'Confidence', 'Last Updated', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#7A9285', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid #DFC0B7' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, i) => (
                <tr
                  key={record.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid #F7EDE5' : 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedId === record.id ? '#FCEAE5' : 'transparent',
                    transition: 'background-color 0.1s',
                  }}
                  onClick={() => setSelectedId(selectedId === record.id ? null : record.id)}
                  onMouseEnter={e => {
                    if (selectedId !== record.id) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#FBF6E9'
                  }}
                  onMouseLeave={e => {
                    if (selectedId !== record.id) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#173F2A', whiteSpace: 'nowrap' }}>{record.product}</td>
                  <td style={{ padding: '12px 16px', color: '#4A5E51', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', whiteSpace: 'nowrap' }}>{record.id}</td>
                  <td style={{ padding: '12px 16px', color: '#4A5E51' }}>{record.classification}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={record.patentability} /></td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={record.tkStatus} /></td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={record.absStatus} /></td>
                  <td style={{ padding: '12px 16px', color: '#4A5E51', whiteSpace: 'nowrap' }}>{record.regulatoryPathway}</td>
                  <td style={{ padding: '12px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#173F2A', fontWeight: 500 }}>{record.confidence}%</td>
                  <td style={{ padding: '12px 16px', color: '#A89590', whiteSpace: 'nowrap' }}>{record.lastUpdated}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={record.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', color: '#173F2A', fontWeight: 600 }}>
                      {selectedId === record.id ? 'Close ↑' : 'View →'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedRecord && (
        <DetailPanel record={selectedRecord} onClose={() => setSelectedId(null)} onViewDetail={() => onNavigate?.('assessment-detail')} />
      )}
    </div>
  )
}
