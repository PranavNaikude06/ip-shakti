export type PageId =
  | 'dashboard'
  | 'product-analysis'
  | 'assessments'
  | 'ip-assessment'
  | 'abs-compliance'
  | 'regulatory-pathway'
  | 'evidence-explorer'
  | 'knowledge-graph'
  | 'legal-library'
  | 'reports'
  | 'intelligence'
  | 'assessment-detail'

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Review Required'
export type AnalysisStatus = 'Completed' | 'Review Required' | 'Expert Review' | 'Draft'
export type SourceStatus = 'Official' | 'Verified' | 'Current' | 'Historical'
export type EscalationStatus = 'Pending' | 'Assigned' | 'Under Review' | 'Resolved'

export interface MetricData {
  label: string
  value: number
  trend: number
  unit?: string
  icon: string
}

export interface PriorityAlert {
  id: string
  severity: 'High' | 'Medium' | 'Low'
  product: string
  reason: string
  action: string
  type: 'patent' | 'abs' | 'tk' | 'regulatory'
}

export interface AnalysisRecord {
  id: string
  product: string
  date: string
  classification: string
  patentability: RiskLevel
  tkStatus: string
  absStatus: string
  regulatoryPathway: string
  confidence: number
  lastUpdated: string
  status: AnalysisStatus
}

export interface SourceRecord {
  id: string
  authority: string
  document: string
  section: string
  jurisdiction: string
  effectiveDate: string
  statuses: SourceStatus[]
  usedFor: string
  excerpt: string
}

export interface KGNode {
  id: string
  label: string
  type: 'product' | 'ingredient' | 'patent' | 'law' | 'regulation' | 'tk' | 'biological'
  x: number
  y: number
  r: number
}

export interface KGEdge {
  from: string
  to: string
  label: string
}

export interface RelevantConnection {
  label: string
  reference: string
  relevance: number
  color: string
}

// --- Metrics ---
export const metrics: MetricData[] = [
  { label: 'Active Products', value: 14, trend: 3, icon: 'package' },
  { label: 'IP Assets', value: 27, trend: 5, icon: 'shield' },
  { label: 'Expiring Soon', value: 3, trend: -1, icon: 'clock' },
  { label: 'Compliance Reviews', value: 8, trend: 2, icon: 'clipboard' },
  { label: 'Expert Escalations', value: 2, trend: 0, icon: 'user-check' },
]

// --- Priority Alerts ---
export const priorityAlerts: PriorityAlert[] = [
  {
    id: 'PA-001',
    severity: 'High',
    product: 'Ashwagandha Advanced Extract',
    reason: 'Patent IN202311045231 approaching expiry in 90 days',
    action: 'Initiate renewal or continuation proceedings',
    type: 'patent',
  },
  {
    id: 'PA-002',
    severity: 'High',
    product: 'Guduchi Immunity Capsules',
    reason: 'ABS assessment incomplete — biological resource sourced from notified area',
    action: 'Complete ABS compliance workflow before commercial launch',
    type: 'abs',
  },
  {
    id: 'PA-003',
    severity: 'Medium',
    product: 'Triphala Gut Formula',
    reason: 'Traditional knowledge overlap detected — TKDL ref TK-TR-0567',
    action: 'Review prior art and consult TK expert before filing',
    type: 'tk',
  },
  {
    id: 'PA-004',
    severity: 'Medium',
    product: 'Brahmi Memory Support',
    reason: 'Regulatory classification requires review — possible Phytopharmaceutical route',
    action: 'Seek CDSCO pre-submission consultation',
    type: 'regulatory',
  },
  {
    id: 'PA-005',
    severity: 'Low',
    product: 'Neem Skin Repair Serum',
    reason: 'Prior-art search incomplete for novel extraction methodology',
    action: 'Complete prior-art search and file provisional application',
    type: 'patent',
  },
]

// --- Analysis Records ---
export const analysisRecords: AnalysisRecord[] = [
  {
    id: 'AN-2026-0891',
    product: 'Ashwagandha Advanced Extract',
    date: '28 Aug 2026',
    classification: 'Proprietary Ayurvedic Medicine',
    patentability: 'Moderate',
    tkStatus: 'Overlap Detected',
    absStatus: 'Review Required',
    regulatoryPathway: 'AYUSH',
    confidence: 91,
    lastUpdated: '28 Aug 2026',
    status: 'Review Required',
  },
  {
    id: 'AN-2026-0876',
    product: 'Triphala Gut Formula',
    date: '22 Aug 2026',
    classification: 'Classical Ayurvedic Medicine',
    patentability: 'Low',
    tkStatus: 'Reference Detected',
    absStatus: 'Compliant',
    regulatoryPathway: 'AYUSH',
    confidence: 87,
    lastUpdated: '24 Aug 2026',
    status: 'Expert Review',
  },
  {
    id: 'AN-2026-0862',
    product: 'Brahmi Memory Support',
    date: '18 Aug 2026',
    classification: 'Proprietary Ayurvedic Medicine',
    patentability: 'Moderate',
    tkStatus: 'No Overlap',
    absStatus: 'Compliant',
    regulatoryPathway: 'AYUSH / Phytopharmaceutical',
    confidence: 79,
    lastUpdated: '20 Aug 2026',
    status: 'Review Required',
  },
  {
    id: 'AN-2026-0851',
    product: 'Shatavari Women\'s Health',
    date: '12 Aug 2026',
    classification: 'Proprietary Ayurvedic Medicine',
    patentability: 'Low',
    tkStatus: 'No Overlap',
    absStatus: 'Compliant',
    regulatoryPathway: 'AYUSH',
    confidence: 94,
    lastUpdated: '14 Aug 2026',
    status: 'Completed',
  },
  {
    id: 'AN-2026-0839',
    product: 'Neem Skin Repair Serum',
    date: '05 Aug 2026',
    classification: 'Cosmetic / Ayurvedic',
    patentability: 'High',
    tkStatus: 'No Overlap',
    absStatus: 'Review Required',
    regulatoryPathway: 'Cosmetics (D&C Act)',
    confidence: 82,
    lastUpdated: '06 Aug 2026',
    status: 'Draft',
  },
  {
    id: 'AN-2026-0821',
    product: 'Guduchi Immunity Capsules',
    date: '29 Jul 2026',
    classification: 'Proprietary Ayurvedic Medicine',
    patentability: 'Moderate',
    tkStatus: 'Overlap Detected',
    absStatus: 'Review Required',
    regulatoryPathway: 'AYUSH',
    confidence: 88,
    lastUpdated: '02 Aug 2026',
    status: 'Review Required',
  },
]

// --- Source Records ---
export const sourceRecords: SourceRecord[] = [
  {
    id: 'EVID-001',
    authority: 'Parliament of India',
    document: 'Patents Act, 1970',
    section: 'Section 3(p)',
    jurisdiction: 'India',
    effectiveDate: '20 Apr 1972',
    statuses: ['Official', 'Current'],
    usedFor: 'Patentability / Traditional Knowledge assessment',
    excerpt:
      'An invention which, in effect, is traditional knowledge or which is an aggregation or duplication of known properties of traditionally known component or components, is not patentable.',
  },
  {
    id: 'EVID-002',
    authority: 'Parliament of India',
    document: 'Biological Diversity Act, 2002',
    section: 'Section 3 & Section 6',
    jurisdiction: 'India',
    effectiveDate: '05 Feb 2003',
    statuses: ['Official', 'Current'],
    usedFor: 'ABS Compliance / Biological Resource identification',
    excerpt:
      'No person shall, without previous approval of the National Biodiversity Authority, apply for any intellectual property right, by whatever name called, in or outside India for any invention based on any research or information on a biological resource obtained from India.',
  },
  {
    id: 'EVID-003',
    authority: 'Ministry of AYUSH',
    document: 'Drugs & Cosmetics Act — Schedule E(1)',
    section: 'Schedule E(1)',
    jurisdiction: 'India',
    effectiveDate: '01 Jan 2021',
    statuses: ['Official', 'Verified', 'Current'],
    usedFor: 'Regulatory pathway / Manufacturing requirements',
    excerpt:
      'Schedule E(1) lists poisonous substances under Ayurvedic, Siddha, and Unani Systems of Medicine which require special labelling and prescription.',
  },
  {
    id: 'EVID-004',
    authority: 'CSIR — TKDL',
    document: 'Traditional Knowledge Digital Library',
    section: 'Ref TK-AW-0234',
    jurisdiction: 'India (International)',
    effectiveDate: '01 Mar 2001',
    statuses: ['Official', 'Verified'],
    usedFor: 'Prior art / Traditional knowledge overlap assessment',
    excerpt:
      'TKDL documents traditional Ayurvedic formulations containing Withania somnifera (Ashwagandha) as described in classical texts including Charaka Samhita and Sushruta Samhita.',
  },
  {
    id: 'EVID-005',
    authority: 'CBD Secretariat',
    document: 'Nagoya Protocol on ABS',
    section: 'Article 6',
    jurisdiction: 'International',
    effectiveDate: '12 Oct 2014',
    statuses: ['Official', 'Current'],
    usedFor: 'ABS compliance / International obligations',
    excerpt:
      'In the exercise of sovereign rights over natural resources, and subject to domestic access and benefit-sharing legislation or regulatory requirements, access to genetic resources for their utilization shall be subject to the prior informed consent of the Party providing such resources.',
  },
  {
    id: 'EVID-006',
    authority: 'Parliament of India',
    document: 'Trade Marks Act, 1999',
    section: 'Section 9(1)(b)',
    jurisdiction: 'India',
    effectiveDate: '15 Sep 2003',
    statuses: ['Official', 'Current'],
    usedFor: 'Trademark / Brand assessment',
    excerpt:
      'A trade mark shall not be registered if it is devoid of any distinctive character or if it consists exclusively of marks or indications which may serve, in trade, to designate the kind, quality, quantity, intended purpose, value, geographical origin, or the time of production of the goods.',
  },
]

// --- Knowledge Graph Nodes (viewBox 0 0 800 560) ---
export const kgNodes: KGNode[] = [
  { id: 'center', label: 'Ashwagandha\nFormulation', type: 'product', x: 400, y: 280, r: 44 },
  { id: 'n1', label: 'Ashwagandha\n(Withania somnifera)', type: 'ingredient', x: 210, y: 150, r: 30 },
  { id: 'n2', label: 'Traditional\nKnowledge (TKDL)', type: 'tk', x: 595, y: 150, r: 30 },
  { id: 'n3', label: 'Patent\nIN202311045231', type: 'patent', x: 160, y: 305, r: 28 },
  { id: 'n4', label: 'Patent\nUS10123456B2', type: 'patent', x: 190, y: 430, r: 28 },
  { id: 'n5', label: "Patents Act\n§3(p)", type: 'law', x: 600, y: 385, r: 28 },
  { id: 'n6', label: 'Biological\nDiversity Act', type: 'law', x: 660, y: 255, r: 28 },
  { id: 'n7', label: 'AYUSH\nRegulation', type: 'regulation', x: 400, y: 460, r: 28 },
]

export const kgEdges: KGEdge[] = [
  { from: 'center', to: 'n1', label: 'contains' },
  { from: 'center', to: 'n2', label: 'references TK' },
  { from: 'center', to: 'n3', label: 'prior art' },
  { from: 'center', to: 'n4', label: 'prior art' },
  { from: 'center', to: 'n5', label: 'governed by' },
  { from: 'center', to: 'n6', label: 'governed by' },
  { from: 'center', to: 'n7', label: 'regulated by' },
  { from: 'n1', to: 'n2', label: 'documented in' },
  { from: 'n2', to: 'n5', label: 'restricts' },
]

export const relevantConnections: RelevantConnection[] = [
  { label: "Patents Act §3(p)", reference: 'EVID-001', relevance: 94, color: '#CF5A3D' },
  { label: 'Biodiversity / ABS Regulation', reference: 'EVID-002', relevance: 89, color: '#E9684F' },
  { label: 'Similar patent — IN202311045231', reference: 'IN202311045231', relevance: 82, color: '#E9684F' },
  { label: 'TKDL TK-AW-0234', reference: 'EVID-004', relevance: 78, color: '#4A5E51' },
]

// Mini KG nodes (viewBox 0 0 500 320)
export const kgNodesMini: KGNode[] = [
  { id: 'center', label: 'Ashwagandha\nFormulation', type: 'product', x: 250, y: 160, r: 34 },
  { id: 'n1', label: 'Ashwagandha', type: 'ingredient', x: 120, y: 80, r: 24 },
  { id: 'n2', label: 'TK / TKDL', type: 'tk', x: 378, y: 80, r: 22 },
  { id: 'n3', label: 'Patent\nIN202311...', type: 'patent', x: 90, y: 185, r: 22 },
  { id: 'n4', label: "Patents Act\n§3(p)", type: 'law', x: 395, y: 225, r: 22 },
  { id: 'n5', label: 'BDA 2002', type: 'law', x: 430, y: 150, r: 20 },
  { id: 'n6', label: 'AYUSH Reg', type: 'regulation', x: 250, y: 280, r: 20 },
]

export const kgEdgesMini: KGEdge[] = [
  { from: 'center', to: 'n1', label: '' },
  { from: 'center', to: 'n2', label: '' },
  { from: 'center', to: 'n3', label: '' },
  { from: 'center', to: 'n4', label: '' },
  { from: 'center', to: 'n5', label: '' },
  { from: 'center', to: 'n6', label: '' },
  { from: 'n1', to: 'n2', label: '' },
]

export const nodeColors: Record<KGNode['type'], string> = {
  product: '#E9684F',
  ingredient: '#E9684F',
  tk: '#A94350',
  patent: '#4A5E51',
  law: '#173F2A',
  regulation: '#CF5A3D',
  biological: '#A94350',
}

// --- Evidence Explorer Records ---
export interface EvidenceRecord {
  id: string
  source: string
  framework: string
  section: string
  confidence: number
  finding: string
  status: string
  jurisdiction: string
  product: string
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical'
}

export const evidenceRecords: EvidenceRecord[] = [
  {
    id: 'EVID-001',
    source: 'Patents Act 1970',
    framework: 'Patent',
    section: 'Section 3(p)',
    confidence: 94,
    finding: 'Prior-art similarity — traditional use documented in TKDL',
    status: 'Verified',
    jurisdiction: 'India',
    product: 'Ashwagandha Advanced Extract',
    riskLevel: 'High',
  },
  {
    id: 'EVID-014',
    source: 'TKDL Database',
    framework: 'Traditional Knowledge',
    section: 'TK-AW-0234',
    confidence: 89,
    finding: 'TK overlap — classical reference in Charaka Samhita',
    status: 'Verified',
    jurisdiction: 'India (International)',
    product: 'Ashwagandha Advanced Extract',
    riskLevel: 'High',
  },
  {
    id: 'EVID-021',
    source: 'Biological Diversity Act 2002',
    framework: 'ABS',
    section: 'Rule 4',
    confidence: 91,
    finding: 'Biological-resource relationship — prior NBA approval required',
    status: 'Official',
    jurisdiction: 'India',
    product: 'Guduchi Immunity Capsules',
    riskLevel: 'High',
  },
  {
    id: 'EVID-034',
    source: 'Nagoya Protocol',
    framework: 'ABS',
    section: 'Article 6',
    confidence: 87,
    finding: 'International ABS obligation — prior informed consent required',
    status: 'Verified',
    jurisdiction: 'International',
    product: 'Guduchi Immunity Capsules',
    riskLevel: 'Moderate',
  },
  {
    id: 'EVID-048',
    source: 'D&C Act — Schedule E(1)',
    framework: 'AYUSH',
    section: 'Schedule E(1)',
    confidence: 96,
    finding: 'Labelling requirement — special prescription labelling needed',
    status: 'Official',
    jurisdiction: 'India',
    product: 'Triphala Gut Formula',
    riskLevel: 'Moderate',
  },
  {
    id: 'EVID-052',
    source: 'Patent IN202311045231',
    framework: 'Patent',
    section: 'Claims 1–4',
    confidence: 82,
    finding: 'Overlapping extraction methodology claim — novelty concern',
    status: 'Verified',
    jurisdiction: 'India',
    product: 'Brahmi Memory Support',
    riskLevel: 'Moderate',
  },
  {
    id: 'EVID-067',
    source: 'Trade Marks Act 1999',
    framework: 'Trademark',
    section: 'Section 9(1)(b)',
    confidence: 78,
    finding: 'Descriptive mark concern — "Shatavari" may lack distinctiveness',
    status: 'Verified',
    jurisdiction: 'India',
    product: "Shatavari Women's Health",
    riskLevel: 'Low',
  },
  {
    id: 'EVID-078',
    source: 'CDSCO Guidelines 2023',
    framework: 'Regulatory',
    section: 'Para 4.2',
    confidence: 88,
    finding: 'Phytopharmaceutical route applicable — CDSCO pre-submission advised',
    status: 'Current',
    jurisdiction: 'India',
    product: 'Brahmi Memory Support',
    riskLevel: 'Moderate',
  },
]

// --- Legal Library Entries ---
export interface LegalEntry {
  id: string
  reference: string
  title: string
  category: 'Patent Law' | 'Biodiversity' | 'Traditional Knowledge' | 'AYUSH' | 'Regulatory'
  jurisdiction: string
  effectiveDate: string
  lastVerified: string
  status: 'Current' | 'Historical'
  summary: string
  keyProvision: string
}

export const legalEntries: LegalEntry[] = [
  {
    id: 'PAT-ACT-1970',
    reference: 'PAT-ACT-1970',
    title: 'Patents Act, 1970',
    category: 'Patent Law',
    jurisdiction: 'India',
    effectiveDate: '20 Apr 1972',
    lastVerified: '01 Aug 2026',
    status: 'Current',
    summary: 'Primary statute governing patentability in India. Section 3(p) explicitly excludes traditional knowledge from patentability.',
    keyProvision: 'Section 3(p) — traditional knowledge not patentable',
  },
  {
    id: 'BIO-ACT-2002',
    reference: 'BIO-ACT-2002',
    title: 'Biological Diversity Act, 2002',
    category: 'Biodiversity',
    jurisdiction: 'India',
    effectiveDate: '05 Feb 2003',
    lastVerified: '01 Aug 2026',
    status: 'Current',
    summary: 'Governs access to biological resources and benefit sharing. Requires NBA approval before filing IP on inventions based on biological resources from India.',
    keyProvision: 'Section 6 — prior NBA approval required',
  },
  {
    id: 'ABS-RULE-2014',
    reference: 'ABS-RULE-2014',
    title: 'Biological Diversity (Access to Biological Resources and Knowledge) Rules, 2014',
    category: 'Biodiversity',
    jurisdiction: 'India',
    effectiveDate: '12 Dec 2014',
    lastVerified: '01 Aug 2026',
    status: 'Current',
    summary: 'Operational rules under the Biological Diversity Act specifying procedures for ABS applications, benefit-sharing agreements, and NBA approvals.',
    keyProvision: 'Rule 4 — ABS application procedure',
  },
  {
    id: 'NAGOYA-2014',
    reference: 'NAGOYA-2014',
    title: 'Nagoya Protocol on Access and Benefit Sharing',
    category: 'Biodiversity',
    jurisdiction: 'International',
    effectiveDate: '12 Oct 2014',
    lastVerified: '01 Aug 2026',
    status: 'Current',
    summary: 'International treaty supplementing the CBD for access to genetic resources and fair benefit sharing. Requires prior informed consent from provider countries.',
    keyProvision: 'Article 6 — prior informed consent requirement',
  },
  {
    id: 'TKDL-2001',
    reference: 'TKDL-2001',
    title: 'Traditional Knowledge Digital Library',
    category: 'Traditional Knowledge',
    jurisdiction: 'India (International)',
    effectiveDate: '01 Mar 2001',
    lastVerified: '15 Aug 2026',
    status: 'Current',
    summary: 'Searchable database of traditional Ayurvedic, Siddha, Unani and Yoga formulations. Used as prior-art evidence at IPOs worldwide to prevent misappropriation.',
    keyProvision: 'TK documentation — prior art standard',
  },
  {
    id: 'DCA-SCHED-E',
    reference: 'DCA-SCHED-E',
    title: 'Drugs & Cosmetics Act — Schedule E(1)',
    category: 'AYUSH',
    jurisdiction: 'India',
    effectiveDate: '01 Jan 2021',
    lastVerified: '01 Aug 2026',
    status: 'Current',
    summary: 'Lists restricted Ayurvedic substances requiring special labelling and prescription. Applies to Schedule E(1) substances in Ayurvedic products.',
    keyProvision: 'Schedule E(1) — restricted substances list',
  },
  {
    id: 'CDSCO-PHYTO-2023',
    reference: 'CDSCO-PHYTO-2023',
    title: 'CDSCO Phytopharmaceutical Drug Guidelines, 2023',
    category: 'Regulatory',
    jurisdiction: 'India',
    effectiveDate: '15 Jun 2023',
    lastVerified: '01 Aug 2026',
    status: 'Current',
    summary: 'Guidelines for approval of Phytopharmaceutical drugs under the D&C Act. Applicable where Ayurvedic ingredients are used with defined active fractions.',
    keyProvision: 'Para 4.2 — pre-submission consultation',
  },
  {
    id: 'GI-ACT-1999',
    reference: 'GI-ACT-1999',
    title: 'Geographical Indications of Goods Act, 1999',
    category: 'Regulatory',
    jurisdiction: 'India',
    effectiveDate: '15 Sep 2003',
    lastVerified: '01 Aug 2026',
    status: 'Current',
    summary: 'Protects geographical indications for goods originating from specific regions. Relevant for Ayurvedic products with region-specific ingredients.',
    keyProvision: 'Section 22 — GI protection provisions',
  },
]
