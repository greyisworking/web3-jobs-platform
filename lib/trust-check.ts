/**
 * Company Trust Check System
 * Evaluates company trustworthiness based on multiple signals
 */

import { isTVLHealthy } from './api/defillama'

// ══════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════

export type TrustLevel = 'verified' | 'caution' | 'warning' | 'blacklisted'

export interface TrustCheck {
  id: string
  label: string
  passed: boolean
  type: 'white' | 'black'
  detail?: string
}

export interface TrustScore {
  level: TrustLevel
  score: number // 0-100
  checks: TrustCheck[]
  comment: string
  parentCompany?: string // For subsidiaries
}

// ══════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════

// Tier 1 VCs (trusted)
export const TIER1_VCS = [
  'a16z', 'Andreessen Horowitz',
  'Paradigm',
  'Hashed',
  'Sequoia',
  'Pantera',
  'Polychain',
  'Multicoin',
  'Dragonfly',
  'Electric Capital',
  'Framework Ventures',
  'Placeholder',
  'Variant',
  'Coinbase Ventures',
  'Binance Labs',
]

// ══════════════════════════════════════════════════════════
// Major Corporation Subsidiaries (Auto VERIFIED)
// ══════════════════════════════════════════════════════════

export interface ParentCompany {
  name: string
  subsidiaries: string[]
  country: 'KR' | 'JP' | 'US' | 'GLOBAL'
}

export const MAJOR_CORP_SUBSIDIARIES: ParentCompany[] = [
  // Dunamu (두나무) - Korea's largest crypto company
  {
    name: 'Dunamu',
    subsidiaries: [
      'lambda256', 'lambda 256', '람다256',
      'upbit', '업비트',
      'luniverse',
      'dunamu', '두나무',
      'ubcn', 'ub컨텐츠넷',
    ],
    country: 'KR',
  },
  // Kakao (카카오)
  {
    name: 'Kakao',
    subsidiaries: [
      'ground x', 'groundx', '그라운드엑스',
      'klaytn', '클레이튼',
      'kaia', 'kaia labs',
      'kakao games', '카카오게임즈',
      'kakao entertainment', '카카오엔터',
      'kakao', '카카오',
    ],
    country: 'KR',
  },
  // Naver (네이버)
  {
    name: 'Naver',
    subsidiaries: [
      'line next', 'line plus', 'line tech plus',
      'line xenesis',
      'naver labs', '네이버랩스',
      'naver z', '제페토', 'zepeto',
      'naver', '네이버',
      'snow', '스노우',
    ],
    country: 'KR',
  },
  // Line (라인)
  {
    name: 'Line',
    subsidiaries: [
      'line blockchain', 'line next', 'line plus',
      'finschia', '핀시아',
      'line', '라인',
    ],
    country: 'JP',
  },
  // SK Group
  {
    name: 'SK',
    subsidiaries: [
      'sk planet', 'sk플래닛',
      'sk telecom', 'skt',
      'sk c&c',
      'sk square', 'sk스퀘어',
    ],
    country: 'KR',
  },
  // Samsung
  {
    name: 'Samsung',
    subsidiaries: [
      'samsung sds', '삼성sds',
      'samsung next',
      'samsung electronics', '삼성전자',
    ],
    country: 'KR',
  },
  // Coinbase
  {
    name: 'Coinbase',
    subsidiaries: [
      'coinbase', 'base',
      'coinbase cloud',
      'coinbase ventures',
    ],
    country: 'US',
  },
  // Binance
  {
    name: 'Binance',
    subsidiaries: [
      'binance', 'bnb chain',
      'binance labs',
      'binance.us',
    ],
    country: 'GLOBAL',
  },
]

// Korean FSS registered / major exchanges (bonus points)
export const KOREAN_TRUSTED_ENTITIES = [
  // Major exchanges (금감원 등록)
  'upbit', 'bithumb', 'coinone', 'korbit', 'gopax',
  '업비트', '빗썸', '코인원', '코빗', '고팍스',
  // FSS registered companies
  'hashed', 'blocko', '블로코',
  'ozys', 'klippa', '클립파',
]

// Known scam/warning companies (example list)
const BLACKLISTED_COMPANIES: string[] = [
  // Add known scam projects here
]

// Warning keywords in news
const WARNING_KEYWORDS = [
  'layoff', 'lay-off', 'laid off',
  'restructuring', 'downsizing',
  'rugpull', 'rug pull', 'rug-pull',
  'scam', 'fraud', 'ponzi',
  'hack', 'hacked', 'exploit',
  'sec investigation', 'lawsuit',
  'bankruptcy', 'insolvent',
]

// Pixelbara comments for each trust level (Web3 degen style)
export const TRUST_COMMENTS: Record<TrustLevel, string> = {
  verified: 'ser this ones legit fr',
  caution: 'anon team... idk man. dyor',
  warning: 'giving rug energy ngl',
  blacklisted: 'they rugged. i was there.',
}

// ══════════════════════════════════════════════════════════
// Trust Check Functions
// ══════════════════════════════════════════════════════════

export interface CompanyData {
  name: string
  backers?: string[] | null
  hasToken?: boolean
  tvl?: number | null
  isDoxxed?: boolean
  isAudited?: boolean
  lastFundingDate?: Date | string | null
  newsAlerts?: string[]
  tokenPriceChange90d?: number | null
  parentCompany?: string | null // For subsidiaries (e.g., "Dunamu" for Lambda256)
  isKoreanEntity?: boolean // For Korean regulatory bonus
}

// ══════════════════════════════════════════════════════════
// Subsidiary Detection
// ══════════════════════════════════════════════════════════

/**
 * Check if company is a subsidiary of a major corporation
 * Returns parent company name if found
 */
export function detectParentCompany(companyName: string): string | null {
  const nameLower = companyName.toLowerCase()

  for (const parent of MAJOR_CORP_SUBSIDIARIES) {
    for (const subsidiary of parent.subsidiaries) {
      if (nameLower.includes(subsidiary.toLowerCase())) {
        return parent.name
      }
    }
  }

  return null
}

/**
 * Check if company is a Korean trusted entity
 */
export function isKoreanTrustedEntity(companyName: string): boolean {
  const nameLower = companyName.toLowerCase()
  return KOREAN_TRUSTED_ENTITIES.some(entity =>
    nameLower.includes(entity.toLowerCase())
  )
}

/**
 * Check if company is a major corp subsidiary (auto VERIFIED)
 */
function checkMajorCorpSubsidiary(companyName: string, parentCompany?: string | null): TrustCheck {
  const detected = parentCompany || detectParentCompany(companyName)

  return {
    id: 'major_corp',
    label: 'Major Corp Subsidiary',
    passed: !!detected,
    type: 'white',
    detail: detected || undefined,
  }
}

/**
 * Check if company is a Korean trusted entity
 */
function checkKoreanTrusted(companyName: string, isKoreanEntity?: boolean): TrustCheck {
  const isTrusted = isKoreanEntity || isKoreanTrustedEntity(companyName)

  return {
    id: 'korean_trusted',
    label: 'Korean Regulated Entity',
    passed: isTrusted,
    type: 'white',
  }
}

/**
 * Check if company has Tier 1 VC backing
 */
function checkTier1VC(backers?: string[] | null): TrustCheck {
  const hasTier1 = backers?.some((b) =>
    TIER1_VCS.some((vc) => b.toLowerCase().includes(vc.toLowerCase()))
  ) ?? false

  return {
    id: 'tier1_vc',
    label: 'Tier 1 VC Investment',
    passed: hasTier1,
    type: 'white',
    detail: hasTier1 ? backers?.find((b) =>
      TIER1_VCS.some((vc) => b.toLowerCase().includes(vc.toLowerCase()))
    ) : undefined,
  }
}

/**
 * Check if company received funding in the last year
 */
function checkRecentFunding(lastFundingDate?: Date | string | null): TrustCheck {
  if (!lastFundingDate) {
    return {
      id: 'recent_funding',
      label: 'Recent Funding (< 1 year)',
      passed: false,
      type: 'white',
    }
  }

  const fundingDate = new Date(lastFundingDate)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  return {
    id: 'recent_funding',
    label: 'Recent Funding (< 1 year)',
    passed: fundingDate >= oneYearAgo,
    type: 'white',
    detail: fundingDate.toLocaleDateString(),
  }
}

/**
 * Check if DeFi protocol has healthy TVL
 */
function checkTVL(tvl?: number | null): TrustCheck {
  const healthy = tvl ? isTVLHealthy(tvl) : false

  return {
    id: 'tvl_healthy',
    label: 'TVL > $10M',
    passed: healthy,
    type: 'white',
    detail: tvl ? `$${(tvl / 1e6).toFixed(1)}M` : undefined,
  }
}

/**
 * Check if team is doxxed
 */
function checkDoxxed(isDoxxed?: boolean): TrustCheck {
  return {
    id: 'doxxed',
    label: 'Team Doxxed',
    passed: isDoxxed ?? false,
    type: 'white',
  }
}

/**
 * Check if project is audited
 */
function checkAudited(isAudited?: boolean): TrustCheck {
  return {
    id: 'audited',
    label: 'Security Audit',
    passed: isAudited ?? false,
    type: 'white',
  }
}

/**
 * Check for blacklisted company
 */
function checkBlacklisted(name: string): TrustCheck {
  const isBlacklisted = BLACKLISTED_COMPANIES.some(
    (b) => name.toLowerCase().includes(b.toLowerCase())
  )

  return {
    id: 'blacklisted',
    label: 'Scam Reports',
    passed: !isBlacklisted, // passed = no reports
    type: 'black',
    detail: isBlacklisted ? 'Found in scam database' : undefined,
  }
}

/**
 * Check for anonymous team (warning sign)
 */
function checkAnonymousTeam(isDoxxed?: boolean): TrustCheck {
  return {
    id: 'anon_team',
    label: 'Anonymous Team',
    passed: isDoxxed !== false, // passed = not explicitly anon
    type: 'black',
  }
}

/**
 * Check for warning keywords in news
 */
function checkNewsAlerts(newsAlerts?: string[]): TrustCheck {
  const hasWarning = newsAlerts?.some((alert) =>
    WARNING_KEYWORDS.some((kw) => alert.toLowerCase().includes(kw))
  ) ?? false

  return {
    id: 'news_warning',
    label: 'Negative News',
    passed: !hasWarning,
    type: 'black',
    detail: hasWarning ? 'Warning keywords detected' : undefined,
  }
}

/**
 * Check for token price crash
 */
function checkTokenCrash(priceChange90d?: number | null): TrustCheck {
  const hasCrashed = priceChange90d !== null && priceChange90d !== undefined && priceChange90d <= -90

  return {
    id: 'token_crash',
    label: 'Token Crash (-90%)',
    passed: !hasCrashed,
    type: 'black',
    detail: hasCrashed ? `${priceChange90d?.toFixed(0)}% in 90d` : undefined,
  }
}

// ══════════════════════════════════════════════════════════
// Main Trust Score Calculator
// ══════════════════════════════════════════════════════════

// Score weights for positive signals
const SCORE_WEIGHTS = {
  major_corp: 50,       // Major corp subsidiary = auto high score
  korean_trusted: 30,   // Korean regulated entity
  tier1_vc: 25,         // Tier 1 VC
  recent_funding: 15,   // Recent funding
  tvl_healthy: 15,      // Healthy TVL
  doxxed: 25,           // Team doxxed (increased from ~20)
  audited: 15,          // Security audit
}

/**
 * Calculate trust score for a company
 */
export function calculateTrustScore(company: CompanyData): TrustScore {
  const checks: TrustCheck[] = []

  // Detect parent company first
  const detectedParent = company.parentCompany || detectParentCompany(company.name)

  // White checks (positive signals)
  const majorCorpCheck = checkMajorCorpSubsidiary(company.name, company.parentCompany)
  checks.push(majorCorpCheck)
  checks.push(checkKoreanTrusted(company.name, company.isKoreanEntity))
  checks.push(checkTier1VC(company.backers))
  checks.push(checkRecentFunding(company.lastFundingDate))
  if (company.tvl !== undefined) {
    checks.push(checkTVL(company.tvl))
  }
  checks.push(checkDoxxed(company.isDoxxed))
  checks.push(checkAudited(company.isAudited))

  // Black checks (negative signals)
  checks.push(checkBlacklisted(company.name))
  checks.push(checkAnonymousTeam(company.isDoxxed))
  checks.push(checkNewsAlerts(company.newsAlerts))
  if (company.hasToken) {
    checks.push(checkTokenCrash(company.tokenPriceChange90d))
  }

  // ══════════════════════════════════════════════════════════
  // Special Case: Major Corp Subsidiary = Auto VERIFIED
  // ══════════════════════════════════════════════════════════
  if (majorCorpCheck.passed) {
    // Auto VERIFIED for major corp subsidiaries
    return {
      level: 'verified',
      score: 95,
      checks,
      comment: TRUST_COMMENTS.verified,
      parentCompany: detectedParent || undefined,
    }
  }

  // ══════════════════════════════════════════════════════════
  // Calculate weighted score
  // ══════════════════════════════════════════════════════════
  let score = 0
  const whiteChecks = checks.filter((c) => c.type === 'white')
  const blackChecks = checks.filter((c) => c.type === 'black')

  // Add points for each passed white check based on weights
  for (const check of whiteChecks) {
    if (check.passed) {
      const weight = SCORE_WEIGHTS[check.id as keyof typeof SCORE_WEIGHTS] || 15
      score += weight
    }
  }

  // Apply black check penalties (reduced from 25 to 15)
  const blackPenalty = blackChecks.filter((c) => !c.passed).length * 15
  score = score - blackPenalty

  // ══════════════════════════════════════════════════════════
  // Special Case: Team Doxxed = minimum 50 points
  // ══════════════════════════════════════════════════════════
  const doxxedCheck = checks.find((c) => c.id === 'doxxed')
  if (doxxedCheck?.passed && score < 50) {
    score = 50
  }

  // Clamp score between 0-100
  score = Math.max(0, Math.min(100, score))

  // ══════════════════════════════════════════════════════════
  // Determine trust level
  // ══════════════════════════════════════════════════════════
  let level: TrustLevel
  const hasBlacklistHit = !checks.find((c) => c.id === 'blacklisted')?.passed

  if (hasBlacklistHit) {
    level = 'blacklisted'
    score = 0
  } else if (score >= 60) {
    level = 'verified'
  } else if (score >= 35) {
    level = 'caution'
  } else {
    level = 'warning'
  }

  return {
    level,
    score,
    checks,
    comment: TRUST_COMMENTS[level],
    parentCompany: detectedParent || undefined,
  }
}

/**
 * Quick trust check based on limited data (for cards)
 */
export function quickTrustCheck(backers?: string[] | null, companyName?: string): TrustLevel {
  // Check for major corp subsidiary first
  if (companyName) {
    const parentCompany = detectParentCompany(companyName)
    if (parentCompany) return 'verified'

    // Check Korean trusted entity
    if (isKoreanTrustedEntity(companyName)) return 'verified'
  }

  // Check Tier 1 VC
  const hasTier1 = backers?.some((b) =>
    TIER1_VCS.some((vc) => b.toLowerCase().includes(vc.toLowerCase()))
  ) ?? false

  if (hasTier1) return 'verified'
  if (backers && backers.length > 0) return 'caution'
  return 'caution' // Default to caution for unknown
}
