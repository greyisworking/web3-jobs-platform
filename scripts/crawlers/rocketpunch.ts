import puppeteer, { Page } from 'puppeteer'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay } from '../utils'
import { translateLocation, translateTags } from '../../lib/translation'

interface CrawlerReturn {
  total: number
  new: number
}

interface JobListing {
  title: string
  company: string
  location: string
  type: string
  url: string
}

/**
 * Fetch job description from detail page
 */
async function fetchJobDescription(page: Page, url: string): Promise<string | null> {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 })

    // Wait for job description to load
    await page.waitForSelector('.description, .job-description, [class*="description"], .content', { timeout: 5000 }).catch(() => {})

    const description = await page.evaluate(() => {
      // Try multiple selectors for job description
      const selectors = [
        '.job-description',
        '.description-wrapper',
        '.job-content',
        '#job-description',
        '[class*="job-description"]',
        '.content-description',
        // 로켓펀치 specific selectors
        '.job-detail .description',
        '.duty-description',
        '.job-duty',
        '.job-content-wrapper',
        'section.description',
        // Fallback: main content area
        'article .content',
        '.main-content .description',
      ]

      for (const selector of selectors) {
        const el = document.querySelector(selector)
        if (el) {
          const text = el.textContent?.trim() || ''
          if (text.length > 50) {
            return text
          }
        }
      }

      // Last fallback: look for any large text block in main area
      const mainContent = document.querySelector('main, .main, article, .job-detail')
      if (mainContent) {
        const paragraphs = mainContent.querySelectorAll('p, li, div')
        let combined = ''
        paragraphs.forEach(p => {
          const text = p.textContent?.trim() || ''
          if (text.length > 20 && text.length < 2000) {
            combined += text + '\n'
          }
        })
        if (combined.length > 100) {
          return combined.slice(0, 5000)
        }
      }

      return null
    })

    return description
  } catch (error) {
    return null
  }
}

export async function crawlRocketPunch(): Promise<CrawlerReturn> {
  console.log('🚀 Starting 로켓펀치 crawler...')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // Search for blockchain/web3 jobs
    await page.goto('https://www.rocketpunch.com/jobs?keywords=블록체인+web3', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Wait for job cards to render
    await page.waitForSelector('.company-name, .job-title, [class*="job-card"], .job-item', { timeout: 10000 }).catch(async () => {
      console.log('⚠️  Selector timeout, dumping page HTML for debugging...')
      try {
        const bodyHtml = await page.evaluate(() => document.querySelector('body')?.innerHTML?.substring(0, 3000) || 'empty body')
        console.log('🔍 Page HTML (first 3000 chars):\n', bodyHtml)
      } catch (e) {
        console.log('⚠️  Could not capture page HTML')
      }
    })

    // Extract job data from the rendered DOM
    const jobs = await page.evaluate(() => {
      const results: JobListing[] = []

      // RocketPunch job card structure
      const jobCards = document.querySelectorAll('.job-card-container, .job-item, [class*="content-item"], .company-jobs-item')

      jobCards.forEach((card) => {
        const titleEl = card.querySelector('.job-title a, h4 a, .position a, a.job-title')
        const companyEl = card.querySelector('.company-name a, .company a, .name a, a.company')
        const locationEl = card.querySelector('.location, .job-stat-info .location, [class*="location"]')
        const typeEl = card.querySelector('.job-stat-info .type, [class*="employment"], .job-type')

        const title = titleEl?.textContent?.trim() || ''
        const company = companyEl?.textContent?.trim() || ''
        const location = locationEl?.textContent?.trim() || 'Seoul'
        const type = typeEl?.textContent?.trim() || 'Full-time'

        let url = (titleEl as HTMLAnchorElement)?.href || (card.querySelector('a') as HTMLAnchorElement)?.href || ''

        if (title && company && url) {
          results.push({ title, company, location, type, url })
        }
      })

      // Fallback: try alternate selectors if above yields nothing
      if (results.length === 0) {
        const rows = document.querySelectorAll('.company-jobs-item, .job-list-item, [data-job-id], .job-card')
        rows.forEach((row) => {
          const title = row.querySelector('h4, .title, .job-title')?.textContent?.trim() || ''
          const company = row.querySelector('.company-name, .corp-name')?.textContent?.trim() || ''
          const link = row.querySelector('a')
          const url = (link as HTMLAnchorElement)?.href || ''

          if (title && url) {
            results.push({ title, company: company || 'Unknown', location: 'Seoul', type: 'Full-time', url })
          }
        })
      }

      // Fallback 2: scan all links matching /jobs/ pattern
      if (results.length === 0) {
        const allLinks = document.querySelectorAll('a[href*="/jobs/"]')
        allLinks.forEach((link) => {
          const url = (link as HTMLAnchorElement)?.href || ''
          const title = link.textContent?.trim() || ''
          // Skip nav/header links (too short or generic)
          if (title && title.length > 5 && url && !url.includes('/jobs?')) {
            const parentCard = link.closest('div, li, article, section')
            const company = parentCard?.querySelector('.company-name, .corp-name, [class*="company"]')?.textContent?.trim() || 'Unknown'
            results.push({ title, company, location: 'Seoul', type: 'Full-time', url })
          }
        })
      }

      return results
    })

    console.log(`📦 Found ${jobs.length} jobs from 로켓펀치`)

    let savedCount = 0
    let newCount = 0

    for (const job of jobs) {
      try {
        // Fetch job description from detail page
        console.log(`  📄 Fetching JD: ${job.title.slice(0, 40)}...`)
        const description = await fetchJobDescription(page, job.url)

        if (description) {
          console.log(`    ✅ Got description (${description.length} chars)`)
        } else {
          console.log(`    ⚠️  No description found`)
        }

        await delay(500)  // Rate limit for Korean site

        const result = await validateAndSaveJob(
          {
            title: job.title,
            company: job.company,
            url: job.url,
            location: translateLocation(job.location),
            type: job.type,
            category: 'Engineering',
            tags: translateTags(['Blockchain', 'Web3', 'Korea']),
            source: 'rocketpunch.com',
            region: 'Korea',
            postedDate: new Date(),
            description: description || undefined,
          },
          'rocketpunch.com'
        )
        if (result.saved) savedCount++
        if (result.isNew) newCount++
      } catch (error) {
        console.error('Error saving 로켓펀치 job:', error)
      }
    }

    await supabase.from('CrawlLog').insert({
      source: 'rocketpunch.com',
      status: 'success',
      jobCount: savedCount,
      createdAt: new Date().toISOString(),
    })

    console.log(`✅ Saved ${savedCount} jobs from 로켓펀치 (${newCount} new)`)
    return { total: savedCount, new: newCount }
  } catch (error) {
    console.error('❌ RocketPunch crawler error:', error)

    await supabase.from('CrawlLog').insert({
      source: 'rocketpunch.com',
      status: 'failed',
      jobCount: 0,
      createdAt: new Date().toISOString(),
    })

    return { total: 0, new: 0 }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
