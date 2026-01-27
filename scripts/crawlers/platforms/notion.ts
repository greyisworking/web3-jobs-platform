import { fetchHTML, cleanText } from '../../utils'
import type { PlatformJob } from './index'

/**
 * Best-effort crawl of a published Notion career page.
 * Notion pages are JS-rendered, so static HTML fetch may yield limited results.
 * Returns empty array if the page requires JS rendering.
 */
export async function crawlNotionJobs(notionUrl: string, companyName: string): Promise<PlatformJob[]> {
  const $ = await fetchHTML(notionUrl)

  if (!$) {
    console.log(`⚠️  Notion: Failed to fetch page for ${companyName}`)
    return []
  }

  const jobs: PlatformJob[] = []
  const seenUrls = new Set<string>()

  // Notion pages may have links to individual job postings or external job boards
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const text = cleanText($(el).text())

    // Skip navigation / non-job links
    if (!text || text.length < 5) return
    if (href.startsWith('#') || href.includes('notion.site') && !href.includes('/')) return

    // Look for links that point to job-related URLs
    const isJobLink = /lever\.co|greenhouse\.io|ashby|wanted\.co\.kr\/wd|career|recruit|apply|position/i.test(href)
    const hasJobTitle = /engineer|developer|designer|manager|analyst|lead|intern|head of|director/i.test(text)

    if ((isJobLink || hasJobTitle) && !seenUrls.has(href)) {
      seenUrls.add(href)

      const fullUrl = href.startsWith('http')
        ? href
        : `https://${new URL(notionUrl).host}${href}`

      jobs.push({
        title: text,
        company: companyName,
        url: fullUrl,
        location: 'Seoul, Korea',
        type: 'Full-time',
        category: 'Engineering',
        tags: [],
        postedDate: new Date(),
      })
    }
  })

  // Also check for text blocks that look like job titles (Notion renders these as divs)
  if (jobs.length === 0) {
    $('[class*="title"], [class*="header"], h1, h2, h3').each((_, el) => {
      const text = cleanText($(el).text())
      if (/engineer|developer|designer|manager|analyst|lead|intern/i.test(text) && text.length < 100) {
        if (!seenUrls.has(text)) {
          seenUrls.add(text)
          jobs.push({
            title: text,
            company: companyName,
            url: notionUrl,
            location: 'Seoul, Korea',
            type: 'Full-time',
            category: 'Engineering',
            tags: [],
            postedDate: new Date(),
          })
        }
      }
    })
  }

  return jobs
}
