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
  let allJobs: JobData[] = []

  // Crawl first 3 pages
  for (let page = 1; page <= 3; page++) {
    const pageUrl = page === 1 ? `${baseUrl}/web3-jobs` : `${baseUrl}/web3-jobs?page=${page}`
    const $ = await fetchHTML(pageUrl)

    if (!$) {
      console.error(`❌ Failed to fetch Web3.career page ${page}`)
      continue
    }

    // web3.career uses a <table> with tr.table_row for each job
    // Structure per row: 6 <td> cells
    //   td[0]: title (h2) + company (h3) + logo
    //   td[1]: company name (td.job-location-mobile)
    //   td[2]: posted time
    //   td[3]: location (td.job-location-mobile)
    //   td[4]: salary
    //   td[5]: tag text
    // Some rows are ads (no data-jobid) — skip those
    $('tr.table_row').each((_, element) => {
      try {
        const $row = $(element)

        // Skip ad/promo rows that have no job ID
        const jobId = $row.attr('data-jobid')
        if (!jobId) return

        const title = cleanText($row.find('h2').first().text())
        const company = cleanText($row.find('h3').first().text())

        let href = $row.find('a[data-jobid]').first().attr('href') || ''
        if (href && !href.startsWith('http')) {
          href = baseUrl + href
        }

        if (!title || !href) return

        // Location is in the second td.job-location-mobile
        const locationTds = $row.find('td.job-location-mobile')
        const location = cleanText(locationTds.eq(1).text()) || 'Remote'

        // Salary is in td[4] (5th cell)
        const allTds = $row.find('td')
        const salaryText = cleanText(allTds.eq(4).text())
        const salary = salaryText && salaryText.includes('$') ? salaryText : undefined

        // Tags from span.my-badge
        const tags: string[] = []
        $row.find('span.my-badge').each((_, badge) => {
          const tag = cleanText($(badge).text())
          if (tag) tags.push(tag)
        })

        allJobs.push({
          title,
          company: company || 'Unknown',
          location,
          type: 'Full-time',
          category: 'Engineering',
          url: href,
          salary,
          tags,
          postedDate: new Date(),
        })
      } catch (error) {
        console.error('Error parsing Web3.career job:', error)
      }
    })

    await delay(500) // Rate limit between pages
  }

  console.log(`📦 Found ${allJobs.length} jobs from Web3.career`)

  let savedCount = 0
  for (const job of allJobs) {
    try {
      const saved = await validateAndSaveJob(
        {
          title: job.title,
          company: job.company,
          url: job.url,
          location: job.location,
          type: job.type,
          category: job.category,
          salary: job.salary,
          tags: job.tags,
          source: 'web3.career',
          region: 'Global',
          postedDate: job.postedDate,
        },
        'web3.career'
      )
      if (saved) savedCount++
      await delay(100)
    } catch (error) {
      console.error(`Error saving job ${job.url}:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'web3.career',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Web3.career`)
  return savedCount
}
