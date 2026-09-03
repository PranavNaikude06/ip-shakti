import { useState, useEffect } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'

type ReportStatus = 'Draft' | 'Generating' | 'Completed' | 'Expert Reviewed'

interface Report {
  id: string
  title: string
  description: string
  includes: string[]
  status: ReportStatus
  date: string
  progress?: number
}

const initialReports: Report[] = [
  {
    id: 'rpt-full',
    title: 'Full Product Assessment',
    description: 'Comprehensive analysis covering all IP, compliance, and regulatory dimensions.',
    includes: ['Product classification', 'IP assessment', 'Prior art search', 'Traditional knowledge', 'ABS compliance', 'Regulatory pathway', 'Evidence citations'],
    status: 'Draft',
    date: '',
  },
  {
    id: 'rpt-patent',
    title: 'Patentability Report',
    description: 'Focused analysis of patent eligibility, prior art landscape, and filing strategy.',
    includes: ['Novelty assessment', 'Prior art — TKDL, EPO, IPO', 'Inventive step analysis', '§3(p) compliance check', 'Claim drafting guidance'],
    status: 'Completed',
    date: '24 Aug 2026',
  },
  {
    id: 'rpt-abs',
    title: 'ABS Compliance Report',
    description: 'Biological resource and benefit-sharing obligations assessment for filing preparation.',
    includes: ['Resource identification', 'NBA approval requirements', 'Nagoya Protocol obligations', 'PIC/MAT documentation', 'Benefit-sharing framework'],
    status: 'Expert Reviewed',
    date: '20 Aug 2026',
  },
  {
    id: 'rpt-reg',
    title: 'Regulatory Assessment',
    description: 'Product classification and applicable regulatory pathway determination.',
    includes: ['AYUSH classification', 'D&C Act requirements', 'Licensing checklist', 'Labelling compliance', 'Market-specific requirements'],
    status: 'Draft',
    date: '',
  },
]

const completedArchive = [
  { id: 'AN-2026-0876', product: 'Triphala Gut Formula', type: 'Full Assessment', date: '24 Aug 2026', status: 'Expert Reviewed' as ReportStatus },
  { id: 'AN-2026-0851', product: "Shatavari Women's Health", type: 'Patentability Report', date: '14 Aug 2026', status: 'Completed' as ReportStatus },
  { id: 'AN-2026-0821', product: 'Guduchi Immunity Capsules', type: 'ABS Compliance Report', date: '02 Aug 2026', status: 'Completed' as ReportStatus },
]

export default function Reports() {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  useEffect(() => {
    if (!generatingId) return

    let progress = 0
    const interval = setInterval(() => {
      progress += 12
      setReports(prev =>
        prev.map(r =>
          r.id === generatingId ? { ...r, progress: Math.min(progress, 100) } : r
        )
      )
      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          setReports(prev =>
            prev.map(r =>
              r.id === generatingId
                ? { ...r, status: 'Completed', date: '02 Sep 2026', progress: undefined }
                : r
            )
          )
          setGeneratingId(null)
        }, 400)
      }
    }, 300)

    return () => clearInterval(interval)
  }, [generatingId])

  const startGeneration = (id: string) => {
    setReports(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'Generating', progress: 0 } : r)
    )
    setGeneratingId(id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', color: '#173F2A', marginBottom: '6px', fontWeight: 400 }}>
          Reports
        </h1>
        <p style={{ fontSize: '14px', color: '#4A5E51' }}>
          Generate structured IP and compliance reports for internal review, filing preparation and expert consultation.
        </p>
      </div>

      {/* Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {reports.map(report => (
          <div
            key={report.id}
            style={{
              background: '#FFFDF8',
              border: '1px solid #DFC0B7',
              borderRadius: '12px',
              boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #F7EDE5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#173F2A', margin: '0 0 4px' }}>{report.title}</h3>
                <p style={{ fontSize: '12px', color: '#A89590', margin: 0 }}>{report.description}</p>
              </div>
              <StatusBadge status={report.status} size="md" />
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#7A9285', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Includes</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {report.includes.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#4A5E51' }}>
                    <span style={{ color: '#173F2A', fontWeight: 700 }}>·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Progress bar for generating state */}
            {report.status === 'Generating' && report.progress !== undefined && (
              <div style={{ padding: '0 20px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#173F2A', fontWeight: 500 }}>Generating report…</span>
                  <span style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", color: '#173F2A' }}>{report.progress}%</span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#F7EDE5', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${report.progress}%`,
                      height: '100%',
                      backgroundColor: '#173F2A',
                      borderRadius: '2px',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ padding: '12px 20px', borderTop: '1px solid #F7EDE5', display: 'flex', gap: '8px' }}>
              {(report.status === 'Draft' || report.status === 'Completed' || report.status === 'Expert Reviewed') && (
                <button
                  onClick={() => report.status === 'Draft' && startGeneration(report.id)}
                  className={report.status === 'Draft' ? 'btn-interact btn-green' : ''}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: report.status === 'Draft' ? '#173F2A' : '#F7DED5',
                    color: report.status === 'Draft' ? '#FFFFFF' : '#A89590',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: report.status === 'Draft' ? 'pointer' : 'default',
                    fontFamily: 'Manrope, system-ui, sans-serif',
                  }}
                >
                  {report.status === 'Draft' ? 'Generate Detailed Report' : 'View Report'}
                </button>
              )}
              {report.status === 'Generating' && (
                <button
                  disabled
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#F7EDE5',
                    color: '#7A9285',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'not-allowed',
                    fontFamily: 'Manrope, system-ui, sans-serif',
                  }}
                >
                  Generating…
                </button>
              )}
              {report.date && (
                <span style={{ fontSize: '12px', color: '#7A9285', display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
                  {report.date}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Completed Archive */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DFC0B7',
          borderRadius: '12px',
          boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #F7DED5' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#173F2A', margin: 0 }}>Previous Reports</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#FBF6E9' }}>
              {['Analysis ID', 'Product', 'Report Type', 'Generated', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#7A9285', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1px solid #DFC0B7' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {completedArchive.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: i < completedArchive.length - 1 ? '1px solid #F7DED5' : 'none' }}>
                <td style={{ padding: '12px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#A89590' }}>{r.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#173F2A' }}>{r.product}</td>
                <td style={{ padding: '12px 16px', color: '#4A5E51' }}>{r.type}</td>
                <td style={{ padding: '12px 16px', color: '#4A5E51' }}>{r.date}</td>
                <td style={{ padding: '12px 16px' }}><StatusBadge status={r.status} /></td>
                <td style={{ padding: '12px 16px' }}>
                  <button style={{ fontSize: '11px', fontWeight: 600, color: '#4A5E51', background: '#F7DED5', border: '1px solid #DFC0B7', borderRadius: '6px', padding: '4px 10px', cursor: 'not-allowed', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    Download ↓
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
