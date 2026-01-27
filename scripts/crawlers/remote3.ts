import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

export async function crawlRemote3(): Promise<number> {
  console.log('🚀 Starting Remote3.co crawler...')

  const baseUrl = 'https://remote3.co'
  const $ = await fetchHTML(baseUrl + '/jobs')

  if (!$) {
    console.error('❌ Failed to fetch Remote3.co')
    return 0
  }

  const jobs: any[] = []

  $('.job-card, .job-item, [class*="job"]').each((_, element) => {
    try {
      const $el = $(element)

      const title = cleanText($el.find('.job-title, h2, h3, [class*="title"]').first().text())
      const company = cleanText($el.find('.company, [class*="company"]').first().text())
      const location = 'Remote' // Remote3는 주로 원격
      const type = cleanText($el.find('.type, [class*="type"]').first().text()) || 'Full-time'

      let url = $el.find('a').first().attr('href') || ''
      if (url && !url.startsWith('http')) {
        url = baseUrl + url
      }

      if (title && company && url) {
        jobs.push({
          title,
          company,
          location,
          type,
          category: 'Engineering',
          url,
          tags: [],
          postedDate: new Date(),
        })
      }
    } catch (error) {
      console.error('Error parsing job:', error)
    }
  })

  console.log(`📦 Found ${jobs.length} jobs from Remote3.co`)

  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        { title: job.title, company: job.company, url: job.url, location: job.location, type: job.type, category: job.category, tags: job.tags, source: 'remote3.co', region: 'Global', postedDate: job.postedDate },
        'remote3.co'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'remote3.co',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Remote3.co`)
  return savedCount
}
