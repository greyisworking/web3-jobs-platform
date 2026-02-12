import axios from 'axios'
import * as cheerio from 'cheerio'

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

export async function fetchHTML(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const response = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      timeout: 10000,
    })
    return cheerio.load(response.data)
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    return null
  }
}

export async function fetchJSON<T = any>(url: string, headers?: Record<string, string>): Promise<T | null> {
  try {
    const response = await axios.get<T>(url, {
      headers: { ...DEFAULT_HEADERS, ...headers },
      timeout: 15000,
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching JSON from ${url}:`, error)
    return null
  }
}

export async function fetchXML(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const response = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      timeout: 10000,
    })
    return cheerio.load(response.data, { xmlMode: true })
  } catch (error) {
    console.error(`Error fetching XML from ${url}:`, error)
    return null
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

/**
 * Extract clean HTML content preserving structure.
 * Removes noise elements (ads, related jobs, sidebars, etc.) before extraction.
 */
export function extractHTML($element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
  if (!$element.length) return ''

  // Clone to avoid mutating original
  const clone = $element.clone()

  // Remove standard noise elements
  clone.find('script, style, noscript, iframe, svg, nav, header, footer').remove()

  // Remove source-site noise: related jobs, salary widgets, profiles, sharing, etc.
  const noiseSelectors = [
    '[class*="related"]', '[class*="recommended"]', '[class*="similar"]',
    '[class*="share"]', '[class*="social"]', '[class*="sharing"]',
    '[class*="salary-comp"]', '[class*="salary-range"]', '[class*="salary-info"]',
    '[class*="average-salary"]', '[class*="compensation-data"]',
    '[class*="candidate"]', '[class*="profile-card"]',
    '[class*="chat"]', '[class*="interview"]', '[class*="cover-letter"]',
    '[class*="trust"]', '[class*="verified-badge"]', '[class*="verification"]',
    '[class*="cookie"]', '[class*="consent"]', '[class*="gdpr"]',
    '[class*="newsletter"]', '[class*="subscribe"]', '[class*="signup"]',
    '[class*="sidebar"]', '[class*="widget"]',
    '[class*="report"]', '[class*="flag"]',
    '[class*="bookmark"]', '[class*="save-job"]',
    '[class*="apply-section"]', '[class*="apply-btn"]',
    '[class*="comment"]', '[class*="discussion"]',
    '[class*="pagination"]', '[class*="pager"]',
    '[class*="ad-"]', '[class*="advert"]', '[class*="promo"]',
    '[class*="banner"]', '[class*="sponsored"]',
  ]
  for (const sel of noiseSelectors) {
    clone.find(sel).remove()
  }

  // Get HTML and clean it
  let html = clone.html() || ''

  // Convert to cleaner format
  html = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
    .trim()

  return html
}

/**
 * Parse salary string to extract min/max/currency
 */
export function parseSalary(salaryStr: string | null | undefined): {
  min: number | null
  max: number | null
  currency: string | null
} {
  if (!salaryStr) return { min: null, max: null, currency: null }

  const result = { min: null as number | null, max: null as number | null, currency: null as string | null }

  // Detect currency
  if (salaryStr.includes('$') || salaryStr.toLowerCase().includes('usd')) {
    result.currency = 'USD'
  } else if (salaryStr.includes('₩') || salaryStr.toLowerCase().includes('krw') || salaryStr.includes('원')) {
    result.currency = 'KRW'
  } else if (salaryStr.includes('€') || salaryStr.toLowerCase().includes('eur')) {
    result.currency = 'EUR'
  } else if (salaryStr.includes('£') || salaryStr.toLowerCase().includes('gbp')) {
    result.currency = 'GBP'
  }

  // Extract numbers (handle K for thousands)
  const numbers = salaryStr.match(/[\d,]+(?:\.\d+)?[kK]?/g)
  if (numbers && numbers.length > 0) {
    const parseNum = (s: string) => {
      const num = parseFloat(s.replace(/,/g, ''))
      if (s.toLowerCase().includes('k')) {
        return num * 1000
      }
      return num
    }

    result.min = parseNum(numbers[0])
    if (numbers.length > 1) {
      result.max = parseNum(numbers[1])
    }
  }

  return result
}

/**
 * Detect experience level from text
 */
export function detectExperienceLevel(text: string): string | null {
  const lower = text.toLowerCase()

  if (lower.includes('intern') || lower.includes('entry') || lower.includes('junior') || lower.includes('0-2 year') || lower.includes('신입')) {
    return 'Junior'
  }
  if (lower.includes('mid-level') || lower.includes('mid level') || lower.includes('intermediate') || lower.includes('2-5 year') || lower.includes('경력')) {
    return 'Mid'
  }
  if (lower.includes('senior') || lower.includes('lead') || lower.includes('principal') || lower.includes('5+ year') || lower.includes('시니어')) {
    return 'Senior'
  }
  if (lower.includes('staff') || lower.includes('architect') || lower.includes('director') || lower.includes('head of')) {
    return 'Lead'
  }

  return null
}

/**
 * Detect remote type from text
 */
export function detectRemoteType(text: string): string | null {
  const lower = text.toLowerCase()

  if (lower.includes('fully remote') || lower.includes('100% remote') || lower.includes('remote only') || lower === 'remote') {
    return 'Remote'
  }
  if (lower.includes('hybrid') || lower.includes('flexible')) {
    return 'Hybrid'
  }
  if (lower.includes('onsite') || lower.includes('on-site') || lower.includes('in-office') || lower.includes('office')) {
    return 'Onsite'
  }

  return null
}

/**
 * Role categories for job classification
 */
export type RoleCategory =
  | 'Engineering'
  | 'Product'
  | 'Design'
  | 'Marketing/Growth'
  | 'Business Development'
  | 'Operations/HR'
  | 'Community/Support'

/**
 * Detect job role category from job title
 * Categories: Engineering, Product, Design, Marketing/Growth, Business Development, Operations/HR, Community/Support
 */
export function detectRole(title: string): RoleCategory {
  const lower = title.toLowerCase()

  // Check compound/specific patterns FIRST (order matters!)

  // Community/Support compound terms (check before "developer" matches Engineering)
  if (lower.includes('developer relations') || lower.includes('devrel')) return 'Community/Support'
  if (lower.includes('developer advocate')) return 'Community/Support'
  if (lower.includes('support engineer')) return 'Community/Support'
  if (lower.includes('technical support')) return 'Community/Support'

  // Engineering-specific compound terms (check before ops/support)
  if (lower.includes('devops') || lower.includes('dev ops')) return 'Engineering'
  if (lower.includes('protocol engineer')) return 'Engineering'
  if (lower.includes('platform engineer')) return 'Engineering'
  if (lower.includes('infrastructure engineer')) return 'Engineering'

  // Business Development specific patterns
  if (lower.includes('business development') || lower.includes('biz dev') || lower.includes('bizdev')) return 'Business Development'
  if (lower.includes('enterprise sales') || lower.includes('sales manager') || lower.includes('account executive')) return 'Business Development'
  if (lower.includes('bd lead') || lower.includes('bd manager') || lower.match(/\bbd\b/)) return 'Business Development'
  if (lower.includes('사업개발')) return 'Business Development'

  // Operations/HR specific patterns
  if (lower.includes('talent acquisition') || lower.includes('recruiter') || lower.includes('recruiting')) return 'Operations/HR'
  if (lower.includes('human resource') || lower.includes(' hr ') || lower.startsWith('hr ')) return 'Operations/HR'
  if (lower.includes('people ops') || lower.includes('people operations')) return 'Operations/HR'

  // Engineering (high confidence patterns)
  const engineeringKeywords = [
    'engineer', 'developer', 'dev', 'programmer', 'architect', 'swe', 'sre',
    'backend', 'frontend', 'fullstack', 'full-stack', 'full stack',
    'infrastructure', 'platform', 'security', 'blockchain',
    'smart contract', 'solidity', 'rust', 'protocol', 'node',
    'data engineer', 'ml engineer', 'machine learning', 'ai engineer',
    'qa', 'quality', 'test', 'automation',
    '개발', '엔지니어', '백엔드', '프론트엔드', '풀스택',
  ]

  // Product
  const productKeywords = [
    'product manager', 'product lead', 'product owner', 'product director',
    'product analyst', 'product strategist',
    'program manager', 'project manager', 'technical product',
    '프로덕트', '기획',
  ]

  // Design
  const designKeywords = [
    'designer', 'design lead', 'design director', 'ux', 'ui', 'ui/ux',
    'visual design', 'brand design', 'graphic design', 'product design',
    'creative director', 'art director', 'illustrator',
    '디자이너', '디자인',
  ]

  // Marketing/Growth
  const marketingKeywords = [
    'marketing', 'growth', 'seo', 'sem', 'content', 'copywriter',
    'social media', 'brand manager', 'communications',
    'demand gen', 'acquisition', 'performance marketing',
    'influencer', 'campaign', 'events',
    '마케팅', '마케터', '그로스',
  ]

  // Business Development
  const bdKeywords = [
    'partnerships', 'sales', 'account',
    'client', 'revenue', 'strategic', 'alliances',
    'deal', 'commercial', 'expansion',
    '사업개발', '영업', '파트너십',
  ]

  // Operations/HR
  const opsKeywords = [
    'operations manager', 'ops manager',
    'people', 'finance', 'accounting',
    'legal', 'compliance', 'admin', 'office manager',
    'chief of staff', 'executive assistant',
    '운영', '인사', '채용', '재무', '회계',
  ]

  // Community/Support
  const communityKeywords = [
    'community', 'customer success', 'customer service',
    'developer relations', 'devrel', 'advocate', 'ambassador',
    'moderator', 'engagement', 'success manager',
    'help desk',
    '커뮤니티', '고객',
  ]

  // Check in order of specificity

  // Product (check before general terms)
  for (const keyword of productKeywords) {
    if (lower.includes(keyword)) return 'Product'
  }

  // Design
  for (const keyword of designKeywords) {
    if (lower.includes(keyword)) return 'Design'
  }

  // Engineering (check early for tech roles)
  for (const keyword of engineeringKeywords) {
    if (lower.includes(keyword)) return 'Engineering'
  }

  // Community/Support
  for (const keyword of communityKeywords) {
    if (lower.includes(keyword)) return 'Community/Support'
  }

  // Marketing/Growth
  for (const keyword of marketingKeywords) {
    if (lower.includes(keyword)) return 'Marketing/Growth'
  }

  // Business Development
  for (const keyword of bdKeywords) {
    if (lower.includes(keyword)) return 'Business Development'
  }

  // Operations/HR
  for (const keyword of opsKeywords) {
    if (lower.includes(keyword)) return 'Operations/HR'
  }

  // Default to Engineering for web3 job boards (most common category)
  return 'Engineering'
}

/**
 * Employment type categories for standardized filtering
 */
export type EmploymentType = 'Full-time' | 'Contractor' | 'Ambassador'

/**
 * Normalize employment type from raw crawled data to standard values.
 * Maps: "full-time", "full time", "permanent" → Full-time
 *       "contract", "contractor", "freelance" → Contractor
 *       "ambassador", "community", "devrel", "advocate" → Ambassador
 */
export function normalizeEmploymentType(type: string | null | undefined, title?: string): EmploymentType {
  const typeLower = (type ?? '').toLowerCase()
  const titleLower = (title ?? '').toLowerCase()

  // Check for Ambassador-type roles first (DevRel, Community, Ambassador positions)
  const ambassadorKeywords = ['ambassador', 'advocate', 'devrel', 'developer relations', 'community lead', 'community manager', 'evangelist']
  if (ambassadorKeywords.some(k => typeLower.includes(k) || titleLower.includes(k))) {
    return 'Ambassador'
  }

  // Check for Contractor-type
  const contractorKeywords = ['contract', 'contractor', 'freelance', 'freelancer', 'temporary', 'temp', 'consultant', 'consulting']
  if (contractorKeywords.some(k => typeLower.includes(k))) {
    return 'Contractor'
  }

  // Check for Full-time (default for permanent/regular positions)
  const fulltimeKeywords = ['full-time', 'full time', 'fulltime', 'permanent', 'regular', 'employee', 'fte']
  if (fulltimeKeywords.some(k => typeLower.includes(k))) {
    return 'Full-time'
  }

  // Part-time maps to Full-time (since we removed Part-time option)
  if (typeLower.includes('part-time') || typeLower.includes('part time')) {
    return 'Full-time'
  }

  // Internship also maps to Full-time
  if (typeLower.includes('intern')) {
    return 'Full-time'
  }

  // Default to Full-time
  return 'Full-time'
}

/**
 * Detect region based on location string.
 * Returns 'Korea' for Korean cities, 'Global' otherwise.
 */
export function detectRegion(location: string | null | undefined): 'Korea' | 'Global' {
  if (!location) return 'Global'

  const locationLower = location.toLowerCase()
  const koreaKeywords = [
    'korea', 'south korea', '한국', '대한민국',
    'seoul', '서울', 'busan', '부산', 'daegu', '대구',
    'incheon', '인천', 'gwangju', '광주', 'daejeon', '대전',
    'ulsan', '울산', 'sejong', '세종', 'pangyo', '판교',
    'gangnam', '강남', 'suwon', '수원', 'bundang', '분당',
  ]

  if (koreaKeywords.some(k => locationLower.includes(k))) {
    return 'Korea'
  }

  return 'Global'
}
