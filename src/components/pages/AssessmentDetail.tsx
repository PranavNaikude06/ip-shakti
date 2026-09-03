import { useState } from 'react'
import { createPortal } from 'react-dom'
import StatusBadge from '@/components/ui/StatusBadge'
import RiskMeter from '@/components/ui/RiskMeter'
import type { PageId } from '@/data/mockData'

interface AssessmentDetailProps {
  onNavigate: (page: PageId) => void
}

const S = '0 1px 3px rgba(23, 63, 42, 0.07)'

const assessment = {
  id: 'AN-2026-0891',
  product: 'Ashwagandha Advanced Extract',
  classification: 'Proprietary Ayurvedic Medicine',
  date: '28 Aug 2026',
  status: 'Review Required' as const,
  riskLevel: 'Moderate' as const,
  confidence: 91,
  analyst: 'IP-SAKTI Automated Assessment',
  frameworks: ['Patents Act 1970', 'Biological Diversity Act 2002', 'TKDL', 'AYUSH D&C Act'],
  summary: 'The Ashwagandha Advanced Extract formulation presents moderate IP risk with significant traditional knowledge overlap. Prior-art records in TKDL and two active patents with overlapping extraction claims require resolution before a patent application is filed. ABS compliance is partially complete — NBA pre-approval is pending.',
}

const findings = [
  {
    category: 'Patent',
    risk: 'Moderate' as const,
    title: 'Patentability — Moderate Concern',
    detail: 'Section 3(p) of the Patents Act applies. TKDL documents (TK-AW-0234) establish traditional use as prior art. Two active patents (IN202311045231, US10123456B2) overlap with proposed extraction claims.',
    evidence: ['EVID-001', 'EVID-052'],
    actions: ['Conduct clearance search against IN202311045231', 'File provisional to secure priority date', 'Engage TKDL specialist for prior-art mapping'],
  },
  {
    category: 'Traditional Knowledge',
    risk: 'High' as const,
    title: 'TK Overlap — High Concern',
    detail: 'Classical Ayurvedic texts (Charaka Samhita, Sushruta Samhita) document Withania somnifera use in formulations structurally similar to the product. TKDL reference TK-AW-0234 directly covers therapeutic use.',
    evidence: ['EVID-014'],
    actions: ['Document distinction from classical formulations', 'Consult TK expert for impact assessment', 'Review prior-art response strategy'],
  },
  {
    category: 'ABS Compliance',
    risk: 'High' as const,
    title: 'ABS Compliance — Action Required',
    detail: 'Ashwagandha sourced from a notified area triggers Section 6 of the Biological Diversity Act. NBA prior approval is required before filing any IP application. ABS workflow is 60% complete.',
    evidence: ['EVID-021'],
    actions: ['Submit NBA pre-approval application (Form I)', 'Negotiate benefit-sharing agreement with local communities', 'Document resource provenance chain'],
  },
  {
    category: 'Regulatory',
    risk: 'Low' as const,
    title: 'Regulatory Classification — AYUSH Pathway',
    detail: 'Product is correctly classifiable as a Proprietary Ayurvedic Medicine under AYUSH. Schedule E(1) substances labelling requirements apply. No Phytopharmaceutical route indicators detected.',
    evidence: ['EVID-048'],
    actions: ['Complete Schedule E(1) labelling review', 'File Form 26 with CDSCO for manufacturing licence'],
  },
]

const evidenceItems = [
  { id: 'EVID-001', source: 'Patents Act 1970', framework: 'Patent', section: '§3(p)', confidence: 94, finding: 'Prior-art similarity — TK exclusion' },
  { id: 'EVID-014', source: 'TKDL Database', framework: 'TK', section: 'TK-AW-0234', confidence: 89, finding: 'Classical TK overlap — Charaka Samhita' },
  { id: 'EVID-021', source: 'Biodiversity Act 2002', framework: 'ABS', section: 'Rule 4', confidence: 91, finding: 'Biological-resource relationship — NBA required' },
  { id: 'EVID-048', source: 'D&C Act — Schedule E(1)', framework: 'AYUSH', section: 'Sched. E(1)', confidence: 96, finding: 'Labelling requirement applies' },
  { id: 'EVID-052', source: 'Patent IN202311045231', framework: 'Patent', section: 'Claims 1–4', confidence: 82, finding: 'Overlapping extraction claim — novelty concern' },
]

const riskColors = {
  Low:      { color: '#6B8F71', bg: '#E5EEE6', border: '#B8D4BB' },
  Moderate: { color: '#173F2A', bg: '#FCEAE5', border: '#F0B5A8' },
  High:     { color: '#A94350', bg: '#FCEAE5', border: '#F0B5A8' },
  Review:   { color: '#CF5A3D', bg: '#FCEAE5', border: '#F2B8BC' },
}

function EscalationModal({ onClose, onNavigate }: { onClose: () => void; onNavigate: (p: PageId) => void }) {
  const [expertType, setExpertType] = useState('IP Attorney')
  const [urgency, setUrgency] = useState('standard')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit() {
    setLoading(true)
    setTimeout(() => { setLoading(false); setSubmitted(true) }, 1000)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(48, 33, 31, 0.45)',
        zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.18s ease',
      }}
      onPointerDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '12px',
        boxShadow: '0 12px 40px rgba(23, 63, 42, 0.18)',
        width: '480px', maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto',
        animation: 'fadeSlideUp 0.22s ease',
      }}>
        {submitted ? (
          <div style={{ padding: '36px 32px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#E5EEE6', border: '1px solid #B8D4BB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px' }}>✓</div>
            <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '22px', color: '#173F2A', margin: '0 0 8px', fontWeight: 400 }}>Escalation Submitted</h3>
            <p style={{ fontSize: '13px', color: '#4A5E51', margin: '0 0 24px', lineHeight: 1.5, fontFamily: 'Manrope, system-ui, sans-serif' }}>
              Your case has been assigned to a {expertType}. You will be contacted within 2 business days. Reference: <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>ESC-2026-{Math.floor(Math.random() * 900 + 100)}</span>
            </p>
            <button onClick={onClose} style={{ padding: '9px 24px', background: '#173F2A', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif' }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #DFC0B7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', color: '#173F2A', margin: '0 0 3px', fontWeight: 400 }}>Escalate to Expert</h3>
                <p style={{ fontSize: '12px', color: '#A89590', margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>AN-2026-0891 · Ashwagandha Advanced Extract</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: '1px solid #DFC0B7', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', color: '#4A5E51', fontFamily: 'Manrope, system-ui, sans-serif' }}>✕ Close</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ padding: '12px 14px', background: '#FCEAE5', border: '1px solid #F0B5A8', borderRadius: '6px', fontSize: '12.5px', color: '#173F2A', lineHeight: 1.5, fontFamily: 'Manrope, system-ui, sans-serif' }}>
                <strong>Auto-generated case summary:</strong> Moderate IP risk. TK overlap under §3(p), NBA pre-approval pending, EVID-001/014/021 require expert review before patent filing.
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4A5E51', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Manrope, system-ui, sans-serif' }}>Expert Type</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['IP Attorney', 'Patent Agent', 'AYUSH Specialist', 'Biodiversity Expert'].map(t => (
                    <button key={t} onClick={() => setExpertType(t)} style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${expertType === t ? '#173F2A' : '#DFC0B7'}`, background: expertType === t ? '#173F2A' : '#FDF2EC', color: expertType === t ? '#FFFFFF' : '#4A5E51', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', transition: 'all 0.12s' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4A5E51', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Manrope, system-ui, sans-serif' }}>Urgency</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ val: 'standard', label: 'Standard (2–3 days)' }, { val: 'urgent', label: 'Urgent (same day)' }].map(o => (
                    <button key={o.val} onClick={() => setUrgency(o.val)} style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${urgency === o.val ? '#E9684F' : '#DFC0B7'}`, background: urgency === o.val ? '#E9684F' : '#FDF2EC', color: urgency === o.val ? '#FFFFFF' : '#4A5E51', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', transition: 'all 0.12s' }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#4A5E51', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Manrope, system-ui, sans-serif' }}>Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe your specific concerns or questions for the expert…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #DFC0B7', borderRadius: '6px', fontSize: '13px', fontFamily: 'Manrope, system-ui, sans-serif', color: '#173F2A', background: '#FBF6E9', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#173F2A' }}
                  onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#DFC0B7' }}
                />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #DFC0B7', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '9px 18px', background: '#FDF2EC', border: '1px solid #DFC0B7', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: '#4A5E51', cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif' }}>Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ padding: '9px 20px', background: loading ? '#8AB5A0' : '#173F2A', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#FFFFFF', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#CF5A3D' }}
                onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#173F2A' }}
              >
                {loading && <svg width="12" height="12" viewBox="0 0 14 14" style={{ animation: 'spin 0.8s linear infinite' }}><circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" /><path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                {loading ? 'Submitting…' : 'Submit Escalation'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

const nextSteps = [
  { num: '01', label: 'Conduct detailed prior-art search', sub: 'Map TKDL records and active patent claims' },
  { num: '02', label: 'Verify traditional knowledge overlap', sub: 'Review §3(p) risk with TK specialist' },
  { num: '03', label: 'Complete applicable ABS assessment', sub: 'Submit NBA pre-approval Form I' },
  { num: '04', label: 'Confirm AYUSH regulatory classification', sub: 'Review Schedule E(1) labelling requirements' },
  { num: '05', label: 'Consult an IP facilitator before filing', sub: 'Engage registered patent agent' },
]

export default function AssessmentDetail({ onNavigate }: AssessmentDetailProps) {
  const [showEscalation, setShowEscalation] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#A89590', fontFamily: 'Manrope, system-ui, sans-serif' }}>
        <button onClick={() => onNavigate('assessments')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#173F2A', fontSize: '12px', fontWeight: 500, fontFamily: 'Manrope, system-ui, sans-serif', padding: 0 }}>
          My Assessments
        </button>
        <span>›</span>
        <span style={{ color: '#173F2A', fontWeight: 500 }}>{assessment.id}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', color: '#173F2A', margin: '0 0 4px', fontWeight: 400, letterSpacing: '-0.02em' }}>
            {assessment.product}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#7A9285' }}>{assessment.id}</span>
            <span style={{ fontSize: '11px', color: '#7A9285', fontFamily: 'Manrope, system-ui, sans-serif' }}>{assessment.classification}</span>
            <span style={{ fontSize: '11px', color: '#7A9285', fontFamily: 'Manrope, system-ui, sans-serif' }}>Assessed {assessment.date}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button style={{
            padding: '8px 16px', background: '#FDF2EC', border: '1px solid #DFC0B7', borderRadius: '6px',
            color: '#4A5E51', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Manrope, system-ui, sans-serif',
          }}>
            Export Report
          </button>
          <button style={{
            padding: '8px 16px', background: '#173F2A', border: 'none', borderRadius: '6px',
            color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Manrope, system-ui, sans-serif',
          }}>
            Request Expert Review
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', padding: '16px 20px', boxShadow: S, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Manrope, system-ui, sans-serif' }}>Overall Risk</div>
          <RiskMeter level={assessment.riskLevel} />
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Manrope, system-ui, sans-serif' }}>Status</div>
          <StatusBadge status={assessment.status} size="md" />
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Manrope, system-ui, sans-serif' }}>Confidence</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '5px', borderRadius: '3px', backgroundColor: '#F3C9BD', overflow: 'hidden' }}>
              <div style={{ width: `${assessment.confidence}%`, height: '100%', borderRadius: '3px', backgroundColor: '#6B8F71' }} />
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#173F2A' }}>{assessment.confidence}%</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Manrope, system-ui, sans-serif' }}>Frameworks Applied</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {assessment.frameworks.map(f => (
              <span key={f} style={{ fontSize: '10px', fontWeight: 500, padding: '2px 6px', borderRadius: '3px', backgroundColor: '#F3C9BD', color: '#4A5E51', fontFamily: 'Manrope, system-ui, sans-serif' }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Executive summary */}
      <div style={{ background: '#F7DED5', border: '1px solid #DFC0B7', borderRadius: '6px', padding: '14px 18px', borderLeft: '3px solid #E9684F' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#A89590', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '5px', fontFamily: 'Manrope, system-ui, sans-serif' }}>Executive Summary</div>
        <p style={{ fontSize: '13px', color: '#173F2A', lineHeight: 1.6, margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>{assessment.summary}</p>
      </div>

      {/* Findings by category */}
      <div>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', color: '#173F2A', margin: '0 0 12px', fontWeight: 400 }}>Assessment Findings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {findings.map(finding => {
            const rc = riskColors[finding.risk as keyof typeof riskColors] ?? riskColors.Moderate
            return (
              <div key={finding.category} style={{ background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', overflow: 'hidden', boxShadow: S }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F2DDD7', backgroundColor: '#F7EDE5', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                    backgroundColor: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
                    fontFamily: 'Manrope, system-ui, sans-serif',
                  }}>
                    {finding.risk}
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#173F2A', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    {finding.title}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#7A9285', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    {finding.category}
                  </span>
                </div>
                <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#173F2A', lineHeight: 1.5, margin: '0 0 12px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                      {finding.detail}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {finding.evidence.map(evId => (
                        <span key={evId} style={{
                          fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 500,
                          padding: '2px 7px', borderRadius: '3px',
                          backgroundColor: '#E8EFE9', color: '#173F2A',
                        }}>
                          {evId}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                      Recommended Actions
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {finding.actions.map((action, j) => (
                        <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12.5px', color: '#173F2A', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                          <span style={{ color: '#173F2A', fontWeight: 700, flexShrink: 0, lineHeight: 1.4 }}>→</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recommended Next Steps */}
      <div>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', color: '#173F2A', margin: '0 0 14px', fontWeight: 400 }}>Recommended Next Steps</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {nextSteps.map(step => (
            <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '12px 16px', background: '#FDF2EC', border: '1px solid #DFC0B7', borderRadius: '6px' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#173F2A', flexShrink: 0, lineHeight: 1.4 }}>{step.num}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#173F2A', fontFamily: 'Manrope, system-ui, sans-serif' }}>{step.label}</div>
                <div style={{ fontSize: '11px', color: '#4A5E51', fontFamily: 'Manrope, system-ui, sans-serif', marginTop: '2px' }}>{step.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onNavigate('reports')}
            style={{ padding: '10px 20px', background: '#173F2A', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', transition: 'background 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#CF5A3D' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#173F2A' }}
          >
            Generate Detailed Report
          </button>
          <button
            onClick={() => setShowEscalation(true)}
            style={{ padding: '10px 20px', background: '#FFFDF8', color: '#E9684F', border: '1px solid #E9684F', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E9684F'; (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFDF8'; (e.currentTarget as HTMLButtonElement).style.color = '#E9684F' }}
          >
            Escalate to Human Expert
          </button>
        </div>
      </div>

      {/* Evidence table */}
      <div>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', color: '#173F2A', margin: '0 0 12px', fontWeight: 400 }}>Evidence & Citations</h2>
        <div style={{ background: '#FDF2EC', border: '1px solid #DFC0B7', borderRadius: '8px', overflow: 'hidden', boxShadow: S }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F7EDE5' }}>
                {['Evidence ID', 'Source', 'Framework', 'Section', 'Confidence', 'Finding'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #DFC0B7', whiteSpace: 'nowrap', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evidenceItems.map((ev, i) => (
                <tr key={ev.id} style={{ borderBottom: i < evidenceItems.length - 1 ? '1px solid #F2DDD7' : 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#F7EDE5' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent' }}
                >
                  <td style={{ padding: '10px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 500, color: '#173F2A', whiteSpace: 'nowrap' }}>{ev.id}</td>
                  <td style={{ padding: '10px 14px', fontSize: '12.5px', color: '#173F2A', fontFamily: 'Manrope, system-ui, sans-serif' }}>{ev.source}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '3px', backgroundColor: '#E8EFE9', color: '#173F2A', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                      {ev.framework}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#7A9285', whiteSpace: 'nowrap' }}>{ev.section}</td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 600, color: ev.confidence >= 90 ? '#6B8F71' : ev.confidence >= 80 ? '#6B8F71' : '#E9684F' }}>
                      {ev.confidence}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12.5px', color: '#4A5E51', fontFamily: 'Manrope, system-ui, sans-serif' }}>{ev.finding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showEscalation && <EscalationModal onClose={() => setShowEscalation(false)} onNavigate={onNavigate} />}
    </div>
  )
}
