import { useState, useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import RiskMeter from '@/components/ui/RiskMeter'
import { KnowledgeGraphMini } from '@/components/pages/KnowledgeGraph'
import { sourceRecords, relevantConnections } from '@/data/mockData'
import type { PageId } from '@/data/mockData'

type Phase = 'form' | 'analyzing' | 'result'

interface AnswerCard {
  question: string
  answer: string
  sourceLabel: string
  sourceRef: string
}

interface NewProductAnalysisProps {
  onNavigate: (page: PageId) => void
}

const pipelineSteps = [
  'Extracting product information and classifying ingredients…',
  'Retrieving applicable regulations and AYUSH guidelines…',
  'Searching patent databases, IPO India and TKDL…',
  'Analysing traditional knowledge overlap and prior art…',
  'Evaluating ABS compliance requirements under BDA 2002…',
  'Generating structured assessment report…',
]

const mockAnswers: { keywords: string[]; card: AnswerCard }[] = [
  {
    keywords: ['patent', '3p', 'section 3'],
    card: {
      question: '',
      answer: 'Patents Act §3(p) excludes inventions that are effectively an aggregation or duplication of known properties of traditionally known components. Your formulation uses Ashwagandha — a herb documented in TKDL TK-AW-0234 — which creates a §3(p) risk. A novel extraction process may still be patentable if adequately differentiated from documented TK.',
      sourceLabel: 'Patents Act 1970 — §3(p)',
      sourceRef: 'EVID-001',
    },
  },
  {
    keywords: ['abs', 'biodiversity', 'nba', 'biological diversity'],
    card: {
      question: '',
      answer: 'The Biological Diversity Act 2002 (§3 & §6) requires NBA prior approval before applying for any IP rights based on biological resources from India. Ashwagandha (Withania somnifera) sourced from India triggers this requirement. NBA approval must be obtained before filing — failure to disclose is grounds for patent revocation.',
      sourceLabel: 'Biological Diversity Act 2002 — §3 & §6',
      sourceRef: 'EVID-002',
    },
  },
  {
    keywords: ['traditional knowledge', 'tkdl', 'tk', 'traditional'],
    card: {
      question: '',
      answer: 'TKDL TK-AW-0234 documents Ashwagandha-based formulations as described in Charaka Samhita and Sushruta Samhita. This reference is accessible to major patent offices (EPO, USPTO, IPO India) as prior art. The documented traditional use does not automatically bar a patent, but the novel claim must be clearly differentiated from the classical formulation.',
      sourceLabel: 'TKDL Reference TK-AW-0234 — CSIR',
      sourceRef: 'EVID-004',
    },
  },
  {
    keywords: ['regulatory', 'ayush', 'classification', 'drugs'],
    card: {
      question: '',
      answer: 'Your product is classified as a Proprietary Ayurvedic Medicine (91% confidence) under the Drugs & Cosmetics Act. This pathway requires a valid AYUSH manufacturing licence, GMP certification per Schedule M, and labelling per Schedule J. Therapeutic claims must conform to Schedule V approved indications only.',
      sourceLabel: 'Drugs & Cosmetics Act — Schedule E(1)',
      sourceRef: 'EVID-003',
    },
  },
]

function getAnswerCard(query: string): AnswerCard {
  const lower = query.toLowerCase()
  const match = mockAnswers.find(a => a.keywords.some(kw => lower.includes(kw)))
  if (match) return { ...match.card, question: query }
  return {
    question: query,
    answer: 'Based on available evidence, this formulation has been assessed against AYUSH regulations, IP law (Patents Act §3(p), TK databases), and ABS requirements (BDA 2002). One item requires review before filing: ABS disclosure to the National Biodiversity Authority is mandatory. Consult the Sources page for full evidence citations.',
    sourceLabel: 'Assessment summary — multiple sources',
    sourceRef: 'EVID-001',
  }
}

function AnalyzingScreen({ onComplete }: { onComplete: () => void }) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    pipelineSteps.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setCompletedSteps(prev => [...prev, i])
        if (i === pipelineSteps.length - 1) {
          timers.push(setTimeout(onComplete, 600))
        }
      }, (i + 1) * 700))
    })
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', padding: '60px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '26px', color: '#173F2A', margin: '0 0 8px', fontWeight: 400 }}>
          Analysing Your Product
        </h2>
        <p style={{ fontSize: '14px', color: '#4A5E51', margin: 0 }}>
          Running IP, biodiversity and regulatory assessment pipeline…
        </p>
      </div>
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DFC0B7',
          borderRadius: '14px',
          boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
          padding: '28px 36px',
          width: '100%',
          maxWidth: '540px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {pipelineSteps.map((step, i) => {
          const done = completedSteps.includes(i)
          const isActive = !done && completedSteps.length === i
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: `2px solid ${done ? '#173F2A' : isActive ? '#173F2A' : '#DFC0B7'}`,
                  backgroundColor: done ? '#173F2A' : isActive ? '#FCEAE5' : '#FBF6E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: done ? '#FFFFFF' : isActive ? '#173F2A' : '#A89590',
                  flexShrink: 0,
                  transition: 'all 0.3s',
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: done ? 500 : isActive ? 600 : 400,
                  color: done ? '#173F2A' : isActive ? '#173F2A' : '#A89590',
                  transition: 'all 0.3s',
                }}
              >
                {step}
              </span>
              {isActive && (
                <span style={{ fontSize: '10px', color: '#173F2A', fontWeight: 600, backgroundColor: '#FCEAE5', padding: '1px 6px', borderRadius: '8px', border: '1px solid #F0B5A8', marginLeft: 'auto', flexShrink: 0 }}>
                  Running…
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AssessmentResult({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const [insightQuery, setInsightQuery] = useState('')
  const [answerCard, setAnswerCard] = useState<AnswerCard | null>(null)

  const handleInsightQuery = () => {
    if (!insightQuery.trim()) return
    setAnswerCard(getAnswerCard(insightQuery))
    setInsightQuery('')
  }

  const assessmentCards = [
    {
      title: 'Product Classification',
      value: 'Proprietary Ayurvedic Medicine',
      sub: '91% confidence · Likely',
      accent: '#173F2A',
      detail: '',
    },
    {
      title: 'Patentability',
      value: 'Medium Risk',
      sub: 'Novel extraction process may require prior-art assessment',
      accent: '#E9684F',
      riskLevel: 'Moderate' as const,
    },
    {
      title: 'Traditional Knowledge',
      value: 'Potential Overlap',
      sub: 'Traditional-use references detected — TKDL TK-AW-0234',
      accent: '#CF5A3D',
    },
    {
      title: 'ABS / Biodiversity',
      value: 'Review Required',
      sub: 'Biological resource identified — NBA prior approval needed',
      accent: '#CF5A3D',
    },
    {
      title: 'Regulatory Pathway',
      value: 'AYUSH',
      sub: 'Proprietary Ayurvedic Medicine route — further checks required',
      accent: '#173F2A',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Assessment Overview */}
      <div>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '22px', color: '#173F2A', marginBottom: '14px', fontWeight: 400 }}>
          Assessment Overview
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {assessmentCards.map(card => (
            <div
              key={card.title}
              style={{
                background: '#FFFDF8',
                border: '1px solid #DFC0B7',
                borderTop: `3px solid ${card.accent}`,
                borderRadius: '10px',
                boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#A89590', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>{card.title}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#173F2A', marginBottom: '6px' }}>{card.value}</div>
              {'riskLevel' in card && card.riskLevel && (
                <div style={{ marginBottom: '6px' }}>
                  <RiskMeter level={card.riskLevel} />
                </div>
              )}
              <p style={{ fontSize: '11px', color: '#4A5E51', margin: 0, lineHeight: '1.4' }}>{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: IP Insight Panel + Knowledge Graph */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
        {/* IP Insight Panel */}
        <div
          style={{
            background: '#FFFDF8',
            border: '1px solid #DFC0B7',
            borderRadius: '12px',
            boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F7DED5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#173F2A', margin: 0 }}>IP Insight Panel</h3>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#173F2A', backgroundColor: '#FCEAE5', padding: '2px 8px', borderRadius: '10px', border: '1px solid #F0B5A8' }}>
              Evidence-grounded AI
            </span>
          </div>

          {/* Pipeline Status */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F7EDE5' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#7A9285', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>Analysis Pipeline</div>
            {[
              { label: 'Product information extracted', ok: true },
              { label: 'Relevant regulations retrieved', ok: true },
              { label: 'Prior-art search completed', ok: true },
              { label: 'ABS assessment required', ok: false },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: item.ok ? '#DCE8DF' : '#FCEAE5',
                    border: `1px solid ${item.ok ? '#B8CFC0' : '#F0B5A8'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: item.ok ? '#718A78' : '#CF5A3D',
                    flexShrink: 0,
                  }}
                >
                  {item.ok ? '✓' : '⚠'}
                </span>
                <span style={{ fontSize: '12px', color: item.ok ? '#173F2A' : '#CF5A3D', fontWeight: item.ok ? 400 : 500 }}>{item.label}</span>
              </div>
            ))}
            <p style={{ fontSize: '12px', color: '#4A5E51', margin: '10px 0 0', lineHeight: '1.5', fontStyle: 'italic' }}>
              This formulation has been analysed against available IP, traditional-knowledge and regulatory sources. One item requires review before filing.
            </p>
          </div>

          {/* Query Field */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#4A5E51', marginBottom: '8px' }}>Ask about this analysis</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={insightQuery}
                onChange={e => setInsightQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleInsightQuery() }}
                placeholder="Ask about patents, ABS, TK, regulatory…"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #DFC0B7',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'Manrope, system-ui, sans-serif',
                  color: '#173F2A',
                  outline: 'none',
                  backgroundColor: '#FBF6E9',
                }}
                onFocus={e => (e.target.style.borderColor = '#173F2A')}
                onBlur={e => (e.target.style.borderColor = '#DFC0B7')}
              />
              <button
                onClick={handleInsightQuery}
                style={{
                  padding: '8px 16px',
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
                Ask <span className="arr">{'→'}</span>
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#7A9285', margin: '6px 0 0' }}>Try: "What does §3(p) mean for my product?" or "Is NBA approval needed?"</p>

            {/* Answer Card */}
            {answerCard && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '14px 16px',
                  backgroundColor: '#FBF6E9',
                  border: '1px solid #DFC0B7',
                  borderLeft: '3px solid #173F2A',
                  borderRadius: '0 10px 10px 0',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#7A9285', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Q: {answerCard.question}
                </div>
                <p style={{ fontSize: '13px', color: '#173F2A', margin: '0 0 10px', lineHeight: '1.5' }}>
                  {answerCard.answer}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#173F2A', backgroundColor: '#FCEAE5', padding: '2px 8px', borderRadius: '8px', border: '1px solid #F0B5A8' }}>
                    {answerCard.sourceLabel}
                  </span>
                  <button
                    style={{ fontSize: '11px', color: '#4A5E51', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', padding: 0 }}
                    onClick={() => {}}
                  >
                    View full evidence →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Graph + Connections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: '#FFFDF8',
              border: '1px solid #DFC0B7',
              borderRadius: '12px',
              boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F7DED5' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#173F2A', margin: 0 }}>Relevant Knowledge & Prior Art</h3>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <KnowledgeGraphMini />
            </div>
          </div>

          {/* Relevance connections */}
          <div
            style={{
              background: '#FFFDF8',
              border: '1px solid #DFC0B7',
              borderRadius: '12px',
              boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#7A9285', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Top Relevant Connections</div>
            {relevantConnections.map((conn, i) => (
              <div key={i} style={{ marginBottom: i < relevantConnections.length - 1 ? '12px' : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#173F2A' }}>{conn.label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, color: conn.color }}>{conn.relevance}%</span>
                </div>
                <div style={{ height: '3px', backgroundColor: '#F7EDE5', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${conn.relevance}%`, height: '100%', backgroundColor: conn.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Table */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DFC0B7',
          borderRadius: '12px',
          boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F7DED5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#173F2A', margin: 0 }}>Evidence & Sources</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#173F2A', backgroundColor: '#FCEAE5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #F0B5A8' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3" /><path d="M6 3.5v3l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            Evidence-backed response
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#FBF6E9' }}>
                {['Authority', 'Document', 'Provision', 'Effective Date', 'Status', 'Used For'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#7A9285', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1px solid #DFC0B7', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sourceRecords.slice(0, 4).map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < 3 ? '1px solid #F7DED5' : 'none' }}>
                  <td style={{ padding: '11px 16px', fontWeight: 500, color: '#173F2A', whiteSpace: 'nowrap' }}>{r.authority}</td>
                  <td style={{ padding: '11px 16px', color: '#4A5E51' }}>{r.document}</td>
                  <td style={{ padding: '11px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#4A5E51' }}>{r.section}</td>
                  <td style={{ padding: '11px 16px', color: '#A89590', whiteSpace: 'nowrap' }}>{r.effectiveDate}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {r.statuses.slice(0, 2).map(s => <StatusBadge key={s} status={s} />)}
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', color: '#4A5E51', fontSize: '12px' }}>{r.usedFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Next Steps */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DFC0B7',
          borderRadius: '12px',
          boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
          padding: '24px',
        }}
      >
        <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', color: '#173F2A', margin: '0 0 18px', fontWeight: 400 }}>
          Recommended Next Steps
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {[
            'Conduct detailed prior-art search across IPO India, TKDL, EPO and USPTO databases',
            'Verify traditional knowledge overlap with a TKDL-specialist before claim drafting',
            'Complete applicable ABS assessment and obtain NBA prior approval',
            'Confirm AYUSH regulatory classification via CDSCO pre-submission consultation',
            'Consult an IP facilitator or Patent Agent before filing any application',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#FCEAE5',
                  border: '1px solid #F0B5A8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#173F2A',
                  flexShrink: 0,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <p style={{ fontSize: '13px', color: '#173F2A', margin: '4px 0 0', lineHeight: '1.5' }}>{step}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onNavigate('reports')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#173F2A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Manrope, system-ui, sans-serif',
            }}
          >
            Generate Detailed Report
          </button>
          <button
            onClick={() => onNavigate('intelligence')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#FFFDF8',
              color: '#E9684F',
              border: '1.5px solid #E9684F',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Manrope, system-ui, sans-serif',
            }}
          >
            Escalate to Human Expert
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewProductAnalysis({ onNavigate }: NewProductAnalysisProps) {
  const [phase, setPhase] = useState<Phase>('form')
  const [productName, setProductName] = useState('Ashwagandha Advanced Extract')
  const [ingredients, setIngredients] = useState<string[]>(['Ashwagandha', 'Water', 'Botanical extract'])
  const [ingredientInput, setIngredientInput] = useState('')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState<'classical' | 'proprietary' | 'novel'>('proprietary')
  const [manufacturing, setManufacturing] = useState('')
  const [claims, setClaims] = useState('')
  const [targetMarket, setTargetMarket] = useState<'india' | 'international'>('india')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addIngredient = (val: string) => {
    const trimmed = val.trim()
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients(prev => [...prev, trimmed])
    }
    setIngredientInput('')
  }

  const removeIngredient = (ing: string) => {
    setIngredients(prev => prev.filter(i => i !== ing))
  }

  const handleIngredientKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addIngredient(ingredientInput)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', color: '#173F2A', marginBottom: '6px', fontWeight: 400 }}>
            {phase === 'result' ? 'Assessment Results' : 'Analyse Your Ayurvedic Product'}
          </h1>
          <p style={{ fontSize: '14px', color: '#4A5E51' }}>
            {phase === 'result'
              ? 'Evidence-backed IP, biodiversity and regulatory assessment for Ashwagandha Advanced Extract.'
              : 'Get an evidence-backed IP, biodiversity and regulatory assessment.'}
          </p>
        </div>
        {phase === 'result' && (
          <button
            onClick={() => setPhase('form')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FDF2EC',
              color: '#4A5E51',
              border: '1px solid #DFC0B7',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Manrope, system-ui, sans-serif',
            }}
          >
            ← New Analysis
          </button>
        )}
      </div>

      {/* Phase: Form */}
      {phase === 'form' && (
        <div
          style={{
            background: '#FFFDF8',
            border: '1px solid #DFC0B7',
            borderRadius: '12px',
            boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F7DED5' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#173F2A', margin: 0 }}>Product Information</h2>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Product Name */}
            <div>
              <label style={labelStyle}>Product / Formulation Name</label>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="e.g. Ashwagandha Advanced Extract"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#173F2A')}
                onBlur={e => (e.target.style.borderColor = '#DFC0B7')}
              />
            </div>

            {/* Ingredients */}
            <div>
              <label style={labelStyle}>Ingredients / Biological Resources</label>
              <div
                style={{
                  border: '1px solid #DFC0B7',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#FFFDF8',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  alignItems: 'center',
                  minHeight: '44px',
                }}
              >
                {ingredients.map(ing => (
                  <span
                    key={ing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      backgroundColor: '#FCEAE5',
                      border: '1px solid #F0B5A8',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#173F2A',
                    }}
                  >
                    {ing}
                    <button
                      onClick={() => removeIngredient(ing)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#173F2A', padding: '0', fontSize: '12px', lineHeight: 1, fontWeight: 700 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={e => setIngredientInput(e.target.value)}
                  onKeyDown={handleIngredientKey}
                  onBlur={() => { if (ingredientInput) addIngredient(ingredientInput) }}
                  placeholder="Type and press Enter to add…"
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: 'Manrope, system-ui, sans-serif',
                    color: '#173F2A',
                    backgroundColor: 'transparent',
                    minWidth: '180px',
                    flex: 1,
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Formulation Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the formulation — composition, preparation method, concentration levels…"
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                onFocus={e => (e.target.style.borderColor = '#173F2A')}
                onBlur={e => (e.target.style.borderColor = '#DFC0B7')}
              />
            </div>

            {/* Source + Target Market */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Source of Formulation</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['classical', 'proprietary', 'novel'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSource(opt)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: `1.5px solid ${source === opt ? '#173F2A' : '#DFC0B7'}`,
                        borderRadius: '8px',
                        backgroundColor: source === opt ? '#FCEAE5' : '#FFFFFF',
                        color: source === opt ? '#173F2A' : '#4A5E51',
                        fontSize: '12px',
                        fontWeight: source === opt ? 600 : 400,
                        cursor: 'pointer',
                        fontFamily: 'Manrope, system-ui, sans-serif',
                        textTransform: 'capitalize',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Target Market</label>
                <div
                  style={{
                    display: 'flex',
                    borderRadius: '8px',
                    border: '1.5px solid #DFC0B7',
                    overflow: 'hidden',
                  }}
                >
                  {(['india', 'international'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setTargetMarket(m)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        backgroundColor: targetMarket === m ? '#173F2A' : '#FFFFFF',
                        color: targetMarket === m ? '#FFFFFF' : '#4A5E51',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'Manrope, system-ui, sans-serif',
                        textTransform: 'capitalize',
                        transition: 'all 0.15s',
                      }}
                    >
                      {m === 'india' ? 'India' : 'International'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Manufacturing */}
            <div>
              <label style={labelStyle}>Manufacturing / Extraction Process</label>
              <textarea
                value={manufacturing}
                onChange={e => setManufacturing(e.target.value)}
                placeholder="Describe the manufacturing methodology, extraction method, key process steps…"
                style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                onFocus={e => (e.target.style.borderColor = '#173F2A')}
                onBlur={e => (e.target.style.borderColor = '#DFC0B7')}
              />
            </div>

            {/* Claims */}
            <div>
              <label style={labelStyle}>Intended Use / Claims</label>
              <textarea
                value={claims}
                onChange={e => setClaims(e.target.value)}
                placeholder="Describe therapeutic, wellness, cosmetic or other intended claims…"
                style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                onFocus={e => (e.target.style.borderColor = '#173F2A')}
                onBlur={e => (e.target.style.borderColor = '#DFC0B7')}
              />
            </div>

            {/* Document Upload */}
            <div>
              <label style={labelStyle}>Upload Formulation / Specification Document</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0] ?? null
                  setUploadedFile(f)
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = '#173F2A' }}
                onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = uploadedFile ? '#173F2A' : '#DFC0B7' }}
                onDrop={e => {
                  e.preventDefault()
                  const f = e.dataTransfer.files?.[0] ?? null
                  setUploadedFile(f)
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = f ? '#173F2A' : '#DFC0B7'
                }}
                style={{
                  border: `2px dashed ${uploadedFile ? '#173F2A' : '#DFC0B7'}`,
                  borderRadius: '10px',
                  padding: '28px',
                  textAlign: 'center',
                  backgroundColor: uploadedFile ? '#E8EFE9' : '#FFFDF8',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background-color 0.15s',
                }}
                onMouseEnter={e => { if (!uploadedFile) (e.currentTarget as HTMLDivElement).style.borderColor = '#173F2A' }}
                onMouseLeave={e => { if (!uploadedFile) (e.currentTarget as HTMLDivElement).style.borderColor = '#DFC0B7' }}
              >
                {uploadedFile ? (
                  <>
                    <div style={{ fontSize: '22px', marginBottom: '8px' }}>✓</div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#173F2A', margin: '0 0 4px' }}>{uploadedFile.name}</p>
                    <p style={{ fontSize: '11px', color: '#4A5E51', margin: '0 0 8px' }}>
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={e => { e.stopPropagation(); setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      style={{ fontSize: '11px', color: '#A94350', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Manrope, system-ui, sans-serif' }}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#173F2A', margin: '0 0 4px' }}>Drop file here or click to browse</p>
                    <p style={{ fontSize: '12px', color: '#A89590', margin: 0 }}>PDF, DOCX, Technical specification — up to 20MB</p>
                  </>
                )}
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button
                onClick={() => setPhase('analyzing')}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#173F2A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Manrope, system-ui, sans-serif',
                  letterSpacing: '0.01em',
                }}
              >
                Analyse Product <span className="arr">{'→'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase: Analyzing */}
      {phase === 'analyzing' && (
        <AnalyzingScreen onComplete={() => setPhase('result')} />
      )}

      {/* Phase: Result */}
      {phase === 'result' && (
        <AssessmentResult onNavigate={onNavigate} />
      )}
    </div>
  )
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#4A5E51',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #DFC0B7',
  borderRadius: '8px',
  fontSize: '13px',
  fontFamily: 'Manrope, system-ui, sans-serif',
  color: '#173F2A',
  backgroundColor: '#FDF2EC',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}
