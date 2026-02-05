import axios from 'axios'
import type { CheerioAPI } from 'cheerio'
import { supabase } from '../../../lib/supabase-script'
import { validateAndSaveJob } from '../../../lib/validations/validate-job'
import { fetchHTML, delay, detectExperienceLevel, detectRemoteType } from '../../utils'

const GETRO_SEARCH_API = 'https://api.getro.com/api/v2'

export interface GetroConfig {
  baseUrl: string
  source: string
  displayName: string
  tags: string[]
  defaultCompany: string
  emoji: string
  networkId: string
  perPage?: number
  pageDelay?: number
}

// ── Getro Search API (primary) ──────────────────────────────────────

interface GetroSearchResponse {
  results: {
    jobs: any[]
    count: number
  }
}

/**
 * Fetch a page of jobs from the Getro search API.
 * Endpoint: POST /collections/{networkId}/search/jobs
 * Supports hitsPerPage up to 50, 0-indexed pages.
 */
async function fetchSearchPage(
  networkId: string,
  page: number,
  hitsPerPage: number,
): Promise<{ jobs: any[]; total: number } | null> {
  try {
    const { data } = await axios.post<GetroSearchResponse>(
      `${GETRO_SEARCH_API}/collections/${networkId}/search/jobs`,
      { hits_per_page: hitsPerPage, page, filters: '', query: '' },
      {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        timeout: 15000,
      },
    )
    return { jobs: data.results.jobs || [], total: data.results.count }
  } catch {
    return null
  }
}

// ── SSR __NEXT_DATA__ fallback ──────────────────────────────────────

function parseNextData($: CheerioAPI): any | null {
  const script = $('script#__NEXT_DATA__').html()
  if (!script) return null
  try {
    return JSON.parse(script)
  } catch {
    return null
  }
}

function extractJobsFromNextData(nextData: any, $: CheerioAPI, config: GetroConfig): any[] {
  const pageProps = nextData?.props?.pageProps || {}
  let jobsArray: any[] = []

  if (Array.isArray(pageProps.jobs)) {
    jobsArray = pageProps.jobs
  } else if (pageProps.initialState) {
    const state = pageProps.initialState
    if (state.jobs?.items) {
      jobsArray = Object.values(state.jobs.items)
    } else if (state.jobs?.list) {
      jobsArray = state.jobs.list
    } else if (state.entities?.jobs) {
      jobsArray = Object.values(state.entities.jobs)
    } else {
      for (const key of Object.keys(state)) {
        const val = state[key]
        if (Array.isArray(val) && val.length > 0 && val[0]?.title) {
          jobsArray = val
          break
        }
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          for (const subKey of Object.keys(val)) {
            const subVal = val[subKey]
            if (Array.isArray(subVal) && subVal.length > 0 && subVal[0]?.title) {
              jobsArray = subVal
              break
            }
          }
          if (jobsArray.length > 0) break
        }
      }
    }
  }

  if (jobsArray.length === 0) {
    $('a[href*="/companies/"][href*="/jobs/"]').each((_, el) => {
      const href = $(el).attr('href') || ''
      const title = $(el).text().trim()
      if (title && href) {
        jobsArray.push({
          title,
          url: href.startsWith('http') ? href : config.baseUrl + href,
          company_name: config.defaultCompany,
        })
      }
    })
  }

  return jobsArray
}

// ── Normalize search API fields to match SSR field names ────────────

function normalizeSearchJob(raw: any): any {
  return {
    ...raw,
    // search API uses snake_case; map to the field names the save logic expects
    compensationAmountMinCents: raw.compensation_amount_min_cents,
    compensationAmountMaxCents: raw.compensation_amount_max_cents,
    compensationCurrency: raw.compensation_currency,
    searchableLocations: raw.searchable_locations,
    location_names: raw.locations?.map((l: any) => typeof l === 'string' ? l : l.name).filter(Boolean),
    workMode: raw.work_mode,
    company_name: raw.organization?.name,
    created_at: raw.created_at,
  }
}

// ── Main crawl function ─────────────────────────────────────────────

export async function crawlGetroBoard(config: GetroConfig): Promise<number> {
  const {
    baseUrl,
    source,
    displayName,
    tags: defaultTags,
    defaultCompany,
    emoji,
    networkId,
    perPage = 50,
    pageDelay = 2000,
  } = config

  console.log(`${emoji} Starting ${displayName} crawler...`)

  // ── Try the Getro search API first (returns true per_page) ──
  let allJobs: any[] = []
  let usedSearchApi = false

  const firstPage = await fetchSearchPage(networkId, 0, perPage)
  if (firstPage && firstPage.jobs.length > 0) {
    usedSearchApi = true
    allJobs = firstPage.jobs.map(normalizeSearchJob)
    const total = firstPage.total
    const totalPages = Math.ceil(total / perPage)

    console.log(`📦 Page 1: ${firstPage.jobs.length} jobs (total: ${total}, pages: ${totalPages})`)

    for (let page = 1; page < totalPages; page++) {
      await delay(pageDelay)
      const result = await fetchSearchPage(networkId, page, perPage)
      if (!result || result.jobs.length === 0) {
        console.log(`📭 Page ${page + 1} empty, stopping pagination`)
        break
      }
      allJobs = allJobs.concat(result.jobs.map(normalizeSearchJob))
      console.log(`📦 Page ${page + 1}: ${result.jobs.length} jobs (running total: ${allJobs.length})`)
    }
  }

  // ── Fallback: SSR __NEXT_DATA__ (no per_page control, ~20/page) ──
  if (!usedSearchApi) {
    console.log('⚠️  Search API unavailable, falling back to SSR pagination')
    const $ = await fetchHTML(`${baseUrl}/jobs?page=1`)
    if (!$) {
      console.error(`❌ Failed to fetch ${displayName}`)
      return 0
    }
    const nextData = parseNextData($)
    if (!nextData) {
      console.error(`❌ Could not find __NEXT_DATA__ on ${displayName}`)
      return 0
    }
    allJobs = extractJobsFromNextData(nextData, $, config)
    const total = nextData?.props?.pageProps?.initialState?.jobs?.total
    const ssrPerPage = allJobs.length || 20
    const totalPages = total ? Math.ceil(total / ssrPerPage) : 1

    console.log(`📦 Page 1 (SSR): ${allJobs.length} jobs (total: ${total ?? 'unknown'}, pages: ${totalPages})`)

    for (let page = 2; page <= totalPages; page++) {
      await delay(pageDelay)
      const page$ = await fetchHTML(`${baseUrl}/jobs?page=${page}`)
      if (!page$) break
      const pageNextData = parseNextData(page$)
      if (!pageNextData) break
      const pageJobs = extractJobsFromNextData(pageNextData, page$, config)
      if (pageJobs.length === 0) break
      allJobs = allJobs.concat(pageJobs)
      console.log(`📦 Page ${page} (SSR): ${pageJobs.length} jobs (running total: ${allJobs.length})`)
    }
  }

  console.log(`📦 Found ${allJobs.length} total jobs from ${displayName}`)

  // ── Save jobs ──
  let savedCount = 0
  for (const job of allJobs) {
    try {
      const title = job.title || job.name
      if (!title) continue

      const company = job.company_name || job.companyName || job.company?.name
        || job.organization?.name || defaultCompany

      let jobUrl: string
      if (job.url && job.url.startsWith('http')) {
        jobUrl = job.url
      } else if (job.slug) {
        jobUrl = `${baseUrl}/jobs/${job.slug}`
      } else if (job.id) {
        jobUrl = `${baseUrl}/jobs/${job.id}`
      } else {
        continue
      }

      let location = 'Remote'
      if (Array.isArray(job.searchableLocations) && job.searchableLocations.length > 0) {
        location = job.searchableLocations.join(', ')
      } else if (Array.isArray(job.location_names) && job.location_names.length > 0) {
        location = job.location_names.join(', ')
      } else if (Array.isArray(job.locations) && job.locations.length > 0) {
        location = job.locations.map((l: any) => typeof l === 'string' ? l : l.name || l.city || '').filter(Boolean).join(', ') || 'Remote'
      } else if (typeof job.location === 'string' && job.location) {
        location = job.location
      } else if (job.workMode === 'remote' || job.isRemote) {
        location = 'Remote'
      }

      let salary: string | undefined
      let salaryMin = null
      let salaryMax = null
      let salaryCurrency = null

      const minCents = job.compensationAmountMinCents || job.salary_min
      const maxCents = job.compensationAmountMaxCents || job.salary_max
      if (minCents) {
        salaryMin = minCents > 100_000 ? Math.round(minCents / 100) : minCents
        salaryCurrency = job.compensationCurrency || 'USD'

        if (maxCents) {
          salaryMax = maxCents > 100_000 ? Math.round(maxCents / 100) : maxCents
          salary = `${salaryCurrency} ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}`
        }
      }

      const tags: string[] = [...defaultTags]
      if (Array.isArray(job.tags)) {
        for (const t of job.tags) {
          const tagName = typeof t === 'string' ? t : t.name || ''
          if (tagName && !tags.includes(tagName)) tags.push(tagName)
        }
      }
      if (Array.isArray(job.skills)) {
        for (const s of job.skills) {
          const skillName = typeof s === 'string' ? s : s.name || ''
          if (skillName && !tags.includes(skillName)) tags.push(skillName)
        }
      }

      const description = job.description || job.descriptionHtml || job.content || null
      const experienceLevel = description ? detectExperienceLevel(description) : null
      const remoteType = job.workMode === 'remote' || job.isRemote ? 'Remote' : detectRemoteType(location)
      const companyLogo = job.company?.logo || job.organization?.logo || job.organization?.logoUrl || job.logo || null
      const companyWebsite = job.company?.website || job.organization?.website || null

      const saved = await validateAndSaveJob(
        {
          title,
          company,
          url: jobUrl,
          location,
          type: job.employment_type || job.type || 'Full-time',
          category: job.department || 'Engineering',
          salary,
          tags,
          source,
          region: 'Global',
          postedDate: job.created_at || job.createdAt ? new Date(job.created_at || job.createdAt) : new Date(),
          description,
          experienceLevel,
          remoteType,
          companyLogo,
          companyWebsite,
          salaryMin,
          salaryMax,
          salaryCurrency,
        },
        source
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving ${displayName} job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source,
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from ${displayName}`)
  return savedCount
}
