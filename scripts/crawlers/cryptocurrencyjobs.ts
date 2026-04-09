import { fetchHTML, delay, cleanText, detectExperienceLevel, detectRemoteType } from '../utils'
import { cleanDescriptionHtml } from '../../lib/clean-description'
import { parseStringPromise } from 'xml2js'
import axios from 'axios'
import { runCrawler } from './runner'
import { parseTitleAtCompany } from './utils/rss'
import type { CrawlerReturn } from './platforms'

interface RssItem {
  title: string[]
  description: string[]
  link: string[]
  pubDate: string[]
  guid: string[]
}

// Detail page enrichment
interface JobDetails {
  description?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  experienceLevel?: string
  remoteType?: string
  companyLogo?: string
  location?: string
  type?: string
  tags?: string[]
}

async function fetchJobDetails(jobUrl: string): Promise<JobDetails> {
  const $ = await fetchHTML(jobUrl)
  if (!$) return {}

  const details: JobDetails = {}

  try {
    const proseEl = $('.prose')
    if (proseEl.length) {
      const descHtml = proseEl.html() || ''
      if (descHtml.length > 100) {
        details.description = cleanDescriptionHtml(descHtml.slice(0, 10000))
      }

      proseEl.find('h2, h3').each((_, el) => {
        const header = cleanText($(el).text()).toLowerCase()
        let content = ''
        let nextEl = $(el).next()
        while (nextEl.length && !nextEl.is('h2, h3')) {
          content += nextEl.text() + '\n'
          nextEl = nextEl.next()
        }
        content = cleanText(content)

        if (content.length > 50) {
          if (header.includes('requirement') || header.includes('qualif') || header.includes('skills')) {
            details.requirements = content.slice(0, 3000)
          }
          if (header.includes('responsib') || header.includes('what you') || header.includes('duties')) {
            details.responsibilities = content.slice(0, 3000)
          }
          if (header.includes('benefit') || header.includes('perk') || header.includes('offer') || header.includes('nice to have')) {
            details.benefits = content.slice(0, 2000)
          }
        }
      })
    }

    const locationSection = $('h3:contains("Location")').next('ul')
    if (locationSection.length) details.location = cleanText(locationSection.text())

    const typeSection = $('h3:contains("Job type")').next('ul')
    if (typeSection.length) {
      const typeText = cleanText(typeSection.text()).toLowerCase()
      if (typeText.includes('full-time')) details.type = 'Full-time'
      else if (typeText.includes('part-time')) details.type = 'Part-time'
      else if (typeText.includes('contract')) details.type = 'Contract'
      else if (typeText.includes('internship')) details.type = 'Internship'
    }

    const keywordsSection = $('h3:contains("Keywords")').next('ul')
    if (keywordsSection.length) {
      const tags: string[] = []
      keywordsSection.find('a').each((_, el) => {
        const tag = cleanText($(el).text())
        if (tag.length > 1 && tag.length < 40) tags.push(tag)
      })
      if (tags.length > 0) details.tags = tags.slice(0, 10)
    }

    const logoImg = $('img[alt$="logo"]').first()
    if (logoImg.length) {
      let logoSrc = logoImg.attr('data-src') || logoImg.attr('src')
      if (logoSrc && !logoSrc.includes('placeholder')) {
        if (!logoSrc.startsWith('http')) logoSrc = `https://cryptocurrencyjobs.co${logoSrc}`
        details.companyLogo = logoSrc
      }
    }

    const fullText = $('body').text()
    details.experienceLevel = detectExperienceLevel(fullText) || undefined
    details.remoteType = detectRemoteType(fullText) || undefined
  } catch {
    // skip detail errors
  }

  return details
}

// Enriched job after RSS parse + detail fetch
interface EnrichedJob {
  title: string
  company: string
  url: string
  category: string
  pubDate: string
  rssDescription: string
  details: JobDetails
}

const JOB_WORDS = new Set([
  'senior', 'junior', 'lead', 'head', 'chief', 'staff', 'principal', 'associate',
  'manager', 'engineer', 'developer', 'designer', 'analyst', 'specialist',
  'coordinator', 'director', 'vp', 'marketing', 'sales', 'product', 'tech',
  'software', 'web', 'web3', 'blockchain', 'crypto', 'defi', 'backend',
  'frontend', 'fullstack', 'devops', 'data', 'growth', 'community', 'content',
  'social', 'legal', 'finance', 'hr', 'ops', 'operations', 'business',
  'partner', 'talent', 'recruiter', 'recruiting', 'counsel', 'deputy', 'commercial',
])

function extractCompanyFromUrl(url: string): string {
  const match = url.match(/cryptocurrencyjobs\.co\/[^/]+\/([^/]+)/)
  if (!match) return ''
  const parts = match[1].split('-')
  const companyParts: string[] = []
  for (const part of parts) {
    if (JOB_WORDS.has(part.toLowerCase())) break
    companyParts.push(part)
  }
  if (companyParts.length === 0) return ''
  return companyParts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
    .replace(/\bLi Fi\b/i, 'LI.FI')
    .replace(/\bDefi\b/i, 'DeFi')
    .replace(/\bNft\b/i, 'NFT')
    .replace(/\bDao\b/i, 'DAO')
    .replace(/\bAi\b/i, 'AI')
}

const CATEGORY_MAP: Record<string, string> = {
  'engineering': 'Engineering',
  'design': 'Design',
  'marketing': 'Marketing',
  'sales': 'Sales',
  'product': 'Product',
  'operations': 'Operations',
  'finance': 'Finance',
  'community': 'Community',
  'customer-support': 'Customer Support',
  'non-tech': 'Non-Tech',
  'other': 'Other',
}

export async function crawlCryptocurrencyJobs(): Promise<CrawlerReturn> {
  return runCrawler<EnrichedJob>({
    source: 'cryptocurrencyjobs.co',
    displayName: 'CryptocurrencyJobs',
    emoji: '🚀',

    async fetchJobs() {
      const response = await axios.get('https://cryptocurrencyjobs.co/index.xml', {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      })

      const rssData = await parseStringPromise(response.data)
      const items: RssItem[] = rssData?.rss?.channel?.[0]?.item || []
      const jobItems = items.slice(0, 100)

      // Phase 1: parse RSS
      const entries: EnrichedJob[] = []
      for (const item of jobItems) {
        const fullTitle = item.title?.[0] || ''
        const url = item.link?.[0] || item.guid?.[0] || ''
        const rssDescription = item.description?.[0] || ''
        const pubDate = item.pubDate?.[0] || ''

        if (!fullTitle || !url) continue

        let { title, company } = parseTitleAtCompany(fullTitle)
        if (!company) company = extractCompanyFromUrl(url)
        if (!company) company = 'Unknown'

        const urlMatch = url.match(/cryptocurrencyjobs\.co\/([^/]+)\//)
        const category = urlMatch ? (CATEGORY_MAP[urlMatch[1]] || 'Engineering') : 'Engineering'

        entries.push({ title, company, url, category, pubDate, rssDescription, details: {} })
      }

      // Phase 2: fetch detail pages
      for (const job of entries) {
        console.log(`  📄 Fetching: ${job.title.slice(0, 50)}...`)
        job.details = await fetchJobDetails(job.url)
        await delay(200)
      }

      return entries
    },

    mapToJobInput(job) {
      let description = job.details.description
      if (!description && job.rssDescription) {
        description = cleanDescriptionHtml(job.rssDescription)
      }

      const tags: string[] = ['Web3', 'Blockchain']
      if (job.details.tags) tags.push(...job.details.tags)

      return {
        title: job.title,
        company: job.company,
        url: job.url,
        location: job.details.location || 'Remote',
        type: job.details.type || 'Full-time',
        category: job.category,
        tags: [...new Set(tags)].slice(0, 10),
        source: 'cryptocurrencyjobs.co',
        region: 'Global',
        postedDate: job.pubDate ? new Date(job.pubDate) : new Date(),
        description,
        requirements: job.details.requirements,
        responsibilities: job.details.responsibilities,
        benefits: job.details.benefits,
        experienceLevel: job.details.experienceLevel,
        remoteType: job.details.remoteType,
        companyLogo: job.details.companyLogo,
      }
    },
  })
}
