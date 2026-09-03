import { useState } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import { sourceRecords } from '@/data/mockData'
import type { SourceRecord } from '@/data/mockData'

function DetailPanel({ record, onClose }: { record: SourceRecord; onClose: () => void }) {
  return (
    <div
      style={{
        background: '#FFFDF8',
        border: '1px solid #DFC0B7',
        borderLeft: '4px solid #173F2A',
        borderRadius: '12px',
        boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
        padding: '24px',
        marginTop: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#7A9285' }}>{record.id}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {record.statuses.map(s => <StatusBadge key={s} status={s} />)}
            </div>
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', color: '#173F2A', margin: '0 0 2px', fontWeight: 400 }}>
            {record.document}
          </h2>
          <p style={{ fontSize: '13px', color: '#4A5E51', margin: 0 }}>{record.section}</p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: '1px solid #DFC0B7', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: '#4A5E51', fontFamily: 'Manrope, system-ui, sans-serif' }}
        >
          Close
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Authority', value: record.authority },
          { label: 'Jurisdiction', value: record.jurisdiction },
          { label: 'Effective Date', value: record.effectiveDate },
        ].map(item => (
          <div key={item.label} style={{ backgroundColor: '#FBF6E9', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#A89590', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#173F2A' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#7A9285', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Supporting Evidence</div>
        <blockquote
          style={{
            margin: 0,
            padding: '14px 16px',
            backgroundColor: '#FCEAE5',
            borderLeft: '3px solid #173F2A',
            borderRadius: '0 8px 8px 0',
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#173F2A',
            fontStyle: 'italic',
          }}
        >
          "{record.excerpt}"
        </blockquote>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#A89590', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Used For</div>
        <p style={{ fontSize: '13px', color: '#173F2A', margin: 0 }}>{record.usedFor}</p>
      </div>

      <button
        disabled
        style={{
          padding: '8px 16px',
          backgroundColor: '#F7EDE5',
          color: '#7A9285',
          border: '1px solid #DFC0B7',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'not-allowed',
          fontFamily: 'Manrope, system-ui, sans-serif',
        }}
      >
        View Original Source ↗
      </button>
    </div>
  )
}

export default function Sources() {
  const [selectedSource, setSelectedSource] = useState<SourceRecord | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', color: '#173F2A', marginBottom: '6px', fontWeight: 400 }}>
            Evidence & Sources
          </h1>
          <p style={{ fontSize: '14px', color: '#4A5E51' }}>
            Review the authoritative sources supporting each assessment.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FCEAE5',
            border: '1px solid #F0B5A8',
            borderRadius: '8px',
            padding: '8px 14px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#173F2A" strokeWidth="1.5" />
            <path d="M7 4v3.5l2 1.5" stroke="#173F2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#173F2A' }}>Evidence-backed response</span>
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
                {['ID', 'Source Authority', 'Document', 'Section / Rule', 'Jurisdiction', 'Effective Date', 'Status', 'Used For', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#7A9285', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid #DFC0B7' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sourceRecords.map((record, i) => (
                <tr
                  key={record.id}
                  style={{
                    borderBottom: i < sourceRecords.length - 1 ? '1px solid #F7EDE5' : 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedSource?.id === record.id ? '#FCEAE5' : 'transparent',
                    transition: 'background-color 0.1s',
                  }}
                  onClick={() => setSelectedSource(selectedSource?.id === record.id ? null : record)}
                  onMouseEnter={e => {
                    if (selectedSource?.id !== record.id) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#FBF6E9'
                  }}
                  onMouseLeave={e => {
                    if (selectedSource?.id !== record.id) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'
                  }}
                >
                  <td style={{ padding: '12px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#A89590' }}>{record.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#173F2A', whiteSpace: 'nowrap' }}>{record.authority}</td>
                  <td style={{ padding: '12px 16px', color: '#173F2A' }}>{record.document}</td>
                  <td style={{ padding: '12px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#4A5E51' }}>{record.section}</td>
                  <td style={{ padding: '12px 16px', color: '#4A5E51' }}>{record.jurisdiction}</td>
                  <td style={{ padding: '12px 16px', color: '#4A5E51', whiteSpace: 'nowrap' }}>{record.effectiveDate}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {record.statuses.map(s => <StatusBadge key={s} status={s} />)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4A5E51', fontSize: '12px' }}>{record.usedFor}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', color: '#173F2A', fontWeight: 600 }}>
                      {selectedSource?.id === record.id ? 'Close ↑' : 'View →'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedSource && (
        <DetailPanel record={selectedSource} onClose={() => setSelectedSource(null)} />
      )}
    </div>
  )
}
