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

// Pixelbara comments for each trust level
export const TRUST_COMMENTS: Record<TrustLevel, string> = {
  verified: "this one's legit ser",
  caution: 'hmm... dyor anon',
  warning: 'be careful fren...',
  blacklisted: 'run. just run.',
}

// ══════════════════════════════════════════════════════════
// Trust Check Functions
// ══════════════════════════════════════════════════════════

interface CompanyData {
  name: string
  backers?: string[] | null
  hasToken?: boolean
  tvl?: number | null
  isDoxxed?: boolean
  isAudited?: boolean
  lastFundingDate?: Date | string | null
  newsAlerts?: string[]
  tokenPriceChange90d?: number | null
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

/**
 * Calculate trust score for a company
 */
export function calculateTrustScore(company: CompanyData): TrustScore {
  const checks: TrustCheck[] = []

  // White checks (positive signals)
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

  // Calculate score
  const whiteChecks = checks.filter((c) => c.type === 'white')
  const blackChecks = checks.filter((c) => c.type === 'black')

  const whiteScore = whiteChecks.filter((c) => c.passed).length / Math.max(whiteChecks.length, 1)
  const blackPenalty = blackChecks.filter((c) => !c.passed).length * 25 // Each failed black check = -25

  let score = Math.round(whiteScore * 100 - blackPenalty)
  score = Math.max(0, Math.min(100, score))

  // Determine level
  let level: TrustLevel
  const hasBlacklistHit = !checks.find((c) => c.id === 'blacklisted')?.passed

  if (hasBlacklistHit) {
    level = 'blacklisted'
    score = 0
  } else if (score >= 70) {
    level = 'verified'
  } else if (score >= 40) {
    level = 'caution'
  } else {
    level = 'warning'
  }

  return {
    level,
    score,
    checks,
    comment: TRUST_COMMENTS[level],
  }
}

/**
 * Quick trust check based on limited data (for cards)
 */
export function quickTrustCheck(backers?: string[] | null): TrustLevel {
  const hasTier1 = backers?.some((b) =>
    TIER1_VCS.some((vc) => b.toLowerCase().includes(vc.toLowerCase()))
  ) ?? false

  if (hasTier1) return 'verified'
  if (backers && backers.length > 0) return 'caution'
  return 'caution' // Default to caution for unknown
}
