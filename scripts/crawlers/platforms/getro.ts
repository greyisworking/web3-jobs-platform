import type { CheerioAPI } from 'cheerio'
import { supabase } from '../../../lib/supabase-script'
import { validateAndSaveJob } from '../../../lib/validations/validate-job'
import { fetchHTML, delay, detectExperienceLevel, detectRemoteType } from '../../utils'

export interface GetroConfig {
  baseUrl: string
  source: string
  displayName: string
  tags: string[]
  defaultCompany: string
  emoji: string
  perPage?: number
  pageDelay?: number
}

/**
 * Parse __NEXT_DATA__ JSON from a Cheerio-loaded Getro page.
 * Returns the parsed object or null if not found / invalid.
 */
function parseNextData($: CheerioAPI): any | null {
  const script = $('script#__NEXT_DATA__').html()
  if (!script) return null
  try {
    return JSON.parse(script)
  } catch {
    return null
  }
}

/**
 * Extract the jobs array from a parsed __NEXT_DATA__ object.
 * Searches multiple Redux state paths common across Getro boards.
 * Falls back to link extraction from the DOM.
 */
function extractJobs(nextData: any, $: CheerioAPI, config: GetroConfig): any[] {
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

  // Fallback: extract jobs from link hrefs
  if (jobsArray.length === 0) {
    console.log('⚠️  No jobs found in __NEXT_DATA__, falling back to link extraction')
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

/**
 * Read total job count from Getro initialState.
 */
function getTotalFromNextData(nextData: any): number | null {
  const total = nextData?.props?.pageProps?.initialState?.jobs?.total
  return typeof total === 'number' ? total : null
}

/**
 * Crawl a Getro-powered job board with full pagination.
 *
 * Fetches all pages using `?page=N&per_page=M` parameters, parses
 * __NEXT_DATA__ from each response, and saves jobs via validateAndSaveJob.
 */
export async function crawlGetroBoard(config: GetroConfig): Promise<number> {
  const {
    baseUrl,
    source,
    displayName,
    tags: defaultTags,
    defaultCompany,
    emoji,
    perPage = 50,
    pageDelay = 2000,
  } = config

  console.log(`${emoji} Starting ${displayName} crawler...`)

  // --- Page 1 ---
  const firstPageUrl = `${baseUrl}/jobs?page=1&per_page=${perPage}`
  const $ = await fetchHTML(firstPageUrl)

  if (!$) {
    console.error(`❌ Failed to fetch ${displayName}`)
    return 0
  }

  const nextData = parseNextData($)
  if (!nextData) {
    console.error(`❌ Could not find __NEXT_DATA__ on ${displayName} (Getro platform)`)
    return 0
  }

  let allJobs = extractJobs(nextData, $, config)
  const total = getTotalFromNextData(nextData)
  const totalPages = total ? Math.ceil(total / perPage) : 1

  console.log(`📦 Page 1: ${allJobs.length} jobs (total: ${total ?? 'unknown'}, pages: ${totalPages})`)

  // --- Remaining pages ---
  if (totalPages > 1) {
    for (let page = 2; page <= totalPages; page++) {
      await delay(pageDelay)

      const pageUrl = `${baseUrl}/jobs?page=${page}&per_page=${perPage}`
      const page$ = await fetchHTML(pageUrl)
      if (!page$) {
        console.warn(`⚠️  Failed to fetch page ${page}, stopping pagination`)
        break
      }

      const pageNextData = parseNextData(page$)
      if (!pageNextData) {
        console.warn(`⚠️  No __NEXT_DATA__ on page ${page}, stopping pagination`)
        break
      }

      const pageJobs = extractJobs(pageNextData, page$, config)
      if (pageJobs.length === 0) {
        console.log(`📭 Page ${page} returned 0 jobs, stopping pagination`)
        break
      }

      allJobs = allJobs.concat(pageJobs)
      console.log(`📦 Page ${page}: ${pageJobs.length} jobs (running total: ${allJobs.length})`)
    }
  }

  console.log(`📦 Found ${allJobs.length} total jobs from ${displayName}`)

  // --- Save jobs ---
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

      // Getro may store salary in cents
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
      const companyLogo = job.company?.logo || job.organization?.logo || job.logo || null
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
