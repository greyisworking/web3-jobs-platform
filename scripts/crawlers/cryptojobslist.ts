import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

export async function crawlCryptoJobsList(): Promise<number> {
  console.log('🚀 Starting CryptoJobsList crawler...')

  const baseUrl = 'https://cryptojobslist.com'
  const $ = await fetchHTML(baseUrl)

  if (!$) {
    console.error('❌ Failed to fetch CryptoJobsList')
    return 0
  }

  const jobs: any[] = []

  // CryptoJobsList 구조 파싱
  $('.job-tile, .job-listing, [class*="JobTile"]').each((_, element) => {
    try {
      const $el = $(element)

      const title = cleanText($el.find('.job-title, h2, h3, [class*="title"]').first().text())
      const company = cleanText($el.find('.company, [class*="company"]').first().text())
      const location = cleanText($el.find('.location, [class*="location"]').first().text()) || 'Remote'
      const type = cleanText($el.find('.type, [class*="type"]').first().text()) || 'Full-time'
      const salary = cleanText($el.find('.salary, [class*="salary"]').first().text())

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
          salary: salary || undefined,
          tags: [],
          postedDate: new Date(),
        })
      }
    } catch (error) {
      console.error('Error parsing job:', error)
    }
  })

  console.log(`📦 Found ${jobs.length} jobs from CryptoJobsList`)

  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        { title: job.title, company: job.company, url: job.url, location: job.location, type: job.type, category: job.category, salary: job.salary, tags: job.tags, source: 'cryptojobslist.com', region: 'Global', postedDate: job.postedDate },
        'cryptojobslist.com'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'cryptojobslist.com',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from CryptoJobsList`)
  return savedCount
}
