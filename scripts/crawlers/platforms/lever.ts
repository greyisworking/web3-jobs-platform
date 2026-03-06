import { fetchJSON } from '../../utils'
import type { PlatformJob } from './index'

interface LeverList {
  text: string
  content: string
}

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
  descriptionPlain?: string
  lists?: LeverList[]
}

/**
 * Build description from Lever posting data
 */
function buildDescription(posting: LeverPosting): string | undefined {
  const parts: string[] = []

  if (posting.descriptionPlain) {
    parts.push(posting.descriptionPlain)
  }

  if (posting.lists && posting.lists.length > 0) {
    for (const list of posting.lists) {
      if (list.text && list.content) {
        parts.push(`\n${list.text}\n${list.content}`)
      }
    }
  }

  const description = parts.join('\n').trim()
  return description.length > 50 ? description : undefined
}

/**
 * Extract salary info from description text.
 * Looks for patterns like "$150,000 - $200,000", "USD 120K-180K", etc.
 */
function extractSalaryFromText(text: string): string | undefined {
  if (!text) return undefined
  const patterns = [
    /\$[\d,]+k?\s*[-–—to]+\s*\$[\d,]+k?\s*(?:per\s+(?:year|annum)|\/\s*(?:yr|year)|annually)?/i,
    /USD\s*[\d,]+k?\s*[-–—to]+\s*USD?\s*[\d,]+k?\s*(?:per\s+(?:year|annum))?/i,
    /(?:salary|compensation|pay)[\s:]+\$[\d,]+k?\s*[-–—to]+\s*\$[\d,]+k?/i,
  ]
  for (const p of patterns) {
    const match = text.match(p)
    if (match) return match[0].trim()
  }
  return undefined
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

    const description = buildDescription(posting)

    // Build tags from posting tags + department/team
    const tags: string[] = [...(posting.tags || [])]
    const dept = posting.categories?.department || posting.categories?.team
    if (dept && !tags.includes(dept)) tags.push(dept)
    if (tags.length === 0) tags.push('Web3', 'Blockchain')

    // Extract salary from description text
    const salary = description ? extractSalaryFromText(description) : undefined

    jobs.push({
      title: posting.text,
      company: companyName,
      url: posting.hostedUrl || `https://jobs.lever.co/${slug}/${posting.id}`,
      location: posting.categories?.location || 'Seoul, Korea',
      type: posting.categories?.commitment || 'Full-time',
      category: posting.categories?.department || posting.categories?.team || 'Engineering',
      tags,
      postedDate: posting.createdAt ? new Date(posting.createdAt) : new Date(),
      description,
      salary,
    })
  }

  return jobs
}
