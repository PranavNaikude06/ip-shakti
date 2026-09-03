import { useState, useEffect } from 'react'
import type { PageId } from '@/data/mockData'
import Login from '@/components/pages/Login'
import Landing from '@/components/pages/Landing'
import TopNav from '@/components/layout/TopNav'
import PageFooter from '@/components/layout/PageFooter'
import Dashboard from '@/components/pages/Dashboard'
import ProductAnalysis from '@/components/pages/NewProductAnalysis'
import Assessments from '@/components/pages/MyAnalyses'
import IPAssessment from '@/components/pages/IPAssessment'
import ABSCompliance from '@/components/pages/ABSCompliance'
import RegulatoryPathway from '@/components/pages/RegulatoryPathway'
import EvidenceExplorer from '@/components/pages/EvidenceExplorer'
import KnowledgeGraph from '@/components/pages/KnowledgeGraph'
import LegalLibrary from '@/components/pages/LegalLibrary'
import Reports from '@/components/pages/Reports'
import Intelligence from '@/components/pages/Intelligence'
import AssessmentDetail from '@/components/pages/AssessmentDetail'

function renderPage(page: PageId, onNavigate: (p: PageId) => void) {
  switch (page) {
    case 'dashboard':          return <Dashboard onNavigate={onNavigate} />
    case 'product-analysis':   return <ProductAnalysis onNavigate={onNavigate} />
    case 'assessments':        return <Assessments onNavigate={onNavigate} />
    case 'ip-assessment':      return <IPAssessment onNavigate={onNavigate} />
    case 'abs-compliance':     return <ABSCompliance />
    case 'regulatory-pathway': return <RegulatoryPathway />
    case 'evidence-explorer':  return <EvidenceExplorer />
    case 'knowledge-graph':    return <KnowledgeGraph />
    case 'legal-library':      return <LegalLibrary />
    case 'reports':            return <Reports />
    case 'intelligence':       return <Intelligence />
    case 'assessment-detail':  return <AssessmentDetail onNavigate={onNavigate} />
    default:                   return <Dashboard onNavigate={onNavigate} />
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [jurisdiction, setJurisdiction] = useState<'india' | 'international'>('india')
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en')

  // Landing → Login transition state
  const [showLanding, setShowLanding] = useState(true)
  const [landingExiting, setLandingExiting] = useState(false)

  // Cleanup: remove landing from DOM after slide-out completes
  useEffect(() => {
    if (!landingExiting) return
    const t = setTimeout(() => setShowLanding(false), 850)
    return () => clearTimeout(t)
  }, [landingExiting])

  function handleGetStarted() {
    setLandingExiting(true)
  }

  if (!isLoggedIn) {
    return (
      <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Login lives underneath — always visible, ready to receive */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <Login onLogin={() => setIsLoggedIn(true)} />
        </div>

        {/* Landing slides upward on "Get Started" — cinematic wakeup */}
        {showLanding && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              transform: landingExiting ? 'translateY(-100%)' : 'translateY(0)',
              transition: landingExiting
                ? 'transform 780ms cubic-bezier(0.76, 0, 0.24, 1)'
                : 'none',
              willChange: 'transform',
            }}
          >
            <Landing onGetStarted={handleGetStarted} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FBF6E9' }}>
      <TopNav
        activePage={activePage}
        onNavigate={setActivePage}
        jurisdiction={jurisdiction}
        onJurisdictionChange={setJurisdiction}
        language={language}
        onLanguageChange={setLanguage}
        onLogout={() => { setIsLoggedIn(false); setActivePage('dashboard') }}
      />
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: '28px 32px' }}>
          {renderPage(activePage, setActivePage)}
        </div>
        <PageFooter />
      </main>
    </div>
  )
}
