import puppeteer, { type Page } from 'puppeteer'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay } from '../utils'

/**
 * Fetch job description from a web3kr.jobs detail page using Puppeteer.
 * These pages are Oopy/Notion-rendered and require JS execution.
 * Oopy wraps Notion content in specific class structures.
 */
async function fetchDescriptionFromDetailPage(
  page: Page,
  detailUrl: string
): Promise<string | null> {
  try {
    await page.goto(detailUrl, {
      waitUntil: 'networkidle2',
      timeout: 25000,
    })

    // Wait longer for Notion/Oopy content to fully render
    await delay(4000)

    // Wait for Oopy-specific content containers
    await page.waitForSelector('[class*="notion"], [class*="oopy"], [class*="page-content"], main, article', { timeout: 10000 }).catch(() => {
      console.log('    ⚠️ Content container not found, proceeding anyway')
    })

    // Use string template to avoid TypeScript/esbuild transformation issues in page.evaluate
    const description = await page.evaluate(`
      (function() {
        var oopySelectors = [
          '[class*="oopy-page"]',
          '[class*="oopy-content"]',
          '[class*="oopy-notion"]',
          '[class*="notion-page-content"]',
          '[class*="notion-text-block"]',
          '[class*="notion-bulleted"]',
          '[class*="notion-numbered"]',
          '[class*="page-body"]',
          '[class*="page-content"]',
          'article',
          'main',
          '[role="main"]',
          '.content',
        ];

        function collectText(element) {
          var clone = element.cloneNode(true);
          var noiseSelectors = [
            'nav', 'header', 'footer', 'script', 'style', 'noscript', 'iframe', 'svg',
            '[class*="nav"]', '[class*="header"]', '[class*="footer"]', '[class*="menu"]',
            '[class*="sidebar"]', '[class*="breadcrumb"]', '[class*="share"]',
            '[class*="social"]', '[class*="comment"]', 'button', 'a[class*="button"]',
          ];
          noiseSelectors.forEach(function(sel) {
            clone.querySelectorAll(sel).forEach(function(n) { n.remove(); });
          });
          return (clone.textContent || '')
            .split('\\n')
            .map(function(line) { return line.trim(); })
            .filter(function(line) { return line.length > 0; })
            .join('\\n');
        }

        for (var i = 0; i < oopySelectors.length; i++) {
          var sel = oopySelectors[i];
          var el = document.querySelector(sel);
          if (el) {
            var text = collectText(el);
            if (text.length > 100) {
              var hasJobContent = /[가-힣]|experience|requirement|responsibility|team|company|role|job/i.test(text);
              if (hasJobContent) {
                return text;
              }
            }
          }
        }

        // Fallback: TreeWalker
        var body = document.body;
        if (!body) return null;

        var textBlocks = [];
        var walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
        var node;

        while ((node = walker.nextNode())) {
          var nodeText = node.textContent ? node.textContent.trim() : '';
          if (!nodeText || nodeText.length < 10) continue;
          var parent = node.parentElement;
          if (!parent) continue;
          var isInNoise = parent.closest('nav, header, footer, [class*="nav"], [class*="menu"], [class*="header"], [class*="footer"], script, style');
          if (isInNoise) continue;
          textBlocks.push(nodeText);
        }

        var combinedText = textBlocks.join('\\n');
        if (combinedText.length > 150) {
          return combinedText;
        }

        return null;
      })()
    `)

    if (description && typeof description === 'string' && description.length > 50) {
      // Clean up the text
      const cleaned = description
        .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
        .replace(/[ \t]+/g, ' ')      // Collapse spaces
        .replace(/\n /g, '\n')        // Remove leading spaces after newlines
        .trim()
        .substring(0, 10000)          // Limit size

      // Final validation: make sure it's not just navigation text
      if (cleaned.length > 100) {
        return cleaned
      }
    }

    return null
  } catch (error) {
    console.error(`  ⚠️ Failed to fetch description from ${detailUrl}:`, error)
    return null
  }
}

interface CrawlerReturn {
  total: number
  new: number
}

export async function crawlWeb3KRJobs(): Promise<CrawlerReturn> {
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
      const results: { title: string; company: string; url: string; notionPagePath: string | null }[] = []
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
              let notionPagePath: string | null = null
              if (titleCell) {
                // Prefer link text within the cell (Notion page link)
                const titleLink = titleCell.querySelector('a')
                title = titleLink?.textContent?.trim() || titleCell.textContent?.trim() || ''
                // Capture Notion page path for later description fetch
                if (titleLink) {
                  const href = titleLink.getAttribute('href') || ''
                  if (/^\/[0-9a-f-]{20,}$/i.test(href)) {
                    notionPagePath = href
                  }
                }
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
                  notionPagePath,
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
              notionPagePath: href,
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

          results.push({ title: text, company: 'Unknown', url: href, notionPagePath: null })
        })
      }

      return results
    })

    console.log(`📦 Found ${jobs.length} jobs from Web3 KR Jobs`)

    // Log first few for debugging
    for (const j of jobs.slice(0, 3)) {
      console.log(`   → "${j.title}" at ${j.company} (${j.url.substring(0, 60)}...)`)
    }

    // Open a separate page for fetching descriptions so we don't lose the listing page
    const detailPage = await browser.newPage()
    await detailPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

    let savedCount = 0
    let newCount = 0
    for (const job of jobs) {
      try {
        // Skip jobs with no real title, title is a URL, or is the site header
        if (!job.title || job.title.startsWith('http')) continue
        if (job.company === 'Unknown' && job.url.includes('web3kr.jobs')) continue
        // Skip status values and noise that aren't real job titles
        const SKIP_TITLES = ['open', 'closed', 'draft', 'expired']
        if (SKIP_TITLES.includes(job.title.toLowerCase())) continue

        // Fetch JD description from the Notion detail page
        let description: string | null = null

        // If we have a Notion page path, visit it to get the description
        if (job.notionPagePath) {
          const detailUrl = `https://www.web3kr.jobs${job.notionPagePath}`
          console.log(`   📄 Fetching JD for "${job.title}" ...`)
          description = await fetchDescriptionFromDetailPage(detailPage, detailUrl)
          if (description) {
            console.log(`   ✅ Got description (${description.length} chars)`)
          } else {
            console.log(`   ⚠️ No description found for "${job.title}"`)
          }
          await delay(1000) // Rate limit between detail page fetches
        }

        const result = await validateAndSaveJob(
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
            // Enhanced fields
            remoteType: 'Hybrid',
            description: description || undefined,
          },
          'web3kr.jobs'
        )
        if (result.saved) savedCount++
        if (result.isNew) newCount++
        await delay(100)
      } catch (error) {
        console.error('Error saving Web3 KR job:', error)
      }
    }

    await detailPage.close()

    await supabase.from('CrawlLog').insert({
      source: 'web3kr.jobs',
      status: 'success',
      jobCount: savedCount,
      createdAt: new Date().toISOString(),
    })

    console.log(`✅ Saved ${savedCount} jobs from Web3 KR Jobs (${newCount} new)`)
    return { total: savedCount, new: newCount }
  } catch (error) {
    console.error('❌ Web3 KR Jobs crawler error:', error)

    await supabase.from('CrawlLog').insert({
      source: 'web3kr.jobs',
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
