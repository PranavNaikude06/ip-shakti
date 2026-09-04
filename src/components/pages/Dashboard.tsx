import type { ReactNode } from 'react'
import MetricCard from '@/components/ui/MetricCard'
import StatusBadge from '@/components/ui/StatusBadge'
import { priorityAlerts, analysisRecords } from '@/data/mockData'
import type { PageId } from '@/data/mockData'

interface DashboardProps {
  onNavigate: (page: PageId) => void
}

const S = '0 1px 3px rgba(23, 63, 42, 0.07)'

const overviewMetrics = [
  { label: 'Total Assessments', value: 14, trend: 3, icon: 'clipboard' },
  { label: 'High-Risk Products', value: 4, trend: 1, icon: 'alert' },
  { label: 'Pending Reviews', value: 8, trend: -2, icon: 'clock' },
  { label: 'Evidence Requiring Verification', value: 6, trend: 2, icon: 'evidence' },
  { label: 'Expert Escalations', value: 2, trend: 0, icon: 'escalation' },
]

const metricIcons: Record<string, ReactNode> = {
  clipboard: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 2V1.5a1 1 0 011-1h4a1 1 0 011 1V2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  alert: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L15 14H1L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  clock: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  evidence: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 3h12M2 6h8M2 9h10M2 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  escalation: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 14c0-2.8 2.2-5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 10l2 2 3-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

const metricAccents: Record<string, string> = {
  clipboard:  '#173F2A',
  alert:      '#CF5A3D',
  clock:      '#A94350',
  evidence:   '#173F2A',
  escalation: '#A94350',
}

const severityConfig = {
  High:   { color: '#A94350', bg: '#FCEAE5', border: '#F0B5A8', label: 'High' },
  Medium: { color: '#E9684F', bg: '#FCEAE5', border: '#F0B5A8', label: 'Medium' },
  Low:    { color: '#718A78', bg: '#DCE8DF', border: '#B8CFC0', label: 'Low' },
} as const

const alertTypeIcons: Record<string, string> = {
  patent: 'P', abs: 'B', tk: 'TK', regulatory: 'R'
}

const alertTypeNav: Record<string, PageId> = {
  patent:     'ip-assessment',
  abs:        'abs-compliance',
  tk:         'intelligence',
  regulatory: 'regulatory-pathway',
}

const intelligenceSnapshot = [
  { label: 'Patent Conflicts',    count: 3, color: '#E9684F', bg: '#FCEAE5' },
  { label: 'TK Overlaps',         count: 4, color: '#A94350', bg: '#FAE0DC' },
  { label: 'Biological Resources',count: 2, color: '#E9684F', bg: '#FCEAE5' },
  { label: 'Regulatory Issues',   count: 5, color: '#A94350', bg: '#FAE0DC' },
]

const tableHeaders = ['Product', 'Analysis ID', 'Classification', 'Risk', 'Evidence', 'Last Updated', 'Status', '']

export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: '32px',
          color: '#173F2A',
          margin: '0 0 5px',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          IP-SAKTI Intelligence
        </h1>
        <p style={{ fontSize: '13px', color: '#4A5E51', margin: 0, lineHeight: 1.5, fontFamily: 'Manrope, system-ui, sans-serif' }}>
          Monitor intellectual-property, biodiversity and traditional-knowledge assessments.
        </p>
      </div>

      {/* ── Overview Stats ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {overviewMetrics.map((m, i) => (
          <div key={m.label} style={{ animation: `fadeSlideUp 0.35s ease both`, animationDelay: `${i * 60}ms` }}>
            <MetricCard
              label={m.label}
              value={m.value}
              trend={m.trend}
              icon={metricIcons[m.icon]}
              accent={metricAccents[m.icon]}
              featured={i === 0}
            />
          </div>
        ))}
      </div>

      {/* ── Priority Actions + Intelligence Snapshot ─────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', animation: 'fadeSlideUp 0.35s ease 0.32s both' }}>

        {/* Priority Actions */}
        <div style={{ background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', boxShadow: S, overflow: 'hidden' }}>
          <div style={{
            padding: '13px 20px', borderBottom: '1px solid #DFC0B7', backgroundColor: '#F7EDE5',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#173F2A', margin: '0 0 1px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                Priority Actions
              </h2>
              <p style={{ fontSize: '11px', color: '#7A9285', margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>
                {priorityAlerts.length} items requiring attention
              </p>
            </div>
            <span style={{
              fontSize: '10px', color: '#A94350', fontWeight: 700,
              backgroundColor: '#FCEAE5', padding: '2px 8px', borderRadius: '4px',
              border: '1px solid #F0B5A8', letterSpacing: '0.04em',
              fontFamily: 'Manrope, system-ui, sans-serif',
            }}>
              {priorityAlerts.filter(a => a.severity === 'High').length} HIGH
            </span>
          </div>

          {priorityAlerts.map((alert, i) => {
            const sev = severityConfig[alert.severity as keyof typeof severityConfig] ?? severityConfig.Low
            return (
              <div
                key={alert.id}
                style={{
                  padding: '11px 20px 11px 0',
                  borderBottom: i < priorityAlerts.length - 1 ? '1px solid #F2DDD7' : 'none',
                  display: 'flex', alignItems: 'flex-start', borderLeft: `4px solid ${sev.color}`,
                }}
              >
                <div style={{ flex: 1, paddingLeft: '16px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#173F2A', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                      {alert.product}
                    </span>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, color: sev.color,
                      backgroundColor: sev.bg, padding: '1px 5px', borderRadius: '3px',
                      border: `1px solid ${sev.border}`, letterSpacing: '0.05em',
                      textTransform: 'uppercase', fontFamily: 'Manrope, system-ui, sans-serif',
                    }}>
                      {sev.label}
                    </span>
                    <span style={{
                      fontSize: '9px', fontWeight: 600, color: '#7A9285',
                      backgroundColor: '#F2DDD7', padding: '1px 5px', borderRadius: '3px',
                      fontFamily: 'Manrope, system-ui, sans-serif',
                    }}>
                      {alertTypeIcons[alert.type]}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#173F2A', margin: '0 0 2px', lineHeight: 1.4, fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    {alert.reason}
                  </p>
                  <p style={{ fontSize: '11px', color: '#7A9285', margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    → {alert.action}
                  </p>
                </div>
                <button
                  style={{
                    flexShrink: 0, fontSize: '11px', fontWeight: 700, color: '#FFFFFF',
                    background: '#173F2A', border: 'none', borderRadius: '4px',
                    padding: '5px 10px', cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif',
                    alignSelf: 'center', marginLeft: '16px', whiteSpace: 'nowrap', transition: 'background 0.12s',
                  }}
                  onClick={() => onNavigate(alertTypeNav[alert.type] ?? 'assessments')}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E9684F' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#173F2A' }}
                  className="btn-interact"
                >
                  View {'→'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Intelligence Snapshot */}
        <div style={{ background: '#FDF2EC', border: '1px solid #DFC0B7', borderRadius: '8px', boxShadow: S, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid #DFC0B7', backgroundColor: '#F7DED5' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#173F2A', margin: '0 0 1px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
              Intelligence Snapshot
            </h2>
            <p style={{ fontSize: '11px', color: '#7A9285', margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>Active issues across portfolio</p>
          </div>
          <div style={{ padding: '6px 0' }}>
            {intelligenceSnapshot.map((item, i) => (
              <button
                key={item.label}
                onClick={() => onNavigate('intelligence')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 18px', background: 'transparent', border: 'none',
                  borderBottom: i < intelligenceSnapshot.length - 1 ? '1px solid #F2DDD7' : 'none',
                  cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', transition: 'background 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F7EDE5' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
              >
                <span style={{ fontSize: '13px', color: '#173F2A', fontWeight: 500 }}>{item.label}</span>
                <span style={{
                  minWidth: '28px', height: '22px', borderRadius: '5px',
                  backgroundColor: item.bg, color: item.color, border: `1px solid ${item.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700,
                }}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
          <div style={{ padding: '12px 18px', borderTop: '1px solid #DFC0B7', backgroundColor: '#F7EDE5' }}>
            <button
              onClick={() => onNavigate('product-analysis')}
              className="btn-interact btn-green"
              style={{
                width: '100%', padding: '8px', background: '#173F2A', border: 'none',
                borderRadius: '6px', color: '#FFFFFF', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif',
              }}
            >
              Analyse New Product <span className="arr">{'→'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Recent Analyses Table ────────────────────────────────── */}
      <div style={{ background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', boxShadow: S, overflow: 'hidden', animation: 'fadeIn 0.4s ease 0.5s both' }}>
        <div style={{
          padding: '13px 20px', borderBottom: '1px solid #DFC0B7', backgroundColor: '#F7EDE5',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#173F2A', margin: '0 0 1px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
              Recent Analyses
            </h2>
            <p style={{ fontSize: '11px', color: '#7A9285', margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>Latest product assessments</p>
          </div>
          <button
            onClick={() => onNavigate('assessments')}
            className="link-arrow"
            style={{ fontSize: '12px', fontWeight: 600, color: '#173F2A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif' }}
          >
            View All <span className="arr">{'→'}</span>
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F7EDE5' }}>
                {tableHeaders.map(h => (
                  <th key={h} style={{
                    padding: '8px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700,
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
              {analysisRecords.slice(0, 5).map((record, i) => (
                <tr
                  key={record.id}
                  style={{ borderBottom: i < 4 ? '1px solid #F2DDD7' : 'none', transition: 'background 0.1s', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#F7EDE5' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent' }}
                  onClick={() => onNavigate('assessment-detail')}
                >
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#173F2A', whiteSpace: 'nowrap', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    {record.product}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#7A9285' }}>
                    {record.id}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#4A5E51', whiteSpace: 'nowrap', fontSize: '12px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    {record.classification}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <StatusBadge status={record.patentability} />
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '32px', height: '3px', borderRadius: '2px', backgroundColor: '#F2DDD7', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{
                          width: `${record.confidence}%`, height: '100%', borderRadius: '2px',
                          backgroundColor: record.confidence >= 90 ? '#E9684F' : record.confidence >= 80 ? '#E9684F' : '#CF5A3D',
                        }} />
                      </div>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#173F2A', fontWeight: 500 }}>
                        {record.confidence}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#7A9285', whiteSpace: 'nowrap', fontSize: '12px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    {record.lastUpdated}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <StatusBadge status={record.status} />
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); onNavigate('assessment-detail') }}
                      className="link-arrow"
                      style={{ fontSize: '11px', fontWeight: 700, color: '#173F2A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif' }}
                    >
                      View <span className="arr">{'→'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
