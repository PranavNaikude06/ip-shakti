import { useState } from 'react'

const S = '0 1px 3px rgba(23, 63, 42, 0.07)'

interface IntelligenceResult {
  question: string
  status: string
  statusLevel: 'moderate' | 'high' | 'low'
  finding: string
  framework: string
  frameworkDetail: string
  evidence: string[]
  reasoning: string
  recommendation: string
  confidence: number
  applicableLaw: { ref: string; title: string }[]
}

const sampleQuestions = [
  "Can my Ashwagandha formulation be patented?",
  "Is TKDL prior art a bar to my patent application?",
  "What ABS obligations apply for Guduchi sourced from a notified area?",
  "Which regulatory pathway applies to Brahmi extract — AYUSH or Phytopharmaceutical?",
]

const sampleResult: IntelligenceResult = {
  question: "Can my Ashwagandha formulation be patented?",
  status: "Patentability Assessment — Moderate Concern",
  statusLevel: 'moderate',
  finding: "The formulation faces patentability barriers under the Indian Patents Act. Section 3(p) excludes inventions that are, in effect, traditional knowledge or aggregations of known properties of traditionally known components. TKDL records document Ashwagandha use in classical texts (Charaka Samhita, Sushruta Samhita), creating a substantial prior-art obstacle.",
  framework: "Patents Act, 1970",
  frameworkDetail: "Section 3(p) — Traditional knowledge exclusion; Section 3(d) — Obviousness; Section 25 — Pre/post-grant opposition",
  evidence: ['EVID-001', 'EVID-014', 'EVID-052'],
  reasoning: "The assessment weighs three factors: (1) novelty over TKDL-documented traditional uses; (2) inventive step beyond known Ashwagandha properties; (3) technical advancement over existing patents IN202311045231 and US10123456B2. Novelty is achievable if the specific extraction methodology is genuinely novel. Inventive step is the primary barrier given the documented prior art.",
  recommendation: "File a provisional application to secure a priority date. Simultaneously engage a TKDL search specialist to map prior-art overlap precisely. Consider claiming the extraction process or a specific compound isolation rather than the formulation per se. Seek NBA clearance before filing if biological resources are sourced from India.",
  confidence: 91,
  applicableLaw: [
    { ref: 'PAT-ACT-1970', title: 'Patents Act, 1970' },
    { ref: 'BIO-ACT-2002', title: 'Biological Diversity Act, 2002' },
    { ref: 'ABS-RULE-2014', title: 'ABS Rules, 2014' },
    { ref: 'TKDL-2001', title: 'Traditional Knowledge Digital Library' },
  ],
}

const statusColors = {
  moderate: { color: '#173F2A', bg: '#FCEAE5', border: '#F0B5A8', dot: '#173F2A' },
  high:     { color: '#A94350', bg: '#FCEAE5', border: '#F0B5A8', dot: '#A94350' },
  low:      { color: '#718A78', bg: '#DCE8DF', border: '#B8CFC0', dot: '#718A78' },
}

export default function Intelligence() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<IntelligenceResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  function handleAnalyze() {
    if (!query.trim()) return
    setAnalyzing(true)
    setTimeout(() => {
      setResult({ ...sampleResult, question: query })
      setAnalyzing(false)
    }, 1400)
  }

  function handleSample(q: string) {
    setQuery(q)
    setAnalyzing(true)
    setTimeout(() => {
      setResult({ ...sampleResult, question: q })
      setAnalyzing(false)
    }, 1400)
  }

  const sc = result ? statusColors[result.statusLevel] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '30px', color: '#173F2A', margin: '0 0 4px', fontWeight: 400, letterSpacing: '-0.02em' }}>
          IP-SAKTI Intelligence
        </h1>
        <p style={{ fontSize: '13px', color: '#4A5E51', margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>
          Ask a question. Trace the reasoning. Review the evidence.
        </p>
      </div>

      {/* Query workspace */}
      <div style={{ background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', padding: '20px', boxShadow: S }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
          Research Query
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze() }}
            placeholder="Ask about patentability, ABS obligations, TK overlap, regulatory pathways, GI status…"
            rows={2}
            style={{
              flex: 1, padding: '10px 14px', border: '1px solid #DFC0B7', borderRadius: '6px',
              fontSize: '13.5px', color: '#173F2A', backgroundColor: '#FBF6E9',
              fontFamily: 'Manrope, system-ui, sans-serif', resize: 'none', outline: 'none',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={!query.trim() || analyzing}
            style={{
              padding: '0 20px', background: query.trim() ? '#173F2A' : '#DFC0B7',
              border: 'none', borderRadius: '6px', color: '#FFFFFF',
              fontSize: '13px', fontWeight: 600, cursor: query.trim() ? 'pointer' : 'default',
              fontFamily: 'Manrope, system-ui, sans-serif', flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {analyzing ? 'Analysing…' : 'Analyse'}
          </button>
        </div>
        {/* Sample questions */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#7A9285', fontFamily: 'Manrope, system-ui, sans-serif', alignSelf: 'center' }}>Try:</span>
          {sampleQuestions.map(q => (
            <button
              key={q}
              onClick={() => handleSample(q)}
              style={{
                padding: '4px 10px', background: '#F7DED5', border: '1px solid #DFC0B7',
                borderRadius: '4px', fontSize: '11.5px', color: '#4A5E51', cursor: 'pointer',
                fontFamily: 'Manrope, system-ui, sans-serif', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F2DDD7' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F7EDE5' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Analyzing indicator */}
      {analyzing && (
        <div style={{
          background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px',
          padding: '24px', textAlign: 'center', boxShadow: S,
        }}>
          <div style={{ fontSize: '13px', color: '#4A5E51', fontFamily: 'Manrope, system-ui, sans-serif', marginBottom: '12px' }}>
            Tracing applicable frameworks and evidence…
          </div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            {['Classifying query', 'Mapping frameworks', 'Retrieving evidence', 'Forming analysis'].map((step, i) => (
              <div key={step} style={{
                padding: '4px 10px', borderRadius: '4px',
                background: i === 0 ? '#173F2A' : '#F3C9BD',
                color: i === 0 ? '#FFFFFF' : '#A89590',
                fontSize: '11px', fontWeight: 500, fontFamily: 'Manrope, system-ui, sans-serif',
              }}>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result — structured intelligence report */}
      {result && !analyzing && sc && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start' }}>

          {/* Main analysis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', overflow: 'hidden', boxShadow: S }}>
            {/* Status header */}
            <div style={{ padding: '16px 20px', backgroundColor: '#F7EDE5', borderBottom: '1px solid #DFC0B7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sc.dot, flexShrink: 0 }} />
                <span style={{
                  fontSize: '13px', fontWeight: 700, color: sc.color,
                  fontFamily: 'Manrope, system-ui, sans-serif',
                }}>
                  {result.status}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#4A5E51', margin: 0, fontFamily: 'Manrope, system-ui, sans-serif', fontStyle: 'italic' }}>
                "{result.question}"
              </p>
            </div>

            {/* Analysis sections */}
            {[
              {
                label: 'Finding',
                content: result.finding,
                accent: '#173F2A',
              },
              {
                label: 'Applicable Framework',
                content: result.framework,
                sub: result.frameworkDetail,
                accent: '#173F2A',
              },
              {
                label: 'Reasoning',
                content: result.reasoning,
                accent: '#CF5A3D',
              },
              {
                label: 'Recommendation',
                content: result.recommendation,
                accent: '#718A78',
                highlight: true,
              },
            ].map((section, i) => (
              <div
                key={section.label}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < 3 ? '1px solid #F2DDD7' : 'none',
                  borderLeft: `3px solid ${section.accent}`,
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  {section.label}
                </div>
                <p style={{
                  fontSize: '13px', color: section.highlight ? '#173F2A' : '#173F2A',
                  lineHeight: 1.6, margin: 0, fontFamily: 'Manrope, system-ui, sans-serif',
                  fontWeight: section.highlight ? 500 : 400,
                }}>
                  {section.content}
                </p>
                {section.sub && (
                  <p style={{ fontSize: '12px', color: '#7A9285', margin: '6px 0 0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {section.sub}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Confidence */}
            <div style={{ background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', padding: '16px', boxShadow: S }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                Confidence
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#F3C9BD', overflow: 'hidden' }}>
                  <div style={{ width: `${result.confidence}%`, height: '100%', borderRadius: '3px', backgroundColor: '#173F2A' }} />
                </div>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '15px', fontWeight: 600, color: '#173F2A' }}>
                  {result.confidence}%
                </span>
              </div>
            </div>

            {/* Evidence used */}
            <div style={{ background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', padding: '16px', boxShadow: S }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                Evidence Used
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.evidence.map(evId => (
                  <div key={evId} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', background: '#F7EDE5', borderRadius: '5px', border: '1px solid #DFC0B7',
                  }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 500, color: '#173F2A' }}>
                      {evId}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M6 2l4 4-4 4" stroke="#7A9285" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            {/* Applicable law */}
            <div style={{ background: '#FFFDF8', border: '1px solid #DFC0B7', borderRadius: '8px', padding: '16px', boxShadow: S }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#7A9285', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
                Applicable Law
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {result.applicableLaw.map(law => (
                  <div key={law.ref} style={{ display: 'flex', flexDirection: 'column', padding: '7px 10px', background: '#F7DED5', borderRadius: '5px', border: '1px solid #DFC0B7' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#A89590' }}>{law.ref}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#173F2A', marginTop: '1px', fontFamily: 'Manrope, system-ui, sans-serif' }}>{law.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <button style={{
              width: '100%', padding: '10px', background: '#173F2A', border: 'none', borderRadius: '6px',
              color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Manrope, system-ui, sans-serif',
            }}>
              Export Intelligence Report
            </button>
            <button style={{
              width: '100%', padding: '10px', background: '#FDF2EC', border: '1px solid #DFC0B7', borderRadius: '6px',
              color: '#4A5E51', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Manrope, system-ui, sans-serif',
            }}>
              Request Expert Review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
