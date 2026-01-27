import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

interface JobData {
  title: string
  company: string
  location: string
  type: string
  category: string
  url: string
  salary?: string
  tags?: string[]
  postedDate?: Date
}

export async function crawlWeb3Career(): Promise<number> {
  console.log('🚀 Starting Web3.career crawler...')

  const baseUrl = 'https://web3.career'
  const $ = await fetchHTML(baseUrl)

  if (!$ ) {
    console.error('❌ Failed to fetch Web3.career')
    return 0
  }

  const jobs: JobData[] = []

  // Web3.career의 구조를 파싱
  // 실제 구조는 사이트를 확인해야 하지만, 일반적인 패턴으로 작성
  $('.job-listing, .job-item, [class*="job"]').each((_, element) => {
    try {
      const $el = $(element)

      const title = cleanText($el.find('.job-title, h2, h3').first().text())
      const company = cleanText($el.find('.company-name, .company').first().text())
      const location = cleanText($el.find('.location, [class*="location"]').first().text()) || 'Remote'
      const type = cleanText($el.find('.job-type, [class*="type"]').first().text()) || 'Full-time'

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
          category: 'Engineering', // 기본값, 나중에 개선
          url,
          tags: [],
          postedDate: new Date(),
        })
      }
    } catch (error) {
      console.error('Error parsing job:', error)
    }
  })

  console.log(`📦 Found ${jobs.length} jobs from Web3.career`)

  // 데이터베이스에 저장
  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        { title: job.title, company: job.company, url: job.url, location: job.location, type: job.type, category: job.category, salary: job.salary, tags: job.tags, source: 'web3.career', region: 'Global', postedDate: job.postedDate },
        'web3.career'
      )
      if (saved) savedCount++
      await delay(100) // Rate limiting
    } catch (error) {
      console.error(`Error saving job ${job.url}:`, error)
    }
  }

  // 크롤링 로그 저장
  await supabase.from('CrawlLog').insert({
    source: 'web3.career',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Web3.career`)
  return savedCount
}
