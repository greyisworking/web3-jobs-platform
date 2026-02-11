import type { CheerioAPI } from 'cheerio'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText, extractHTML, parseSalary, detectExperienceLevel, detectRemoteType } from '../utils'
import { cleanDescriptionText } from '../../lib/clean-description'

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
  // Enhanced details
  description?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  experienceLevel?: string
  remoteType?: string
  companyLogo?: string
  companyWebsite?: string
}

/**
 * Fetch detailed job information from individual job page
 */
async function fetchJobDetails(jobUrl: string): Promise<Partial<JobData>> {
  const $ = await fetchHTML(jobUrl)
  if (!$) return {}

  const details: Partial<JobData> = {}

  try {
    // Job description - main content area
    const descriptionEl = $('.job-description, .job-content, [class*="description"], article')
    if (descriptionEl.length) {
      const raw = extractHTML(descriptionEl.first(), $)
      details.description = cleanDescriptionText(raw)
    }

    // Look for sections with common headers
    $('h2, h3, h4, strong').each((_, el) => {
      const header = cleanText($(el).text()).toLowerCase()
      const content = $(el).nextUntil('h2, h3, h4').text()

      if (header.includes('requirement') || header.includes('qualif') || header.includes('looking for') || header.includes('자격')) {
        details.requirements = cleanText(content)
      }
      if (header.includes('responsib') || header.includes('what you') || header.includes('duties') || header.includes('담당')) {
        details.responsibilities = cleanText(content)
      }
      if (header.includes('benefit') || header.includes('perk') || header.includes('offer') || header.includes('복리')) {
        details.benefits = cleanText(content)
      }
    })

    // Company logo
    const logoImg = $('img[src*="logo"], .company-logo img, .job-company img').first()
    if (logoImg.length) {
      const logoSrc = logoImg.attr('src')
      if (logoSrc && !logoSrc.includes('placeholder')) {
        details.companyLogo = logoSrc.startsWith('http') ? logoSrc : `https://web3.career${logoSrc}`
      }
    }

    // Company website
    const websiteLink = $('a[href*="company"], a:contains("website"), a:contains("Visit")').first()
    if (websiteLink.length) {
      const href = websiteLink.attr('href')
      if (href && href.startsWith('http') && !href.includes('web3.career')) {
        details.companyWebsite = href
      }
    }

    // Experience level detection
    const fullText = $('body').text()
    details.experienceLevel = detectExperienceLevel(fullText) || undefined
    details.remoteType = detectRemoteType(fullText) || undefined

  } catch (error) {
    console.error(`Error fetching details from ${jobUrl}:`, error)
  }

  return details
}

interface CrawlerReturn {
  total: number
  new: number
}

export async function crawlWeb3Career(): Promise<CrawlerReturn> {
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
  let newCount = 0
  for (const job of allJobs) {
    try {
      // Fetch detailed information from job page (rate limited)
      console.log(`  📄 Fetching details for: ${job.title}`)
      const details = await fetchJobDetails(job.url)
      await delay(300) // Rate limit detail page fetches

      // Parse salary if available
      const salaryInfo = parseSalary(job.salary)

      const result = await validateAndSaveJob(
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
          // Enhanced details
          description: details.description,
          requirements: details.requirements,
          responsibilities: details.responsibilities,
          benefits: details.benefits,
          salaryMin: salaryInfo.min,
          salaryMax: salaryInfo.max,
          salaryCurrency: salaryInfo.currency,
          experienceLevel: details.experienceLevel,
          remoteType: details.remoteType,
          companyLogo: details.companyLogo,
          companyWebsite: details.companyWebsite,
        },
        'web3.career'
      )
      if (result.saved) savedCount++
      if (result.isNew) newCount++
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

  console.log(`✅ Saved ${savedCount} jobs from Web3.career (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
