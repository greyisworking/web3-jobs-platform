import { fetchJSON } from '../../utils'
import type { PlatformJob } from './index'

interface AshbyJob {
  id: string
  title: string
  location: string
  department?: string
  team?: string
  employmentType?: string
  jobUrl?: string
  applyUrl?: string
  publishedAt?: string
  isRemote?: boolean
  descriptionHtml?: string
  descriptionPlain?: string
  compensation?: {
    compensationTierSummary?: string
    summaryComponents?: Array<{
      compensationType: string
      minValue?: number
      maxValue?: number
      currencyCode?: string
    }>
  }
}

interface AshbyResponse {
  apiVersion?: string
  jobs: AshbyJob[]
}

/**
 * Crawl jobs from Ashby's public posting API.
 * API: GET https://api.ashbyhq.com/posting-api/job-board/{org}?includeCompensation=true
 *
 * Note: The list API returns full job descriptions (descriptionHtml).
 * The detail API (/jobs/{jobId}) requires authentication and is not public.
 */
export async function crawlAshbyJobs(orgSlug: string, companyName: string): Promise<PlatformJob[]> {
  // Include compensation data in the request
  const url = `https://api.ashbyhq.com/posting-api/job-board/${orgSlug}?includeCompensation=true`
  const data = await fetchJSON<AshbyResponse>(url)

  if (!data?.jobs || !Array.isArray(data.jobs)) {
    console.log(`⚠️  Ashby: No jobs found for ${companyName} (${orgSlug})`)
    return []
  }

  const jobs: PlatformJob[] = []
  for (const job of data.jobs) {
    if (!job.title) continue

    const locationParts: string[] = []
    if (job.location) locationParts.push(job.location)
    if (job.isRemote) locationParts.push('Remote')
    const location = locationParts.length > 0
      ? [...new Set(locationParts)].join(', ')
      : 'Remote'

    // Use description from list API (already includes full JD)
    const description = job.descriptionHtml || job.descriptionPlain || undefined

    // Extract salary from compensation data
    let salary: string | undefined
    if (job.compensation?.compensationTierSummary) {
      salary = job.compensation.compensationTierSummary
    } else if (job.compensation?.summaryComponents?.length) {
      const salaryComp = job.compensation.summaryComponents.find(
        c => c.compensationType === 'Salary' || c.compensationType === 'BaseSalary'
      )
      if (salaryComp && salaryComp.minValue && salaryComp.maxValue) {
        const currency = salaryComp.currencyCode || 'USD'
        salary = `${currency} ${salaryComp.minValue.toLocaleString()} - ${salaryComp.maxValue.toLocaleString()}`
      }
    }

    jobs.push({
      title: job.title,
      company: companyName,
      url: job.jobUrl || `https://jobs.ashbyhq.com/${orgSlug}/${job.id}`,
      applyUrl: job.applyUrl,
      location,
      type: job.employmentType || 'Full-time',
      category: job.department || job.team || 'Engineering',
      tags: [],
      postedDate: job.publishedAt ? new Date(job.publishedAt) : new Date(),
      description,
      salary,
    })
  }

  return jobs
}
