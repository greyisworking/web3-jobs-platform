import axios from 'axios'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay, getRandomUserAgent } from '../utils'
import type { CrawlerReturn } from './platforms'

/** JobStash API response */
interface JSApiResponse {
  page: number
  count: number
  total: number
  data: JSJob[]
}

interface JSJob {
  id: string
  access: 'public' | 'protected'
  url: string | null           // Original apply URL (Ashby, Lever, Greenhouse, etc.)
  title: string
  summary: string | null
  description: string | null
  requirements: string[] | null
  responsibilities: string[] | null
  minimumSalary: number | null
  maximumSalary: number | null
  salary: number | null
  salaryCurrency: string | null
  seniority: string | null     // "1"–"5" numeric string
  benefits: string[] | null
  location: string | null
  locationType: string | null  // "remote", "onsite", "hybrid"
  commitment: string | null    // "full-time", "part-time", "contract"
  classification: string | null
  timestamp: number            // Unix ms
  tags: { name: string }[]
  organization: {
    name: string
    logoUrl: string | null
    website: string | null
    investors: { name: string }[] | null
    projects?: { name: string }[] | null
  } | null
  project: { name: string } | null  // Specific project this job belongs to
}

const API_BASE = 'https://middleware.jobstash.xyz/jobs/list'
const PAGE_SIZE = 10  // API max per page
const MAX_PAGES = 200 // Safety limit (~2000 jobs)
const DELAY_MS = 300  // Between API calls (500→300: rate limit 여유 확인됨)
const API_TIMEOUT = 30000 // 30s per request
const MAX_RETRIES = 2
const CONSECUTIVE_ERROR_LIMIT = 3 // Stop after 3 consecutive errors

// ── Quality filters: skip garbage listings before saving ──

const TITLE_MAX_LENGTH = 50
const DESC_MIN_LENGTH = 200

const JUNK_TITLE_PHRASES = [
  'interested in meeting',
  'get in touch',
  'general application',
  'open application',
  'name your role',
  'define your role',
  "i'm proposing a role",
  'propose a role',
  'talent network',
  'talent pool',
  'future opportunities',
  'speculative application',
  'we are always interested',
  'join our talent',
]

function isGarbageListing(title: string, company: string, description: string | undefined): string | null {
  const t = (title || '').trim()
  const c = (company || '').trim()
  const d = description || ''

  if (!t) return 'empty title'
  if (t.toLowerCase() === c.toLowerCase()) return 'title == company'
  if (t.length > TITLE_MAX_LENGTH) return `title too long (${t.length})`
  for (const phrase of JUNK_TITLE_PHRASES) {
    if (t.toLowerCase().includes(phrase)) return `junk phrase: "${phrase}"`
  }
  if (d.length < DESC_MIN_LENGTH) return `description too short (${d.length})`
  if (d.toLowerCase().includes('share your cv') && d.length < DESC_MIN_LENGTH) return 'share your CV + short desc'
  return null
}

/** Map numeric seniority to experience level */
function mapSeniority(seniority: string | null): string | undefined {
  const map: Record<string, string> = {
    '1': 'Entry',
    '2': 'Junior',
    '3': 'Mid',
    '4': 'Senior',
    '5': 'Executive',
  }
  return seniority ? map[seniority] : undefined
}

/** Map locationType to remoteType */
function mapLocationType(locationType: string | null): string | undefined {
  if (!locationType) return undefined
  const lower = locationType.toLowerCase()
  if (lower === 'remote') return 'Remote'
  if (lower === 'hybrid') return 'Hybrid'
  if (lower === 'onsite') return 'On-site'
  return undefined
}

/** Map commitment to employment type */
function mapCommitment(commitment: string | null): string {
  if (!commitment) return 'Full-time'
  const lower = commitment.toLowerCase()
  if (lower.includes('part')) return 'Part-time'
  if (lower.includes('contract') || lower.includes('freelance')) return 'Contract'
  if (lower.includes('intern')) return 'Internship'
  return 'Full-time'
}

// ── Salary normalization: detect monthly values stored as annual ──

/** Currency-specific annual salary thresholds. Below this → likely monthly, multiply by 12 */
const MONTHLY_SALARY_THRESHOLDS: Record<string, number> = {
  USD: 15000,
  EUR: 14000,
  GBP: 12000,
  MYR: 30000,
  SGD: 20000,
  INR: 200000,
}
const GARBAGE_SALARY_THRESHOLD = 500 // Below this → nonsense, clear it

/**
 * Normalize salary values: detect monthly→annual confusion and garbage values.
 * Returns corrected { min, max } or null if salary should be cleared.
 */
function normalizeSalary(
  min: number | null,
  max: number | null,
  currency: string | null
): { min: number | null; max: number | null } | null {
  if (!min && !max) return { min, max }

  const cur = (currency || 'USD').toUpperCase()
  const threshold = MONTHLY_SALARY_THRESHOLDS[cur] || MONTHLY_SALARY_THRESHOLDS.USD
  const ref = max || min || 0

  // Garbage: absurdly low values
  if (ref > 0 && ref < GARBAGE_SALARY_THRESHOLD) {
    console.log(`  💰 Salary cleared: ${cur} ${ref} (below ${GARBAGE_SALARY_THRESHOLD} threshold)`)
    return null
  }

  // Monthly detection: below currency threshold → multiply by 12
  if (ref > 0 && ref < threshold) {
    const correctedMin = min ? min * 12 : null
    const correctedMax = max ? max * 12 : null
    console.log(`  💰 Salary corrected (monthly→annual): ${cur} ${ref} → ${correctedMax || correctedMin}`)
    return { min: correctedMin, max: correctedMax }
  }

  return { min, max }
}

/** Format salary string from min/max/currency */
function formatSalary(min: number | null, max: number | null, currency: string | null): string | undefined {
  if (!min && !max) return undefined
  const cur = currency || 'USD'
  if (min && max) return `${cur} ${min.toLocaleString()}–${max.toLocaleString()}`
  if (min) return `${cur} ${min.toLocaleString()}+`
  if (max) return `${cur} up to ${max.toLocaleString()}`
  return undefined
}

/**
 * Clean up verbose location strings.
 * "Zug (primary) with regular presence in Vaduz, Switzerland" → "Zug, Switzerland"
 * "New York, NY / Remote, Boston / Remote" → "New York, NY / Boston (Remote)"
 */
function cleanLocation(raw: string | null): string {
  if (!raw) return 'Remote'
  let loc = raw.trim()

  // Strip parenthetical qualifiers
  loc = loc.replace(/\s*\((primary|headquarters?)\)/gi, '')

  // Strip verbose phrases
  loc = loc.replace(/\bwith regular presence in\b/gi, ',')
  loc = loc.replace(/\b(candidates must be based in|open to candidates based in|but must be located in)\b/gi, '')

  // "REGION - Remote" pattern → strip " - Remote"
  loc = loc.replace(/\s*-\s*Remote/gi, '')

  // Handle "City / Remote, City2 / Remote" → extract cities, append (Remote)
  if (/\/\s*Remote/i.test(loc)) {
    const parts = loc.split(/\s*,\s*/)
    const cities = parts.map(p => p.replace(/\s*\/\s*Remote/gi, '').trim()).filter(Boolean)
    const unique = [...new Set(cities)].slice(0, 3)
    return unique.length > 0 ? `${unique.join(' / ')} (Remote)` : 'Remote'
  }

  // Strip standalone "Remote," or ", Remote" from beginning
  loc = loc.replace(/^Remote\s*,\s*/i, '')
  loc = loc.replace(/,\s*Remote$/i, '')

  // Handle semicolons → first 3
  if (loc.includes(';')) {
    const parts = loc.split(/\s*;\s*/).filter(Boolean).slice(0, 3)
    loc = parts.join(', ')
    if (raw.split(';').length > 3) loc += ', ...'
  }

  // Handle long comma-separated lists → first 3 meaningful parts
  const commaParts = loc.split(/\s*,\s*/).filter(Boolean)
  if (commaParts.length > 4) {
    loc = commaParts.slice(0, 3).join(', ') + ', ...'
  }

  // Deduplicate repeated city names (e.g. "Berlin, Berlin, Germany")
  const segments = loc.split(/\s*,\s*/)
  const seen = new Set<string>()
  const deduped = segments.filter(s => {
    const key = s.trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
  loc = deduped.join(', ')

  loc = loc.replace(/^[,;\s]+|[,;\s]+$/g, '').trim()
  return loc || 'Remote'
}

/** Convert requirements/responsibilities array to string */
function arrayToString(arr: string[] | null): string | undefined {
  if (!arr || arr.length === 0) return undefined
  return arr.map(item => `• ${item}`).join('\n')
}

// ── Company resolution: detect when org.name is actually a project name ──

/** Known ATS platforms — extract company slug from URL path/subdomain */
const ATS_EXTRACTORS: { pattern: RegExp; getSlug: (url: URL) => string | null }[] = [
  { pattern: /jobs\.ashbyhq\.com$/i, getSlug: (u) => u.pathname.split('/')[1] || null },
  { pattern: /jobs\.lever\.co$/i, getSlug: (u) => u.pathname.split('/')[1] || null },
  { pattern: /boards\.greenhouse\.io$/i, getSlug: (u) => u.pathname.split('/')[1] || null },
  { pattern: /\.greenhouse\.io$/i, getSlug: (u) => u.hostname.split('.')[0] || null },
  { pattern: /apply\.workable\.com$/i, getSlug: (u) => u.pathname.split('/')[1] || null },
  { pattern: /\.bamboohr\.com$/i, getSlug: (u) => u.hostname.split('.')[0] || null },
  { pattern: /\.myworkdayjobs\.com$/i, getSlug: (u) => u.hostname.split('.')[0] || null },
]

/** Job board domains to skip (not employer sites) */
const JOB_BOARD_DOMAINS = [
  'linkedin.com', 'indeed.com', 'glassdoor.com', 'wellfound.com',
  'rocketpunch.com', 'wanted.co.kr', 'jobstash.xyz', 'web3.career',
  'cryptojobslist.com', 'cryptocurrencyjobs.co', 'remote3.co', 'remoteok.com',
  'angel.co', 'talent.io', 'notion.site',
]

/** Convert URL slug to readable name: "chainlink-labs" → "Chainlink Labs" */
function slugToName(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Normalize for comparison: lowercase, strip non-alphanumeric */
function normalizeForCompare(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Extract company hint from an apply URL.
 * For ATS URLs, extracts company slug from the URL structure.
 * For direct career pages, extracts domain name.
 * Returns null for job board URLs or unparseable URLs.
 */
function extractCompanyHintFromUrl(applyUrl: string): string | null {
  try {
    const url = new URL(applyUrl)
    const hostname = url.hostname.toLowerCase()

    // Skip known job boards
    if (JOB_BOARD_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
      return null
    }

    // Try ATS extractors first
    for (const { pattern, getSlug } of ATS_EXTRACTORS) {
      if (pattern.test(hostname)) {
        const slug = getSlug(url)
        return slug ? slugToName(slug) : null
      }
    }

    // Direct career page: use domain name (e.g., "ozys" from "ozys.io")
    const cleanHost = hostname.replace(/^www\./, '')
    const name = cleanHost.split('.')[0]
    if (name && name.length > 2) {
      return name.charAt(0).toUpperCase() + name.slice(1)
    }

    return null
  } catch {
    return null
  }
}

/**
 * Resolve the actual hiring company.
 * JobStash sometimes uses project names as organization.name (e.g., "megaton.fi"
 * when the real employer is "Ozys"). We cross-check against the apply URL domain
 * and fall back to org.name when they match or can't be determined.
 */
function resolveCompany(orgName: string, applyUrl: string | null): string {
  if (!applyUrl) return orgName

  const urlHint = extractCompanyHintFromUrl(applyUrl)
  if (!urlHint) return orgName

  const normOrg = normalizeForCompare(orgName)
  const normHint = normalizeForCompare(urlHint)

  // If names overlap (substring match), org.name is likely correct
  if (normOrg.includes(normHint) || normHint.includes(normOrg)) {
    return orgName
  }

  // Names differ significantly → URL domain is likely the real employer
  console.log(`  🔄 Company remap: "${orgName}" → "${urlHint}" (from apply URL)`)
  return urlHint
}

export async function crawlJobStash(): Promise<CrawlerReturn> {
  console.log('🚀 Starting JobStash crawler (API mode)...')

  let savedCount = 0
  let newCount = 0
  let totalFetched = 0
  let skippedProtected = 0
  let consecutiveErrors = 0

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${API_BASE}?page=${page}&count=${PAGE_SIZE}`

      let data: JSApiResponse | null = null
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await axios.get<JSApiResponse>(url, {
            headers: { 'User-Agent': getRandomUserAgent() },
            timeout: API_TIMEOUT,
          })
          data = response.data
          consecutiveErrors = 0
          break
        } catch (error: any) {
          if (attempt < MAX_RETRIES) {
            console.log(`  ⚠️ Page ${page} attempt ${attempt} failed (${error.message}), retrying...`)
            await delay(3000)
          } else {
            console.error(`  ❌ Page ${page} failed after ${MAX_RETRIES} attempts: ${error.message}`)
            consecutiveErrors++
          }
        }
      }

      if (!data) {
        if (consecutiveErrors >= CONSECUTIVE_ERROR_LIMIT) {
          console.log(`  🛑 ${CONSECUTIVE_ERROR_LIMIT} consecutive errors — stopping pagination`)
          break
        }
        continue // Skip this page, try next
      }

      if (!data.data || data.data.length === 0) {
        console.log(`  📄 Page ${page}: empty — done`)
        break
      }

      for (const job of data.data) {
        // Skip protected jobs (no URL)
        if (job.access === 'protected' || !job.url) {
          skippedProtected++
          continue
        }

        totalFetched++

        try {
          const org = job.organization
          const orgName = org?.name || 'Unknown'
          const company = resolveCompany(orgName, job.url)
          const desc = job.description || job.summary || undefined

          // Quality filter: skip garbage listings
          const garbageReason = isGarbageListing(job.title, company, desc)
          if (garbageReason) {
            console.log(`  🗑️ Skip: "${job.title.substring(0, 40)}" (${garbageReason})`)
            continue
          }

          const tags = job.tags?.map(t => t.name).slice(0, 10) || []

          // If company was remapped, preserve original project name in tags
          if (company !== orgName && orgName !== 'Unknown') {
            const projectTag = `project:${orgName}`
            if (!tags.includes(projectTag)) tags.push(projectTag)
          }

          // Salary normalization: monthly→annual correction + garbage removal
          const normalizedSalary = normalizeSalary(job.minimumSalary, job.maximumSalary, job.salaryCurrency)
          const salaryMin = normalizedSalary?.min ?? null
          const salaryMax = normalizedSalary?.max ?? null

          // AI description marking: JobStash uses AI-generated summaries
          let finalDesc = desc
          if (desc && /^you will\b/i.test(desc.trim())) {
            finalDesc = `[AI-summarized by JobStash]\n\n${desc}`
          }

          const result = await validateAndSaveJob(
            {
              title: job.title,
              company,
              url: job.url,
              location: cleanLocation(job.location),
              type: mapCommitment(job.commitment),
              category: job.classification || 'Engineering',
              tags,
              source: 'jobstash.xyz',
              region: 'Global',
              postedDate: job.timestamp ? new Date(job.timestamp) : new Date(),
              description: finalDesc,
              requirements: arrayToString(job.requirements),
              responsibilities: arrayToString(job.responsibilities),
              benefits: arrayToString(job.benefits),
              salaryMin,
              salaryMax,
              salaryCurrency: job.salaryCurrency,
              salary: formatSalary(salaryMin, salaryMax, job.salaryCurrency),
              experienceLevel: mapSeniority(job.seniority),
              remoteType: mapLocationType(job.locationType),
              companyLogo: org?.logoUrl || undefined,
              companyWebsite: org?.website || undefined,
            },
            'jobstash.xyz'
          )

          if (result.saved) savedCount++
          if (result.isNew) newCount++
        } catch (error) {
          console.error(`  Error saving job ${job.url}:`, error)
        }
      }

      // Progress log every 10 pages
      if (page % 10 === 0) {
        console.log(`  📄 Page ${page}/${Math.ceil(data.total / PAGE_SIZE)}: ${totalFetched} fetched, ${savedCount} saved, ${newCount} new`)
      }

      // Stop if we've reached the end
      if (page * PAGE_SIZE >= data.total) {
        console.log(`  📄 Reached last page (${page})`)
        break
      }

      await delay(DELAY_MS)
    }

    console.log(`📦 JobStash: ${totalFetched} public jobs fetched (${skippedProtected} protected skipped)`)

    await supabase.from('CrawlLog').insert({
      source: 'jobstash.xyz',
      status: 'success',
      jobCount: savedCount,
      createdAt: new Date().toISOString(),
    })

    console.log(`✅ Saved ${savedCount} jobs from JobStash (${newCount} new)`)
    return { total: savedCount, new: newCount }
  } catch (error: any) {
    console.error('❌ JobStash crawler error:', error.message)

    await supabase.from('CrawlLog').insert({
      source: 'jobstash.xyz',
      status: 'failed',
      jobCount: 0,
      createdAt: new Date().toISOString(),
    })

    return { total: 0, new: 0 }
  }
}
