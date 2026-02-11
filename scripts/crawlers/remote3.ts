import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchXML, delay, cleanText, detectExperienceLevel, detectRemoteType } from '../utils'

interface CrawlerReturn {
  total: number
  new: number
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
    // RSS feeds typically have description or content:encoded
    const description = cleanText($item.find('description').text())
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

    jobEntries.push({ title, company, link, pubDate, description })
  })

  let savedCount = 0
  let newCount = 0
  for (const job of jobEntries) {
    try {
      // Extract enhanced details
      const experienceLevel = job.description ? detectExperienceLevel(job.description) : null
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
          description: job.description,
          experienceLevel,
          remoteType: remoteType || 'Remote',
        },
        'remote3.co'
      )
      if (result.saved) savedCount++
      if (result.isNew) newCount++
      await delay(100)
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
