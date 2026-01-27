import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

export async function crawlSuiJobs(): Promise<number> {
  console.log('🚀 Starting Sui Jobs crawler...')

  const baseUrl = 'https://jobs.sui.io'
  const $ = await fetchHTML(baseUrl + '/jobs')

  if (!$) {
    console.error('❌ Failed to fetch Sui Jobs')
    return 0
  }

  const jobs: any[] = []

  $('.job-listing, [class*="job"], [class*="position"]').each((_, element) => {
    try {
      const $el = $(element)

      const title = cleanText($el.find('.job-title, h3, [class*="title"]').first().text())
      const company = 'Sui Foundation'
      const location = cleanText($el.find('.location, [class*="location"]').first().text()) || 'Remote'
      const type = cleanText($el.find('.type, [class*="type"]').first().text()) || 'Full-time'

      let url = $el.find('a').first().attr('href') || ''
      if (url && !url.startsWith('http')) {
        url = baseUrl + url
      }

      if (title && url) {
        jobs.push({
          title,
          company,
          location,
          type,
          category: 'Engineering',
          url,
          tags: ['Sui', 'Blockchain', 'Layer 1'],
          postedDate: new Date(),
        })
      }
    } catch (error) {
      console.error('Error parsing job:', error)
    }
  })

  console.log(`📦 Found ${jobs.length} jobs from Sui Jobs`)

  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        { title: job.title, company: job.company, url: job.url, location: job.location, type: job.type, category: job.category, tags: job.tags, source: 'jobs.sui.io', region: 'Global', postedDate: job.postedDate },
        'jobs.sui.io'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'jobs.sui.io',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Sui Jobs`)
  return savedCount
}
