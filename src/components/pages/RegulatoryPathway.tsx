export default function RegulatoryPathway() {
  const categories = [
    { name: 'Classical Ayurvedic Medicine', active: false, confidence: 62 },
    { name: 'Proprietary Ayurvedic Medicine', active: true, confidence: 91 },
    { name: 'New / Non-classical Drug', active: false, confidence: 24 },
    { name: 'Phytopharmaceutical', active: false, confidence: 31 },
    { name: 'Ayurveda-Aahar / Nutraceutical', active: false, confidence: 18 },
    { name: 'Cosmetic', active: false, confidence: 8 },
    { name: 'Other Applicable Category', active: false, confidence: 5 },
  ]

  const assessmentCards = [
    {
      title: 'Manufacturing Requirements',
      status: 'Active',
      items: [
        'GMP certification under Schedule M of D&C Act',
        'AYUSH manufacturing licence required',
        'Quality control per Ayurvedic Pharmacopoeia of India',
        'HVAC and equipment calibration standards',
      ],
    },
    {
      title: 'Labelling Requirements',
      status: 'Active',
      items: [
        'Schedule J warnings for Schedule E(1) herbs',
        'List of ingredients in INCI / pharmacopoeial names',
        'Net content, batch number, expiry date mandatory',
        'Ayurvedic indication in Schedule V language only',
      ],
    },
    {
      title: 'Claims & Advertising',
      status: 'Attention',
      items: [
        'Therapeutic claims restricted to Schedule V indications',
        'No disease cure claims without clinical substantiation',
        'ASCI guidelines applicable to all marketing',
        'Drug claims require CDSCO pre-approval for ads',
      ],
    },
    {
      title: 'Licensing Requirements',
      status: 'Active',
      items: [
        'State Licensing Authority approval for manufacture',
        'Separate licence for export if applicable',
        'Wholesale licence under D&C Act for distribution',
        'Import / export NOC from DGFT where applicable',
      ],
    },
    {
      title: 'Product Standards',
      status: 'Active',
      items: [
        'Heavy metals within API limits (As, Cd, Pb, Hg)',
        'Pesticide residues within WHO/FAO MRL',
        'Microbial contamination per Ayurvedic Pharmacopoeia',
        'Aflatoxin limits per FSSAI / API standards',
      ],
    },
    {
      title: 'Market-Specific Requirements',
      status: 'Review',
      items: [
        'India: CDSCO / State Drug Controller registration',
        'EU: EU Traditional Herbal Medicine Directive (THMPD)',
        'US: FDA dietary supplement DSHEA notification',
        'GCC / MENA: country-specific AYUSH registration',
      ],
    },
  ]

  const evidenceItems = [
    { label: 'Source of Formulation', value: 'Proprietary', operator: '=' },
    { label: 'Schedule E(1) herbs', value: 'Present (Ashwagandha)', operator: '+' },
    { label: 'Manufacturing process', value: 'Described', operator: '+' },
    { label: 'Intended therapeutic use', value: 'Adaptogenic — Schedule V', operator: '→' },
    { label: 'Concluded classification', value: 'Proprietary Ayurvedic Medicine', operator: '=' },
  ]

  const statusColor = (s: string) => {
    if (s === 'Active') return { bg: '#E5EEE6', text: '#6B8F71', border: '#B8D4BB' }
    if (s === 'Attention') return { bg: '#FCEAE5', text: '#173F2A', border: '#F0B5A8' }
    return { bg: '#FCEAE5', text: '#173F2A', border: '#F0B5A8' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', color: '#173F2A', marginBottom: '6px', fontWeight: 400 }}>
          Regulatory Pathway
        </h1>
        <p style={{ fontSize: '14px', color: '#4A5E51' }}>
          Determine the likely regulatory category and identify product-specific compliance requirements.
        </p>
      </div>

      {/* Classification Engine + Category List */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
        {/* Classification Result */}
        <div
          style={{
            background: '#FFFDF8',
            border: '1px solid #DFC0B7',
            borderRadius: '12px',
            boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
            padding: '24px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#7A9285', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
            Classification Engine Result
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', color: '#173F2A', margin: '0 0 10px', fontWeight: 400 }}>
            Proprietary Ayurvedic Medicine
          </h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#A89590', marginBottom: '2px' }}>Confidence</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '22px', fontWeight: 500, color: '#173F2A' }}>91%</div>
            </div>
            <div style={{ width: '1px', backgroundColor: '#DFC0B7' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#7A9285', marginBottom: '4px' }}>Status</div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#718A78', backgroundColor: '#DCE8DF', padding: '2px 8px', borderRadius: '10px', border: '1px solid #B8CFC0' }}>
                Likely
              </span>
            </div>
          </div>
          <div>
            <div style={{ height: '6px', backgroundColor: '#F7DED5', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '91%', height: '100%', backgroundColor: '#173F2A', borderRadius: '3px' }} />
            </div>
          </div>
        </div>

        {/* Category List */}
        <div
          style={{
            background: '#FFFDF8',
            border: '1px solid #DFC0B7',
            borderRadius: '12px',
            boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F7DED5' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#173F2A' }}>Possible Categories</span>
          </div>
          {categories.map((cat, i) => (
            <div
              key={cat.name}
              style={{
                padding: '12px 20px',
                borderBottom: i < categories.length - 1 ? '1px solid #F7EDE5' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: cat.active ? '#FCEAE5' : 'transparent',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: `2px solid ${cat.active ? '#173F2A' : '#DFC0B7'}`,
                  backgroundColor: cat.active ? '#173F2A' : 'transparent',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontSize: '13px', fontWeight: cat.active ? 600 : 400, color: cat.active ? '#173F2A' : '#4A5E51' }}>
                {cat.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '80px', height: '4px', backgroundColor: '#F7DED5', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${cat.confidence}%`, height: '100%', backgroundColor: cat.active ? '#173F2A' : '#CBD5E1', borderRadius: '2px' }} />
                </div>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: cat.active ? '#173F2A' : '#A89590', fontWeight: 500, minWidth: '30px', textAlign: 'right' }}>
                  {cat.confidence}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory Assessment Cards */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#173F2A', marginBottom: '16px' }}>Regulatory Assessment</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {assessmentCards.map(card => {
            const sc = statusColor(card.status)
            return (
              <div
                key={card.title}
                style={{
                  background: '#FFFDF8',
                  border: '1px solid #DFC0B7',
                  borderRadius: '12px',
                  boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F7DED5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#173F2A' }}>{card.title}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: sc.text, backgroundColor: sc.bg, border: `1px solid ${sc.border}`, padding: '2px 6px', borderRadius: '10px' }}>
                    {card.status}
                  </span>
                </div>
                <ul style={{ margin: 0, padding: '14px 16px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {card.items.map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#4A5E51', lineHeight: '1.4' }}>
                      <span style={{ color: '#173F2A', flexShrink: 0, marginTop: '1px' }}>·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* Why this classification */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DFC0B7',
          borderRadius: '12px',
          boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#173F2A', margin: '0 0 16px' }}>Why this classification?</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {evidenceItems.map((item, i) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: i < evidenceItems.length - 1 ? '8px' : 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: i === evidenceItems.length - 1 ? '#173F2A' : '#FCEAE5',
                    border: `1px solid ${i === evidenceItems.length - 1 ? '#173F2A' : '#F0B5A8'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: i === evidenceItems.length - 1 ? '#FFFFFF' : '#173F2A',
                    flexShrink: 0,
                  }}
                >
                  {item.operator}
                </div>
                {i < evidenceItems.length - 1 && (
                  <div style={{ width: '1px', height: '8px', backgroundColor: '#DFC0B7' }} />
                )}
              </div>
              <div style={{ paddingBottom: i < evidenceItems.length - 1 ? '8px' : 0 }}>
                <span style={{ fontSize: '12px', color: '#A89590' }}>{item.label}: </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#173F2A' }}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
