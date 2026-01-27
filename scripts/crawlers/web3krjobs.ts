import puppeteer from 'puppeteer'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay } from '../utils'

export async function crawlWeb3KRJobs(): Promise<number> {
  console.log('🚀 Starting Web3 KR Jobs crawler...')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

    await page.goto('https://www.web3kr.jobs', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Notion-based sites need extra time to render
    await delay(3000)

    // Wait for Notion content
    await page.waitForSelector('.notion-page-content, .notion-collection-card, [class*="notion"]', { timeout: 15000 }).catch(() => {
      console.log('⚠️  Notion content selector timeout, proceeding with available content')
    })

    // Extract jobs from the rendered Notion page
    const jobs = await page.evaluate(() => {
      const results: { title: string; company: string; url: string }[] = []

      // Notion sites use structural selectors — hashed class names change on deploy
      // Strategy: find links that look like job postings

      // Try Notion collection/database view (table or gallery)
      const collectionCards = document.querySelectorAll(
        '.notion-collection-card, [class*="collection-card"], .notion-table-row'
      )

      collectionCards.forEach((card) => {
        const linkEl = card.querySelector('a[href]') as HTMLAnchorElement | null
        const titleEl = card.querySelector('[class*="title"], [class*="property-title"], .notion-page-title-text')
        const companyEl = card.querySelector('[class*="company"], [class*="property"]:nth-child(2)')

        const title = titleEl?.textContent?.trim() || linkEl?.textContent?.trim() || ''
        const company = companyEl?.textContent?.trim() || ''
        const url = linkEl?.href || ''

        if (title && url) {
          results.push({ title, company: company || 'Unknown', url })
        }
      })

      // Fallback: scan all links on the Notion page for job-like content
      if (results.length === 0) {
        const allLinks = document.querySelectorAll('.notion-page-content a[href], [class*="notion"] a[href]')
        const seen = new Set<string>()

        allLinks.forEach((link) => {
          const anchor = link as HTMLAnchorElement
          const text = anchor.textContent?.trim() || ''
          const href = anchor.href

          // Skip navigation/header links, empty links, and duplicates
          if (!text || text.length < 5 || seen.has(href)) return
          if (href.includes('#') && !href.includes('http')) return
          seen.add(href)

          results.push({ title: text, company: 'Unknown', url: href })
        })
      }

      // Final fallback: any visible text blocks that look like job titles
      if (results.length === 0) {
        const pageContent = document.querySelector('.notion-page-content, [class*="notion-page"]')
        if (pageContent) {
          const blocks = pageContent.querySelectorAll('a[href]')
          blocks.forEach((block) => {
            const anchor = block as HTMLAnchorElement
            const text = anchor.textContent?.trim() || ''
            if (text && text.length > 5 && anchor.href) {
              results.push({ title: text, company: 'Unknown', url: anchor.href })
            }
          })
        }
      }

      return results
    })

    console.log(`📦 Found ${jobs.length} jobs from Web3 KR Jobs`)

    let savedCount = 0
    for (const job of jobs) {
      try {
        const saved = await validateAndSaveJob(
          {
            title: job.title,
            company: job.company,
            url: job.url,
            location: '서울',
            type: '정규직',
            category: 'Engineering',
            tags: ['Web3', '블록체인'],
            source: 'web3kr.jobs',
            region: 'Korea',
            postedDate: new Date(),
          },
          'web3kr.jobs'
        )
        if (saved) savedCount++
        await delay(100)
      } catch (error) {
        console.error('Error saving Web3 KR job:', error)
      }
    }

    await supabase.from('CrawlLog').insert({
      source: 'web3kr.jobs',
      status: 'success',
      jobCount: savedCount,
      createdAt: new Date().toISOString(),
    })

    console.log(`✅ Saved ${savedCount} jobs from Web3 KR Jobs`)
    return savedCount
  } catch (error) {
    console.error('❌ Web3 KR Jobs crawler error:', error)

    await supabase.from('CrawlLog').insert({
      source: 'web3kr.jobs',
      status: 'failed',
      jobCount: 0,
      createdAt: new Date().toISOString(),
    })

    return 0
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
