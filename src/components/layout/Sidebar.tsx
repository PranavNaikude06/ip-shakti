import type { ReactNode } from 'react'
import type { PageId } from '@/data/mockData'

interface SidebarProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
}

interface NavItem {
  id: PageId
  label: string
  icon: ReactNode
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function PlusCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L2 3.5v4.5c0 3.3 2.5 5.8 6 6.5 3.5-.7 6-3.2 6-6.5V3.5L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13 2C8 2 3 6 3 11c0 1 .5 2 1 3 1-3 3-5 9-5V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 14c0-2 1-4 3-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function RouteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 13V6a3 3 0 016 0v4a3 3 0 006 0V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function GraphIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="2.5" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13.5" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="2.5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13.5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 7L4 5M10 7l2 5M6 9l-2 2M10 9l2-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 2h8a1 1 0 011 1v10a1 1 0 01-1 1H3V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 2h1a1 1 0 011 1v10a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function UserCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 14c0-3 2.5-5 6-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 11l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M2.8 11.2l1.4-1.4M9.8 4.2l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <GridIcon /> },
  { id: 'product-analysis', label: 'New Product Analysis', icon: <PlusCircleIcon /> },
  { id: 'assessments', label: 'My Analyses', icon: <ListIcon /> },
  { id: 'ip-assessment', label: 'IP Assessment', icon: <ShieldIcon /> },
  { id: 'abs-compliance', label: 'ABS Compliance', icon: <LeafIcon /> },
  { id: 'regulatory-pathway', label: 'Regulatory Pathway', icon: <RouteIcon /> },
  { id: 'knowledge-graph', label: 'Knowledge Graph', icon: <GraphIcon /> },
  { id: 'evidence-explorer', label: 'Sources', icon: <BookIcon /> },
  { id: 'intelligence', label: 'Human Expert Escalation', icon: <UserCheckIcon /> },
]

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <div
      style={{
        width: '240px',
        minWidth: '240px',
        height: '100%',
        backgroundColor: '#173F2A',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
          IP-SAKTI
        </div>
        <div style={{ fontSize: '11px', color: '#7A9285', marginTop: '3px', letterSpacing: '0.02em' }}>
          IP & Compliance Intelligence
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {navItems.map(item => {
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 20px 9px 17px',
                background: isActive ? 'rgba(232, 98, 26, 0.14)' : 'transparent',
                border: 'none',
                borderLeft: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: isActive ? '#F97316' : '#7A9285',
                fontSize: '13.5px',
                fontWeight: isActive ? 700 : 400,
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'background 0.12s, color 0.12s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(232, 98, 26, 0.06)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#E0C9B8'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#7A9285'
                }
              }}
            >
              {/* Active indicator — gradient orange→coral for warm brand edge */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: '4px',
                bottom: '4px',
                width: '3px',
                borderRadius: '0 2px 2px 0',
                background: isActive
                  ? 'linear-gradient(180deg, #173F2A 30%, #102F20 100%)'
                  : 'transparent',
              }} />
              <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
              <span style={{ lineHeight: 1.3 }}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User Area */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div
          style={{
            backgroundColor: '#2A3560',
            borderRadius: '10px',
            padding: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#173F2A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              PS
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Dr. Priya Sharma
              </div>
              <div style={{ fontSize: '10px', color: '#6B5E5A', marginTop: '1px' }}>
                Patent Attorney
              </div>
            </div>
            <button
              style={{ color: '#6B5E5A', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
              title="Settings"
            >
              <SettingsIcon />
            </button>
          </div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: '#6B5E5A' }}>
            VaidyaTech Pvt. Ltd.
          </div>
        </div>
      </div>
    </div>
  )
}
