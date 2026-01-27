import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText } from '../utils'

export async function crawlJobKorea(): Promise<number> {
  console.log('🚀 Starting 잡코리아 crawler...')

  const baseUrl = 'https://www.jobkorea.co.kr'
  const $ = await fetchHTML(baseUrl + '/Search/?stext=web3')

  if (!$) {
    console.error('❌ Failed to fetch 잡코리아')
    return 0
  }

  // JobKorea may use __NEXT_DATA__ or server-rendered HTML
  // Try __NEXT_DATA__ first
  const nextDataScript = $('script#__NEXT_DATA__').html()

  const jobs: { title: string; company: string; location: string; type: string; url: string }[] = []

  if (nextDataScript) {
    try {
      const nextData = JSON.parse(nextDataScript)
      const pageProps = nextData?.props?.pageProps

      // Navigate common JobKorea data structures
      const jobList = pageProps?.jobs || pageProps?.searchResult?.jobs ||
        pageProps?.data?.list || pageProps?.recruitList || []

      for (const job of jobList) {
        const title = job.title || job.jobName || job.recruitTitle || ''
        const company = job.company?.name || job.companyName || job.corpName || ''
        const location = job.location || job.workPlace || job.locationName || '서울'
        const type = job.employmentType || job.employment || job.type || '정규직'

        let url = job.url || job.detailUrl || ''
        if (url && !url.startsWith('http')) {
          url = baseUrl + url
        }

        if (title && company && url) {
          jobs.push({ title, company, location, type, url })
        }
      }
    } catch (error) {
      console.error('Failed to parse __NEXT_DATA__, falling back to HTML:', error)
    }
  }

  // Fallback: try parsing React Server Components (__next_f) or rendered HTML
  if (jobs.length === 0) {
    // Try RSC payload from inline scripts
    const scripts: string[] = []
    $('script').each((_, el) => {
      const text = $(el).html() || ''
      if (text.includes('self.__next_f') || text.includes('recruitTitle') || text.includes('jobName')) {
        scripts.push(text)
      }
    })

    for (const scriptText of scripts) {
      // RSC payloads often contain JSON objects within push() calls
      const jsonMatches = scriptText.matchAll(/"title"\s*:\s*"([^"]+)"[^}]*"company[Nn]ame?"\s*:\s*"([^"]+)"/g)
      for (const match of jsonMatches) {
        jobs.push({
          title: match[1],
          company: match[2],
          location: '서울',
          type: '정규직',
          url: `${baseUrl}/Search/?stext=web3`,
        })
      }
    }

    // Final fallback: try common JobKorea HTML selectors
    if (jobs.length === 0) {
      $('.list-default .list-item, .recruit-info, .post-list-info').each((_, element) => {
        const $el = $(element)
        const title = cleanText($el.find('.information-title-link, .title, a.title').first().text())
        const company = cleanText($el.find('.corp-name a, .company-name, .name').first().text())
        const location = cleanText($el.find('.chip-information-group .chip-information-item:nth-child(1), .option .loc').first().text()) || '서울'
        const type = cleanText($el.find('.chip-information-group .chip-information-item:nth-child(2), .option .type').first().text()) || '정규직'

        let url = $el.find('a').first().attr('href') || ''
        if (url && !url.startsWith('http')) {
          url = baseUrl + url
        }

        if (title && company && url) {
          jobs.push({ title, company, location, type, url })
        }
      })
    }
  }

  console.log(`📦 Found ${jobs.length} jobs from 잡코리아`)

  let savedCount = 0
  for (const job of jobs) {
    try {
      const saved = await validateAndSaveJob(
        {
          title: job.title,
          company: job.company,
          url: job.url,
          location: job.location,
          type: job.type,
          category: 'Engineering',
          tags: ['Web3', '블록체인'],
          source: 'jobkorea.co.kr',
          region: 'Korea',
          postedDate: new Date(),
        },
        'jobkorea.co.kr'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error('Error saving 잡코리아 job:', error)
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
