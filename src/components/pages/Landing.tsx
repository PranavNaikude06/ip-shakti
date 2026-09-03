import ayurvedaHero from '@/imports/WhatsApp_Image_2026-09-03_at_10.36.37.jpeg'

interface LandingProps {
  onGetStarted: () => void
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#0D2418',
        fontFamily: 'Manrope, system-ui, sans-serif',
      }}
    >
      {/* Hero image — objects lean right, upper-left stays clean for text */}
      <img
        src={ayurvedaHero}
        alt="Ayurvedic herbs, oils and preparations arranged on a wooden table"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: '65% center',
          userSelect: 'none',
        }}
      />

      {/* Left-to-right gradient — makes text legible without hiding right-side objects */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to right, rgba(13, 36, 24, 0.93) 0%, rgba(13, 36, 24, 0.80) 28%, rgba(13, 36, 24, 0.45) 50%, rgba(13, 36, 24, 0.08) 68%, transparent 82%)',
        }}
      />

      {/* Subtle bottom vignette for footer readability */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '180px',
          background: 'linear-gradient(to top, rgba(13, 36, 24, 0.5) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main content column */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 6% 0 7%',
          maxWidth: '680px',
        }}
      >
        {/* Brand mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '52px',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              backgroundColor: 'rgba(251, 246, 233, 0.12)',
              border: '1px solid rgba(251, 246, 233, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1L8 4.5H11L8.5 7H9.5L6 11L2.5 7H3.5L1 4.5H4L6 1Z"
                fill="rgba(251, 246, 233, 0.9)"
              />
            </svg>
          </div>
          <div>
            <span
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '13px',
                color: 'rgba(251, 246, 233, 0.5)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              IP-SAKTI
            </span>
            <span
              style={{
                fontSize: '11px',
                color: 'rgba(251, 246, 233, 0.35)',
                letterSpacing: '0.06em',
                marginLeft: '10px',
                fontWeight: 400,
                textTransform: 'uppercase',
              }}
            >
              Sahayak · Ayurveda × IP
            </span>
          </div>
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(40px, 5.2vw, 70px)',
            fontWeight: 400,
            color: '#FBF6E9',
            lineHeight: 1.08,
            letterSpacing: '-0.025em',
            margin: '0 0 26px',
          }}
        >
          Where Ancient Wisdom<br />Meets Modern IP.
        </h1>

        {/* Supporting text */}
        <p
          style={{
            fontSize: 'clamp(13px, 1.3vw, 17px)',
            color: 'rgba(251, 246, 233, 0.65)',
            lineHeight: 1.7,
            margin: '0 0 52px',
            maxWidth: '440px',
            fontWeight: 400,
          }}
        >
          Empowering Ayurveda startups, researchers and manufacturers to
          discover, protect and navigate intellectual property with
          AI-powered intelligence.
        </p>

        {/* CTA */}
        <div>
          <button
            onClick={onGetStarted}
            style={{
              padding: '13px 28px',
              backgroundColor: '#FBF6E9',
              color: '#173F2A',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Manrope, system-ui, sans-serif',
              letterSpacing: '0.01em',
              boxShadow: '0 4px 16px rgba(13, 36, 24, 0.22)',
              transition: 'background-color 180ms ease, color 180ms ease, transform 160ms ease, box-shadow 160ms ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.backgroundColor = '#173F2A'
              el.style.color = '#FBF6E9'
              el.style.transform = 'scale(1.025) translateY(-1px)'
              el.style.boxShadow = '0 6px 20px rgba(13, 36, 24, 0.35)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.backgroundColor = '#FBF6E9'
              el.style.color = '#173F2A'
              el.style.transform = 'scale(1) translateY(0)'
              el.style.boxShadow = '0 4px 16px rgba(13, 36, 24, 0.22)'
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.025) translateY(-1px)' }}
          >
            Get Started
            <span style={{ fontSize: '16px', lineHeight: 1, fontFamily: 'monospace' }}>{'→'}</span>
          </button>
        </div>

        {/* Capability pills */}
        <div
          style={{
            marginTop: '60px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {[
            { label: 'Patent & IP Assessment', icon: '§' },
            { label: 'ABS / Biodiversity Compliance', icon: '⬡' },
            { label: 'Traditional Knowledge', icon: '◈' },
            { label: 'AYUSH Regulatory Pathways', icon: '▸' },
          ].map(item => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px 5px 8px',
                backgroundColor: 'rgba(251, 246, 233, 0.07)',
                border: '1px solid rgba(251, 246, 233, 0.12)',
                borderRadius: '20px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: 'rgba(184, 212, 187, 0.85)',
                  fontWeight: 700,
                  width: '14px',
                  textAlign: 'center',
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: 'rgba(251, 246, 233, 0.55)',
                  letterSpacing: '0.02em',
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          padding: '14px 7%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(251, 246, 233, 0.07)',
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px',
            color: 'rgba(251, 246, 233, 0.28)',
            letterSpacing: '0.05em',
          }}
        >
          IP-SAKTI Sahayak · Government-grade Ayurvedic IP Intelligence
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(251, 246, 233, 0.28)', letterSpacing: '0.04em' }}>
            SIH 2026
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(251, 246, 233, 0.28)', letterSpacing: '0.04em' }}>
            Ministry of AYUSH
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <div
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#6B8F71',
              }}
            />
            <span style={{ fontSize: '10px', color: 'rgba(251, 246, 233, 0.28)', letterSpacing: '0.04em' }}>
              AI-Powered · Source-Cited
            </span>
          </div>
        </div>
      </div>

      {/* Subtle scroll hint arrow */}
      <div
        style={{
          position: 'absolute',
          bottom: '52px',
          right: '7%',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          opacity: 0.35,
          animation: 'bounceY 2s ease-in-out infinite',
        }}
      >
        <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
          <rect x="1" y="1" width="12" height="20" rx="6" stroke="rgba(251,246,233,0.8)" strokeWidth="1.2" />
          <circle cx="7" cy="7" r="2" fill="rgba(251,246,233,0.8)">
            <animate attributeName="cy" values="7;13;7" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  )
}
