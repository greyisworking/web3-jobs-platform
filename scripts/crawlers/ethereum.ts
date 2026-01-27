import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

export async function crawlEthereumJobs(): Promise<number> {
  console.log('🚀 Starting Ethereum Foundation Jobs crawler...')

  const baseUrl = 'https://jobs.ashbyhq.com'
  const $ = await fetchHTML(baseUrl + '/ethereum-foundation')

  if (!$) {
    console.error('❌ Failed to fetch Ethereum Foundation Jobs')
    return 0
  }

  const jobs: any[] = []

  $('.job-listing, [class*="job"], [class*="JobsList"]').each((_, element) => {
    try {
      const $el = $(element)

      const title = cleanText($el.find('.job-title, h3, [class*="title"]').first().text())
      const company = 'Ethereum Foundation'
      const location = cleanText($el.find('.location, [class*="location"]').first().text()) || 'Remote'
      const type = 'Full-time'

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
          tags: ['Ethereum', 'Blockchain', 'Layer 1'],
          postedDate: new Date(),
        })
      }
    } catch (error) {
      console.error('Error parsing job:', error)
    }
  })

  console.log(`📦 Found ${jobs.length} jobs from Ethereum Foundation`)

  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        { title: job.title, company: job.company, url: job.url, location: job.location, type: job.type, category: job.category, tags: job.tags, source: 'ethereum.foundation', region: 'Global', postedDate: job.postedDate },
        'ethereum.foundation'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'ethereum.foundation',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Ethereum Foundation`)
  return savedCount
}
