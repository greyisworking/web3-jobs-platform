import { fetchJSON, delay } from '../../utils'
import type { PlatformJob } from './index'

interface AshbyJob {
  id: string
  title: string
  location: string
  department?: string
  team?: string
  employmentType?: string
  jobUrl?: string
  publishedAt?: string
  isRemote?: boolean
  descriptionHtml?: string
  descriptionPlain?: string
}

interface AshbyJobDetail {
  id: string
  title: string
  descriptionHtml?: string
  descriptionPlain?: string
  info?: {
    descriptionHtml?: string
    descriptionPlain?: string
  }
}

interface AshbyResponse {
  jobs: AshbyJob[]
}

/**
 * Fetch full job description from Ashby's job detail API.
 * The listing API only returns summary (About section).
 * Detail API returns full JD including Responsibilities/Qualifications.
 */
async function fetchJobDetail(orgSlug: string, jobId: string): Promise<string | null> {
  const detailUrl = `https://api.ashbyhq.com/posting-api/job-board/${orgSlug}/jobs/${jobId}`
  const detail = await fetchJSON<AshbyJobDetail>(detailUrl)

  if (!detail) return null

  // Ashby detail API may return description in different fields
  return detail.descriptionHtml
    || detail.descriptionPlain
    || detail.info?.descriptionHtml
    || detail.info?.descriptionPlain
    || null
}

/**
 * Crawl jobs from Ashby's public posting API.
 * API: GET https://api.ashbyhq.com/posting-api/job-board/{org}
 * Detail API: GET https://api.ashbyhq.com/posting-api/job-board/{org}/jobs/{jobId}
 */
export async function crawlAshbyJobs(orgSlug: string, companyName: string): Promise<PlatformJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${orgSlug}`
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
      : 'Seoul, Korea'

    // Fetch full job description from detail API
    let description = job.descriptionHtml || job.descriptionPlain || undefined
    const fullDescription = await fetchJobDetail(orgSlug, job.id)
    if (fullDescription && fullDescription.length > (description?.length || 0)) {
      description = fullDescription
    }

    jobs.push({
      title: job.title,
      company: companyName,
      url: job.jobUrl || `https://jobs.ashbyhq.com/${orgSlug}/${job.id}`,
      location,
      type: job.employmentType || 'Full-time',
      category: job.department || job.team || 'Engineering',
      tags: [],
      postedDate: job.publishedAt ? new Date(job.publishedAt) : new Date(),
      description,
    })

    // Rate limiting to avoid API throttling
    await delay(200)
  }

  return jobs
}
