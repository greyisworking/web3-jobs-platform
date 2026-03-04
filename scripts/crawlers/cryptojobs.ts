import axios from 'axios'
import * as cheerio from 'cheerio'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { cleanText, parseSalary, getRandomUserAgent } from '../utils'

interface CrawlerReturn {
  total: number
  new: number
}

/**
 * CryptoJobs (crypto.jobs) Crawler — RSS feed mode
 * The site blocks HTML scraping (Cloudflare 403), but the RSS feed is open.
 * Feed: https://crypto.jobs/feed/rss — returns ~50 most recent jobs with rich data.
 */
export async function crawlCryptoJobs(): Promise<CrawlerReturn> {
  console.log('🚀 Starting CryptoJobs crawler (RSS mode)...')

  const feedUrl = 'https://crypto.jobs/feed/rss'

  let xml: string
  try {
    const response = await axios.get(feedUrl, {
      headers: { 'User-Agent': getRandomUserAgent() },
      timeout: 15000,
    })
    xml = response.data
  } catch (error: any) {
    console.error(`  ❌ Failed to fetch RSS feed: ${error.message}`)
    await supabase.from('CrawlLog').insert({
      source: 'crypto.jobs',
      status: 'failed',
      jobCount: 0,
      createdAt: new Date().toISOString(),
    })
    return { total: 0, new: 0 }
  }

  const $ = cheerio.load(xml, { xmlMode: true })
  const items = $('item')
  console.log(`  📡 RSS feed: ${items.length} items`)

  let savedCount = 0
  let newCount = 0

  items.each((_, item) => {
    // Queued for processing below (cheerio .each is sync)
  })

  // Process items sequentially (for DB writes)
  const itemElements = items.toArray()
  for (const item of itemElements) {
    try {
      const $item = $(item)

      // Title: "Senior Blockchain Engineer at Unlimit Pro"
      const rawTitle = cleanText($item.find('title').text())
      const link = $item.find('link').text().trim().split('?')[0] // Strip UTM params
      const category = cleanText($item.find('category').text()) || 'Engineering'
      const pubDateStr = $item.find('pubDate').text().trim()
      const descriptionHtml = $item.find('description').text()

      if (!rawTitle || !link) continue

      // Parse "Title at Company" pattern
      let title = rawTitle
      let company = 'Unknown'
      const atMatch = rawTitle.match(/^(.+?)\s+at\s+(.+)$/i)
      if (atMatch) {
        title = cleanText(atMatch[1])
        company = cleanText(atMatch[2])
      }

      // Parse description HTML for structured fields
      const $desc = cheerio.load(descriptionHtml)
      let location = 'Remote'
      let salary: string | undefined
      let type = 'Full-time'
      let skills: string[] = []

      $desc('p').each((_, p) => {
        const text = $desc(p).text()
        if (text.startsWith('Company:') && company === 'Unknown') {
          company = cleanText(text.replace('Company:', ''))
        }
        if (text.startsWith('Location:')) {
          location = cleanText(text.replace('Location:', ''))
        }
        if (text.startsWith('Salary:')) {
          salary = cleanText(text.replace('Salary:', ''))
        }
        if (text.startsWith('Type:')) {
          type = cleanText(text.replace('Type:', ''))
        }
        if (text.startsWith('Skills:')) {
          skills = text.replace('Skills:', '').split(',').map(s => cleanText(s)).filter(Boolean)
        }
      })

      // Extract remaining text as description (after structured fields)
      $desc('p strong').parent().remove()
      const description = cleanText($desc.text()).slice(0, 5000) || undefined

      // Map category
      const categoryMap: Record<string, string> = {
        'Tech': 'Engineering',
        'Marketing': 'Marketing',
        'Sales': 'Sales',
        'Design': 'Design',
        'Other': 'Operations',
      }
      const mappedCategory = categoryMap[category] || 'Engineering'

      // Parse salary
      const salaryInfo = parseSalary(salary)

      // Tags: combine RSS skills + detected from title
      const tags = skills.length > 0 ? skills : ['Web3', 'Crypto']

      // Parse date
      const postedDate = pubDateStr ? new Date(pubDateStr) : new Date()

      const result = await validateAndSaveJob(
        {
          title,
          company,
          url: link,
          location,
          type,
          category: mappedCategory,
          salary: salary || undefined,
          salaryMin: salaryInfo.min,
          salaryMax: salaryInfo.max,
          salaryCurrency: salaryInfo.currency,
          tags,
          source: 'crypto.jobs',
          region: 'Global',
          postedDate,
          description,
        },
        'crypto.jobs'
      )

      if (result.saved) savedCount++
      if (result.isNew) newCount++
    } catch (error) {
      console.error('  Error processing RSS item:', error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'crypto.jobs',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from CryptoJobs (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
