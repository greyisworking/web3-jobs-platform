/**
 * Dry-run test for the web3kr.jobs crawler extraction logic.
 * Tests that the Puppeteer selectors correctly extract job title + company.
 * Does NOT save to database — just prints what would be extracted.
 *
 * Run: npx tsx tests/crawl-web3kr-dryrun.ts
 */

import puppeteer from 'puppeteer'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log('🧪 Dry-run: web3kr.jobs crawler extraction\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    )

    console.log('Loading https://www.web3kr.jobs ...')
    await page.goto('https://www.web3kr.jobs', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    await delay(5000)
    console.log('Page loaded. Extracting jobs...\n')

    const { jobs, strategy } = await page.evaluate(() => {
      const results: { title: string; company: string; url: string }[] = []
      const seen = new Set<string>()
      let strategyUsed = 'none'

      // ── Strategy 1: Header-based column mapping ──
      try {
        let headerRow: Element | null = null

        const allElements = Array.from(document.querySelectorAll('*'))
        for (const el of allElements) {
          if (el.children.length === 0 && el.textContent?.trim() === '회사') {
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
          const headerCells = Array.from(headerRow.children)
          const colMap: Record<string, number> = {}

          headerCells.forEach((cell, index) => {
            const text = cell.textContent?.trim() || ''
            if (text === '회사') colMap.company = index
            if (text === '포지션' || text.includes('포지션')) colMap.title = index
            if (text === '링크' || text.includes('링크')) colMap.link = index
          })

          const container = headerRow.parentElement
          if (container && colMap.company != null && colMap.title != null) {
            const allRows = Array.from(container.children)
            const dataRows = allRows.filter((r) => r !== headerRow)

            for (const row of dataRows) {
              const cells = Array.from(row.children)
              if (cells.length < 3) continue

              const companyCell = cells[colMap.company]
              const company = companyCell?.textContent?.trim() || ''

              const titleCell = cells[colMap.title]
              let title = ''
              if (titleCell) {
                const titleLink = titleCell.querySelector('a')
                title = titleLink?.textContent?.trim() || titleCell.textContent?.trim() || ''
              }

              let applyUrl = ''
              if (colMap.link != null) {
                const linkCell = cells[colMap.link]
                if (linkCell) {
                  const linkAnchor = linkCell.querySelector('a[href]') as HTMLAnchorElement | null
                  applyUrl = linkAnchor?.href || ''
                  if (!applyUrl) {
                    const cellText = linkCell.textContent?.trim() || ''
                    if (cellText.startsWith('http')) applyUrl = cellText
                  }
                }
              }

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

            if (results.length > 0) strategyUsed = 'strategy1-header-columns'
          }
        }
      } catch (e) {
        // continue
      }

      // ── Strategy 2: Notion page links ──
      if (results.length === 0) {
        try {
          const allAnchors = Array.from(document.querySelectorAll('a[href]'))

          for (const anchor of allAnchors) {
            const href = anchor.getAttribute('href') || ''
            if (!/^\/[0-9a-f-]{20,}$/i.test(href)) continue

            const title = anchor.textContent?.trim() || ''
            if (!title || title.length < 3 || seen.has(title)) continue
            if (title.startsWith('http')) continue
            seen.add(title)

            let row = anchor.parentElement
            let depth = 0
            while (row && row.children.length < 3 && depth < 10) {
              row = row.parentElement
              depth++
            }

            let company = 'Unknown'
            let applyUrl = ''

            if (row && row.children.length >= 3) {
              const firstCellText = row.children[0]?.textContent?.trim() || ''
              if (firstCellText && firstCellText !== title) {
                company = firstCellText
              }
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

          if (results.length > 0) strategyUsed = 'strategy2-notion-links'
        } catch (e) {
          // continue
        }
      }

      // ── Strategy 3: Fallback ──
      if (results.length === 0) {
        const allLinks = document.querySelectorAll('a[href]')
        allLinks.forEach((el) => {
          const anchor = el as HTMLAnchorElement
          const text = anchor.textContent?.trim() || ''
          const href = anchor.href
          if (!text || text.length < 5 || seen.has(href)) return
          if (text.startsWith('http://') || text.startsWith('https://')) return
          if (href.includes('#') && !href.startsWith('http')) return
          if (['home', 'about', 'contact', 'login'].some((w) => text.toLowerCase() === w)) return
          seen.add(href)
          results.push({ title: text, company: 'Unknown', url: href })
        })
        if (results.length > 0) strategyUsed = 'strategy3-fallback-links'
      }

      return { jobs: results, strategy: strategyUsed }
    })

    console.log(`Strategy used: ${strategy}`)
    console.log(`Jobs found: ${jobs.length}\n`)

    if (jobs.length === 0) {
      console.log('⚠️  No jobs extracted. The page structure may have changed.')
      // Dump page info for debugging
      const debugInfo = await page.evaluate(() => {
        return {
          title: document.title,
          bodyLength: document.body.innerHTML.length,
          linkCount: document.querySelectorAll('a').length,
          hasOopy: !!(window as any).__OOPY__,
          allTextSnippet: document.body.innerText.substring(0, 500),
        }
      })
      console.log('Debug info:', JSON.stringify(debugInfo, null, 2))
    } else {
      // Print results
      let titleUrlCount = 0
      let unknownCompanyCount = 0

      for (const job of jobs) {
        const isTitleUrl = job.title.startsWith('http')
        const isUnknown = job.company === 'Unknown'
        if (isTitleUrl) titleUrlCount++
        if (isUnknown) unknownCompanyCount++

        const statusIcon = isTitleUrl || isUnknown ? '⚠️ ' : '✅'
        console.log(
          `  ${statusIcon} "${job.title}" @ ${job.company}\n     URL: ${job.url.substring(0, 80)}${job.url.length > 80 ? '...' : ''}`
        )
      }

      console.log(`\n${'─'.repeat(50)}`)
      console.log(`Total: ${jobs.length} jobs`)
      console.log(`Title is URL (bug): ${titleUrlCount}`)
      console.log(`Company is Unknown (bug): ${unknownCompanyCount}`)
      console.log(
        `Clean jobs: ${jobs.length - Math.max(titleUrlCount, unknownCompanyCount)}`
      )

      if (titleUrlCount === 0 && unknownCompanyCount === 0) {
        console.log('\n✅ All jobs have proper titles and company names!')
      } else if (titleUrlCount === 0) {
        console.log(
          `\n✅ No URL-as-title bugs! (${unknownCompanyCount} jobs still have Unknown company)`
        )
      } else {
        console.log('\n❌ Some bugs remain — check output above')
      }
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
