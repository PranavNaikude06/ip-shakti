import { useState } from 'react'
import botanicalBg from '@/imports/WhatsApp_Image_2026-09-03_at_10.17.15.jpeg'

interface LoginProps {
  onLogin: () => void
}

type AuthView = 'signin' | 'forgot' | 'register'

const inputStyle = {
  width: '100%',
  padding: '10px 13px',
  border: '1px solid rgba(176, 203, 186, 0.65)',
  borderRadius: '7px',
  fontSize: '13px',
  fontFamily: 'Manrope, system-ui, sans-serif',
  color: '#173F2A',
  background: 'rgba(253, 250, 245, 0.88)',
  outline: 'none',
  transition: 'border-color 0.15s, background 0.15s',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block' as const,
  fontSize: '10.5px',
  fontWeight: 600 as const,
  color: '#4A5E51',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  marginBottom: '5px',
  fontFamily: 'Manrope, system-ui, sans-serif',
}

function PrimaryBtn({
  children,
  onClick,
  loading,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        padding: '11px',
        backgroundColor: disabled || loading ? '#8AB5A0' : '#173F2A',
        color: '#FBF6E9',
        border: 'none',
        borderRadius: '7px',
        fontSize: '13px',
        fontWeight: 700,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: 'Manrope, system-ui, sans-serif',
        letterSpacing: '0.02em',
        transition: 'background 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#102F20'
      }}
      onMouseLeave={e => {
        if (!disabled && !loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#173F2A'
      }}
    >
      {loading && (
        <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin 0.8s linear infinite' }}>
          <circle cx="7" cy="7" r="5.5" stroke="rgba(251,246,233,0.4)" strokeWidth="2" fill="none" />
          <path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="#FBF6E9" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      )}
      {loading ? 'Signing in…' : children}
    </button>
  )
}

function SignInForm({ onLogin }: { onLogin: () => void; onForgot: () => void; onRegister: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)

  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  function handleSubmit() {
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }
    if (emailError) { setError('Please enter a valid email address.'); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 900)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{
          padding: '10px 14px', backgroundColor: 'rgba(250, 224, 220, 0.8)',
          border: '1px solid #E8B0A8', borderRadius: '6px',
          fontSize: '12.5px', color: '#A94350',
          fontFamily: 'Manrope, system-ui, sans-serif', lineHeight: 1.4,
        }}>
          {error}
        </div>
      )}

      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          placeholder="you@example.com"
          style={{
            ...inputStyle,
            borderColor: emailError ? '#A94350' : emailFocused ? '#173F2A' : 'rgba(176, 203, 186, 0.65)',
            background: 'rgba(253, 250, 245, 0.88)',
          }}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
        />
        {emailError && <p style={{ fontSize: '11px', color: '#A94350', margin: '4px 0 0', fontFamily: 'Manrope, system-ui, sans-serif' }}>Invalid email address.</p>}
      </div>

      <div>
        <label style={labelStyle}>Password</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onFocus={() => setPassFocused(true)}
            onBlur={() => setPassFocused(false)}
            placeholder="••••••••"
            style={{
              ...inputStyle,
              paddingRight: '40px',
              borderColor: passFocused ? '#173F2A' : 'rgba(176, 203, 186, 0.65)',
              background: 'rgba(253, 250, 245, 0.88)',
            }}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#7A9285',
              padding: '2px', display: 'flex', alignItems: 'center',
            }}
            tabIndex={-1}
          >
            {showPass ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            style={{ accentColor: '#173F2A', width: '14px', height: '14px' }}
          />
          <span style={{ fontSize: '12px', color: '#4A5E51', fontFamily: 'Manrope, system-ui, sans-serif' }}>Remember me</span>
        </label>
      </div>

      <PrimaryBtn onClick={handleSubmit} loading={loading}>
        Sign In
      </PrimaryBtn>

      <button
        type="button"
        style={{
          width: '100%', padding: '10px',
          backgroundColor: 'rgba(253, 250, 245, 0.88)',
          border: '1px solid rgba(176, 203, 186, 0.65)', borderRadius: '7px',
          fontSize: '13px', fontWeight: 500, color: '#4A5E51',
          cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#173F2A'
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(253, 250, 245, 0.98)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(176, 203, 186, 0.65)'
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(253, 250, 245, 0.88)'
        }}
      >
        <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2a10 10 0 00-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4" />
          <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 009 18z" fill="#34A853" />
          <path d="M3.97 10.71A5.4 5.4 0 013.69 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" fill="#FBBC05" />
          <path d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 00.96 4.96L3.97 7.3C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>
    </div>
  )
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSend() {
    if (!email) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setSent(true) }, 900)
  }

  if (sent) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ padding: '16px', background: 'rgba(229, 238, 230, 0.8)', border: '1px solid #B8D4BB', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#6B8F71', marginBottom: '6px', fontFamily: 'Manrope, system-ui, sans-serif' }}>Recovery link sent</div>
        <p style={{ fontSize: '12px', color: '#4A5E51', margin: 0, fontFamily: 'Manrope, system-ui, sans-serif' }}>
          If an account exists for <strong>{email}</strong>, a recovery link has been sent. Check your inbox.
        </p>
      </div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#173F2A', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif' }}>
        ← Return to Sign In
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
        />
      </div>
      <PrimaryBtn onClick={handleSend} loading={loading}>Send Recovery Link</PrimaryBtn>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#4A5E51', fontSize: '12px', cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', textDecoration: 'underline' }}>
        Return to Sign In
      </button>
    </div>
  )
}

function RegisterForm({ onBack, onLogin }: { onBack: () => void; onLogin: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [org, setOrg] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function handleRegister() {
    if (!name || !email || !password) return
    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 1200)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
      <div>
        <label style={labelStyle}>Full Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Priya Sharma" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Organisation</label>
        <input type="text" value={org} onChange={e => setOrg(e.target.value)} placeholder="VaidyaTech Pvt. Ltd." style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
      </div>
      <PrimaryBtn onClick={handleRegister} loading={loading}>Create Account</PrimaryBtn>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#4A5E51', fontSize: '12px', cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', textDecoration: 'underline' }}>
        Return to Sign In
      </button>
    </div>
  )
}

export default function Login({ onLogin }: LoginProps) {
  const [view, setView] = useState<AuthView>('signin')
  const [demoLoading, setDemoLoading] = useState(false)

  function handleDemo() {
    setDemoLoading(true)
    setTimeout(() => { setDemoLoading(false); onLogin() }, 700)
  }

  const viewTitles: Record<AuthView, string> = {
    signin: 'Sign In',
    forgot: 'Reset Password',
    register: 'Create Account',
  }

  return (
    <div
      style={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Manrope, system-ui, sans-serif',
        backgroundColor: '#EFF4EC',
      }}
    >
      {/* Botanical background image */}
      <img
        src={botanicalBg}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: '60% center',
          opacity: 0.82,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Very light wash — just enough to soften edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(239, 244, 236, 0.22)',
          pointerEvents: 'none',
        }}
      />

      {/* Brand watermark — bottom left, barely visible */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '28px',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            backgroundColor: '#173F2A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L8 4.5H11L8.5 7H9.5L6 11L2.5 7H3.5L1 4.5H4L6 1Z" fill="#FBF6E9" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: '12px',
            color: '#173F2A',
            letterSpacing: '0.06em',
          }}
        >
          IP-SAKTI
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            color: '#4A5E51',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          · Sahayak
        </span>
      </div>

      {/* Footer note */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '28px',
          zIndex: 1,
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            color: '#173F2A',
            letterSpacing: '0.04em',
          }}
        >
          Ministry of AYUSH · SIH 2026
        </span>
      </div>

      {/* Login card — frosted glass over botanical */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '400px',
          margin: '0 20px',
          backgroundColor: 'rgba(251, 246, 233, 0.62)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          borderRadius: '16px',
          padding: '36px 38px',
          boxShadow: '0 8px 32px rgba(23, 63, 42, 0.12)',
        }}
      >
        {/* Brand mark inside card */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#173F2A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L8 4.5H11L8.5 7H9.5L6 11L2.5 7H3.5L1 4.5H4L6 1Z" fill="#FBF6E9" />
            </svg>
          </div>
          <div>
            <span
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '15px',
                color: '#173F2A',
                letterSpacing: '-0.01em',
                fontWeight: 400,
              }}
            >
              IP-SAKTI Sahayak
            </span>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '26px' }}>
          <h2
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: '24px',
              fontWeight: 400,
              color: '#173F2A',
              margin: '0 0 5px',
              letterSpacing: '-0.01em',
            }}
          >
            {viewTitles[view]}
          </h2>
          <p style={{ fontSize: '12.5px', color: '#7A9285', margin: 0, lineHeight: 1.5 }}>
            {view === 'signin' && 'Access your IP intelligence workspace.'}
            {view === 'forgot' && 'Enter your email to receive a recovery link.'}
            {view === 'register' && 'Create your IP-SAKTI Sahayak account.'}
          </p>
        </div>

        {/* Forms */}
        {view === 'signin' && (
          <SignInForm onLogin={onLogin} onForgot={() => setView('forgot')} onRegister={() => setView('register')} />
        )}
        {view === 'forgot' && <ForgotForm onBack={() => setView('signin')} />}
        {view === 'register' && <RegisterForm onBack={() => setView('signin')} onLogin={onLogin} />}

        {/* Footer links — only on signin */}
        {view === 'signin' && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setView('forgot')}
                style={{ background: 'none', border: 'none', color: '#4A5E51', fontSize: '12px', cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', textDecoration: 'underline' }}
              >
                Forgot password?
              </button>
              <span style={{ color: '#B0CBBA', fontSize: '12px' }}>·</span>
              <button
                onClick={() => setView('register')}
                style={{ background: 'none', border: 'none', color: '#4A5E51', fontSize: '12px', cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif', textDecoration: 'underline' }}
              >
                Create account
              </button>
            </div>

            <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(23, 63, 42, 0.15)', margin: '6px 0' }} />

            <button
              onClick={handleDemo}
              disabled={demoLoading}
              style={{
                width: '100%', padding: '9px',
                backgroundColor: 'rgba(253, 250, 245, 0.75)',
                border: '1px solid rgba(223, 192, 183, 0.7)', borderRadius: '7px',
                fontSize: '12px', fontWeight: 600, color: '#173F2A',
                cursor: demoLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'Manrope, system-ui, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                if (!demoLoading) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(253, 250, 245, 0.95)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(23, 63, 42, 0.3)'
                }
              }}
              onMouseLeave={e => {
                if (!demoLoading) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(253, 250, 245, 0.75)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(223, 192, 183, 0.7)'
                }
              }}
            >
              {demoLoading ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 14 14" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="7" cy="7" r="5.5" stroke="rgba(23,63,42,0.3)" strokeWidth="2" fill="none" />
                    <path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="#173F2A" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                  Loading demo…
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M4.5 6l1 1 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Demo Access — Explore with sample data
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
