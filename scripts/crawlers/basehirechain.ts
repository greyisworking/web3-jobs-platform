import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText, parseSalary, detectRemoteType } from '../utils'

interface CrawlerReturn {
  total: number
  new: number
}

interface HirechainCompany {
  id: string
  name: string
  slug: string
  logo_url?: string
  location?: string
  about_short?: string
  jobs_count: number
}

interface HirechainJob {
  id: string
  title: string
  slug: string
  company_id: string
  location?: string
  remote_policy?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  employment_type?: string
  experience_level?: string
  description?: string
  requirements?: string
  created_at?: string
  deadline?: string
}

/**
 * Base Hirechain Crawler
 * Crawls jobs from the Base (L2) ecosystem job board
 */
export async function crawlBaseHirechain(): Promise<CrawlerReturn> {
  console.log('🚀 Starting Base Hirechain crawler...')

  const baseUrl = 'https://base.hirechain.io'

  // Fetch main page to get __NEXT_DATA__
  const $ = await fetchHTML(baseUrl)

  if (!$) {
    console.error('  ❌ Failed to fetch Base Hirechain page')
    await supabase.from('CrawlLog').insert({
      source: 'base.hirechain.io',
      status: 'failed',
      jobCount: 0,
      error: 'Failed to fetch page',
      createdAt: new Date().toISOString(),
    })
    return { total: 0, new: 0 }
  }

  // Try to extract __NEXT_DATA__
  const nextDataScript = $('script#__NEXT_DATA__').html()

  let companies: HirechainCompany[] = []
  let jobs: HirechainJob[] = []

  if (nextDataScript) {
    try {
      const nextData = JSON.parse(nextDataScript)
      const pageProps = nextData?.props?.pageProps

      // Extract companies and jobs
      companies = pageProps?.companies || pageProps?.initialCompanies || []
      jobs = pageProps?.jobs || pageProps?.initialJobs || pageProps?.allJobs || []

      console.log(`  📊 Found ${companies.length} companies, ${jobs.length} jobs in __NEXT_DATA__`)
    } catch (error) {
      console.error('  Error parsing __NEXT_DATA__:', error)
    }
  }

  // If no jobs found, try to scrape from HTML
  if (jobs.length === 0) {
    console.log('  📄 Scraping jobs from HTML...')

    const scrapedJobs: Array<{
      title: string
      company: string
      url: string
      location: string
      type: string
      category: string
      tags: string[]
      companyLogo?: string
    }> = []

    // Look for job cards or links
    $('a[href*="/jobs/"], a[href*="/job/"]').each((_, el) => {
      try {
        const $el = $(el)
        const href = $el.attr('href') || ''

        // Skip navigation
        if (href === '/jobs' || href === '/jobs/') return

        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`

        // Get card container
        const $card = $el.closest('div, article, li').first()
        const cardText = $card.text()

        // Extract title
        let title = cleanText($el.find('h2, h3, h4').first().text() || $el.text())
        if (title.length < 5 || title.length > 200) return

        // Extract company
        let company = 'Unknown'
        const companyEl = $card.find('[class*="company"], [class*="org"]')
        if (companyEl.length) {
          company = cleanText(companyEl.text())
        }

        // Extract logo
        let companyLogo: string | undefined
        const logoImg = $card.find('img').first()
        if (logoImg.length) {
          const src = logoImg.attr('src')
          if (src && src.startsWith('http') && !src.includes('placeholder')) {
            companyLogo = src
          }
        }

        // Extract location
        let location = 'Remote'
        if (cardText.toLowerCase().includes('remote')) {
          location = 'Remote'
        } else {
          const locationMatch = cardText.match(/([\w\s,]+(?:USA|Europe|Asia|Remote))/i)
          if (locationMatch) {
            location = cleanText(locationMatch[1])
          }
        }

        // Determine type
        let type = 'Full-time'
        if (cardText.toLowerCase().includes('contract')) type = 'Contract'
        if (cardText.toLowerCase().includes('part-time')) type = 'Part-time'

        // Tags
        const tags = ['Base', 'Ethereum', 'L2']
        if (cardText.toLowerCase().includes('solidity')) tags.push('Solidity')
        if (cardText.toLowerCase().includes('react')) tags.push('React')
        if (cardText.toLowerCase().includes('defi')) tags.push('DeFi')

        scrapedJobs.push({
          title,
          company,
          url: fullUrl,
          location,
          type,
          category: 'Engineering',
          tags,
          companyLogo,
        })
      } catch (error) {
        // Skip invalid entries
      }
    })

    // Also look for company cards with job counts
    $('a[href*="/company/"], a[href*="/companies/"]').each((_, el) => {
      try {
        const $el = $(el)
        const $card = $el.closest('div, article').first()
        const cardText = $card.text()

        // Check if company has jobs
        const jobCountMatch = cardText.match(/(\d+)\s*(?:jobs?|positions?|openings?)/i)
        if (jobCountMatch && parseInt(jobCountMatch[1]) > 0) {
          const companyName = cleanText($el.text() || $card.find('h2, h3, h4').first().text())

          if (companyName.length > 2) {
            // We found a company with jobs - would need to fetch their page
            console.log(`  📌 Company with jobs: ${companyName} (${jobCountMatch[1]} jobs)`)
          }
        }
      } catch (error) {
        // Skip
      }
    })

    if (scrapedJobs.length > 0) {
      console.log(`📦 Found ${scrapedJobs.length} jobs from Base Hirechain (HTML)`)

      let savedCount = 0
      let newCount = 0

      for (const job of scrapedJobs) {
        try {
          const result = await validateAndSaveJob(
            {
              title: job.title,
              company: job.company,
              url: job.url,
              location: job.location,
              type: job.type,
              category: job.category,
              tags: job.tags,
              source: 'base.hirechain.io',
              region: 'Global',
              postedDate: new Date(),
              companyLogo: job.companyLogo,
            },
            'base.hirechain.io'
          )

          if (result.saved) savedCount++
          if (result.isNew) newCount++

          await delay(100)
        } catch (error) {
          console.error(`  Error saving job:`, error)
        }
      }

      await supabase.from('CrawlLog').insert({
        source: 'base.hirechain.io',
        status: 'success',
        jobCount: savedCount,
        createdAt: new Date().toISOString(),
      })

      console.log(`✅ Saved ${savedCount} jobs from Base Hirechain (${newCount} new)`)
      return { total: savedCount, new: newCount }
    }
  }

  // Process structured data
  console.log(`📦 Found ${jobs.length} jobs from Base Hirechain`)

  // Build company map for enrichment
  const companyMap = new Map(companies.map(c => [c.id, c]))

  let savedCount = 0
  let newCount = 0

  for (const job of jobs) {
    try {
      const company = companyMap.get(job.company_id)

      const url = `${baseUrl}/jobs/${job.slug}`

      const salaryInfo = parseSalary(
        job.salary_min && job.salary_max
          ? `${job.salary_currency || 'USD'} ${job.salary_min} - ${job.salary_max}`
          : undefined
      )

      const result = await validateAndSaveJob(
        {
          title: job.title,
          company: company?.name || 'Unknown',
          url,
          location: job.location || job.remote_policy || 'Remote',
          type: job.employment_type || 'Full-time',
          category: 'Engineering',
          tags: ['Base', 'Ethereum', 'L2'],
          source: 'base.hirechain.io',
          region: 'Global',
          postedDate: job.created_at ? new Date(job.created_at) : new Date(),
          description: job.description,
          requirements: job.requirements,
          salaryMin: job.salary_min || salaryInfo.min,
          salaryMax: job.salary_max || salaryInfo.max,
          salaryCurrency: job.salary_currency || salaryInfo.currency,
          experienceLevel: job.experience_level,
          remoteType: job.remote_policy || detectRemoteType(job.location || ''),
          companyLogo: company?.logo_url,
          deadline: job.deadline ? new Date(job.deadline) : undefined,
        },
        'base.hirechain.io'
      )

      if (result.saved) savedCount++
      if (result.isNew) newCount++

      await delay(100)
    } catch (error) {
      console.error(`  Error saving job ${job.title}:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'base.hirechain.io',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Base Hirechain (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
