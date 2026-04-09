import axios from 'axios'
import * as cheerio from 'cheerio'
import { cleanText, parseSalary, getRandomUserAgent, delay } from '../utils'
import { runCrawler } from './runner'
import { parseTitleAtCompany } from './utils/rss'
import { extractJsonLdDescription } from './utils/extractors'
import type { CrawlerReturn } from './platforms'

async function fetchDetailDescription(jobUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(jobUrl, {
      headers: { 'User-Agent': getRandomUserAgent() },
      timeout: 15000,
    })
    const $ = cheerio.load(response.data)
    const desc = extractJsonLdDescription($)
    return desc ? cleanText(desc).slice(0, 10000) : null
  } catch {
    return null
  }
}

// Intermediate type after RSS parse + detail fetch
interface CryptoJob {
  title: string
  company: string
  link: string
  category: string
  pubDate: string
  location: string
  salary?: string
  type: string
  skills: string[]
  rssBodyText?: string
  description?: string
}

const CATEGORY_MAP: Record<string, string> = {
  'Tech': 'Engineering',
  'Marketing': 'Marketing',
  'Sales': 'Sales',
  'Design': 'Design',
  'Other': 'Operations',
}

export async function crawlCryptoJobs(): Promise<CrawlerReturn> {
  return runCrawler<CryptoJob>({
    source: 'crypto.jobs',
    displayName: 'CryptoJobs (RSS)',
    emoji: '🚀',

    async fetchJobs() {
      const response = await axios.get('https://crypto.jobs/feed/rss', {
        headers: { 'User-Agent': getRandomUserAgent() },
        timeout: 15000,
      })

      const $ = cheerio.load(response.data, { xmlMode: true })
      const entries: CryptoJob[] = []

      // Phase 1: parse RSS items
      for (const item of $('item').toArray()) {
        const $item = $(item)
        const rawTitle = cleanText($item.find('title').text())
        const link = $item.find('link').text().trim().split('?')[0]
        const category = cleanText($item.find('category').text()) || 'Engineering'
        const pubDate = $item.find('pubDate').text().trim()
        const descriptionHtml = $item.find('description').text()

        if (!rawTitle || !link) continue

        const { title, company } = parseTitleAtCompany(rawTitle)

        const $desc = cheerio.load(descriptionHtml)
        let location = 'Remote'
        let salary: string | undefined
        let type = 'Full-time'
        let skills: string[] = []
        let resolvedCompany = company

        $desc('p').each((_, p) => {
          const text = $desc(p).text()
          if (text.startsWith('Company:') && !resolvedCompany) resolvedCompany = cleanText(text.replace('Company:', ''))
          if (text.startsWith('Location:')) location = cleanText(text.replace('Location:', ''))
          if (text.startsWith('Salary:')) salary = cleanText(text.replace('Salary:', ''))
          if (text.startsWith('Type:')) type = cleanText(text.replace('Type:', ''))
          if (text.startsWith('Skills:')) skills = text.replace('Skills:', '').split(',').map(s => cleanText(s)).filter(Boolean)
        })

        $desc('p strong').parent().remove()
        const rssBodyText = cleanText($desc.text()).slice(0, 5000) || undefined

        entries.push({
          title,
          company: resolvedCompany || 'Unknown',
          link,
          category,
          pubDate,
          location,
          salary,
          type,
          skills,
          rssBodyText,
        })
      }

      // Phase 2: fetch detail pages for full JD
      for (const job of entries) {
        const detail = await fetchDetailDescription(job.link)
        job.description = detail || job.rssBodyText
        await delay(300)
      }

      return entries
    },

    mapToJobInput(job) {
      const salaryInfo = parseSalary(job.salary)
      const tags = job.skills.length > 0 ? job.skills : ['Web3', 'Crypto']

      return {
        title: job.title,
        company: job.company,
        url: job.link,
        location: job.location,
        type: job.type,
        category: CATEGORY_MAP[job.category] || 'Engineering',
        salary: job.salary || undefined,
        salaryMin: salaryInfo.min,
        salaryMax: salaryInfo.max,
        salaryCurrency: salaryInfo.currency,
        tags,
        source: 'crypto.jobs',
        region: 'Global',
        postedDate: job.pubDate ? new Date(job.pubDate) : new Date(),
        description: job.description,
      }
    },
  })
}
