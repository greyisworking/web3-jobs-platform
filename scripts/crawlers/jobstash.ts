import axios from 'axios'
import { delay, getRandomUserAgent } from '../utils'
import { runCrawler } from './runner'
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
  url: string | null
  title: string
  summary: string | null
  description: string | null
  requirements: string[] | null
  responsibilities: string[] | null
  minimumSalary: number | null
  maximumSalary: number | null
  salary: number | null
  salaryCurrency: string | null
  seniority: string | null
  benefits: string[] | null
  location: string | null
  locationType: string | null
  commitment: string | null
  classification: string | null
  timestamp: number
  tags: { name: string }[]
  organization: {
    name: string
    logoUrl: string | null
    website: string | null
    investors: { name: string }[] | null
    projects?: { name: string }[] | null
  } | null
  project: { name: string } | null
}

const API_BASE = 'https://middleware.jobstash.xyz/jobs/list'
const PAGE_SIZE = 10
const MAX_PAGES = 200
const DELAY_MS = 300
const API_TIMEOUT = 30000
const MAX_RETRIES = 2
const CONSECUTIVE_ERROR_LIMIT = 3

// ── Quality filters ──

const JUNK_TITLE_PHRASES = [
  'interested in meeting', 'get in touch', 'general application',
  'open application', 'name your role', 'define your role',
  "i'm proposing a role", 'propose a role', 'talent network',
  'talent pool', 'future opportunities', 'speculative application',
  'we are always interested', 'join our talent',
]

function isGarbageListing(title: string, company: string, description: string | undefined): string | null {
  const t = (title || '').trim()
  if (!t) return 'empty title'
  if (t.toLowerCase() === (company || '').trim().toLowerCase()) return 'title == company'
  if (t.length > 50) return `title too long (${t.length})`
  for (const phrase of JUNK_TITLE_PHRASES) {
    if (t.toLowerCase().includes(phrase)) return `junk phrase: "${phrase}"`
  }
  if ((description || '').length < 200) return `description too short (${(description || '').length})`
  return null
}

// ── Mappers ──

function mapSeniority(s: string | null): string | undefined {
  const map: Record<string, string> = { '1': 'Entry', '2': 'Junior', '3': 'Mid', '4': 'Senior', '5': 'Executive' }
  return s ? map[s] : undefined
}

function mapLocationType(t: string | null): string | undefined {
  if (!t) return undefined
  const l = t.toLowerCase()
  if (l === 'remote') return 'Remote'
  if (l === 'hybrid') return 'Hybrid'
  if (l === 'onsite') return 'On-site'
  return undefined
}

function mapCommitment(c: string | null): string {
  if (!c) return 'Full-time'
  const l = c.toLowerCase()
  if (l.includes('part')) return 'Part-time'
  if (l.includes('contract') || l.includes('freelance')) return 'Contract'
  if (l.includes('intern')) return 'Internship'
  return 'Full-time'
}

// ── Salary normalization ──

const MONTHLY_THRESHOLDS: Record<string, number> = {
  USD: 15000, EUR: 14000, GBP: 12000, MYR: 30000, SGD: 20000, INR: 200000,
}

function normalizeSalary(min: number | null, max: number | null, currency: string | null): { min: number | null; max: number | null } | null {
  if (!min && !max) return { min, max }
  const cur = (currency || 'USD').toUpperCase()
  const threshold = MONTHLY_THRESHOLDS[cur] || MONTHLY_THRESHOLDS.USD
  const ref = max || min || 0
  if (ref > 0 && ref < 500) return null // garbage
  if (ref > 0 && ref < threshold) return { min: min ? min * 12 : null, max: max ? max * 12 : null } // monthly→annual
  return { min, max }
}

function formatSalary(min: number | null, max: number | null, currency: string | null): string | undefined {
  if (!min && !max) return undefined
  const cur = currency || 'USD'
  if (min && max) return `${cur} ${min.toLocaleString()}–${max.toLocaleString()}`
  if (min) return `${cur} ${min.toLocaleString()}+`
  if (max) return `${cur} up to ${max.toLocaleString()}`
  return undefined
}

// ── Location cleaning ──

function cleanLocation(raw: string | null): string {
  if (!raw) return 'Remote'
  let loc = raw.trim()
    .replace(/\s*\((primary|headquarters?)\)/gi, '')
    .replace(/\bwith regular presence in\b/gi, ',')
    .replace(/\b(candidates must be based in|open to candidates based in|but must be located in)\b/gi, '')
    .replace(/\s*-\s*Remote/gi, '')

  if (/\/\s*Remote/i.test(loc)) {
    const cities = loc.split(/\s*,\s*/).map(p => p.replace(/\s*\/\s*Remote/gi, '').trim()).filter(Boolean)
    const unique = [...new Set(cities)].slice(0, 3)
    return unique.length > 0 ? `${unique.join(' / ')} (Remote)` : 'Remote'
  }

  loc = loc.replace(/^Remote\s*,\s*/i, '').replace(/,\s*Remote$/i, '')

  if (loc.includes(';')) {
    const parts = loc.split(/\s*;\s*/).filter(Boolean).slice(0, 3)
    loc = parts.join(', ')
    if (raw.split(';').length > 3) loc += ', ...'
  }

  const commaParts = loc.split(/\s*,\s*/).filter(Boolean)
  if (commaParts.length > 4) loc = commaParts.slice(0, 3).join(', ') + ', ...'

  const seen = new Set<string>()
  loc = loc.split(/\s*,\s*/).filter(s => {
    const key = s.trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  }).join(', ')

  return loc.replace(/^[,;\s]+|[,;\s]+$/g, '').trim() || 'Remote'
}

function arrayToString(arr: string[] | null): string | undefined {
  if (!arr || arr.length === 0) return undefined
  return arr.map(item => `• ${item}`).join('\n')
}

// ── Company resolution ──

const ATS_EXTRACTORS: { pattern: RegExp; getSlug: (u: URL) => string | null }[] = [
  { pattern: /jobs\.ashbyhq\.com$/i, getSlug: (u) => u.pathname.split('/')[1] || null },
  { pattern: /jobs\.lever\.co$/i, getSlug: (u) => u.pathname.split('/')[1] || null },
  { pattern: /boards\.greenhouse\.io$/i, getSlug: (u) => u.pathname.split('/')[1] || null },
  { pattern: /\.greenhouse\.io$/i, getSlug: (u) => u.hostname.split('.')[0] || null },
  { pattern: /apply\.workable\.com$/i, getSlug: (u) => u.pathname.split('/')[1] || null },
  { pattern: /\.bamboohr\.com$/i, getSlug: (u) => u.hostname.split('.')[0] || null },
  { pattern: /\.myworkdayjobs\.com$/i, getSlug: (u) => u.hostname.split('.')[0] || null },
]

const JOB_BOARD_DOMAINS = [
  'linkedin.com', 'indeed.com', 'glassdoor.com', 'wellfound.com',
  'rocketpunch.com', 'wanted.co.kr', 'jobstash.xyz', 'web3.career',
  'cryptojobslist.com', 'cryptocurrencyjobs.co', 'remote3.co', 'remoteok.com',
  'angel.co', 'talent.io', 'notion.site',
]

function slugToName(slug: string): string {
  return slug.replace(/[-_]/g, ' ').split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function resolveCompany(orgName: string, applyUrl: string | null): string {
  if (!applyUrl) return orgName
  try {
    const url = new URL(applyUrl)
    const hostname = url.hostname.toLowerCase()
    if (JOB_BOARD_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) return orgName

    let slug: string | null = null
    for (const { pattern, getSlug } of ATS_EXTRACTORS) {
      if (pattern.test(hostname)) { slug = getSlug(url); break }
    }
    if (!slug) {
      const name = hostname.replace(/^www\./, '').split('.')[0]
      slug = name && name.length > 2 ? name : null
    }
    if (!slug) return orgName

    const hint = slugToName(slug)
    const normOrg = orgName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const normHint = hint.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (normOrg.includes(normHint) || normHint.includes(normOrg)) return orgName

    console.log(`  🔄 Company remap: "${orgName}" → "${hint}" (from apply URL)`)
    return hint
  } catch { return orgName }
}

// Enriched job after pagination + quality filter
interface EnrichedJSJob {
  job: JSJob
  company: string
  desc: string | undefined
}

export async function crawlJobStash(): Promise<CrawlerReturn> {
  return runCrawler<EnrichedJSJob>({
    source: 'jobstash.xyz',
    displayName: 'JobStash',
    emoji: '🚀',

    async fetchJobs() {
      const results: EnrichedJSJob[] = []
      let totalFetched = 0
      let skippedProtected = 0
      let consecutiveErrors = 0

      for (let page = 1; page <= MAX_PAGES; page++) {
        let data: JSApiResponse | null = null
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            const response = await axios.get<JSApiResponse>(`${API_BASE}?page=${page}&count=${PAGE_SIZE}`, {
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
          continue
        }

        if (!data.data || data.data.length === 0) break

        for (const job of data.data) {
          if (job.access === 'protected' || !job.url) { skippedProtected++; continue }
          totalFetched++

          const orgName = job.organization?.name || 'Unknown'
          const company = resolveCompany(orgName, job.url)
          const desc = job.description || job.summary || undefined

          const garbageReason = isGarbageListing(job.title, company, desc)
          if (garbageReason) {
            console.log(`  🗑️ Skip: "${job.title.substring(0, 40)}" (${garbageReason})`)
            continue
          }

          results.push({ job, company, desc })
        }

        if (page % 10 === 0) {
          console.log(`  📄 Page ${page}/${Math.ceil(data.total / PAGE_SIZE)}: ${totalFetched} fetched, ${results.length} passed quality filter`)
        }

        if (page * PAGE_SIZE >= data.total) break
        await delay(DELAY_MS)
      }

      console.log(`  📦 ${totalFetched} public jobs fetched (${skippedProtected} protected skipped), ${results.length} passed quality filter`)
      return results
    },

    mapToJobInput({ job, company, desc }) {
      const tags = job.tags?.map(t => t.name).slice(0, 10) || []
      if (company !== (job.organization?.name || 'Unknown') && job.organization?.name !== 'Unknown') {
        tags.push(`project:${job.organization?.name}`)
      }

      const ns = normalizeSalary(job.minimumSalary, job.maximumSalary, job.salaryCurrency)
      const salaryMin = ns?.min ?? null
      const salaryMax = ns?.max ?? null

      let finalDesc = desc
      if (desc && /^you will\b/i.test(desc.trim())) {
        finalDesc = `[AI-summarized by JobStash]\n\n${desc}`
      }

      return {
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
        companyLogo: job.organization?.logoUrl || undefined,
        companyWebsite: job.organization?.website || undefined,
      }
    },
  })
}
