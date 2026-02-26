import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay } from '../utils'

interface CrawlerReturn {
  total: number
  new: number
}

interface WantedJob {
  id: number
  position: string
  status: string
  company: {
    id: number
    name: string
    industry_name: string
  }
  address: {
    location: string
    full_location: string
    country: string
  }
  annual_from: number | null
  annual_to: number | null
  category_tags: { parent_id: number; id: number }[]
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

/**
 * Fetch job listings from Wanted search API
 */
async function fetchJobsByKeyword(keyword: string): Promise<WantedJob[]> {
  const jobs: WantedJob[] = []

  for (let offset = 0; offset < 100; offset += 20) {
    const url = `${WANTED_API}?query=${encodeURIComponent(keyword)}&country=kr&job_sort=job.latest_order&years=-1&limit=20&offset=${offset}`

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
      })

      if (!res.ok) {
        console.log(`    ⚠️ API returned ${res.status} for "${keyword}" offset=${offset}`)
        break
      }

      const data = await res.json()
      if (!data.data || data.data.length === 0) break

      jobs.push(...data.data)
    } catch (error) {
      console.log(`    ❌ API error for "${keyword}": ${error}`)
      break
    }

    await delay(300)
  }

  return jobs
}

/**
 * Fetch job detail from Wanted API
 */
async function fetchJobDetail(jobId: number): Promise<WantedJobDetail | null> {
  try {
    const res = await fetch(`${WANTED_API}/${jobId}`, {
      headers: { 'User-Agent': UA },
    })

    if (!res.ok) return null

    const data = await res.json()
    return data.job || data
  } catch {
    return null
  }
}

/**
 * Build location string from Wanted address
 */
function buildLocation(address: WantedJob['address']): string {
  if (!address) return '서울'
  const parts = [address.location, address.full_location].filter(Boolean)
  if (parts.length > 0) {
    // Use full_location if available, otherwise location
    return address.full_location || address.location || '서울'
  }
  return '서울'
}

/**
 * Build salary string from annual range (unit: 만원)
 */
function buildSalary(annualFrom: number | null, annualTo: number | null): string | undefined {
  if (!annualFrom && !annualTo) return undefined
  if (annualFrom && annualTo) {
    return `${annualFrom * 10000}-${annualTo * 10000}`
  }
  return undefined
}

export async function crawlWanted(): Promise<CrawlerReturn> {
  console.log('🔵 Starting 원티드(Wanted) API crawler...')

  try {
    // 1. Collect all jobs across keywords
    const jobMap = new Map<number, WantedJob>()

    for (const keyword of SEARCH_KEYWORDS) {
      console.log(`  🔍 Searching: "${keyword}"`)
      const jobs = await fetchJobsByKeyword(keyword)
      console.log(`    📦 Found ${jobs.length} jobs`)

      for (const job of jobs) {
        if (job.status === 'active' && !jobMap.has(job.id)) {
          jobMap.set(job.id, job)
        }
      }

      await delay(500)
    }

    console.log(`📦 Total unique jobs: ${jobMap.size}`)

    // 2. Fetch details and save each job
    let savedCount = 0
    let newCount = 0

    for (const [jobId, job] of Array.from(jobMap.entries())) {
      try {
        console.log(`  📄 Fetching: ${job.position.slice(0, 50)}...`)

        const detail = await fetchJobDetail(jobId)

        // Build description from detail sections
        let fullDescription = ''
        if (detail?.detail) {
          const { intro, main_tasks, requirements, preferred_points, benefits } = detail.detail
          if (intro) fullDescription += `## 회사소개\n${intro}\n\n`
          if (main_tasks) fullDescription += `## 주요업무\n${main_tasks}\n\n`
          if (requirements) fullDescription += `## 자격요건\n${requirements}\n\n`
          if (preferred_points) fullDescription += `## 우대사항\n${preferred_points}\n\n`
          if (benefits) fullDescription += `## 혜택 및 복지\n${benefits}\n\n`
        }

        // Extract tags from skill_tags
        const tags = detail?.skill_tags?.map(t => t.title).filter(Boolean) || []
        if (tags.length === 0) tags.push('블록체인', 'Web3', 'Korea')

        const location = buildLocation(job.address)
        const salary = buildSalary(job.annual_from, job.annual_to)
        const jobUrl = `${WANTED_URL}/${jobId}`

        await delay(300)

        const result = await validateAndSaveJob(
          {
            title: job.position,
            company: job.company.name,
            url: jobUrl,
            location,
            type: '정규직',
            salary,
            salaryMin: job.annual_from ? job.annual_from * 10000 : undefined,
            salaryMax: job.annual_to ? job.annual_to * 10000 : undefined,
            salaryCurrency: 'KRW',
            category: 'Engineering',
            tags,
            source: 'wanted.co.kr',
            region: 'Korea',
            postedDate: new Date(),
            description: fullDescription || undefined,
          },
          'wanted.co.kr'
        )

        if (result.saved) savedCount++
        if (result.isNew) newCount++
      } catch (error) {
        console.error(`  ❌ Error saving job ${jobId}:`, error)
      }
    }

    // 3. Log results
    try {
      await supabase.from('CrawlLog').insert({
        source: 'wanted.co.kr',
        status: 'success',
        jobCount: savedCount,
        createdAt: new Date().toISOString(),
      })
    } catch {
      // CrawlLog table may not exist
    }

    console.log(`✅ Saved ${savedCount} jobs from 원티드 (${newCount} new)`)
    return { total: savedCount, new: newCount }
  } catch (error) {
    console.error('❌ Wanted crawler error:', error)

    try {
      await supabase.from('CrawlLog').insert({
        source: 'wanted.co.kr',
        status: 'failed',
        jobCount: 0,
        createdAt: new Date().toISOString(),
      })
    } catch {
      // CrawlLog table may not exist
    }

    return { total: 0, new: 0 }
  }
}
