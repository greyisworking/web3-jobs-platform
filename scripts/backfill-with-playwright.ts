/**
 * Enhanced backfill script with Playwright support
 *
 * Usage:
 *   npx tsx scripts/backfill-with-playwright.ts [--dry-run] [--limit=100]
 *
 * Features:
 * 1. Playwright for JS-rendered sites (Ashby, custom career pages)
 * 2. Better selectors for web3.career (excludes UI text)
 * 3. Multiple User-Agent rotation for 403 sites
 * 4. Cleans "Apply Xd ago" text from descriptions
 */

import * as dotenv from 'dotenv'
dotenv.config()

import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'
import { chromium, Browser, Page } from 'playwright'

// Parse CLI args
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 100

// Check required env vars
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const MIN_DESCRIPTION_LENGTH = 200

// User agents rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

interface Job {
  id: string
  title: string
  company: string
  url: string
  source: string
  description: string | null
}

// ============ Text cleaning ============

/**
 * Remove UI text like "Apply 2d ago", "[Apply](/i/xxx)"
 */
function cleanUIText(text: string): string {
  if (!text) return ''

  let cleaned = text
    // Remove "[Apply](/i/xxx) Xd ago" pattern
    .replace(/\[Apply\]\([^)]+\)\s*\d+[dwhm]\s*ago/gi, '')
    // Remove "Apply Xd ago" text
    .replace(/Apply\s+\d+[dwhm]\s+ago/gi, '')
    // Remove standalone time indicators at start
    .replace(/^\s*\d+[dwhm]\s+ago\s*/gi, '')
    // Remove "Apply now" buttons
    .replace(/Apply\s*now/gi, '')
    // Remove navigation text
    .replace(/Back to jobs?/gi, '')
    .replace(/View all jobs?/gi, '')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return cleaned
}

// ============ Web3.career fetcher ============

async function fetchWeb3CareerDescription(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    })

    if (!res.ok) return null

    const html = await res.text()
    const $ = cheerio.load(html)

    // Remove UI elements before extracting description
    $('nav, header, footer, aside, .apply-button, .job-actions, .share-buttons').remove()
    $('[class*="apply"], [class*="share"], [class*="action"]').remove()
    $('button, .btn').remove()

    // web3.career specific selectors (more specific to avoid UI text)
    const selectors = [
      '.job-description-content',
      '.job-detail-description',
      '[class*="JobDescription"]',
      '[class*="job-description"]',
      '.description-section',
      // Fallback to article content but exclude certain elements
      'article .content',
      'main .content',
    ]

    for (const selector of selectors) {
      const el = $(selector)
      if (el.length > 0) {
        // Remove any remaining UI elements
        el.find('[class*="apply"], [class*="action"], button').remove()

        const content = el.first().html()
        if (content && content.length > MIN_DESCRIPTION_LENGTH) {
          return cleanUIText(content)
        }
      }
    }

    // Last resort: try to get main content area but be careful
    const mainContent = $('main').first()
    if (mainContent.length > 0) {
      // Remove header, nav, footer, sidebar
      mainContent.find('nav, header, footer, aside, [class*="sidebar"]').remove()
      mainContent.find('[class*="apply"], [class*="action"], button').remove()

      const content = mainContent.html()
      if (content && content.length > MIN_DESCRIPTION_LENGTH) {
        return cleanUIText(content)
      }
    }

    return null
  } catch (err) {
    console.error(`  [Web3Career] Error fetching ${url}:`, err)
    return null
  }
}

// ============ Playwright fetcher for JS sites ============

let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
  return browser
}

async function fetchWithPlaywright(url: string): Promise<string | null> {
  let page: Page | null = null
  try {
    const b = await getBrowser()
    page = await b.newPage()

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    })

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    // Wait for content to load
    await page.waitForTimeout(2000)

    // Try to find job description
    const selectors = [
      '[data-qa="job-description"]',
      '.ashby-job-posting-brief-description',
      '[class*="JobDescription"]',
      '[class*="job-description"]',
      '.job-description',
      '.posting-description',
      '.job-content',
      'article',
      'main'
    ]

    for (const selector of selectors) {
      const element = await page.$(selector)
      if (element) {
        const content = await element.innerHTML()
        if (content && content.length > MIN_DESCRIPTION_LENGTH) {
          await page.close()
          return cleanUIText(content)
        }
      }
    }

    // Try getting body content as last resort
    const bodyContent = await page.evaluate(() => {
      // Remove navigation, header, footer
      document.querySelectorAll('nav, header, footer, aside').forEach(el => el.remove())
      return document.body.innerHTML
    })

    await page.close()

    if (bodyContent && bodyContent.length > MIN_DESCRIPTION_LENGTH) {
      return cleanUIText(bodyContent)
    }

    return null
  } catch (err) {
    console.error(`  [Playwright] Error fetching ${url}:`, err)
    if (page) await page.close().catch(() => {})
    return null
  }
}

// ============ Greenhouse API fetcher ============

async function fetchGreenhouseDescription(url: string): Promise<string | null> {
  try {
    // Extract job ID from URL
    const jobIdMatch = url.match(/(?:gh_jid=|jobs\/)(\d+)/)
    if (!jobIdMatch) return null

    const jobId = jobIdMatch[1]

    // Try to identify the board name
    const boardMatch = url.match(/job-boards\.greenhouse\.io\/([^\/]+)/) ||
                       url.match(/boards\.greenhouse\.io\/([^\/]+)/)

    if (boardMatch) {
      const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${boardMatch[1]}/jobs/${jobId}`
      const apiRes = await fetch(apiUrl, {
        headers: { 'User-Agent': getRandomUserAgent() }
      })
      if (apiRes.ok) {
        const data = await apiRes.json()
        if (data.content) {
          return cleanUIText(data.content)
        }
      }
    }

    // Fallback to Playwright for custom career pages
    return await fetchWithPlaywright(url)
  } catch (err) {
    console.error(`  [Greenhouse] Error:`, err)
    return null
  }
}

// ============ Ashby fetcher ============

async function fetchAshbyDescription(url: string): Promise<string | null> {
  try {
    const match = url.match(/jobs\.ashbyhq\.com\/([^\/]+)\/([^\/\?]+)/)
    if (!match) {
      // Not a standard Ashby URL, use Playwright
      return await fetchWithPlaywright(url)
    }

    const [, orgSlug, jobId] = match

    // Try API first
    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${orgSlug}/jobs/${jobId}`
    const apiRes = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': getRandomUserAgent()
      }
    })

    if (apiRes.ok) {
      const data = await apiRes.json()
      if (data.descriptionHtml || data.descriptionPlain) {
        return cleanUIText(data.descriptionHtml || data.descriptionPlain)
      }
    }

    // Fallback to Playwright
    return await fetchWithPlaywright(url)
  } catch (err) {
    console.error(`  [Ashby] Error:`, err)
    return await fetchWithPlaywright(url)
  }
}

// ============ Generic fetcher with retry ============

async function fetchGenericDescription(url: string): Promise<string | null> {
  // Try with different user agents
  for (const ua of USER_AGENTS) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        },
        redirect: 'follow'
      })

      if (res.status === 403) continue // Try next UA
      if (!res.ok) continue

      const html = await res.text()
      const $ = cheerio.load(html)

      // Remove unwanted elements
      $('script, style, nav, footer, header, aside, iframe, form, noscript').remove()
      $('[class*="apply"], [class*="share"], button').remove()

      const selectors = [
        '[class*="job-description"]',
        '[class*="jobDescription"]',
        '[id*="job-description"]',
        '.description',
        'article',
        'main',
        '.content'
      ]

      for (const selector of selectors) {
        const el = $(selector)
        if (el.length > 0) {
          const content = el.first().html()
          if (content && content.length > MIN_DESCRIPTION_LENGTH) {
            return cleanUIText(content)
          }
        }
      }
    } catch {
      continue
    }
  }

  // Last resort: try Playwright
  return await fetchWithPlaywright(url)
}

// ============ Route to correct fetcher ============

async function fetchDescription(job: Job): Promise<string | null> {
  const { url, source } = job

  if (!url) return null

  // Web3.career
  if (url.includes('web3.career') || source === 'web3.career') {
    return fetchWeb3CareerDescription(url)
  }

  // Ashby
  if (url.includes('ashbyhq.com') || source.includes('ashby')) {
    return fetchAshbyDescription(url)
  }

  // Greenhouse
  if (url.includes('greenhouse.io') || source.includes('greenhouse')) {
    return fetchGreenhouseDescription(url)
  }

  // Lever
  if (url.includes('lever.co')) {
    return fetchGenericDescription(url)
  }

  // Generic fallback
  return fetchGenericDescription(url)
}

// ============ Clean HTML to markdown ============

function cleanHtmlToText(html: string): string {
  const $ = cheerio.load(html)

  // Remove unwanted elements
  $('script, style, nav, footer, header, aside, iframe, form, noscript').remove()

  // Convert to text
  let text = $.text()

  // Clean UI text
  text = cleanUIText(text)

  // Normalize whitespace
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.replace(/[ \t]{2,}/g, ' ')

  return text.trim()
}

// ============ Main ============

async function main() {
  console.log('=== Enhanced Job Description Backfill ===')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${limit} jobs`)
  console.log('')

  // Find jobs with missing or short descriptions
  console.log('Finding jobs to backfill...')

  const { data: emptyJobs, error: e1 } = await supabase
    .from('Job')
    .select('id, title, company, url, source, description')
    .eq('isActive', true)
    .or(`description.is.null,description.eq.`)
    .order('crawledAt', { ascending: false })
    .limit(limit)

  const { data: shortJobs, error: e2 } = await supabase
    .from('Job')
    .select('id, title, company, url, source, description')
    .eq('isActive', true)
    .not('description', 'is', null)
    .order('crawledAt', { ascending: false })
    .limit(limit * 2)

  if (e1 || e2) {
    console.error('Database error:', e1 || e2)
    process.exit(1)
  }

  // Filter short descriptions and those with UI text
  const shortDescJobs = (shortJobs || []).filter(j =>
    j.description && (
      j.description.length < MIN_DESCRIPTION_LENGTH ||
      j.description.includes('Apply') && j.description.includes('ago')
    )
  ).slice(0, limit)

  // Combine and dedupe
  const allJobs = [...(emptyJobs || []), ...shortDescJobs]
  const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.id, j])).values())

  console.log(`Found ${uniqueJobs.length} jobs to process`)
  console.log('')

  if (uniqueJobs.length === 0) {
    console.log('No jobs need backfilling!')
    return
  }

  let updated = 0
  let failed = 0
  let skipped = 0

  for (const job of uniqueJobs) {
    console.log(`[${updated + failed + skipped + 1}/${uniqueJobs.length}] ${job.company} - ${job.title}`)
    console.log(`  Source: ${job.source}, URL: ${job.url?.slice(0, 50)}...`)
    console.log(`  Current: ${job.description?.length || 0} chars`)

    // Fetch new description
    const newDescription = await fetchDescription(job as Job)

    if (!newDescription || newDescription.length < MIN_DESCRIPTION_LENGTH) {
      console.log(`  ❌ Could not fetch valid description`)
      failed++
      continue
    }

    const cleanedDescription = cleanUIText(newDescription)
    console.log(`  ✅ Fetched ${cleanedDescription.length} chars`)

    if (dryRun) {
      console.log(`  [DRY RUN] Would update`)
      updated++
    } else {
      const { error: updateError } = await supabase
        .from('Job')
        .update({
          description: cleanedDescription,
          updatedAt: new Date().toISOString()
        })
        .eq('id', job.id)

      if (updateError) {
        console.error(`  ❌ Update error:`, updateError)
        failed++
      } else {
        console.log(`  ✅ Updated`)
        updated++
      }
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 500))
  }

  // Cleanup browser
  if (browser) {
    await browser.close()
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Updated: ${updated}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)
}

main().catch(console.error)
