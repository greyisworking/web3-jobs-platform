import { fetchHTML, cleanText } from '../../utils'
import type { PlatformJob } from './index'

/**
 * Crawl jobs from Wanted.co.kr company page.
 * Tries __NEXT_DATA__ JSON extraction first, falls back to HTML selectors.
 */
export async function crawlWantedJobs(companyId: string, companyName: string): Promise<PlatformJob[]> {
  const pageUrl = `https://www.wanted.co.kr/company/${companyId}`
  const $ = await fetchHTML(pageUrl)

  if (!$) {
    console.log(`⚠️  Wanted: Failed to fetch page for ${companyName} (${companyId})`)
    return []
  }

  const jobs: PlatformJob[] = []

  // Strategy 1: Extract from __NEXT_DATA__
  const nextDataScript = $('script#__NEXT_DATA__').html()
  if (nextDataScript) {
    try {
      const nextData = JSON.parse(nextDataScript)
      const pageProps = nextData?.props?.pageProps

      // Wanted stores job positions in various locations
      const jobList = pageProps?.positions || pageProps?.jobs
        || pageProps?.company?.positions || pageProps?.data?.positions || []

      for (const job of jobList) {
        const title = job.title || job.position || job.name || ''
        if (!title) continue

        const jobUrl = job.id
          ? `https://www.wanted.co.kr/wd/${job.id}`
          : pageUrl

        jobs.push({
          title,
          company: companyName,
          url: jobUrl,
          location: job.location || job.address?.full_location || 'Seoul, Korea',
          type: job.employment_type || job.type || '정규직',
          category: job.category?.name || job.department || 'Engineering',
          tags: job.skill_tags?.map((t: any) => (typeof t === 'string' ? t : t.name)) || [],
          postedDate: job.created_at ? new Date(job.created_at) : new Date(),
        })
      }
    } catch {
      // Fall through to HTML parsing
    }
  }

  // Strategy 2: Parse rendered HTML
  if (jobs.length === 0) {
    $('a[href*="/wd/"]').each((_, el) => {
      const $el = $(el)
      const href = $el.attr('href') || ''
      const title = cleanText($el.text())

      if (!title || title.length < 3) return

      const fullUrl = href.startsWith('http')
        ? href
        : `https://www.wanted.co.kr${href}`

      jobs.push({
        title,
        company: companyName,
        url: fullUrl,
        location: 'Seoul, Korea',
        type: '정규직',
        category: 'Engineering',
        tags: [],
        postedDate: new Date(),
      })
    })
  }

  return jobs
}
