import { useState } from 'react'
import type { EscalationStatus } from '@/data/mockData'

interface EscalationCategory {
  id: string
  title: string
  description: string
  experts: string
  timeframe: string
}

const categories: EscalationCategory[] = [
  {
    id: 'patent',
    title: 'Patent / IP Review',
    description: 'Review by a registered Patent Agent or IP Attorney for filing strategy and claim drafting.',
    experts: 'Registered Patent Agents — IPO India',
    timeframe: '3–5 working days',
  },
  {
    id: 'abs',
    title: 'ABS / Biodiversity Review',
    description: 'NBA-accredited expert review of biological resource obligations and benefit-sharing arrangements.',
    experts: 'NBA-accredited consultants',
    timeframe: '5–7 working days',
  },
  {
    id: 'tk',
    title: 'Traditional Knowledge Review',
    description: 'TKDL-expert assessment of traditional knowledge overlap and prior art implications.',
    experts: 'TKDL specialists — CSIR empanelled',
    timeframe: '3–5 working days',
  },
  {
    id: 'regulatory',
    title: 'Regulatory Review',
    description: 'AYUSH regulatory consultant for CDSCO pre-submission consultation and product classification.',
    experts: 'AYUSH regulatory consultants',
    timeframe: '2–4 working days',
  },
  {
    id: 'multi',
    title: 'Multi-domain Review',
    description: 'Coordinated review by an IP attorney, biodiversity specialist, and regulatory expert together.',
    experts: 'Multi-disciplinary panel',
    timeframe: '7–10 working days',
  },
]

const statusSteps: EscalationStatus[] = ['Pending', 'Assigned', 'Under Review', 'Resolved']

const statusColor: Record<EscalationStatus, string> = {
  Pending: '#E9684F',
  Assigned: '#CF5A3D',
  'Under Review': '#E9684F',
  Resolved: '#718A78',
}

export default function HumanExpertEscalation() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [escalationStatus, setEscalationStatus] = useState<EscalationStatus | null>(null)
  const [notes, setNotes] = useState('')

  const selected = categories.find(c => c.id === selectedCategory)

  const handleSubmit = () => {
    setEscalationStatus('Pending')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', color: '#173F2A', marginBottom: '6px', fontWeight: 400 }}>
          Human Expert Escalation
        </h1>
        <p style={{ fontSize: '14px', color: '#4A5E51' }}>
          Request review from an appropriate IP, regulatory or compliance professional.
        </p>
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            backgroundColor: '#FCEAE5',
            border: '1px solid #F0B5A8',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#A94350',
            display: 'inline-block',
          }}
        >
          ⚠ AI assessments are for decision support only. Human expert review is recommended before any IP filing or regulatory submission.
        </div>
      </div>

      {/* Escalation Categories */}
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#173F2A', marginBottom: '14px' }}>Select Review Type</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              style={{
                padding: '16px',
                background: selectedCategory === cat.id ? '#E8EFE9' : '#FFFFFF',
                border: `1.5px solid ${selectedCategory === cat.id ? '#173F2A' : '#DFC0B7'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'Manrope, system-ui, sans-serif',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (selectedCategory !== cat.id) (e.currentTarget as HTMLButtonElement).style.borderColor = '#173F2A'
              }}
              onMouseLeave={e => {
                if (selectedCategory !== cat.id) (e.currentTarget as HTMLButtonElement).style.borderColor = '#DFC0B7'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#173F2A', marginBottom: '6px' }}>{cat.title}</div>
              <div style={{ fontSize: '11px', color: '#A89590', lineHeight: '1.4' }}>{cat.timeframe}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Case Summary (shown when category selected) */}
      {selected && !escalationStatus && (
        <div
          style={{
            background: '#FFFDF8',
            border: '1px solid #DFC0B7',
            borderRadius: '12px',
            boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #F7DED5', backgroundColor: '#FBF6E9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#173F2A', margin: '0 0 2px' }}>Auto-prepared Case Summary</h2>
              <p style={{ fontSize: '12px', color: '#A89590', margin: 0 }}>For: {selected.title} — {selected.experts}</p>
            </div>
            <span style={{ fontSize: '12px', color: '#718A78', backgroundColor: '#DCE8DF', padding: '4px 10px', borderRadius: '10px', border: '1px solid #B8CFC0', fontWeight: 600 }}>
              Auto-populated
            </span>
          </div>

          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Product', value: 'Ashwagandha Advanced Extract' },
              { label: 'Analysis ID', value: 'AN-2026-0891' },
              { label: 'Classification', value: 'Proprietary Ayurvedic Medicine (91% confidence)' },
              { label: 'Overall IP Risk', value: 'Moderate — §3(p) TK overlap detected' },
              { label: 'ABS Status', value: 'Review Required — NBA approval pending' },
              { label: 'Regulatory Pathway', value: 'AYUSH — Proprietary Ayurvedic Medicine' },
            ].map(item => (
              <div key={item.label} style={{ backgroundColor: '#FBF6E9', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#A89590', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', color: '#173F2A' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#7A9285', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Detected Risks</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { risk: 'Traditional knowledge overlap — TKDL TK-AW-0234', level: 'High' },
                { risk: 'Patent §3(p) restriction — aggregation of known properties', level: 'High' },
                { risk: 'NBA prior approval required before IP filing', level: 'High' },
                { risk: 'Prior art: IN202311045231 partially overlapping', level: 'Medium' },
              ].map(r => (
                <li key={r.risk} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                  <span style={{ color: r.level === 'High' ? '#CF5A3D' : '#E9684F', fontWeight: 700, fontSize: '10px', backgroundColor: r.level === 'High' ? '#FCEAE5' : '#FCEAE5', padding: '1px 6px', borderRadius: '10px', border: `1px solid ${r.level === 'High' ? '#F0B5A8' : '#F0B5A8'}` }}>
                    {r.level}
                  </span>
                  <span style={{ color: '#4A5E51' }}>{r.risk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#7A9285', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Questions for Expert</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                'Can the novel extraction process be claimed independently of the herb itself?',
                'Does TKDL TK-AW-0234 constitute a prior art bar under §3(p)?',
                'Is NBA approval required given cultivated-source origin?',
                'What is the recommended claim structure to avoid TK restrictions?',
              ].map((q, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#4A5E51' }}>
                  <span style={{ color: '#173F2A', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#7A9285', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Additional Notes (Optional)
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any specific questions or context for the expert reviewer..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px 12px',
                border: '1px solid #DFC0B7',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'Manrope, system-ui, sans-serif',
                color: '#173F2A',
                backgroundColor: '#FDF2EC',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid #F7EDE5', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleSubmit}
              className="btn-interact btn-green"
              style={{
                padding: '10px 24px',
                backgroundColor: '#173F2A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Manrope, system-ui, sans-serif',
              }}
            >
              Submit for Expert Review
            </button>
            <span style={{ fontSize: '12px', color: '#7A9285' }}>
              Estimated response: {selected.timeframe}
            </span>
          </div>
        </div>
      )}

      {/* Status Tracker (shown after submit) */}
      {escalationStatus && (
        <div
          style={{
            background: '#FFFDF8',
            border: '1px solid #DFC0B7',
            borderRadius: '12px',
            boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#173F2A', margin: '0 0 4px' }}>Escalation Submitted</h2>
            <p style={{ fontSize: '12px', color: '#A89590', margin: 0 }}>
              Case ID: <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>ESC-2026-0042</span> · {selected?.title}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0', position: 'relative' }}>
            {statusSteps.map((step, i) => {
              const activeIdx = statusSteps.indexOf(escalationStatus)
              const isActive = i <= activeIdx
              const isCurrent = step === escalationStatus
              return (
                <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {i < statusSteps.length - 1 && (
                    <div style={{ position: 'absolute', top: '16px', left: '50%', width: '100%', height: '2px', backgroundColor: i < activeIdx ? '#E9684F' : '#DFC0B7', zIndex: 0 }} />
                  )}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isActive ? (isCurrent ? '#E9684F' : '#FCEAE5') : '#F7EDE5',
                      border: `2px solid ${isActive ? '#E9684F' : '#DFC0B7'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isActive ? (isCurrent ? '#FFFFFF' : '#E9684F') : '#7A9285',
                      zIndex: 1,
                      flexShrink: 0,
                    }}
                  >
                    {i < activeIdx ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: isCurrent ? 600 : 400, color: isCurrent ? '#E9684F' : '#4A5E51', marginTop: '6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
            {statusSteps.filter((_, i) => i > statusSteps.indexOf(escalationStatus)).map(next => (
              <button
                key={next}
                onClick={() => setEscalationStatus(next)}
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
                }}
              >
                Advance to: {next} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Escalations */}
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
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#173F2A', margin: 0 }}>Active Escalations</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#FBF6E9' }}>
              {['Case ID', 'Product', 'Review Type', 'Submitted', 'Expert', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#7A9285', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1px solid #DFC0B7' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { id: 'ESC-2026-0039', product: 'Guduchi Immunity Capsules', type: 'ABS / Biodiversity Review', submitted: '28 Aug 2026', expert: 'Dr. M. Pillai — NBA Consultant', status: 'Under Review' as EscalationStatus },
              { id: 'ESC-2026-0031', product: 'Triphala Gut Formula', type: 'Patent / IP Review', submitted: '15 Aug 2026', expert: 'Adv. R. Krishnan — Patent Agent', status: 'Resolved' as EscalationStatus },
            ].map((e, i) => (
              <tr key={e.id} style={{ borderBottom: i === 0 ? '1px solid #F7DED5' : 'none' }}>
                <td style={{ padding: '12px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#A89590' }}>{e.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#173F2A' }}>{e.product}</td>
                <td style={{ padding: '12px 16px', color: '#4A5E51' }}>{e.type}</td>
                <td style={{ padding: '12px 16px', color: '#A89590' }}>{e.submitted}</td>
                <td style={{ padding: '12px 16px', color: '#4A5E51' }}>{e.expert}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: statusColor[e.status], backgroundColor: `${statusColor[e.status]}15`, padding: '2px 8px', borderRadius: '10px' }}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
