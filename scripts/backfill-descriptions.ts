/**
 * Backfill script for jobs with missing or short descriptions
 *
 * Usage:
 *   npx tsx scripts/backfill-descriptions.ts [--dry-run] [--limit=100]
 *
 * This script:
 * 1. Finds jobs with empty or short descriptions (< 200 chars)
 * 2. Re-fetches full descriptions from original sources
 * 3. Updates the database
 */

import * as dotenv from 'dotenv'
dotenv.config() // loads .env by default
import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

// Parse CLI args
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 100

// Check required env vars
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  console.error('Make sure .env.local is configured correctly')
  process.exit(1)
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  console.error('This is required for database updates')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Minimum description length to consider "complete"
const MIN_DESCRIPTION_LENGTH = 200

interface Job {
  id: string
  title: string
  company: string
  url: string
  source: string
  description: string | null
}

// ============ Source-specific fetchers ============

async function fetchAshbyDescription(url: string): Promise<string | null> {
  try {
    // Try API first, then fallback to HTML parsing
    const match = url.match(/jobs\.ashbyhq\.com\/([^\/]+)\/([^\/\?]+)/)
    if (!match) return null

    const [, orgSlug, jobId] = match

    // Try API endpoint first
    const detailUrl = `https://api.ashbyhq.com/posting-api/job-board/${orgSlug}/jobs/${jobId}`
    const apiRes = await fetch(detailUrl, {
      headers: { 'Accept': 'application/json' }
    })

    if (apiRes.ok) {
      const data = await apiRes.json()
      if (data.descriptionHtml || data.descriptionPlain) {
        return data.descriptionHtml || data.descriptionPlain
      }
    }

    // Fallback: Parse HTML page directly
    const htmlRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html'
      }
    })

    if (!htmlRes.ok) return null

    const html = await htmlRes.text()
    const $ = cheerio.load(html)

    // Look for job description in common Ashby page selectors
    const selectors = [
      '[data-qa="job-description"]',
      '.ashby-job-posting-brief-description',
      '[class*="JobDescription"]',
      '[class*="job-description"]',
      '.posting-description',
      'article',
      'main'
    ]

    for (const selector of selectors) {
      const el = $(selector)
      if (el.length > 0) {
        const content = el.first().html()
        if (content && content.length > MIN_DESCRIPTION_LENGTH) {
          return content
        }
      }
    }

    return null
  } catch (err) {
    console.error(`  [Ashby] Error fetching ${url}:`, err)
    return null
  }
}

async function fetchRemote3Description(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html'
      }
    })

    if (!res.ok) return null

    const html = await res.text()
    const $ = cheerio.load(html)

    // Try multiple selectors (Next.js CSS modules use camelCase class names)
    const selectors = [
      '[class*="jobDescription"]',
      '[class*="jobContent"]',
      '[class*="description"]',
      '.job-description',
      'article',
      'main'
    ]

    for (const selector of selectors) {
      const el = $(selector)
      if (el.length > 0) {
        const text = el.first().text().trim()
        if (text.length > MIN_DESCRIPTION_LENGTH) {
          return el.first().html() || text
        }
      }
    }

    return null
  } catch (err) {
    console.error(`  [Remote3] Error fetching ${url}:`, err)
    return null
  }
}

async function fetchGreenhouseDescription(url: string): Promise<string | null> {
  try {
    // Try to extract job ID and use API
    const jobIdMatch = url.match(/(?:gh_jid=|jobs\/)(\d+)/)
    if (jobIdMatch) {
      // Try job-boards API (for job-boards.greenhouse.io URLs)
      const boardMatch = url.match(/job-boards\.greenhouse\.io\/([^\/]+)/)
      if (boardMatch) {
        const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${boardMatch[1]}/jobs/${jobIdMatch[1]}`
        const apiRes = await fetch(apiUrl)
        if (apiRes.ok) {
          const data = await apiRes.json()
          if (data.content) {
            return data.content
          }
        }
      }
    }

    // Fallback: Parse HTML
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html'
      }
    })

    if (!res.ok) return null

    const html = await res.text()
    const $ = cheerio.load(html)

    // Try multiple selectors
    const selectors = [
      '#content',
      '[data-job-content]',
      '.job-description',
      '.job__description',
      '[class*="jobDescription"]',
      '.posting-content',
      'article',
      'main'
    ]

    for (const selector of selectors) {
      const el = $(selector)
      if (el.length > 0) {
        const content = el.first().html()
        if (content && content.length > MIN_DESCRIPTION_LENGTH) {
          return content
        }
      }
    }

    return null
  } catch (err) {
    console.error(`  [Greenhouse] Error fetching ${url}:`, err)
    return null
  }
}

async function fetchLeverDescription(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html'
      }
    })

    if (!res.ok) return null

    const html = await res.text()
    const $ = cheerio.load(html)

    const content = $('.section-wrapper.page-full-width').html() ||
                    $('[data-qa="job-description"]').html() ||
                    $('.content').html()
    return content || null
  } catch (err) {
    console.error(`  [Lever] Error fetching ${url}:`, err)
    return null
  }
}

async function fetchGenericDescription(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html'
      },
      redirect: 'follow'
    })

    if (!res.ok) return null

    const html = await res.text()
    const $ = cheerio.load(html)

    // Remove script, style, nav, footer, header elements
    $('script, style, nav, footer, header, aside').remove()

    // Try common job description selectors
    const selectors = [
      '[class*="job-description"]',
      '[class*="jobDescription"]',
      '[id*="job-description"]',
      '[class*="description"]',
      'article',
      'main',
      '.content'
    ]

    for (const selector of selectors) {
      const el = $(selector)
      if (el.length > 0) {
        const text = el.first().text().trim()
        if (text.length > MIN_DESCRIPTION_LENGTH) {
          return el.first().html() || text
        }
      }
    }

    return null
  } catch (err) {
    console.error(`  [Generic] Error fetching ${url}:`, err)
    return null
  }
}

// Route to correct fetcher based on source/URL
async function fetchDescription(job: Job): Promise<string | null> {
  const { url, source } = job

  if (!url) return null

  // Ashby
  if (url.includes('ashbyhq.com') || source === 'ashby') {
    return fetchAshbyDescription(url)
  }

  // Remote3
  if (url.includes('remote3.co') || source === 'remote3') {
    return fetchRemote3Description(url)
  }

  // Greenhouse
  if (url.includes('greenhouse.io') || source === 'greenhouse') {
    return fetchGreenhouseDescription(url)
  }

  // Lever
  if (url.includes('lever.co') || source === 'lever') {
    return fetchLeverDescription(url)
  }

  // Generic fallback
  return fetchGenericDescription(url)
}

// Clean HTML description
function cleanDescription(html: string): string {
  const $ = cheerio.load(html)

  // Remove unwanted elements
  $('script, style, nav, footer, header, aside, iframe, form').remove()

  // Get clean HTML
  return $.html().trim()
}

async function main() {
  console.log('=== Job Description Backfill ===')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${limit} jobs`)
  console.log('')

  // Find jobs with missing or short descriptions
  console.log('Finding jobs with short/missing descriptions...')

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, url, source, description')
    .eq('isActive', true)
    .or(`description.is.null,description.eq.`)
    .order('crawledAt', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Database error:', error)
    process.exit(1)
  }

  // Also find jobs with very short descriptions
  const { data: shortJobs, error: shortError } = await supabase
    .from('Job')
    .select('id, title, company, url, source, description')
    .eq('isActive', true)
    .not('description', 'is', null)
    .order('crawledAt', { ascending: false })
    .limit(limit * 2)

  if (shortError) {
    console.error('Database error:', shortError)
    process.exit(1)
  }

  // Filter short descriptions
  const shortDescJobs = (shortJobs || []).filter(j =>
    j.description && j.description.length < MIN_DESCRIPTION_LENGTH
  ).slice(0, limit)

  // Combine and dedupe
  const allJobs = [...(jobs || []), ...shortDescJobs]
  const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.id, j])).values())

  console.log(`Found ${uniqueJobs.length} jobs to backfill`)
  console.log('')

  if (uniqueJobs.length === 0) {
    console.log('No jobs need backfilling!')
    return
  }

  // Process jobs
  let updated = 0
  let failed = 0
  let skipped = 0

  for (const job of uniqueJobs) {
    console.log(`[${updated + failed + skipped + 1}/${uniqueJobs.length}] ${job.company} - ${job.title}`)
    console.log(`  Source: ${job.source}, URL: ${job.url?.slice(0, 60)}...`)
    console.log(`  Current description: ${job.description?.length || 0} chars`)

    // Fetch new description
    const newDescription = await fetchDescription(job as Job)

    if (!newDescription || newDescription.length < MIN_DESCRIPTION_LENGTH) {
      console.log(`  ❌ Could not fetch valid description`)
      failed++
      continue
    }

    const cleanedDescription = cleanDescription(newDescription)
    console.log(`  ✅ Fetched ${cleanedDescription.length} chars`)

    if (dryRun) {
      console.log(`  [DRY RUN] Would update job`)
      updated++
    } else {
      // Update database
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
        console.log(`  ✅ Updated in database`)
        updated++
      }
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Updated: ${updated}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)
}

main().catch(console.error)
