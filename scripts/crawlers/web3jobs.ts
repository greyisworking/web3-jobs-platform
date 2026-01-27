import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

export async function crawlWeb3Jobs(): Promise<number> {
  console.log('🚀 Starting Web3Jobs crawler...')

  const baseUrl = 'https://web3jobs.cc'
  const $ = await fetchHTML(baseUrl)

  if (!$) {
    console.error('❌ Failed to fetch Web3Jobs')
    return 0
  }

  const jobs: any[] = []

  // Web3Jobs 구조 파싱
  $('.job-card, .job-item, [class*="JobCard"]').each((_, element) => {
    try {
      const $el = $(element)

      const title = cleanText($el.find('.job-title, h2, h3, [class*="title"]').first().text())
      const company = cleanText($el.find('.company, [class*="company"]').first().text())
      const location = cleanText($el.find('.location, [class*="location"]').first().text()) || 'Remote'
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

  console.log(`📦 Found ${jobs.length} jobs from Web3Jobs`)

  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        { title: job.title, company: job.company, url: job.url, location: job.location, type: job.type, category: job.category, tags: job.tags, source: 'web3jobs.cc', region: 'Global', postedDate: job.postedDate },
        'web3jobs.cc'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'web3jobs.cc',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Web3Jobs`)
  return savedCount
}
