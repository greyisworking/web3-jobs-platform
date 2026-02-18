import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay, cleanText, delayWithJitter } from '../utils'
import { resilientFetchHTML } from './lib/resilient-fetch'

interface CrawlerReturn {
  total: number
  new: number
}

/**
 * CryptoJobs (crypto.jobs) Crawler
 * Crawls the main jobs listing page and extracts job data from HTML
 */
export async function crawlCryptoJobs(): Promise<CrawlerReturn> {
  console.log('🚀 Starting CryptoJobs crawler...')

  const baseUrl = 'https://crypto.jobs'
  const pages = [
    `${baseUrl}/jobs`,
    `${baseUrl}/jobs?categories=tech`,
    `${baseUrl}/jobs?categories=marketing`,
    `${baseUrl}/jobs?categories=sales`,
    `${baseUrl}/jobs?type=remote`,
  ]

  const allJobs: Array<{
    title: string
    company: string
    url: string
    location: string
    type: string
    category: string
    salary?: string
    tags: string[]
  }> = []

  const seenUrls = new Set<string>()

  for (const pageUrl of pages) {
    console.log(`  📄 Fetching ${pageUrl}`)
    const $ = await resilientFetchHTML(pageUrl, {
      source: 'crypto.jobs',
      maxRetries: 3,
    })

    if (!$) {
      console.error(`  ❌ Failed to fetch ${pageUrl}`)
      continue
    }

    // Find job cards - look for links to /jobs/[slug]
    $('a[href^="/jobs/"]').each((_, el) => {
      try {
        const $el = $(el)
        const href = $el.attr('href') || ''

        // Skip main jobs page link
        if (href === '/jobs' || href === '/jobs/') return

        // Skip non-job links
        if (!href.match(/^\/jobs\/[\w-]+$/)) return

        const fullUrl = `${baseUrl}${href}`

        // Skip duplicates
        if (seenUrls.has(fullUrl)) return
        seenUrls.add(fullUrl)

        // Get job card container
        const $card = $el.closest('div, article, li').first()
        const cardText = $card.text() || $el.text()

        // Extract title
        let title = cleanText($el.text())
        // If link text is too short, look for heading
        if (title.length < 5) {
          const heading = $card.find('h2, h3, h4, strong').first()
          title = cleanText(heading.text()) || title
        }

        // Skip if no valid title
        if (title.length < 3 || title.length > 200) return

        // Extract company name (usually appears after the job title or in a separate element)
        let company = 'Unknown'
        const companyPatterns = [
          /at\s+([A-Z][a-zA-Z0-9\s&.]+)/i,
          /([A-Z][a-zA-Z0-9\s&.]+)\s*(?:•|·|-|–)/,
        ]
        for (const pattern of companyPatterns) {
          const match = cardText.match(pattern)
          if (match) {
            company = cleanText(match[1])
            break
          }
        }

        // If still no company, look for secondary link
        const companyLink = $card.find('a:not([href^="/jobs/"])').first()
        if (companyLink.length && company === 'Unknown') {
          company = cleanText(companyLink.text())
        }

        // Extract location
        let location = 'Remote'
        if (cardText.toLowerCase().includes('remote')) {
          location = 'Remote'
        }
        const locationPatterns = [
          /🌍\s*([A-Za-z\s,]+)/,
          /📍\s*([A-Za-z\s,]+)/,
          /(Remote|Europe|USA|Asia|LATAM|Africa|Worldwide)/i,
        ]
        for (const pattern of locationPatterns) {
          const match = cardText.match(pattern)
          if (match) {
            location = cleanText(match[1])
            break
          }
        }

        // Extract employment type
        let type = 'Full-time'
        if (cardText.toLowerCase().includes('part time') || cardText.toLowerCase().includes('part-time')) {
          type = 'Part-time'
        } else if (cardText.toLowerCase().includes('contract')) {
          type = 'Contract'
        }

        // Extract category
        let category = 'Engineering'
        if (cardText.toLowerCase().includes('marketing')) {
          category = 'Marketing'
        } else if (cardText.toLowerCase().includes('sales')) {
          category = 'Sales'
        } else if (cardText.toLowerCase().includes('design')) {
          category = 'Design'
        } else if (cardText.toLowerCase().includes('operations')) {
          category = 'Operations'
        }

        // Extract tags
        const tags: string[] = []
        const tagPatterns = ['Solidity', 'Rust', 'TypeScript', 'Python', 'React', 'Blockchain', 'DeFi', 'NFT', 'Web3', 'Smart Contract']
        for (const tag of tagPatterns) {
          if (cardText.toLowerCase().includes(tag.toLowerCase())) {
            tags.push(tag)
          }
        }

        allJobs.push({
          title,
          company,
          url: fullUrl,
          location,
          type,
          category,
          tags,
        })
      } catch (error) {
        // Skip invalid entries
      }
    })

    // Rate limit with jitter between pages
    await delayWithJitter(1500, 1000)
  }

  // Remove duplicates
  const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.url, j])).values())

  console.log(`📦 Found ${uniqueJobs.length} unique jobs from CryptoJobs`)

  let savedCount = 0
  let newCount = 0

  for (const job of uniqueJobs) {
    try {
      const result = await validateAndSaveJob(
        {
          title: job.title,
          company: job.company,
          url: job.url,
          location: job.location,
          type: job.type,
          category: job.category,
          tags: job.tags,
          source: 'crypto.jobs',
          region: 'Global',
          postedDate: new Date(),
        },
        'crypto.jobs'
      )

      if (result.saved) savedCount++
      if (result.isNew) newCount++

      await delay(100)
    } catch (error) {
      console.error(`  Error saving job ${job.url}:`, error)
    }
  }

  // Log crawl result
  await supabase.from('CrawlLog').insert({
    source: 'crypto.jobs',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from CryptoJobs (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
