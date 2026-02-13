import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchXML, fetchHTML, delay, cleanText, extractHTML, detectExperienceLevel, detectRemoteType } from '../utils'

interface CrawlerReturn {
  total: number
  new: number
}

/**
 * Fetch full job description from Remote3.co job page.
 * RSS feed only contains meta info, not the actual JD.
 */
async function fetchJobDescription(jobUrl: string): Promise<string | null> {
  try {
    const $ = await fetchHTML(jobUrl)
    if (!$) {
      console.warn(`⚠️  fetchHTML returned null for: ${jobUrl}`)
      return null
    }

    // Try Remote3-specific selectors first (Next.js CSS Modules with hash suffix)
    // e.g., RemoteJobs_jobDescription__4e4Ch
    const selectors = [
      '[class*="jobDescription"]',      // Remote3 specific: RemoteJobs_jobDescription__xxx
      '[class*="jobContent"]',          // Remote3 specific: RemoteJobs_jobContent__xxx
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
        if (html && html.length > 100) {
          return html
        }
      }
    }

    // Fallback: try to get main content area
    const $main = $('main').first()
    if ($main.length > 0) {
      const mainHtml = extractHTML($main, $)
      if (mainHtml && mainHtml.length > 100) {
        return mainHtml
      }
    }

    console.warn(`⚠️  No JD found with any selector for: ${jobUrl}`)
    return null
  } catch (error) {
    console.error(`❌ Error fetching job description from ${jobUrl}:`, error)
    return null
  }
}

export async function crawlRemote3(): Promise<CrawlerReturn> {
  console.log('🚀 Starting Remote3.co crawler...')

  const $ = await fetchXML('https://remote3.co/api/rss')

  if (!$) {
    console.error('❌ Failed to fetch Remote3.co RSS feed')
    return { total: 0, new: 0 }
  }

  const items = $('item')
  console.log(`📦 Found ${items.length} jobs from Remote3.co RSS`)

  // Collect all entries synchronously from cheerio, then save async
  const jobEntries: {
    title: string
    company: string
    link: string
    pubDate: string
    description: string | null
  }[] = []

  items.each((_, element) => {
    const $item = $(element)
    const rawTitle = cleanText($item.find('title').text())
    const link = cleanText($item.find('link').text())
    const pubDate = $item.find('pubDate').text()
    // RSS description is just meta info (e.g., "at Company - Full-Time - Location")
    // We'll fetch full description from the job page
    const rssDescription = cleanText($item.find('description').text())
      || cleanText($item.find('content\\:encoded').text())
      || null

    if (!rawTitle || !link) return

    // Parse "Title at Company" pattern
    let title = rawTitle
    let company = 'Remote3'
    const atMatch = rawTitle.match(/^(.+?)\s+at\s+(.+)$/i)
    if (atMatch) {
      title = atMatch[1].trim()
      company = atMatch[2].trim()
    }

    // Store RSS description temporarily, will be replaced with full JD
    jobEntries.push({ title, company, link, pubDate, description: rssDescription })
  })

  let savedCount = 0
  let newCount = 0
  for (const job of jobEntries) {
    try {
      // Fetch full job description from the job page
      // RSS only contains meta info like "at Company - Full-Time - Worldwide"
      let description = job.description
      const fullDescription = await fetchJobDescription(job.link)
      if (fullDescription && fullDescription.length > (description?.length || 0)) {
        description = fullDescription
        console.log(`📄 Fetched full JD for: ${job.title} (${fullDescription.length} chars)`)
      }

      // Extract enhanced details from full description
      const experienceLevel = description ? detectExperienceLevel(description) : null
      const remoteType = detectRemoteType('Remote')

      const result = await validateAndSaveJob(
        {
          title: job.title,
          company: job.company,
          url: job.link,
          location: 'Remote',
          type: 'Full-time',
          category: 'Engineering',
          tags: [],
          source: 'remote3.co',
          region: 'Global',
          postedDate: job.pubDate ? new Date(job.pubDate) : new Date(),
          // Enhanced job details
          description,
          experienceLevel,
          remoteType: remoteType || 'Remote',
        },
        'remote3.co'
      )
      if (result.saved) savedCount++
      if (result.isNew) newCount++

      // Rate limiting to avoid being blocked
      await delay(500)
    } catch (error) {
      console.error('Error saving Remote3 job:', error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'remote3.co',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Remote3.co (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
