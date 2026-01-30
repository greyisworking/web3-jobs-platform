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

    // Oopy/Notion sites need extra time to render the database view
    await delay(5000)

    // Wait for content to appear — Oopy renders Notion databases as div-based tables
    await page.waitForSelector('a[href]', { timeout: 15000 }).catch(() => {
      console.log('⚠️  Content selector timeout, proceeding with available content')
    })

    const jobs = await page.evaluate(() => {
      const results: { title: string; company: string; url: string }[] = []
      const seen = new Set<string>()

      // ── Strategy 1: Header-based column mapping ──
      // The Oopy-rendered Notion table uses div-based rows.
      // Find the header row by searching for known Korean column headers.
      // Columns: 회사, 회사 타입, 코인&NFT 발행, 개발 직군 여부, 직군 유형, 경력, 포지션, 링크, 등록 시점, 상태
      try {
        let headerRow: Element | null = null

        // Walk all text nodes to find one containing "회사" as a standalone header
        const allElements = Array.from(document.querySelectorAll('*'))
        for (const el of allElements) {
          // A header cell: its own text (not children) is exactly "회사"
          if (el.children.length === 0 && el.textContent?.trim() === '회사') {
            // Walk up to the row (container with many sibling cells)
            let candidate = el.parentElement
            let depth = 0
            while (candidate && candidate.children.length < 5 && depth < 8) {
              candidate = candidate.parentElement
              depth++
            }
            if (candidate && candidate.children.length >= 5) {
              headerRow = candidate
              break
            }
          }
        }

        if (headerRow) {
          // Map column indices from header text
          const headerCells = Array.from(headerRow.children)
          const colMap: Record<string, number> = {}

          headerCells.forEach((cell, index) => {
            const text = cell.textContent?.trim() || ''
            if (text === '회사') colMap.company = index
            if (text === '포지션' || text.includes('포지션')) colMap.title = index
            if (text === '링크' || text.includes('링크')) colMap.link = index
          })

          // Find data rows — siblings of the header row in the same container
          const container = headerRow.parentElement
          if (container && colMap.company != null && colMap.title != null) {
            const allRows = Array.from(container.children)
            const dataRows = allRows.filter((r) => r !== headerRow)

            for (const row of dataRows) {
              const cells = Array.from(row.children)
              if (cells.length < 3) continue

              // Extract company from the company column
              const companyCell = cells[colMap.company]
              const company = companyCell?.textContent?.trim() || ''

              // Extract title from the title/position column
              const titleCell = cells[colMap.title]
              let title = ''
              if (titleCell) {
                // Prefer link text within the cell (Notion page link)
                const titleLink = titleCell.querySelector('a')
                title = titleLink?.textContent?.trim() || titleCell.textContent?.trim() || ''
              }

              // Extract apply URL from the link column
              let applyUrl = ''
              if (colMap.link != null) {
                const linkCell = cells[colMap.link]
                if (linkCell) {
                  const linkAnchor = linkCell.querySelector('a[href]') as HTMLAnchorElement | null
                  applyUrl = linkAnchor?.href || ''
                  // If no anchor, try cell text as URL
                  if (!applyUrl) {
                    const cellText = linkCell.textContent?.trim() || ''
                    if (cellText.startsWith('http')) applyUrl = cellText
                  }
                }
              }

              // Also check for Notion page link in the title cell as fallback URL
              if (!applyUrl && titleCell) {
                const pageLink = titleCell.querySelector('a[href]') as HTMLAnchorElement | null
                if (pageLink?.href) {
                  applyUrl = pageLink.href
                }
              }

              if (title && title.length >= 2 && !seen.has(title)) {
                seen.add(title)
                results.push({
                  title,
                  company: company || 'Unknown',
                  url: applyUrl || 'https://www.web3kr.jobs',
                })
              }
            }
          }
        }
      } catch (e) {
        // Strategy 1 failed, continue to fallback
      }

      // ── Strategy 2: Notion page links as job title anchors ──
      // In Oopy-rendered Notion, titles link to /uuid pages
      if (results.length === 0) {
        try {
          const allAnchors = Array.from(document.querySelectorAll('a[href]'))

          for (const anchor of allAnchors) {
            const href = anchor.getAttribute('href') || ''
            // Match Notion page UUID paths (32 hex chars with optional dashes)
            if (!/^\/[0-9a-f-]{20,}$/i.test(href)) continue

            const title = anchor.textContent?.trim() || ''
            if (!title || title.length < 3 || seen.has(title)) continue
            // Skip if the text looks like a URL
            if (title.startsWith('http')) continue
            seen.add(title)

            // Walk up to find the row container
            let row = anchor.parentElement
            let depth = 0
            while (row && row.children.length < 3 && depth < 10) {
              row = row.parentElement
              depth++
            }

            let company = 'Unknown'
            let applyUrl = ''

            if (row && row.children.length >= 3) {
              // First cell is typically company
              const firstCellText = row.children[0]?.textContent?.trim() || ''
              if (firstCellText && firstCellText !== title) {
                company = firstCellText
              }

              // Find external link (apply URL) in the same row
              const externalLinks = Array.from(row.querySelectorAll('a[href^="http"]'))
              for (const extLink of externalLinks) {
                const extHref = (extLink as HTMLAnchorElement).href
                if (extHref && !extHref.includes('web3kr.jobs')) {
                  applyUrl = extHref
                  break
                }
              }
            }

            results.push({
              title,
              company,
              url: applyUrl || `https://www.web3kr.jobs${href}`,
            })
          }
        } catch (e) {
          // Strategy 2 failed, continue to fallback
        }
      }

      // ── Strategy 3: Improved fallback — scan links but skip URL-text links ──
      if (results.length === 0) {
        const allLinks = document.querySelectorAll('a[href]')
        allLinks.forEach((el) => {
          const anchor = el as HTMLAnchorElement
          const text = anchor.textContent?.trim() || ''
          const href = anchor.href

          // Skip empty text, very short text, URL-like text, and duplicates
          if (!text || text.length < 5 || seen.has(href)) return
          if (text.startsWith('http://') || text.startsWith('https://')) return
          if (href.includes('#') && !href.startsWith('http')) return
          // Skip navigation-like links
          if (['home', 'about', 'contact', 'login'].some((w) => text.toLowerCase() === w)) return
          seen.add(href)

          results.push({ title: text, company: 'Unknown', url: href })
        })
      }

      return results
    })

    console.log(`📦 Found ${jobs.length} jobs from Web3 KR Jobs`)

    // Log first few for debugging
    for (const j of jobs.slice(0, 3)) {
      console.log(`   → "${j.title}" at ${j.company} (${j.url.substring(0, 60)}...)`)
    }

    let savedCount = 0
    for (const job of jobs) {
      try {
        // Skip jobs with no real title, title is a URL, or is the site header
        if (!job.title || job.title.startsWith('http')) continue
        if (job.company === 'Unknown' && job.url.includes('web3kr.jobs')) continue
        // Skip status values and noise that aren't real job titles
        const SKIP_TITLES = ['open', 'closed', 'draft', 'expired']
        if (SKIP_TITLES.includes(job.title.toLowerCase())) continue

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
            // Enhanced fields (limited data from Notion board)
            remoteType: 'Hybrid',
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
