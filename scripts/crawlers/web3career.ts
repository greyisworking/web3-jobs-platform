import * as cheerio from 'cheerio'
import { chromium, Browser, Page } from 'playwright'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, cleanText, parseSalary, detectExperienceLevel, detectRemoteType, getRandomUserAgent, delayWithJitter, delay } from '../utils'
import { cleanDescriptionHtml } from '../../lib/clean-description'
import type { CrawlerReturn } from './platforms'

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

// Playwright browser instance (reused across requests)
let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    console.log('  🌐 Launching Playwright browser...')
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }
  return browser
}

async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
  }
}

/**
 * Fetch detailed job information using Playwright (bypasses Cloudflare)
 * Retries once on 403/timeout with 30s backoff.
 */
async function fetchJobDetailsWithPlaywright(jobUrl: string): Promise<Partial<JobData>> {
  const maxAttempts = 2

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let page: Page | null = null
    const details: Partial<JobData> = {}

    try {
      const b = await getBrowser()
      page = await b.newPage({
        userAgent: getRandomUserAgent(),
      })

      // Set browser-like headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      })

      // Navigate with timeout
      const response = await page.goto(jobUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      })

      // Check for 403 (CloudFront block)
      if (response && response.status() === 403) {
        throw new Error('CloudFront 403')
      }

      // Wait for content to render (Cloudflare challenge + JS rendering)
      await page.waitForTimeout(2000)

      // Get page content
      const html = await page.content()
      const $ = cheerio.load(html)

      // Remove UI noise elements before extraction
      $('nav, header, footer, aside, .apply-button, .job-actions, .share-buttons').remove()
      $('[class*="apply"], [class*="share"], [class*="action"], button').remove()
      $('script, style, noscript, iframe').remove()

      // Job description - try multiple selectors
      const descriptionSelectors = [
        '.job-description-content',
        '.job-detail-description',
        '[class*="JobDescription"]',
        '[class*="job-description"]',
        '.description-section',
        '.job-content',
        'article .content',
        'main .prose',
      ]

      for (const selector of descriptionSelectors) {
        const el = $(selector)
        if (el.length) {
          const html = el.first().html()
          if (html && html.length > 100) {
            details.description = cleanDescriptionHtml(html)
            break
          }
        }
      }

      // Fallback: get main content if no description found
      if (!details.description) {
        const mainContent = $('main').first()
        if (mainContent.length) {
          mainContent.find('nav, header, footer, [class*="sidebar"]').remove()
          const html = mainContent.html()
          if (html && html.length > 200) {
            details.description = cleanDescriptionHtml(html)
          }
        }
      }

      // Extract sections from headers
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

      // Experience level and remote type detection
      const fullText = $('body').text()
      details.experienceLevel = detectExperienceLevel(fullText) || undefined
      details.remoteType = detectRemoteType(fullText) || undefined

      await page.close()

      if (attempt > 1) {
        console.log(`    ✅ Detail attempt ${attempt} succeeded`)
      }
      return details

    } catch (error: any) {
      if (page) await page.close().catch(() => {})
      const msg = error.message || String(error)
      const isRetryable = msg.includes('403') || msg.includes('Timeout') || msg.includes('timeout')

      if (isRetryable && attempt < maxAttempts) {
        console.log(`    ⚠️ Detail ${msg} on attempt ${attempt}, retrying in 30s...`)
        await delay(30000)
        continue
      }

      console.log(`    ⚠️ Detail skipped (${msg}) after ${attempt} attempt(s)`)
      return details
    }
  }

  return {}
}

export async function crawlWeb3Career(): Promise<CrawlerReturn> {
  console.log('🚀 Starting Web3.career crawler (Playwright-enabled)...')

  const baseUrl = 'https://web3.career'
  let allJobs: JobData[] = []

  // Crawl first 3 pages using browser headers (with 1 retry on failure)
  for (let page = 1; page <= 3; page++) {
    const pageUrl = page === 1 ? `${baseUrl}/web3-jobs` : `${baseUrl}/web3-jobs?page=${page}`
    let $ = await fetchHTML(pageUrl, { useBrowserHeaders: true })

    if (!$) {
      console.log(`  ⚠️ web3.career: page ${page} failed on attempt 1, retrying in 30s...`)
      await delay(30000)
      $ = await fetchHTML(pageUrl, { useBrowserHeaders: true })
    }

    if (!$) {
      console.log(`  ⚠️ web3.career: page ${page} CloudFront 403 - skipped after 2 attempts`)
      continue
    }

    // web3.career uses a <table> with tr.table_row for each job
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

    // Rate limit with jitter between pages
    await delayWithJitter(1000, 500)
  }

  console.log(`📦 Found ${allJobs.length} jobs from Web3.career`)

  let savedCount = 0
  let newCount = 0
  let detailErrors = 0

  for (const job of allJobs) {
    try {
      // Fetch detailed information using Playwright
      console.log(`  📄 Fetching details for: ${job.title}`)
      const details = await fetchJobDetailsWithPlaywright(job.url)

      // Rate limit with jitter (3-5 seconds to avoid Cloudflare)
      await delayWithJitter(3000, 2000)

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

      // Track if we got description
      if (!details.description) {
        detailErrors++
      }
    } catch (error) {
      console.error(`Error saving job ${job.url}:`, error)
    }
  }

  // Cleanup browser
  await closeBrowser()

  await supabase.from('CrawlLog').insert({
    source: 'web3.career',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Web3.career (${newCount} new, ${detailErrors} without description)`)
  return { total: savedCount, new: newCount }
}
