import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

export async function crawlRemoteOK(): Promise<number> {
  console.log('🚀 Starting RemoteOK crawler...')

  const baseUrl = 'https://remoteok.com'
  const $ = await fetchHTML(baseUrl + '/remote-web3-jobs')

  if (!$) {
    console.error('❌ Failed to fetch RemoteOK')
    return 0
  }

  const jobs: any[] = []

  $('tr.job, [class*="job"]').each((_, element) => {
    try {
      const $el = $(element)

      const title = cleanText($el.find('.job-title, h2, [itemprop="title"]').first().text())
      const company = cleanText($el.find('.company, h3, [itemprop="name"]').first().text())
      const location = 'Remote'
      const type = 'Full-time'
      const salary = cleanText($el.find('.salary, [class*="salary"]').first().text())

      let url = $el.find('a').first().attr('href') || ''
      if (url && url.startsWith('/')) {
        url = baseUrl + url
      }

      if (title && company && url && url.includes('http')) {
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

  console.log(`📦 Found ${jobs.length} jobs from RemoteOK`)

  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        { title: job.title, company: job.company, url: job.url, location: job.location, type: job.type, category: job.category, salary: job.salary, tags: job.tags, source: 'remoteok.com', region: 'Global', postedDate: job.postedDate },
        'remoteok.com'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'remoteok.com',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from RemoteOK`)
  return savedCount
}
