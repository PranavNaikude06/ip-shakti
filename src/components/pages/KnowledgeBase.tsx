import { useState } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'

interface KBEntry {
  title: string
  document: string
  date: string
  jurisdiction: string
  status: 'Official' | 'Verified' | 'Current' | 'Historical'
  description: string
}

interface KBCategory {
  id: string
  label: string
  count: number
  entries: KBEntry[]
}

const categories: KBCategory[] = [
  {
    id: 'ip-law',
    label: 'Indian IP Law',
    count: 6,
    entries: [
      { title: 'Patents Act, 1970 (amended 2005)', document: 'IPO India', date: '1970 (2005 amend.)', jurisdiction: 'India', status: 'Current', description: 'Governs patentability criteria including §3(p) exclusion for traditional knowledge aggregation.' },
      { title: 'Trade Marks Act, 1999', document: 'IPO India', date: '15 Sep 2003', jurisdiction: 'India', status: 'Current', description: 'Regulates brand name registration, oppositions, and enforcement for all goods including AYUSH products.' },
      { title: 'Geographical Indications of Goods Act, 1999', document: 'IPO India', date: '15 Sep 2003', jurisdiction: 'India', status: 'Current', description: 'Protects geographic origin indicators — relevant for region-specific Ayurvedic ingredients.' },
      { title: 'Designs Act, 2000', document: 'IPO India', date: '11 May 2001', jurisdiction: 'India', status: 'Current', description: 'Covers visual appearance of products and packaging eligible for design registration.' },
      { title: 'Copyright Act, 1957 (amended 2012)', document: 'Ministry of Education', date: '1957 (2012 amend.)', jurisdiction: 'India', status: 'Current', description: 'Protects original literary, artistic, musical and dramatic works including product documentation and software.' },
      { title: 'Protection of Plant Varieties and Farmers\' Rights Act, 2001', document: 'PPV&FRA', date: '30 Oct 2001', jurisdiction: 'India', status: 'Current', description: "Protects plant breeders' rights and farmers' traditional seed varieties." },
    ],
  },
  {
    id: 'biodiversity',
    label: 'Biodiversity & ABS',
    count: 3,
    entries: [
      { title: 'Biological Diversity Act, 2002', document: 'NBA India', date: '05 Feb 2003', jurisdiction: 'India', status: 'Current', description: 'Requires NBA approval before IP filing based on biological resources from India (§3 & §6).' },
      { title: 'Nagoya Protocol on Access and Benefit-Sharing', document: 'CBD Secretariat', date: '12 Oct 2014', jurisdiction: 'International', status: 'Current', description: 'International framework for PIC, MAT, and equitable benefit sharing from genetic resources.' },
      { title: 'ITPGRFA — International Treaty on Plant Genetic Resources', document: 'FAO', date: '29 Jun 2004', jurisdiction: 'International', status: 'Current', description: 'Governs access to plant genetic resources for food and agriculture under multilateral system.' },
    ],
  },
  {
    id: 'ayush',
    label: 'AYUSH Regulations',
    count: 4,
    entries: [
      { title: 'Drugs & Cosmetics Act, 1940 (Schedule E(1))', document: 'CDSCO / Ministry of Health', date: '01 Jan 2021', jurisdiction: 'India', status: 'Current', description: 'Lists poisonous Ayurvedic substances requiring special labelling and prescription handling.' },
      { title: 'Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954', document: 'Ministry of Health', date: '1954', jurisdiction: 'India', status: 'Current', description: 'Prohibits misleading claims for diseases including those made for Ayurvedic remedies.' },
      { title: 'AYUSH Manufacturing Rules (GMP), 2021', document: 'Ministry of AYUSH', date: '01 Jan 2021', jurisdiction: 'India', status: 'Current', description: 'Good Manufacturing Practice requirements specific to AYUSH medicinal products.' },
      { title: 'Ayurvedic Pharmacopoeia of India (API)', document: 'Ministry of AYUSH', date: 'Ongoing', jurisdiction: 'India', status: 'Official', description: 'Official quality standards for Ayurvedic medicinal plants and formulations.' },
    ],
  },
  {
    id: 'tk',
    label: 'Traditional Knowledge',
    count: 2,
    entries: [
      { title: 'Traditional Knowledge Digital Library (TKDL)', document: 'CSIR — TKDL Unit', date: 'From 2001', jurisdiction: 'India (International)', status: 'Official', description: 'Digitised database of traditional Ayurvedic, Unani, Siddha, and Yoga formulations used as prior art at patent offices worldwide.' },
      { title: "Farmers' and Community Rights — Protection of Traditional Knowledge", document: 'ICAR / PPV&FRA', date: '2001', jurisdiction: 'India', status: 'Current', description: 'Framework for protecting traditional agricultural and community knowledge from biopiracy.' },
    ],
  },
  {
    id: 'international',
    label: 'International Frameworks',
    count: 3,
    entries: [
      { title: 'Convention on Biological Diversity (CBD)', document: 'UNEP / CBD Secretariat', date: '29 Dec 1993', jurisdiction: 'International', status: 'Current', description: 'Establishes sovereign rights over genetic resources and the ABS framework.' },
      { title: 'TRIPS Agreement — Trade-Related IP Rights', document: 'WTO', date: '01 Jan 1995', jurisdiction: 'International', status: 'Current', description: 'Sets minimum IP protection standards including patentability criteria for WTO members.' },
      { title: 'Paris Convention for the Protection of Industrial Property', document: 'WIPO', date: '20 Mar 1883', jurisdiction: 'International', status: 'Historical', description: 'Foundational international treaty on industrial property including patents and trademarks.' },
    ],
  },
  {
    id: 'case-law',
    label: 'Case Law',
    count: 3,
    entries: [
      { title: 'Novartis AG v. Union of India (2013)', document: 'Supreme Court of India', date: '01 Apr 2013', jurisdiction: 'India', status: 'Official', description: 'Landmark Supreme Court ruling on §3(d) and the patentability of incremental pharmaceutical innovations.' },
      { title: 'Bayer Corporation v. Union of India (2014)', document: 'Supreme Court of India', date: '01 Mar 2014', jurisdiction: 'India', status: 'Official', description: 'Compulsory licensing ruling establishing principles for access to essential medicines.' },
      { title: 'Ayurvedic Formulary — TKDL Prior Art Decisions (EPO, 2002–2022)', document: 'EPO / TKDL', date: 'Ongoing', jurisdiction: 'International', status: 'Current', description: 'Collection of EPO and international patent office revocations based on TKDL prior art citations.' },
    ],
  },
]

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const allCategories = [{ id: 'All', label: 'All', count: categories.reduce((acc, c) => acc + c.count, 0) }, ...categories.map(c => ({ id: c.id, label: c.label, count: c.count }))]

  const filteredCategories = categories.filter(cat =>
    activeCategory === 'All' || cat.id === activeCategory
  ).map(cat => ({
    ...cat,
    entries: cat.entries.filter(entry =>
      searchQuery === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.document.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.entries.length > 0)

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', color: '#173F2A', marginBottom: '6px', fontWeight: 400 }}>
          Knowledge Base
        </h1>
        <p style={{ fontSize: '14px', color: '#4A5E51' }}>
          Explore the legal, regulatory, scientific and traditional-knowledge corpus powering IP-SAKTI.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <svg
          width="18" height="18" viewBox="0 0 18 18" fill="none"
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#7A9285', pointerEvents: 'none' }}
        >
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M14 14l-2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search provisions, patents, regulations, ingredients or traditional knowledge…"
          style={{
            width: '100%',
            padding: '14px 16px 14px 42px',
            border: '1px solid #DFC0B7',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'Manrope, system-ui, sans-serif',
            color: '#173F2A',
            backgroundColor: '#FDF2EC',
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.04)',
          }}
          onFocus={e => (e.target.style.borderColor = '#173F2A')}
          onBlur={e => (e.target.style.borderColor = '#DFC0B7')}
        />
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {allCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: `1px solid ${activeCategory === cat.id ? '#173F2A' : '#DFC0B7'}`,
              backgroundColor: activeCategory === cat.id ? '#173F2A' : '#FDF2EC',
              color: activeCategory === cat.id ? '#FFFFFF' : '#4A5E51',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Manrope, system-ui, sans-serif',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {cat.label}
            <span style={{ fontSize: '10px', opacity: 0.7 }}>({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {filteredCategories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7A9285' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#173F2A', marginBottom: '6px' }}>No results found</div>
          <div style={{ fontSize: '13px' }}>Try different search terms or browse by category.</div>
        </div>
      ) : (
        filteredCategories.map(cat => (
          <div key={cat.id}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#173F2A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {cat.label}
              <span style={{ fontSize: '12px', fontWeight: 400, color: '#7A9285' }}>({cat.entries.length} entries)</span>
            </h2>
            <div
              style={{
                background: '#FFFDF8',
                border: '1px solid #DFC0B7',
                borderRadius: '12px',
                boxShadow: '0 1px 4px 0 rgba(23, 63, 42,0.06)',
                overflow: 'hidden',
              }}
            >
              {cat.entries.map((entry, i) => {
                const key = `${cat.id}-${i}`
                const isOpen = expanded.has(key)
                return (
                  <div key={i} style={{ borderBottom: i < cat.entries.length - 1 ? '1px solid #F7EDE5' : 'none' }}>
                    <div
                      style={{
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '16px',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleExpand(key)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#173F2A' }}>{entry.title}</span>
                          <StatusBadge status={entry.status} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#7A9285' }}>
                          <span>{entry.document}</span>
                          <span>·</span>
                          <span>{entry.jurisdiction}</span>
                          <span>·</span>
                          <span>{entry.date}</span>
                        </div>
                        {isOpen && (
                          <p style={{ fontSize: '13px', color: '#4A5E51', margin: '10px 0 0', lineHeight: '1.5' }}>
                            {entry.description}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: '#173F2A', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {isOpen ? 'Less ↑' : 'More →'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
