import { fetchXML, fetchHTML, cleanText, extractHTML, detectExperienceLevel, detectRemoteType, delayWithJitter, parseSalary } from '../utils'
import { runCrawler } from './runner'
import { parseTitleAtCompany } from './utils/rss'
import type { CrawlerReturn } from './platforms'

async function fetchJobDescription(jobUrl: string): Promise<string | null> {
  try {
    const $ = await fetchHTML(jobUrl, { useBrowserHeaders: true })
    if (!$) return null

    const selectors = [
      '[class*="jobDescription"]',
      '[class*="jobContent"]',
      '.job-description',
      '.job-content',
      '.job-details',
      '[class*="job-body"]',
      'article',
      '.prose',
      'main section',
    ]

    for (const selector of selectors) {
      const $el = $(selector)
      if ($el.length > 0) {
        const html = extractHTML($el.first(), $)
        if (html && html.length > 100) return html
      }
    }

    const $main = $('main').first()
    if ($main.length > 0) {
      const mainHtml = extractHTML($main, $)
      if (mainHtml && mainHtml.length > 100) return mainHtml
    }

    return null
  } catch {
    return null
  }
}

// Intermediate type after RSS parse + detail fetch
interface Remote3Job {
  title: string
  company: string
  link: string
  pubDate: string
  description: string | null
  rssSalary?: string
  rssLocation: string
  rssType: string
}

export async function crawlRemote3(): Promise<CrawlerReturn> {
  return runCrawler<Remote3Job>({
    source: 'remote3.co',
    displayName: 'Remote3.co',
    emoji: '🚀',
    saveDelayMs: 50,

    async fetchJobs() {
      const $ = await fetchXML('https://remote3.co/api/rss')
      if (!$) return []

      // Phase 1: parse RSS items
      const entries: Remote3Job[] = []
      $('item').each((_, element) => {
        const $item = $(element)
        const rawTitle = cleanText($item.find('title').text())
        const link = cleanText($item.find('link').text())
        const pubDate = $item.find('pubDate').text()
        const rssDescription = cleanText($item.find('description').text())
          || cleanText($item.find('content\\:encoded').text())
          || null

        if (!rawTitle || !link) return

        const { title, company } = parseTitleAtCompany(rawTitle)

        let rssSalary: string | undefined
        let rssLocation = 'Remote'
        let rssType = 'Full-time'

        if (rssDescription) {
          for (const part of rssDescription.split(' - ').map(s => s.trim())) {
            if (/full.time/i.test(part)) rssType = 'Full-time'
            else if (/part.time/i.test(part)) rssType = 'Part-time'
            else if (/contract/i.test(part)) rssType = 'Contract'
            else if (/\$[\d,]+k?\s*[-–]\s*\$[\d,]+k?/i.test(part) || /\$[\d,]+k/i.test(part)) {
              rssSalary = part
            } else if (/worldwide|remote|global/i.test(part)) {
              rssLocation = 'Remote'
            } else if (part.length > 2 && !part.startsWith('at ') && !/^\$/.test(part)) {
              rssLocation = part
            }
          }
        }

        entries.push({
          title, company: company || 'Remote3', link, pubDate,
          description: rssDescription, rssSalary, rssLocation, rssType,
        })
      })

      // Phase 2: fetch detail pages
      for (const job of entries) {
        const fullDesc = await fetchJobDescription(job.link)
        if (fullDesc && fullDesc.length > (job.description?.length || 0)) {
          job.description = fullDesc
        }
        await delayWithJitter(800, 500)
      }

      return entries
    },

    mapToJobInput(job) {
      const experienceLevel = job.description ? detectExperienceLevel(job.description) : null
      const remoteType = detectRemoteType('Remote')
      const salaryInfo = job.rssSalary ? parseSalary(job.rssSalary) : { min: null, max: null, currency: null }

      return {
        title: job.title,
        company: job.company,
        url: job.link,
        location: job.rssLocation,
        type: job.rssType,
        category: 'Engineering',
        tags: ['Web3', 'Remote'],
        source: 'remote3.co',
        region: 'Global',
        postedDate: job.pubDate ? new Date(job.pubDate) : new Date(),
        description: job.description,
        experienceLevel,
        remoteType: remoteType || 'Remote',
        salary: job.rssSalary,
        salaryMin: salaryInfo.min,
        salaryMax: salaryInfo.max,
        salaryCurrency: salaryInfo.currency,
      }
    },
  })
}
