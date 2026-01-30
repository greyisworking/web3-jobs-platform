import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, detectExperienceLevel, detectRemoteType } from '../utils'

export async function crawlSuiJobs(): Promise<number> {
  console.log('🚀 Starting Sui Jobs crawler...')

  const baseUrl = 'https://jobs.sui.io'
  const $ = await fetchHTML(baseUrl + '/jobs')

  if (!$) {
    console.error('❌ Failed to fetch Sui Jobs')
    return 0
  }

  // Getro platform uses Next.js — extract __NEXT_DATA__
  const nextDataScript = $('script#__NEXT_DATA__').html()
  if (!nextDataScript) {
    console.error('❌ Could not find __NEXT_DATA__ on Sui Jobs (Getro platform)')
    return 0
  }

  let nextData: any
  try {
    nextData = JSON.parse(nextDataScript)
  } catch (error) {
    console.error('❌ Failed to parse Sui Jobs __NEXT_DATA__:', error)
    return 0
  }

  const pageProps = nextData?.props?.pageProps || {}

  // Getro stores jobs in various locations — check multiple paths
  // including Redux initialState which is common on this platform
  let jobsArray: any[] = []

  if (Array.isArray(pageProps.jobs)) {
    jobsArray = pageProps.jobs
  } else if (pageProps.initialState) {
    // Redux state — jobs may be nested in various shapes
    const state = pageProps.initialState
    if (state.jobs?.items) {
      jobsArray = Object.values(state.jobs.items)
    } else if (state.jobs?.list) {
      jobsArray = state.jobs.list
    } else if (state.entities?.jobs) {
      jobsArray = Object.values(state.entities.jobs)
    } else {
      // Walk the state to find arrays with objects that have 'title' keys
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

  // Fallback: extract jobs from link hrefs if __NEXT_DATA__ doesn't have them directly
  if (jobsArray.length === 0) {
    console.log('⚠️  No jobs found in __NEXT_DATA__, falling back to link extraction')
    $('a[href*="/companies/"][href*="/jobs/"]').each((_, el) => {
      const href = $(el).attr('href') || ''
      const title = $(el).text().trim()
      if (title && href) {
        jobsArray.push({
          title,
          url: href.startsWith('http') ? href : baseUrl + href,
          company_name: 'Sui Ecosystem',
        })
      }
    })
  }

  console.log(`📦 Found ${jobsArray.length} jobs from Sui Jobs`)

  let savedCount = 0
  for (const job of jobsArray) {
    try {
      const title = job.title || job.name
      if (!title) continue

      const company = job.company_name || job.companyName || job.company?.name
        || job.organization?.name || 'Sui Foundation'

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

      // location_names is common in Getro
      let location = 'Remote'
      if (Array.isArray(job.location_names) && job.location_names.length > 0) {
        location = job.location_names.join(', ')
      } else if (Array.isArray(job.locations) && job.locations.length > 0) {
        location = job.locations.map((l: any) => typeof l === 'string' ? l : l.name || l.city || '').filter(Boolean).join(', ') || 'Remote'
      } else if (typeof job.location === 'string' && job.location) {
        location = job.location
      } else if (job.workMode === 'remote' || job.isRemote) {
        location = 'Remote'
      }

      const tags: string[] = ['Sui', 'Blockchain', 'Layer 1']
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

      // Extract enhanced details from Getro data
      const description = job.description || job.descriptionHtml || job.content || null
      const experienceLevel = description ? detectExperienceLevel(description) : null
      const remoteType = job.workMode === 'remote' || job.isRemote ? 'Remote' : detectRemoteType(location)
      const companyLogo = job.company?.logo || job.organization?.logo || job.logo || null
      const companyWebsite = job.company?.website || job.organization?.website || null

      // Salary from Getro
      let salaryMin = null
      let salaryMax = null
      let salaryCurrency = null
      if (job.compensationAmountMinCents || job.salary_min) {
        const minCents = job.compensationAmountMinCents || job.salary_min
        const maxCents = job.compensationAmountMaxCents || job.salary_max
        salaryMin = minCents > 100_000 ? Math.round(minCents / 100) : minCents
        salaryMax = maxCents ? (maxCents > 100_000 ? Math.round(maxCents / 100) : maxCents) : null
        salaryCurrency = job.compensationCurrency || 'USD'
      }

      const saved = await validateAndSaveJob(
        {
          title,
          company,
          url: jobUrl,
          location,
          type: job.employment_type || job.type || 'Full-time',
          category: job.department || 'Engineering',
          tags,
          source: 'jobs.sui.io',
          region: 'Global',
          postedDate: job.created_at || job.createdAt ? new Date(job.created_at || job.createdAt) : new Date(),
          // Enhanced job details
          description,
          experienceLevel,
          remoteType,
          companyLogo,
          companyWebsite,
          salaryMin,
          salaryMax,
          salaryCurrency,
        },
        'jobs.sui.io'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error('Error saving Sui job:', error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'jobs.sui.io',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Sui Jobs`)
  return savedCount
}
