export default function PageFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid #DFC0B7',
        backgroundColor: '#F7EDE5',
        padding: '10px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '11px', color: '#7A9285', fontStyle: 'italic' }}>
        AI-generated information for decision support. Not legal advice.
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#7A9285' }}>
        <span>Knowledge Base Last Updated: 02 Sep 2026</span>
        <span style={{ color: '#DFC0B7' }}>·</span>
        <span>Sources: Official / Verified</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7A9285' }}>
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#718A78',
            display: 'inline-block',
          }}
        />
        <span>Confidence: High</span>
      </div>
    </footer>
  )
}
