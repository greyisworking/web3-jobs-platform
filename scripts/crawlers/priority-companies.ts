import { supabase, isSupabaseConfigured } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { PRIORITY_COMPANIES } from '../../lib/priority-companies'
import type { CareerPlatform } from '../../lib/priority-companies'
import { delay } from '../utils'
import {
  crawlLeverJobs,
  crawlGreenhouseJobs,
  crawlAshbyJobs,
} from './platforms'
import type { PlatformJob } from './platforms'

/**
 * Extract the slug/identifier from a career URL based on the platform.
 */
function extractSlug(careerUrl: string, platform: CareerPlatform): string {
  const url = new URL(careerUrl)

  switch (platform) {
    case 'lever':
      // https://jobs.lever.co/{slug} → slug
      return url.pathname.split('/').filter(Boolean)[0] || ''
    case 'greenhouse':
      // https://boards.greenhouse.io/{boardToken} → boardToken
      return url.pathname.split('/').filter(Boolean)[0] || ''
    case 'ashby':
      // https://api.ashbyhq.com/posting-api/job-board/{org} → org
      return url.pathname.split('/').filter(Boolean).pop() || ''
    default:
      return ''
  }
}

/**
 * Dispatch to the correct platform crawler.
 */
async function crawlCompanyJobs(
  platform: CareerPlatform,
  slug: string,
  companyName: string
): Promise<PlatformJob[]> {
  switch (platform) {
    case 'lever':
      return crawlLeverJobs(slug, companyName)
    case 'greenhouse':
      return crawlGreenhouseJobs(slug, companyName)
    case 'ashby':
      return crawlAshbyJobs(slug, companyName)
    default:
      return []
  }
}

/**
 * Master crawler: iterates all priority companies with career pages,
 * dispatches to platform-specific crawlers, and saves jobs.
 */
export async function crawlPriorityCompanies(): Promise<number> {
  console.log('🚀 Starting Priority Companies crawler...')

  const companiesWithCareers = PRIORITY_COMPANIES.filter(
    (c) => c.careerUrl && c.careerPlatform
  )

  console.log(`📋 ${companiesWithCareers.length} companies with career pages to crawl`)

  let totalSaved = 0

  for (const company of companiesWithCareers) {
    try {
      const slug = extractSlug(company.careerUrl!, company.careerPlatform)
      if (!slug) {
        console.log(`⚠️  Skipping ${company.name}: could not extract slug from ${company.careerUrl}`)
        continue
      }

      console.log(`  🔍 ${company.name} (${company.careerPlatform}/${slug})...`)

      const jobs = await crawlCompanyJobs(company.careerPlatform, slug, company.name)

      let companySaved = 0
      for (const job of jobs) {
        try {
          const saved = await validateAndSaveJob(
            {
              title: job.title,
              company: job.company,
              url: job.url,
              location: job.location,
              type: job.type,
              category: job.category,
              tags: job.tags,
              source: `priority:${company.careerPlatform}`,
              region: 'Global',
              postedDate: job.postedDate,
              description: job.description,  // Pass description from platform crawler
            },
            `priority:${company.careerPlatform}`
          )
          if (saved) companySaved++
          await delay(100)
        } catch (error) {
          console.error(`    Error saving job "${job.title}" from ${company.name}:`, error)
        }
      }

      totalSaved += companySaved
      console.log(`    ✅ ${company.name}: ${companySaved}/${jobs.length} jobs saved`)

      // Rate limit between companies
      await delay(500)
    } catch (error) {
      console.error(`  ❌ ${company.name} failed:`, error)
      // Non-fatal: continue with next company
    }
  }

  if (isSupabaseConfigured) {
    await supabase.from('CrawlLog').insert({
      source: 'priority-companies',
      status: 'success',
      jobCount: totalSaved,
      createdAt: new Date().toISOString(),
    })
  }

  console.log(`✅ Priority Companies: ${totalSaved} total jobs saved`)
  return totalSaved
}
