import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

export async function crawlRocketPunch(): Promise<number> {
  console.log('🚀 Starting 로켓펀치 crawler...')

  const baseUrl = 'https://www.rocketpunch.com'
  const $ = await fetchHTML(baseUrl + '/jobs?keywords=블록체인,web3,암호화폐')

  if (!$) {
    console.error('❌ Failed to fetch 로켓펀치')
    return 0
  }

  const jobs: any[] = []

  $('.job-listing, .job-card, [class*="job"]').each((_, element) => {
    try {
      const $el = $(element)

      const title = cleanText($el.find('.job-title, h4, [class*="title"]').first().text())
      const company = cleanText($el.find('.company-name, [class*="company"]').first().text())
      const location = cleanText($el.find('.location, [class*="location"]').first().text()) || '서울'
      const type = cleanText($el.find('.type, [class*="type"]').first().text()) || '정규직'

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
          tags: ['블록체인', 'Web3'],
          postedDate: new Date(),
        })
      }
    } catch (error) {
      console.error('Error parsing job:', error)
    }
  })

  console.log(`📦 Found ${jobs.length} jobs from 로켓펀치`)

  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        { title: job.title, company: job.company, url: job.url, location: job.location, type: job.type, category: job.category, tags: job.tags, source: 'rocketpunch.com', region: 'Korea', postedDate: job.postedDate },
        'rocketpunch.com'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'rocketpunch.com',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from 로켓펀치`)
  return savedCount
}
