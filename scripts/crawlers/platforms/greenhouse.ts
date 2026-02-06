import { fetchJSON, delay } from '../../utils'
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

interface GreenhouseJobDetail extends GreenhouseJob {
  content?: string  // HTML job description
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[]
}

/**
 * Fetch job detail from Greenhouse API to get description (content field)
 */
async function fetchJobDetail(boardToken: string, jobId: number): Promise<string | null> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}`
    const data = await fetchJSON<GreenhouseJobDetail>(url)
    return data?.content || null
  } catch (error) {
    return null
  }
}

/**
 * Crawl jobs from Greenhouse's public board API.
 * API: GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs
 * Then fetches each job's detail to get the description.
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

    // Fetch job detail to get description
    const description = await fetchJobDetail(boardToken, job.id)
    await delay(100)  // Rate limit

    jobs.push({
      title: job.title,
      company: companyName,
      url: job.absolute_url || `https://boards.greenhouse.io/${boardToken}/jobs/${job.id}`,
      location,
      type: 'Full-time',
      category: department || 'Engineering',
      tags: [],
      postedDate: job.updated_at ? new Date(job.updated_at) : new Date(),
      description: description || undefined,
    })
  }

  return jobs
}
