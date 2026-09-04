import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { PageId } from '@/data/mockData'

interface TopNavProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
  jurisdiction: 'india' | 'international'
  onJurisdictionChange: (j: 'india' | 'international') => void
  language: 'en' | 'hi' | 'mr'
  onLanguageChange: (l: 'en' | 'hi' | 'mr') => void
  onLogout?: () => void
}

type NavItem =
  | { kind: 'link'; label: string; page: PageId }
  | { kind: 'dropdown'; label: string; items: { label: string; page: PageId }[] }

const navItems: NavItem[] = [
  { kind: 'link', label: 'Dashboard', page: 'dashboard' },
  { kind: 'link', label: 'Product Analysis', page: 'product-analysis' },
  {
    kind: 'dropdown',
    label: 'Assessments',
    items: [
      { label: 'My Assessments', page: 'assessments' },
      { label: 'IP Assessment', page: 'ip-assessment' },
      { label: 'ABS Compliance', page: 'abs-compliance' },
      { label: 'Regulatory Pathway', page: 'regulatory-pathway' },
    ],
  },
  { kind: 'link', label: 'Evidence', page: 'evidence-explorer' },
  { kind: 'link', label: 'Knowledge Graph', page: 'knowledge-graph' },
  { kind: 'link', label: 'Legal Library', page: 'legal-library' },
  { kind: 'link', label: 'Reports', page: 'reports' },
  { kind: 'link', label: 'Intelligence', page: 'intelligence' },
]

function isPageInGroup(page: PageId, item: NavItem): boolean {
  if (item.kind === 'link') return item.page === page
  return item.items.some(i => i.page === page)
}

// Portal dropdown — rendered into document.body with position:fixed to
// guarantee zero impact on layout height and no overflow anywhere in the tree.
function DropdownPortal({
  anchorRect,
  items,
  activePage,
  onNavigate,
  onClose,
}: {
  anchorRect: DOMRect
  items: { label: string; page: PageId }[]
  activePage: PageId
  onNavigate: (page: PageId) => void
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onClose])

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: anchorRect.bottom + 1,
        left: anchorRect.left,
        width: 220,
        backgroundColor: '#FFFDF8',
        border: '1px solid #DFC0B7',
        borderRadius: '8px',
        boxShadow: '0 6px 20px rgba(23, 63, 42, 0.13)',
        zIndex: 9999,
        overflow: 'hidden',
        // Explicitly no margin/padding that would affect layout
      }}
    >
      {items.map((sub, i) => {
        const isSubActive = activePage === sub.page
        return (
          <button
            key={sub.page}
            onPointerDown={e => e.stopPropagation()}
            onClick={() => { onNavigate(sub.page); onClose() }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              background: isSubActive ? '#DCE8DF' : 'transparent',
              border: 'none',
              borderBottom: i < items.length - 1 ? '1px solid #F2DDD7' : 'none',
              fontSize: '13px',
              fontWeight: isSubActive ? 600 : 400,
              color: isSubActive ? '#173F2A' : '#173F2A',
              cursor: 'pointer',
              fontFamily: 'Manrope, system-ui, sans-serif',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => {
              if (!isSubActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F7EDE5'
            }}
            onMouseLeave={e => {
              if (!isSubActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
            }}
          >
            {sub.label}
          </button>
        )
      })}
    </div>,
    document.body,
  )
}

function DropdownNavItem({
  item,
  isActive,
  activePage,
  onNavigate,
}: {
  item: Extract<NavItem, { kind: 'dropdown' }>
  isActive: boolean
  activePage: PageId
  onNavigate: (page: PageId) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => setIsOpen(false), [])

  function handleClick() {
    if (isOpen) {
      setIsOpen(false)
      return
    }
    if (triggerRef.current) {
      setAnchorRect(triggerRef.current.getBoundingClientRect())
    }
    setIsOpen(true)
  }

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'stretch', flexShrink: 0 }}>
      <button
        ref={triggerRef}
        onClick={handleClick}
        style={{
          background: isActive ? 'rgba(23, 63, 42, 0.08)' : 'none',
          border: 'none',
          borderBottom: isActive ? '2px solid #173F2A' : '2px solid transparent',
          padding: '0 12px',
          fontSize: '12.5px',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? '#173F2A' : '#4A5E51',
          cursor: 'pointer',
          fontFamily: 'Manrope, system-ui, sans-serif',
          transition: 'all 0.12s',
          whiteSpace: 'nowrap',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            const el = e.currentTarget as HTMLButtonElement
            el.style.color = '#173F2A'
            el.style.background = '#F7DED5'
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            const el = e.currentTarget as HTMLButtonElement
            el.style.color = '#4A5E51'
            el.style.background = 'none'
          }
        }}
      >
        {item.label}
        <svg
          width="9" height="9" viewBox="0 0 10 10" fill="none"
          style={{ transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && anchorRect && (
        <DropdownPortal
          anchorRect={anchorRect}
          items={item.items}
          activePage={activePage}
          onNavigate={onNavigate}
          onClose={close}
        />
      )}
    </div>
  )
}

function ProfileMenu({ onLogout }: { onLogout?: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function handlePD(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('pointerdown', handlePD)
    return () => document.removeEventListener('pointerdown', handlePD)
  }, [open, close])

  function handleToggle() {
    if (open) { setOpen(false); return }
    if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect())
    setOpen(true)
  }

  const menuItems = [
    { label: 'Profile', icon: '◉', action: () => setOpen(false) },
    { label: 'Settings', icon: '⚙', action: () => setOpen(false) },
    { label: 'Log Out', icon: '→', action: () => { setOpen(false); onLogout?.() }, danger: true },
  ]

  return (
    <>
      <div
        ref={btnRef}
        onClick={handleToggle}
        style={{
          width: '28px', height: '28px', borderRadius: '50%',
          backgroundColor: '#173F2A', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '10px', fontWeight: 700,
          color: '#FFFFFF', cursor: 'pointer', flexShrink: 0,
          fontFamily: 'Manrope, system-ui, sans-serif',
          outline: open ? '2px solid #173F2A' : 'none',
          outlineOffset: '2px',
          transition: 'outline 0.12s',
        }}
        title="Dr. Priya Sharma — VaidyaTech Pvt. Ltd."
      >
        PS
      </div>
      {open && anchorRect && createPortal(
        <div
          ref={ref}
          style={{
            position: 'fixed',
            top: anchorRect.bottom + 6,
            right: window.innerWidth - anchorRect.right,
            width: 176,
            backgroundColor: '#FFFDF8',
            border: '1px solid #DFC0B7',
            borderRadius: '8px',
            boxShadow: '0 6px 20px rgba(23, 63, 42, 0.13)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #F3C9BD' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#173F2A', fontFamily: 'Manrope, system-ui, sans-serif' }}>Dr. Priya Sharma</div>
            <div style={{ fontSize: '10px', color: '#A89590', fontFamily: 'Manrope, system-ui, sans-serif', marginTop: '2px' }}>VaidyaTech Pvt. Ltd.</div>
          </div>
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onPointerDown={e => e.stopPropagation()}
              onClick={item.action}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', textAlign: 'left',
                padding: '9px 14px',
                background: 'transparent', border: 'none',
                borderBottom: i < menuItems.length - 1 ? '1px solid #F2DDD7' : 'none',
                fontSize: '13px', fontWeight: 500,
                color: item.danger ? '#A94350' : '#173F2A',
                cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F7EDE5' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
            >
              <span style={{ fontSize: '12px', opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}

const langOptions = [
  { value: 'en' as const, short: 'EN', full: 'English' },
  { value: 'hi' as const, short: 'हिंदी', full: 'हिंदी' },
  { value: 'mr' as const, short: 'मराठी', full: 'मराठी' },
]

function LanguageDropdown({
  language,
  onLanguageChange,
}: {
  language: 'en' | 'hi' | 'mr'
  onLanguageChange: (l: 'en' | 'hi' | 'mr') => void
}) {
  const [open, setOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function handlePD(e: PointerEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) close()
    }
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    document.addEventListener('pointerdown', handlePD)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePD)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, close])

  function handleToggle() {
    if (open) { setOpen(false); return }
    if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect())
    setOpen(true)
  }

  const current = langOptions.find(o => o.value === language)!

  return (
    <div style={{ borderLeft: '1px solid #DFC0B7', paddingLeft: '10px' }}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 10px',
          background: open ? '#173F2A' : 'transparent',
          border: '1px solid',
          borderColor: open ? '#173F2A' : '#DFC0B7',
          borderRadius: '6px',
          color: open ? '#FBF6E9' : '#173F2A',
          fontSize: '13px', fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Manrope, system-ui, sans-serif',
          letterSpacing: '0.03em',
          transition: 'background 0.12s, color 0.12s, border-color 0.12s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background = '#F7DED5'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#B0CBBA'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#DFC0B7'
          }
        }}
      >
        {current.short}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, opacity: 0.7 }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && anchorRect && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: anchorRect.bottom + 4,
            left: anchorRect.left,
            minWidth: anchorRect.width + 40,
            backgroundColor: '#FFFDF8',
            border: '1px solid #DFC0B7',
            borderRadius: '8px',
            boxShadow: '0 6px 20px rgba(23, 63, 42, 0.12)',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'dropdownReveal 0.15s ease',
          }}
        >
          {langOptions.map((opt, i) => {
            const isActive = opt.value === language
            return (
              <button
                key={opt.value}
                onPointerDown={e => e.stopPropagation()}
                onClick={() => { onLanguageChange(opt.value); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', textAlign: 'left',
                  padding: '10px 16px',
                  background: isActive ? '#E8EFE9' : 'transparent',
                  border: 'none',
                  borderBottom: i < langOptions.length - 1 ? '1px solid #F2DDD7' : 'none',
                  fontSize: '13px', fontWeight: isActive ? 600 : 400,
                  color: '#173F2A',
                  cursor: 'pointer',
                  fontFamily: 'Manrope, system-ui, sans-serif',
                  transition: 'background 0.1s',
                  gap: '16px',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F7EDE5' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
              >
                <span>{opt.full}</span>
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#173F2A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </div>
  )
}

export default function TopNav({
  activePage,
  onNavigate,
  jurisdiction,
  onJurisdictionChange,
  language,
  onLanguageChange,
  onLogout,
}: TopNavProps) {
  return (
    <header
      style={{
        backgroundColor: '#FBF6E9',
        borderBottom: '1px solid #DFC0B7',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        flexShrink: 0,
        height: '50px',
        // No position:relative needed — dropdowns are portalled to body
      }}
    >
      {/* Logo + Language toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '20px', flexShrink: 0 }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '5px',
          backgroundColor: '#173F2A', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L8 4.5H11L8.5 7H9.5L6 11L2.5 7H3.5L1 4.5H4L6 1Z" fill="white" fillOpacity="0.95" />
          </svg>
        </div>
        <span style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: '15px', color: '#173F2A', fontWeight: 400,
          letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>
          IP-SAKTI
        </span>

        {/* Language dropdown */}
        <LanguageDropdown language={language} onLanguageChange={onLanguageChange} />
      </div>

      {/* Nav items — no overflow:auto here to avoid implicit overflowY */}
      <nav style={{ display: 'flex', alignItems: 'stretch', flex: 1, height: '100%' }}>
        {navItems.map(item => {
          const isActive = isPageInGroup(activePage, item)

          if (item.kind === 'link') {
            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.page)}
                style={{
                  background: isActive ? 'rgba(23, 63, 42, 0.08)' : 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #173F2A' : '2px solid transparent',
                  padding: '0 12px',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#173F2A' : '#4A5E51',
                  cursor: 'pointer',
                  fontFamily: 'Manrope, system-ui, sans-serif',
                  transition: 'all 0.12s',
                  whiteSpace: 'nowrap',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.color = '#173F2A'
                    el.style.background = '#F7DED5'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.color = '#4A5E51'
                    el.style.background = 'none'
                  }
                }}
              >
                {item.label}
              </button>
            )
          }

          return (
            <DropdownNavItem
              key={item.label}
              item={item}
              isActive={isActive}
              activePage={activePage}
              onNavigate={onNavigate}
            />
          )
        })}
      </nav>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
        {/* Search */}
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
          color: '#4A5E51', display: 'flex', alignItems: 'center',
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Jurisdiction toggle */}
        <div style={{ display: 'flex', borderRadius: '5px', border: '1px solid #DFC0B7', overflow: 'hidden' }}>
          {(['india', 'international'] as const).map(j => (
            <button
              key={j}
              onClick={() => onJurisdictionChange(j)}
              style={{
                padding: '4px 9px', border: 'none',
                background: jurisdiction === j ? '#173F2A' : '#FDF2EC',
                color: jurisdiction === j ? '#FFFFFF' : '#4A5E51',
                cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif',
                fontWeight: 600, fontSize: '10px', letterSpacing: '0.06em',
                textTransform: 'uppercase', transition: 'all 0.15s',
              }}
            >
              {j === 'india' ? 'India' : 'Intl.'}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
          color: '#4A5E51', display: 'flex', alignItems: 'center', position: 'relative',
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 2a5 5 0 00-5 5v3l-1 2h12l-1-2V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span style={{
            position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px',
            borderRadius: '50%', backgroundColor: '#E9684F', border: '1.5px solid #FBF6E9',
          }} />
        </button>

        {/* Profile */}
        <ProfileMenu onLogout={onLogout} />
      </div>
    </header>
  )
}
