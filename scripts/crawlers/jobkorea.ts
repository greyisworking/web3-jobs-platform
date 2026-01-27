import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

export async function crawlJobKorea(): Promise<number> {
  console.log('🚀 Starting 잡코리아 crawler...')

  const baseUrl = 'https://www.jobkorea.co.kr'
  const $ = await fetchHTML(baseUrl + '/Search/?stext=web3.0')

  if (!$) {
    console.error('❌ Failed to fetch 잡코리아')
    return 0
  }

  const jobs: any[] = []

  $('.recruit-info, .list-default, [class*="recruit"]').each((_, element) => {
    try {
      const $el = $(element)

      const title = cleanText($el.find('.recruit-title, [class*="title"]').first().text())
      const company = cleanText($el.find('.corp-name, [class*="corp"]').first().text())
      const location = cleanText($el.find('.option, [class*="location"]').first().text()) || '서울'
      const type = cleanText($el.find('.employment, [class*="type"]').first().text()) || '정규직'

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
          tags: ['Web3.0', '블록체인'],
          postedDate: new Date(),
        })
      }
    } catch (error) {
      console.error('Error parsing job:', error)
    }
  })

  console.log(`📦 Found ${jobs.length} jobs from 잡코리아`)

  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        { title: job.title, company: job.company, url: job.url, location: job.location, type: job.type, category: job.category, tags: job.tags, source: 'jobkorea.co.kr', region: 'Korea', postedDate: job.postedDate },
        'jobkorea.co.kr'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'jobkorea.co.kr',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from 잡코리아`)
  return savedCount
}
