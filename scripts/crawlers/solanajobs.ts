import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

export async function crawlSolanaJobs(): Promise<number> {
  console.log('🚀 Starting Solana Jobs crawler...')

  const baseUrl = 'https://jobs.solana.com'
  const $ = await fetchHTML(baseUrl + '/jobs')

  if (!$) {
    console.error('❌ Failed to fetch Solana Jobs')
    return 0
  }

  const jobs: any[] = []

  $('.job-listing, [class*="job"], [class*="position"]').each((_, element) => {
    try {
      const $el = $(element)

      const title = cleanText($el.find('.job-title, h3, [class*="title"]').first().text())
      const company = cleanText($el.find('.company, [class*="company"]').first().text()) || 'Solana Foundation'
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
          tags: ['Solana', 'Blockchain', 'Layer 1'],
          postedDate: new Date(),
        })
      }
    } catch (error) {
      console.error('Error parsing job:', error)
    }
  })

  console.log(`📦 Found ${jobs.length} jobs from Solana Jobs`)

  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        { title: job.title, company: job.company, url: job.url, location: job.location, type: job.type, category: job.category, tags: job.tags, source: 'jobs.solana.com', region: 'Global', postedDate: job.postedDate },
        'jobs.solana.com'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'jobs.solana.com',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Solana Jobs`)
  return savedCount
}
