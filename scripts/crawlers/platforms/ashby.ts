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
  publishedAt?: string
  isRemote?: boolean
}

interface AshbyResponse {
  jobs: AshbyJob[]
}

/**
 * Crawl jobs from Ashby's public posting API.
 * API: GET https://api.ashbyhq.com/posting-api/job-board/{org}
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

    jobs.push({
      title: job.title,
      company: companyName,
      url: job.jobUrl || `https://jobs.ashbyhq.com/${orgSlug}/${job.id}`,
      location,
      type: job.employmentType || 'Full-time',
      category: job.department || job.team || 'Engineering',
      tags: [],
      postedDate: job.publishedAt ? new Date(job.publishedAt) : new Date(),
    })
  }

  return jobs
}
