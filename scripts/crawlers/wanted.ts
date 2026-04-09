import { delay } from '../utils'
import { translateLocation, translateTags } from '../../lib/translation'
import { runCrawler } from './runner'
import type { CrawlerReturn } from './platforms'

interface WantedJob {
  id: number
  position: string
  status: string
  company: { id: number; name: string; industry_name: string }
  address: { location: string; full_location: string; country: string }
  annual_from: number | null
  annual_to: number | null
}

interface WantedJobDetail extends WantedJob {
  detail: {
    main_tasks: string
    requirements: string
    preferred_points: string
    benefits: string
    intro: string
  }
  skill_tags: { id: number; title: string }[]
}

const WANTED_API = 'https://www.wanted.co.kr/api/v4/jobs'
const WANTED_URL = 'https://www.wanted.co.kr/wd'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const SEARCH_KEYWORDS = [
  '블록체인', 'web3', 'DeFi', '크립토', 'blockchain',
  'NFT', 'DAO', 'solidity', '가상자산', '디파이', '토큰',
]

async function fetchJobsByKeyword(keyword: string): Promise<WantedJob[]> {
  const jobs: WantedJob[] = []
  for (let offset = 0; offset < 100; offset += 20) {
    const url = `${WANTED_API}?query=${encodeURIComponent(keyword)}&country=kr&job_sort=job.latest_order&years=-1&limit=20&offset=${offset}`
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!res.ok) break
      const data = await res.json()
      if (!data.data || data.data.length === 0) break
      jobs.push(...data.data)
    } catch { break }
    await delay(300)
  }
  return jobs
}

async function fetchJobDetail(jobId: number): Promise<WantedJobDetail | null> {
  try {
    const res = await fetch(`${WANTED_API}/${jobId}`, { headers: { 'User-Agent': UA } })
    if (!res.ok) return null
    const data = await res.json()
    return data.job || data
  } catch { return null }
}

// Enriched job after keyword search + detail fetch
interface EnrichedWantedJob {
  id: number
  position: string
  companyName: string
  location: string
  tags: string[]
  salary?: string
  salaryMin?: number
  salaryMax?: number
  description?: string
}

export async function crawlWanted(): Promise<CrawlerReturn> {
  return runCrawler<EnrichedWantedJob>({
    source: 'wanted.co.kr',
    displayName: '원티드(Wanted)',
    emoji: '🔵',

    async fetchJobs() {
      // Phase 1: collect jobs across keywords, deduplicate by ID
      const jobMap = new Map<number, WantedJob>()
      for (const keyword of SEARCH_KEYWORDS) {
        console.log(`  🔍 Searching: "${keyword}"`)
        const jobs = await fetchJobsByKeyword(keyword)
        console.log(`    📦 Found ${jobs.length} jobs`)
        for (const job of jobs) {
          if (job.status === 'active' && !jobMap.has(job.id)) jobMap.set(job.id, job)
        }
        await delay(500)
      }
      console.log(`  📦 Total unique jobs: ${jobMap.size}`)

      // Phase 2: fetch details and enrich
      const enriched: EnrichedWantedJob[] = []
      for (const [jobId, job] of jobMap) {
        const detail = await fetchJobDetail(jobId)

        let description = ''
        if (detail?.detail) {
          const { intro, main_tasks, requirements, preferred_points, benefits } = detail.detail
          if (intro) description += `## About Company\n${intro}\n\n`
          if (main_tasks) description += `## Key Responsibilities\n${main_tasks}\n\n`
          if (requirements) description += `## Requirements\n${requirements}\n\n`
          if (preferred_points) description += `## Preferred Qualifications\n${preferred_points}\n\n`
          if (benefits) description += `## Benefits & Perks\n${benefits}\n\n`
        }

        let tags = detail?.skill_tags?.map(t => t.title).filter(Boolean) || []
        if (tags.length === 0) tags.push('Blockchain', 'Web3', 'Korea')
        tags = translateTags(tags)

        const raw = job.address?.full_location || job.address?.location || 'Seoul'
        const location = translateLocation(raw)

        let salary: string | undefined
        if (job.annual_from && job.annual_to) {
          salary = `${job.annual_from * 10000}-${job.annual_to * 10000}`
        }

        enriched.push({
          id: jobId,
          position: job.position,
          companyName: job.company.name,
          location, tags, salary,
          salaryMin: job.annual_from ? job.annual_from * 10000 : undefined,
          salaryMax: job.annual_to ? job.annual_to * 10000 : undefined,
          description: description || undefined,
        })
        await delay(300)
      }
      return enriched
    },

    mapToJobInput(job) {
      return {
        title: job.position,
        company: job.companyName,
        url: `${WANTED_URL}/${job.id}`,
        location: job.location,
        type: 'Full-time',
        salary: job.salary,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: 'KRW',
        category: 'Engineering',
        tags: job.tags,
        source: 'wanted.co.kr',
        region: 'Korea',
        postedDate: new Date(),
        description: job.description,
      }
    },
  })
}
