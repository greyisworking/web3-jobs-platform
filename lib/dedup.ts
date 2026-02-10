/**
 * Enhanced Duplicate Detection for Job Crawling
 * Prevents duplicate job postings from being saved to the database
 */

// ══════════════════════════════════════════════════════════
// Company Name Normalization
// ══════════════════════════════════════════════════════════

const COMPANY_SUFFIXES = [
  // English
  'inc', 'inc.', 'incorporated',
  'ltd', 'ltd.', 'limited',
  'llc', 'l.l.c.',
  'corp', 'corp.', 'corporation',
  'co', 'co.', 'company',
  'plc', 'plc.',
  'labs', 'lab',
  'studio', 'studios',
  'ventures', 'venture',
  'capital',
  'foundation',
  'protocol',
  'network',
  'finance',
  // Korean
  '주식회사', '(주)',
]

const COMPANY_ALIASES: Record<string, string[]> = {
  'klaytn': ['kaia', 'kaia foundation', 'klaytn foundation'],
  'wemade': ['wemix', 'wemix play'],
  'line next': ['line', 'line corporation', 'dosi', 'finschia'],
  'dunamu': ['upbit'],
  'ground x': ['groundx'],
  'iconloop': ['icon'],
  'dsrv': ['dsrv labs', 'dsrvlabs'],
  'cryptoquant': ['cryptoquant.com'],
}

/**
 * Normalize company name for comparison
 */
export function normalizeCompanyName(name: string): string {
  let normalized = name.toLowerCase().trim()

  // Remove common suffixes
  for (const suffix of COMPANY_SUFFIXES) {
    const regex = new RegExp(`\\s*${suffix}\\s*$`, 'i')
    normalized = normalized.replace(regex, '').trim()
  }

  // Remove parenthetical content
  normalized = normalized.replace(/\([^)]*\)/g, '').trim()

  // Remove special characters
  normalized = normalized.replace(/[^a-z0-9\s]/g, '').trim()

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ')

  return normalized
}

/**
 * Check if two company names refer to the same company
 */
export function isSameCompany(a: string, b: string): boolean {
  const normA = normalizeCompanyName(a)
  const normB = normalizeCompanyName(b)

  // Direct match
  if (normA === normB) return true

  // Check aliases
  for (const [canonical, aliases] of Object.entries(COMPANY_ALIASES)) {
    const allNames = [canonical, ...aliases].map((n) => normalizeCompanyName(n))
    if (allNames.includes(normA) && allNames.includes(normB)) {
      return true
    }
  }

  return false
}

// ══════════════════════════════════════════════════════════
// Job Title Normalization
// ══════════════════════════════════════════════════════════

const TITLE_PREFIXES: Record<string, string> = {
  'sr': 'senior',
  'sr.': 'senior',
  'jr': 'junior',
  'jr.': 'junior',
  'assoc': 'associate',
  'assoc.': 'associate',
  'prin': 'principal',
  'prin.': 'principal',
  'mgr': 'manager',
  'eng': 'engineer',
  'dev': 'developer',
  'sw': 'software',
  'swe': 'software engineer',
  'fe': 'frontend',
  'be': 'backend',
  'fs': 'fullstack',
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
}

const TITLE_SYNONYMS: string[][] = [
  ['engineer', 'developer', 'programmer'],
  ['frontend', 'front-end', 'front end', 'fe'],
  ['backend', 'back-end', 'back end', 'be'],
  ['fullstack', 'full-stack', 'full stack', 'fs'],
  ['senior', 'sr', 'sr.'],
  ['junior', 'jr', 'jr.'],
  ['lead', 'tech lead', 'team lead'],
  ['manager', 'mgr'],
  ['devops', 'dev ops', 'sre', 'site reliability'],
  ['product', 'pm'],
  ['ui', 'ux', 'ui/ux', 'uiux'],
]

/**
 * Normalize job title for comparison
 */
export function normalizeJobTitle(title: string): string {
  let normalized = title.toLowerCase().trim()

  // Remove company name if present at end
  normalized = normalized.replace(/\s*[-–—@]\s*[\w\s]+$/, '').trim()

  // Expand abbreviations
  const words = normalized.split(/\s+/)
  const expandedWords = words.map((word) => TITLE_PREFIXES[word] || word)
  normalized = expandedWords.join(' ')

  // Remove special characters except hyphen
  normalized = normalized.replace(/[^a-z0-9\s-]/g, '')

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}

/**
 * Calculate similarity between two job titles (Jaccard similarity)
 */
export function titleSimilarity(a: string, b: string): number {
  const normA = normalizeJobTitle(a)
  const normB = normalizeJobTitle(b)

  if (normA === normB) return 1.0

  const wordsA = new Set(normA.split(' '))
  const wordsB = new Set(normB.split(' '))

  // Replace synonyms with canonical form
  const canonicalA = new Set<string>()
  const canonicalB = new Set<string>()

  for (const word of wordsA) {
    let found = false
    for (const synonyms of TITLE_SYNONYMS) {
      if (synonyms.includes(word)) {
        canonicalA.add(synonyms[0])
        found = true
        break
      }
    }
    if (!found) canonicalA.add(word)
  }

  for (const word of wordsB) {
    let found = false
    for (const synonyms of TITLE_SYNONYMS) {
      if (synonyms.includes(word)) {
        canonicalB.add(synonyms[0])
        found = true
        break
      }
    }
    if (!found) canonicalB.add(word)
  }

  // Jaccard similarity
  const intersection = new Set([...canonicalA].filter((w) => canonicalB.has(w)))
  const union = new Set([...canonicalA, ...canonicalB])

  if (union.size === 0) return 0
  return intersection.size / union.size
}

// ══════════════════════════════════════════════════════════
// Location Normalization
// ══════════════════════════════════════════════════════════

const LOCATION_ALIASES: Record<string, string[]> = {
  'seoul': ['seoul, korea', 'seoul, south korea', 'seoul, kr', '서울', '서울시'],
  'remote': ['remote work', 'work from home', 'wfh', 'anywhere', 'worldwide'],
  'singapore': ['singapore, sg', 'sg'],
  'san francisco': ['sf', 'san francisco, ca', 'bay area'],
  'new york': ['nyc', 'new york, ny', 'new york city'],
}

/**
 * Normalize location for comparison
 */
export function normalizeLocation(location: string): string {
  let normalized = location.toLowerCase().trim()

  // Check aliases
  for (const [canonical, aliases] of Object.entries(LOCATION_ALIASES)) {
    if (aliases.some((a) => normalized.includes(a)) || normalized.includes(canonical)) {
      return canonical
    }
  }

  // Remove country codes
  normalized = normalized.replace(/,?\s*(kr|us|sg|uk|jp|de)$/i, '')

  return normalized.trim()
}

/**
 * Check if two locations are the same
 */
export function isSameLocation(a: string, b: string): boolean {
  return normalizeLocation(a) === normalizeLocation(b)
}

// ══════════════════════════════════════════════════════════
// Duplicate Detection
// ══════════════════════════════════════════════════════════

interface JobForDedup {
  title: string
  company: string
  location: string
  postedDate?: Date | string | null
  url?: string
  source?: string
}

interface DuplicateCheckResult {
  isDuplicate: boolean
  similarity: number
  matchedJob?: JobForDedup
  reason?: string
}

// Source priority (higher = better)
const SOURCE_PRIORITY: Record<string, number> = {
  'greenhouse': 100,
  'lever': 100,
  'ashby': 100,
  'company website': 90,
  'official': 90,
  'wanted': 70,
  'linkedin': 60,
  'web3career': 50,
  'web3jobs': 50,
  'unknown': 0,
}

/**
 * Check if a job is a duplicate of an existing job
 */
export function checkDuplicate(
  newJob: JobForDedup,
  existingJobs: JobForDedup[],
  options: { similarityThreshold?: number; daysDiff?: number } = {}
): DuplicateCheckResult {
  const { similarityThreshold = 0.8, daysDiff = 7 } = options

  for (const existing of existingJobs) {
    // Must be same company
    if (!isSameCompany(newJob.company, existing.company)) {
      continue
    }

    // Check title similarity
    const similarity = titleSimilarity(newJob.title, existing.title)
    if (similarity < similarityThreshold) {
      continue
    }

    // Check location
    if (!isSameLocation(newJob.location, existing.location)) {
      continue
    }

    // Check date difference (if available)
    if (newJob.postedDate && existing.postedDate) {
      const newDate = new Date(newJob.postedDate)
      const existingDate = new Date(existing.postedDate)
      const diffMs = Math.abs(newDate.getTime() - existingDate.getTime())
      const diffDays = diffMs / (1000 * 60 * 60 * 24)

      if (diffDays > daysDiff) {
        continue
      }
    }

    return {
      isDuplicate: true,
      similarity,
      matchedJob: existing,
      reason: `Matches "${existing.title}" at ${existing.company} (${Math.round(similarity * 100)}% similar)`,
    }
  }

  return { isDuplicate: false, similarity: 0 }
}

/**
 * Get source priority for choosing the best duplicate
 */
export function getSourcePriority(source: string): number {
  const lower = source.toLowerCase()
  for (const [key, priority] of Object.entries(SOURCE_PRIORITY)) {
    if (lower.includes(key)) {
      return priority
    }
  }
  return SOURCE_PRIORITY.unknown
}

/**
 * Choose the best job from a list of duplicates
 */
export function chooseBestDuplicate(jobs: JobForDedup[]): JobForDedup {
  if (jobs.length === 0) throw new Error('No jobs to choose from')
  if (jobs.length === 1) return jobs[0]

  // Sort by priority (highest first)
  const sorted = [...jobs].sort((a, b) => {
    const priorityA = getSourcePriority(a.source || 'unknown')
    const priorityB = getSourcePriority(b.source || 'unknown')
    return priorityB - priorityA
  })

  return sorted[0]
}

/**
 * Generate a hash for quick duplicate lookup
 */
export function generateJobHash(job: JobForDedup): string {
  const company = normalizeCompanyName(job.company)
  const title = normalizeJobTitle(job.title).split(' ').slice(0, 3).join(' ') // First 3 words
  const location = normalizeLocation(job.location)

  return `${company}|${title}|${location}`
}
