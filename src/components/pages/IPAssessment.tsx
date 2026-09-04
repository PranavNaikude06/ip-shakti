import { useState } from 'react'
import RiskMeter from '@/components/ui/RiskMeter'
import type { RiskLevel, PageId } from '@/data/mockData'

interface IPCategory {
  id: string
  name: string
  overallRisk: RiskLevel
  description: string
  criteria: { label: string; value: string; status: 'ok' | 'warn' | 'info' }[]
}

const categories: IPCategory[] = [
  {
    id: 'patent',
    name: 'Patent',
    overallRisk: 'Moderate',
    description: 'Evaluate novelty, inventive step, and prior art for patent eligibility.',
    criteria: [
      { label: 'Novelty', value: 'Partial — known herb, novel extraction', status: 'warn' },
      { label: 'Inventive Step', value: 'Present — advanced extraction method', status: 'ok' },
      { label: 'Industrial Applicability', value: 'Yes — commercial manufacture feasible', status: 'ok' },
      { label: 'Prior Art', value: 'Found — TKDL TK-AW-0234, IN202311045231', status: 'warn' },
      { label: 'TK Consideration', value: 'Overlap detected — §3(p) applies', status: 'warn' },
    ],
  },
  {
    id: 'trademark',
    name: 'Trademark',
    overallRisk: 'Low',
    description: 'Brand name and logo assessment for registration eligibility.',
    criteria: [
      { label: 'Brand Name', value: 'Ashwagandha Advanced Extract — descriptive risk', status: 'warn' },
      { label: 'Distinctiveness', value: 'Moderate — marketing identity needed', status: 'warn' },
      { label: 'Conflicts', value: 'None identified in Classes 5 & 30', status: 'ok' },
      { label: 'Classification', value: 'Class 5 (pharmaceuticals), Class 30 (food)', status: 'info' },
    ],
  },
  {
    id: 'gi',
    name: 'Geographical Indication',
    overallRisk: 'Low',
    description: 'Assess GI eligibility based on geographic association and product characteristics.',
    criteria: [
      { label: 'Geographic Link', value: 'Rajasthan / Maharashtra origin', status: 'info' },
      { label: 'Product Characteristics', value: 'Tied to regional climate and soil', status: 'ok' },
      { label: 'Existing GI', value: 'No registered GI conflicts found', status: 'ok' },
      { label: 'GI Eligibility', value: 'Potentially eligible — further assessment recommended', status: 'info' },
    ],
  },
  {
    id: 'design',
    name: 'Design',
    overallRisk: 'Low',
    description: 'Protect the visual appearance of product packaging and industrial design.',
    criteria: [
      { label: 'Packaging Design', value: 'Novel visual treatment — registrable', status: 'ok' },
      { label: 'Label Artwork', value: 'Original — copyright + design overlap', status: 'ok' },
      { label: 'Prior Designs', value: 'No conflicts found in search', status: 'ok' },
      { label: 'Functional Elements', value: 'Excluded from design protection', status: 'info' },
    ],
  },
  {
    id: 'copyright',
    name: 'Copyright',
    overallRisk: 'Low',
    description: 'Identify copyrightable elements in documentation, software, and creative materials.',
    criteria: [
      { label: 'Product Documentation', value: 'Automatically protected on creation', status: 'ok' },
      { label: 'Software / Algorithm', value: 'Analysis engine — protectable expression', status: 'ok' },
      { label: 'Marketing Literature', value: 'Original — protected', status: 'ok' },
      { label: 'Classical Text Quotation', value: 'Public domain — no restriction', status: 'info' },
    ],
  },
  {
    id: 'trade-secret',
    name: 'Trade Secret',
    overallRisk: 'Low',
    description: 'Protect confidential formulation and process information through non-disclosure.',
    criteria: [
      { label: 'Formulation Details', value: 'Confidential — trade secret protection applicable', status: 'ok' },
      { label: 'Extraction Process', value: 'Proprietary — NDA recommended with suppliers', status: 'ok' },
      { label: 'Supplier Information', value: 'Confidentiality agreements in place?', status: 'warn' },
      { label: 'Employee Access', value: 'Restrict to need-to-know basis', status: 'info' },
    ],
  },
]

const statusIcon = (s: 'ok' | 'warn' | 'info') => {
  if (s === 'ok') return { symbol: '✓', color: '#718A78', bg: '#DCE8DF' }
  if (s === 'warn') return { symbol: '⚠', color: '#CF5A3D', bg: '#FCEAE5' }
  return { symbol: '→', color: '#173F2A', bg: '#E8EFE9' }
}

export default function IPAssessment({ onNavigate }: { onNavigate?: (p: PageId) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', color: '#173F2A', marginBottom: '6px', fontWeight: 400 }}>
          IP Assessment
        </h1>
        <p style={{ fontSize: '14px', color: '#4A5E51' }}>
          Evaluate potential intellectual-property protection and existing rights associated with your Ayurvedic innovation.
        </p>
      </div>

      {/* Overall Risk Summary */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DFC0B7',
          borderRadius: '12px',
          boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#7A9285', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Overall IP Risk — Ashwagandha Advanced Extract</div>
          <div style={{ width: '300px' }}>
            <RiskMeter level="Moderate" />
          </div>
        </div>
        <div style={{ height: '40px', width: '1px', backgroundColor: '#DFC0B7' }} />
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#A89590', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Primary Risk Factors</div>
          <p style={{ fontSize: '13px', color: '#173F2A', margin: 0, lineHeight: '1.5' }}>
            Traditional knowledge overlap (§3(p)) and existing prior art (TKDL TK-AW-0234) require attention before filing.<br />
            Novel extraction process may support a limited patent claim if differentiated adequately.
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => onNavigate?.('reports')}
            className="btn-interact btn-green"
            style={{
              padding: '10px 20px',
              backgroundColor: '#173F2A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Manrope, system-ui, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            Generate IP Report
          </button>
        </div>
      </div>

      {/* IP Category Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {categories.map(cat => (
          <div
            key={cat.id}
            style={{
              background: '#FFFDF8',
              border: '1px solid #DFC0B7',
              borderRadius: '12px',
              boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
              overflow: 'hidden',
              transition: 'box-shadow 0.15s',
            }}
          >
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #F7DED5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#173F2A', margin: 0 }}>{cat.name}</h3>
              <div style={{ width: '120px' }}>
                <RiskMeter level={cat.overallRisk} />
              </div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <p style={{ fontSize: '12px', color: '#7A9285', margin: '0 0 12px', lineHeight: '1.4' }}>{cat.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cat.criteria.map(c => {
                  const ic = statusIcon(c.status)
                  return (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: ic.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: ic.color,
                          flexShrink: 0,
                          marginTop: '1px',
                          fontWeight: 700,
                        }}
                      >
                        {ic.symbol}
                      </span>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#4A5E51' }}>{c.label}</div>
                        <div style={{ fontSize: '11px', color: '#173F2A', lineHeight: '1.4' }}>{c.value}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid #F7EDE5' }}>
              <button
                onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                style={{ fontSize: '12px', fontWeight: 600, color: '#173F2A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', padding: 0 }}
              >
                {expanded === cat.id ? 'Hide details ↑' : 'View detailed assessment →'}
              </button>
              {expanded === cat.id && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#FBF6E9', borderRadius: '8px', fontSize: '12px', color: '#4A5E51', lineHeight: '1.5' }}>
                  Detailed assessment for <strong>{cat.name}</strong> based on Ashwagandha Advanced Extract formulation. Risk level: <strong>{cat.overallRisk}</strong>.<br /><br />
                  Recommend consulting a registered IP attorney before filing. This assessment is for decision support only and does not constitute legal advice.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
