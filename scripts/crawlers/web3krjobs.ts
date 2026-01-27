import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

export async function crawlWeb3KRJobs(): Promise<number> {
  console.log('🚀 Starting Web3 KR Jobs crawler...')

  const baseUrl = 'https://www.web3kr.jobs'
  const $ = await fetchHTML(baseUrl)

  if (!$) {
    console.error('❌ Failed to fetch Web3 KR Jobs')
    return 0
  }

  const jobs: any[] = []

  // Web3 KR Jobs 구조 파싱
  $('.job-listing, .job-card, [class*="job"]').each((_, element) => {
    try {
      const $el = $(element)

      const title = cleanText($el.find('.job-title, h2, h3').first().text())
      const company = cleanText($el.find('.company-name, .company').first().text())
      const location = cleanText($el.find('.location').first().text()) || '서울'
      const type = cleanText($el.find('.job-type').first().text()) || '정규직'

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

  console.log(`📦 Found ${jobs.length} jobs from Web3 KR Jobs`)

  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        { title: job.title, company: job.company, url: job.url, location: job.location, type: job.type, category: job.category, tags: job.tags, source: 'web3kr.jobs', region: 'Korea', postedDate: job.postedDate },
        'web3kr.jobs'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'web3kr.jobs',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Web3 KR Jobs`)
  return savedCount
}
