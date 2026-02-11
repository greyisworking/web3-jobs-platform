import puppeteer from 'puppeteer'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay } from '../utils'

interface CrawlerReturn {
  total: number
  new: number
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
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

    await page.goto('https://www.rocketpunch.com/jobs?keywords=블록체인+web3', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Wait for job cards to render
    await page.waitForSelector('.company-name, .job-title, [class*="job-card"]', { timeout: 10000 }).catch(() => {
      console.log('⚠️  Selector timeout, proceeding with available content')
    })

    // Extract job data from the rendered DOM
    const jobs = await page.evaluate(() => {
      const results: { title: string; company: string; location: string; type: string; url: string }[] = []

      // RocketPunch job card structure
      const jobCards = document.querySelectorAll('.job-card-container, .job-item, [class*="content-item"]')

      jobCards.forEach((card) => {
        const titleEl = card.querySelector('.job-title a, h4 a, .position a')
        const companyEl = card.querySelector('.company-name a, .company a, .name a')
        const locationEl = card.querySelector('.location, .job-stat-info .location, [class*="location"]')
        const typeEl = card.querySelector('.job-stat-info .type, [class*="employment"]')

        const title = titleEl?.textContent?.trim() || ''
        const company = companyEl?.textContent?.trim() || ''
        const location = locationEl?.textContent?.trim() || '서울'
        const type = typeEl?.textContent?.trim() || '정규직'

        let url = (titleEl as HTMLAnchorElement)?.href || (card.querySelector('a') as HTMLAnchorElement)?.href || ''

        if (title && company && url) {
          results.push({ title, company, location, type, url })
        }
      })

      // Fallback: try alternate selectors if above yields nothing
      if (results.length === 0) {
        const rows = document.querySelectorAll('.company-jobs-item, .job-list-item, [data-job-id]')
        rows.forEach((row) => {
          const title = row.querySelector('h4, .title, .job-title')?.textContent?.trim() || ''
          const company = row.querySelector('.company-name, .corp-name')?.textContent?.trim() || ''
          const link = row.querySelector('a')
          const url = (link as HTMLAnchorElement)?.href || ''

          if (title && url) {
            results.push({ title, company: company || 'Unknown', location: '서울', type: '정규직', url })
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
        const result = await validateAndSaveJob(
          {
            title: job.title,
            company: job.company,
            url: job.url,
            location: job.location,
            type: job.type,
            category: 'Engineering',
            tags: ['블록체인', 'Web3'],
            source: 'rocketpunch.com',
            region: 'Korea',
            postedDate: new Date(),
          },
          'rocketpunch.com'
        )
        if (result.saved) savedCount++
        if (result.isNew) newCount++
        await delay(100)
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
