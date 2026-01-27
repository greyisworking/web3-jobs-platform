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

  // Extract __NEXT_DATA__ JSON from the page
  const nextDataScript = $('script#__NEXT_DATA__').html()
  if (!nextDataScript) {
    console.error('❌ Could not find __NEXT_DATA__ script tag on CryptoJobsList')
    return 0
  }

  let pageProps: any
  try {
    const nextData = JSON.parse(nextDataScript)
    pageProps = nextData?.props?.pageProps
  } catch (error) {
    console.error('❌ Failed to parse __NEXT_DATA__ JSON:', error)
    return 0
  }

  if (!pageProps) {
    console.error('❌ No pageProps found in __NEXT_DATA__')
    return 0
  }

  // Jobs may be at pageProps.jobs, pageProps.initialJobs, or similar
  const jobsArray: any[] = pageProps.jobs || pageProps.initialJobs || pageProps.data?.jobs || []

  console.log(`📦 Found ${jobsArray.length} jobs from CryptoJobsList`)

  let savedCount = 0
  for (const job of jobsArray) {
    try {
      const title = job.title || job.name
      if (!title) continue

      const companyName = job.company?.name || job.companyName || job.company || 'Unknown'

      let jobUrl: string
      if (job.url && job.url.startsWith('http')) {
        jobUrl = job.url
      } else if (job.slug) {
        jobUrl = `${baseUrl}/jobs/${job.slug}`
      } else if (job.id) {
        jobUrl = `${baseUrl}/jobs/${job.id}`
      } else {
        continue
      }

      const location = job.location || job.locationName || 'Remote'
      const tags: string[] = Array.isArray(job.tags)
        ? job.tags.map((t: any) => typeof t === 'string' ? t : t.name || t.label || '').filter(Boolean)
        : []

      const saved = await validateAndSaveJob(
        {
          title,
          company: companyName,
          url: jobUrl,
          location: typeof location === 'string' ? location : 'Remote',
          type: job.type || job.employmentType || 'Full-time',
          category: job.category || 'Engineering',
          salary: job.salary || undefined,
          tags,
          source: 'cryptojobslist.com',
          region: 'Global',
          postedDate: job.createdAt ? new Date(job.createdAt) : new Date(),
        },
        'cryptojobslist.com'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error('Error saving CryptoJobsList job:', error)
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
