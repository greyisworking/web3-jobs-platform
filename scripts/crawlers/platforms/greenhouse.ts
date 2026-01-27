import { fetchJSON } from '../../utils'
import type { PlatformJob } from './index'

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  location?: { name?: string }
  departments?: { name?: string }[]
  offices?: { name?: string }[]
  updated_at?: string
  metadata?: { name: string; value: string }[]
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[]
}

/**
 * Crawl jobs from Greenhouse's public board API.
 * API: GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs
 */
export async function crawlGreenhouseJobs(boardToken: string, companyName: string): Promise<PlatformJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`
  const data = await fetchJSON<GreenhouseResponse>(url)

  if (!data?.jobs || !Array.isArray(data.jobs)) {
    console.log(`⚠️  Greenhouse: No jobs found for ${companyName} (${boardToken})`)
    return []
  }

  const jobs: PlatformJob[] = []
  for (const job of data.jobs) {
    if (!job.title) continue

    const location = job.location?.name
      || job.offices?.map((o) => o.name).filter(Boolean).join(', ')
      || 'Seoul, Korea'

    const department = job.departments?.map((d) => d.name).filter(Boolean).join(', ')

    jobs.push({
      title: job.title,
      company: companyName,
      url: job.absolute_url || `https://boards.greenhouse.io/${boardToken}/jobs/${job.id}`,
      location,
      type: 'Full-time',
      category: department || 'Engineering',
      tags: [],
      postedDate: job.updated_at ? new Date(job.updated_at) : new Date(),
    })
  }

  return jobs
}
