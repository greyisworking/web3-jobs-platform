import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText, parseSalary, detectExperienceLevel, detectRemoteType } from '../utils'
import { cleanDescriptionText } from '../../lib/clean-description'
import { parseStringPromise } from 'xml2js'
import axios from 'axios'

interface CrawlerReturn {
  total: number
  new: number
}

interface RssItem {
  title: string[]
  description: string[]
  link: string[]
  pubDate: string[]
  guid: string[]
}

/**
 * Fetch and parse job details from individual job page
 */
async function fetchJobDetails(jobUrl: string): Promise<{
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
}> {
  const $ = await fetchHTML(jobUrl)
  if (!$) return {}

  const details: Record<string, any> = {}

  try {
    // Job description - inside .prose div
    const proseEl = $('.prose')
    if (proseEl.length) {
      // Get the HTML content and convert to clean text
      let descHtml = proseEl.html() || ''
      // Remove script tags and clean
      descHtml = descHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

      // Extract text with proper line breaks
      const descText = proseEl.text()
      if (descText.length > 100) {
        details.description = cleanDescriptionText(descText.slice(0, 8000))
      }

      // Extract sections from headers
      proseEl.find('h2, h3').each((_, el) => {
        const header = cleanText($(el).text()).toLowerCase()
        let content = ''

        // Get all content until next header
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

    // Extract metadata from sidebar
    // Location
    const locationSection = $('h3:contains("Location")').next('ul')
    if (locationSection.length) {
      details.location = cleanText(locationSection.text())
    }

    // Job type
    const typeSection = $('h3:contains("Job type")').next('ul')
    if (typeSection.length) {
      const typeText = cleanText(typeSection.text()).toLowerCase()
      if (typeText.includes('full-time')) details.type = 'Full-time'
      else if (typeText.includes('part-time')) details.type = 'Part-time'
      else if (typeText.includes('contract')) details.type = 'Contract'
      else if (typeText.includes('internship')) details.type = 'Internship'
    }

    // Keywords/Tags - from "Keywords" section only
    const keywordsSection = $('h3:contains("Keywords")').next('ul')
    if (keywordsSection.length) {
      const tags: string[] = []
      keywordsSection.find('a').each((_, el) => {
        const tag = cleanText($(el).text())
        // Only include valid tech-related tags
        if (tag.length > 1 && tag.length < 40) {
          tags.push(tag)
        }
      })
      if (tags.length > 0) {
        details.tags = tags.slice(0, 10)
      }
    }

    // Company logo
    const logoImg = $('img[alt$="logo"]').first()
    if (logoImg.length) {
      let logoSrc = logoImg.attr('data-src') || logoImg.attr('src')
      if (logoSrc && !logoSrc.includes('placeholder')) {
        if (!logoSrc.startsWith('http')) {
          logoSrc = `https://cryptocurrencyjobs.co${logoSrc}`
        }
        details.companyLogo = logoSrc
      }
    }

    // Detect experience level and remote type from full text
    const fullText = $('body').text()
    details.experienceLevel = detectExperienceLevel(fullText) || undefined
    details.remoteType = detectRemoteType(fullText) || undefined

  } catch (error) {
    console.error(`  Error fetching details from ${jobUrl}:`, error)
  }

  return details
}

/**
 * CryptocurrencyJobs.co Crawler
 * Uses RSS feed for reliable job listing extraction
 */
export async function crawlCryptocurrencyJobs(): Promise<CrawlerReturn> {
  console.log('🚀 Starting CryptocurrencyJobs crawler...')

  const rssUrl = 'https://cryptocurrencyjobs.co/index.xml'

  try {
    // Fetch RSS feed
    const response = await axios.get(rssUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    })

    // Parse RSS XML
    const rssData = await parseStringPromise(response.data)
    const items: RssItem[] = rssData?.rss?.channel?.[0]?.item || []

    console.log(`📦 Found ${items.length} jobs from RSS feed`)

    // Limit to recent jobs (first 100)
    const jobItems = items.slice(0, 100)

    let savedCount = 0
    let newCount = 0

    for (const item of jobItems) {
      try {
        const fullTitle = item.title?.[0] || ''
        const url = item.link?.[0] || item.guid?.[0] || ''
        const rssDescription = item.description?.[0] || ''
        const pubDate = item.pubDate?.[0] || ''

        if (!fullTitle || !url) continue

        // Parse "Job Title at Company" format
        const titleMatch = fullTitle.match(/^(.+?)\s+at\s+(.+)$/i)
        let title = fullTitle
        let company = 'Unknown'

        if (titleMatch) {
          title = titleMatch[1].trim()
          company = titleMatch[2].trim()
        }

        // Extract category from URL
        // URL format: /category/company-job-title/
        const urlMatch = url.match(/cryptocurrencyjobs\.co\/([^/]+)\//)
        let category = 'Engineering'
        if (urlMatch) {
          const rawCategory = urlMatch[1]
          const categoryMap: Record<string, string> = {
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
          category = categoryMap[rawCategory] || 'Engineering'
        }

        // Fetch job details (limit to first 50 for rate limiting)
        let details: any = {}
        if (savedCount < 50) {
          console.log(`  📄 Fetching: ${title.slice(0, 50)}...`)
          details = await fetchJobDetails(url)
          await delay(300)
        }

        // Use RSS description as fallback if no detailed description
        let description = details.description
        if (!description && rssDescription) {
          description = cleanDescriptionText(rssDescription)
        }

        // Determine location and type
        const location = details.location || 'Remote'
        const type = details.type || 'Full-time'

        // Build tags - only from keywords, add Web3/Blockchain defaults
        const tags: string[] = ['Web3', 'Blockchain']
        if (details.tags) {
          tags.push(...details.tags)
        }

        const result = await validateAndSaveJob(
          {
            title,
            company,
            url,
            location,
            type,
            category,
            tags: [...new Set(tags)].slice(0, 10), // Dedupe and limit
            source: 'cryptocurrencyjobs.co',
            region: 'Global',
            postedDate: pubDate ? new Date(pubDate) : new Date(),
            description,
            requirements: details.requirements,
            responsibilities: details.responsibilities,
            benefits: details.benefits,
            experienceLevel: details.experienceLevel,
            remoteType: details.remoteType,
            companyLogo: details.companyLogo,
          },
          'cryptocurrencyjobs.co'
        )

        if (result.saved) savedCount++
        if (result.isNew) newCount++

        await delay(100)
      } catch (error) {
        console.error(`  Error processing job:`, error)
      }
    }

    // Log crawl result
    await supabase.from('CrawlLog').insert({
      source: 'cryptocurrencyjobs.co',
      status: 'success',
      jobCount: savedCount,
      createdAt: new Date().toISOString(),
    })

    console.log(`✅ Saved ${savedCount} jobs from CryptocurrencyJobs (${newCount} new)`)
    return { total: savedCount, new: newCount }

  } catch (error: any) {
    console.error('❌ Failed to fetch RSS feed:', error.message)

    await supabase.from('CrawlLog').insert({
      source: 'cryptocurrencyjobs.co',
      status: 'failed',
      jobCount: 0,
      error: error.message,
      createdAt: new Date().toISOString(),
    })

    return { total: 0, new: 0 }
  }
}
