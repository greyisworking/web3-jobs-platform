import { fetchJSON } from '../../utils'
import type { PlatformJob } from './index'

interface LeverPosting {
  id: string
  text: string
  categories?: {
    team?: string
    department?: string
    location?: string
    commitment?: string
  }
  hostedUrl?: string
  applyUrl?: string
  createdAt?: number
  tags?: string[]
}

/**
 * Crawl jobs from Lever's public API.
 * API: GET https://api.lever.co/v0/postings/{slug}?mode=json
 */
export async function crawlLeverJobs(slug: string, companyName: string): Promise<PlatformJob[]> {
  const url = `https://api.lever.co/v0/postings/${slug}?mode=json`
  const data = await fetchJSON<LeverPosting[]>(url)

  if (!data || !Array.isArray(data)) {
    console.log(`⚠️  Lever: No postings found for ${companyName} (${slug})`)
    return []
  }

  const jobs: PlatformJob[] = []
  for (const posting of data) {
    if (!posting.text) continue

    jobs.push({
      title: posting.text,
      company: companyName,
      url: posting.hostedUrl || `https://jobs.lever.co/${slug}/${posting.id}`,
      location: posting.categories?.location || 'Seoul, Korea',
      type: posting.categories?.commitment || 'Full-time',
      category: posting.categories?.department || posting.categories?.team || 'Engineering',
      tags: posting.tags || [],
      postedDate: posting.createdAt ? new Date(posting.createdAt) : new Date(),
    })
  }

  return jobs
}
