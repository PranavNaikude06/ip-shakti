export default function ABSCompliance() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', color: '#173F2A', marginBottom: '6px', fontWeight: 400 }}>
          ABS & Biodiversity Compliance
        </h1>
        <p style={{ fontSize: '14px', color: '#4A5E51' }}>
          Identify biological-resource and associated traditional-knowledge considerations relevant to your product.
        </p>
      </div>

      {/* Biological Resource */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DFC0B7',
          borderRadius: '12px',
          boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #F7DED5', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#A89590', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Biological Resource Identification</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#173F2A', backgroundColor: '#FCEAE5', padding: '2px 8px', borderRadius: '10px', border: '1px solid #F0B5A8' }}>1 Resource Detected</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#FCEAE5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M17 3C12 3 7 7 7 13c0 1.5.5 3 1.5 4.5C10 19 12 20 14 20c5 0 9-4 9-9-2 1-4 2-6 2V3z" stroke="#173F2A" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8.5 17.5C7 20 5 22 3 22" stroke="#173F2A" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontFamily: "'DM Serif Display', Georgia, serif", color: '#173F2A', margin: '0 0 4px', fontWeight: 400 }}>Ashwagandha</h3>
              <p style={{ fontSize: '12px', color: '#173F2A', margin: '0 0 2px', fontWeight: 500 }}>Biological resource detected</p>
              <p style={{ fontSize: '12px', color: '#4A5E51', margin: 0, fontStyle: 'italic' }}>Withania somnifera (L.) Dunal</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Scientific Name', value: 'Withania somnifera (L.) Dunal' },
              { label: 'Common Name', value: 'Ashwagandha / Indian Ginseng' },
              { label: 'Source Type', value: 'Cultivated — commercial farm' },
              { label: 'Geographic Origin', value: 'Rajasthan / Maharashtra, India' },
              { label: 'Intended Use', value: 'Adaptogenic / stress-relief formulation' },
              { label: 'TK Association', value: 'Yes — TKDL TK-AW-0234 documented' },
            ].map(item => (
              <div key={item.label} style={{ backgroundColor: '#FBF6E9', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#A89590', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', color: '#173F2A' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ABS Assessment Checklist */}
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
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#173F2A', margin: 0 }}>ABS Assessment Checklist</h2>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { label: 'Biological resource identified', status: 'ok' as const, detail: 'Withania somnifera — confirmed in formulation' },
            { label: 'Traditional knowledge association detected', status: 'warn' as const, detail: 'TKDL TK-AW-0234 — requires further review' },
            { label: 'Source / geographic origin identified', status: 'ok' as const, detail: 'Rajasthan / Maharashtra — cultivated origin' },
            { label: 'Applicable ABS framework reviewed', status: 'warn' as const, detail: 'Biological Diversity Act 2002 §3 & §6 — NBA approval may be required' },
            { label: 'Further assessment required', status: 'warn' as const, detail: 'ABS disclosure to IP authority mandatory before filing' },
          ].map((item, i) => {
            const isOk = item.status === 'ok'
            return (
              <div
                key={item.label}
                style={{
                  padding: '14px 0',
                  borderBottom: i < 4 ? '1px solid #F7EDE5' : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isOk ? '#DCE8DF' : '#FCEAE5',
                    border: `1px solid ${isOk ? '#B8CFC0' : '#F0B5A8'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isOk ? '#718A78' : '#CF5A3D',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  {isOk ? '✓' : '⚠'}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#173F2A', marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#4A5E51' }}>{item.detail}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Compliance Status */}
      <div
        style={{
          background: '#FCEAE5',
          border: '1px solid #F0B5A8',
          borderLeft: '5px solid #CF5A3D',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#CF5A3D', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Compliance Status</div>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '24px', color: '#173F2A', margin: '0 0 8px', fontWeight: 400 }}>
            Review Required
          </h2>
          <p style={{ fontSize: '13px', color: '#4A5E51', margin: 0, maxWidth: '500px', lineHeight: '1.5' }}>
            NBA (National Biodiversity Authority) prior approval required before any IP filing based on this formulation.
            Traditional knowledge association in TKDL requires acknowledgement of prior art.
            Disclosure mandatory under Biological Diversity Act 2002 §6.
          </p>
        </div>
        <button
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
            whiteSpace: 'nowrap',
          }}
        >
          Start ABS Assessment →
        </button>
      </div>

      {/* ABS Framework */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {[
          {
            title: 'Biological Diversity Act, 2002',
            section: 'Section 3 & 6',
            description: 'Requires prior approval from NBA before applying for IP rights based on biological resources or associated knowledge obtained from India. Non-compliance can invalidate patent claims.',
            severity: 'High',
          },
          {
            title: 'Nagoya Protocol on ABS',
            section: 'Article 6',
            description: 'International treaty requiring Prior Informed Consent (PIC) from the country providing genetic resources and equitable benefit sharing with the providing country and local communities.',
            severity: 'Medium',
          },
        ].map(f => (
          <div
            key={f.title}
            style={{
              background: '#FFFDF8',
              border: '1px solid #DFC0B7',
              borderRadius: '12px',
              boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#173F2A', margin: 0 }}>{f.title}</h3>
              <span style={{ fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace", color: '#4A5E51', backgroundColor: '#F7DED5', padding: '2px 6px', borderRadius: '4px' }}>
                {f.section}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#4A5E51', margin: '0 0 10px', lineHeight: '1.5' }}>{f.description}</p>
            <div style={{ fontSize: '11px', fontWeight: 600, color: f.severity === 'High' ? '#CF5A3D' : '#173F2A' }}>
              {f.severity} relevance to your product
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
