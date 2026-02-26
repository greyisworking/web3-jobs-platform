/**
 * Re-crawl job descriptions using Playwright for dynamic sites
 * Handles JavaScript-rendered content (Ashby, Lever, Greenhouse, etc.)
 */

import { chromium, Page } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface JobRow {
  id: string
  title: string
  company: string
  url: string
  source: string
  description: string | null
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Deep clean description to remove junk content
 */
function cleanDescription(text: string): string {
  if (!text) return ''

  // Remove common UI/navigation patterns
  const junkPatterns = [
    // Similar/Related jobs sections
    /similar\s*jobs?\s*[:\n]?[\s\S]*?(?=\n\n|\z)/gi,
    /related\s*jobs?\s*[:\n]?[\s\S]*?(?=\n\n|\z)/gi,
    /recommended\s*(?:jobs?|for you)\s*[:\n]?[\s\S]*?(?=\n\n|\z)/gi,
    /you\s*(?:may|might)\s*(?:also\s*)?like[\s\S]*?(?=\n\n|\z)/gi,
    /more\s*jobs?\s*(?:at|from|like)[\s\S]*?(?=\n\n|\z)/gi,
    // Share/social patterns (remoteok, etc.)
    /share\s*this\s*job:?\s*/gi,
    /get\s*a\s*\w+\.?\w*\s*short\s*link/gi,
    /(?:^|\n)\s*\w+\.com\s*(?:\n|$)/gim,
    // "Company is hiring" patterns
    /\w+\s+is\s+hiring\s+a\s*\n/gi,
    /remote\s+\w+\s*\n\s*\n/gi,
    // Navigation elements
    /(?:^|\n)\s*(?:home|about|contact|login|sign\s*(?:in|up)|register|apply\s*now|back\s*to)\s*(?:\n|$)/gim,
    /(?:^|\n)\s*(?:share|tweet|post|email)\s*(?:this)?(?:\s*job)?:?\s*(?:\n|$)/gim,
    // Social sharing
    /share\s*(?:on|via)\s*(?:twitter|facebook|linkedin|email)[\s\S]*?(?:\n|$)/gi,
    /follow\s*us\s*(?:on)?[\s\S]*?(?:\n|$)/gi,
    // Cookie/privacy notices
    /(?:we\s*use\s*cookies|cookie\s*policy|privacy\s*policy)[\s\S]*?(?:\n\n|\z)/gi,
    /(?:accept|decline)\s*(?:all\s*)?cookies?/gi,
    // JavaScript artifacts
    /function\s*\([^)]*\)\s*\{[^}]*\}/g,
    /var\s+\w+\s*=\s*[^;]+;/g,
    /const\s+\w+\s*=\s*[^;]+;/g,
    /let\s+\w+\s*=\s*[^;]+;/g,
    /\$\([^)]+\)\./g,
    /document\.\w+/g,
    /window\.\w+/g,
    /addEventListener\([^)]+\)/g,
    /querySelector\([^)]+\)/g,
    // CSS artifacts
    /@media\s*\([^)]+\)\s*\{[^}]*\}/g,
    /\.[a-z_-]+\s*\{[^}]*\}/gi,
    // HTML entities that weren't converted
    /&[a-z]+;/gi,
    /&#\d+;/g,
    // Loading/spinner text
    /loading\.{3,}/gi,
    /please\s*wait/gi,
    // Footer boilerplate
    /(?:^|\n)©\s*\d{4}[\s\S]*?(?:\n\n|\z)/gi,
    /all\s*rights?\s*reserved/gi,
    // Form elements text
    /(?:^|\n)\s*(?:submit|cancel|reset|clear)\s*(?:\n|$)/gim,
    // Ads patterns
    /(?:advertisement|sponsored|promoted)[\s\S]*?(?:\n\n|\z)/gi,
    // Empty bullet points
    /^•\s*$/gm,
    // Backslash n (literal)
    /\\n/g,
    // Email pattern cleanup
    /\[email\s*protected\]/gi,
    // Excessive spacing
    /\n{4,}/g,
  ]

  let cleaned = text

  for (const pattern of junkPatterns) {
    cleaned = cleaned.replace(pattern, '\n\n')
  }

  // Final cleanup
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
    .replace(/^\s+|\s+$/g, '')    // Trim
    .replace(/[ \t]+/g, ' ')      // Normalize spaces

  return cleaned
}

async function extractDescription(page: Page, url: string): Promise<string | null> {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await delay(2000) // Wait for dynamic content

    // Try different selectors based on the site
    const selectors = [
      // Ashby
      '[data-testid="job-description"]',
      '.ashby-job-posting-description',
      '.job-description',
      // Lever
      '.posting-page .content',
      '.posting-description',
      '[data-qa="job-description"]',
      // Greenhouse
      '#content .job-post',
      '.job__description',
      '#app_body',
      // Generic
      '[class*="description"]',
      '[class*="job-content"]',
      '[class*="job-details"]',
      'article',
      'main',
    ]

    for (const selector of selectors) {
      try {
        const element = await page.$(selector)
        if (element) {
          const text = await element.innerText()
          if (text && text.length > 200) {
            return text.trim()
          }
        }
      } catch {
        continue
      }
    }

    // Fallback: get all text from body
    const bodyText = await page.evaluate(() => {
      const main = document.querySelector('main') || document.querySelector('article') || document.body
      // Remove nav, header, footer
      const clone = main.cloneNode(true) as HTMLElement
      clone.querySelectorAll('nav, header, footer, script, style').forEach(el => el.remove())
      return clone.innerText
    })

    if (bodyText && bodyText.length > 500) {
      return bodyText.substring(0, 10000).trim()
    }

    return null
  } catch (error) {
    console.error(`  ⚠️ Error fetching ${url}:`, error instanceof Error ? error.message : error)
    return null
  }
}

async function main() {
  console.log('🚀 Starting Playwright-based description crawler...\n')

  // Get jobs without description
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, url, source, description')
    .eq('isActive', true)
    .or('description.is.null,description.eq.')
    .order('postedDate', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching jobs:', error)
    return
  }

  console.log(`📦 Found ${jobs?.length || 0} jobs without description\n`)

  if (!jobs || jobs.length === 0) {
    console.log('✅ All jobs have descriptions!')
    return
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
  })

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })

  const page = await context.newPage()

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i] as JobRow
    const shortTitle = job.title.substring(0, 40) + (job.title.length > 40 ? '...' : '')

    console.log(`[${i + 1}/${jobs.length}] ${shortTitle}`)
    console.log(`  📍 ${job.company} | ${job.source}`)
    console.log(`  🔗 ${job.url.substring(0, 60)}...`)

    const description = await extractDescription(page, job.url)

    if (description && description.length > 200) {
      const cleanedDesc = cleanDescription(description)
      const { error: updateError } = await supabase
        .from('Job')
        .update({
          description: cleanedDesc,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', job.id)

      if (updateError) {
        console.log(`  ❌ Update failed: ${updateError.message}`)
        failCount++
      } else {
        console.log(`  ✅ Updated with ${description.length} chars`)
        successCount++
      }
    } else {
      console.log(`  ⚠️ No description found or too short`)
      failCount++
    }

    // Rate limiting
    await delay(1500)
  }

  await browser.close()

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Successfully updated: ${successCount}`)
  console.log(`❌ Failed/No content: ${failCount}`)
  console.log('═'.repeat(50))

  // Get final stats
  const { count: total } = await supabase
    .from('Job')
    .select('*', { count: 'exact', head: true })
    .eq('isActive', true)

  const { count: withDesc } = await supabase
    .from('Job')
    .select('*', { count: 'exact', head: true })
    .eq('isActive', true)
    .not('description', 'is', null)
    .neq('description', '')

  console.log(`\n📊 Final Coverage: ${withDesc}/${total} (${((withDesc || 0) / (total || 1) * 100).toFixed(1)}%)`)
}

main().catch(console.error)
