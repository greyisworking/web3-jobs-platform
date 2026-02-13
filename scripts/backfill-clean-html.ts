/**
 * Backfill script to clean HTML tags from job descriptions
 *
 * Usage:
 *   npx tsx scripts/backfill-clean-html.ts [--dry-run] [--limit=100]
 *
 * This script:
 * 1. Finds jobs with HTML tags in descriptions
 * 2. Cleans HTML → clean markdown/text
 * 3. Updates the database
 */

import * as dotenv from 'dotenv'
dotenv.config()

import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

// Parse CLI args
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 500

// Check required env vars
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  process.exit(1)
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Clean HTML content to markdown-like text
 */
function cleanHtmlToMarkdown(html: string): string {
  if (!html) return ''

  // Use cheerio to properly parse HTML
  const $ = cheerio.load(html)

  // Remove script, style, nav, footer, header elements
  $('script, style, nav, footer, header, aside, iframe, form, noscript').remove()

  // Convert elements to markdown
  $('h1').each((_, el) => {
    $(el).replaceWith(`\n# ${$(el).text().trim()}\n`)
  })
  $('h2').each((_, el) => {
    $(el).replaceWith(`\n## ${$(el).text().trim()}\n`)
  })
  $('h3').each((_, el) => {
    $(el).replaceWith(`\n### ${$(el).text().trim()}\n`)
  })
  $('h4, h5, h6').each((_, el) => {
    $(el).replaceWith(`\n#### ${$(el).text().trim()}\n`)
  })

  // Convert bold/strong
  $('strong, b').each((_, el) => {
    const text = $(el).text().trim()
    if (text) {
      $(el).replaceWith(`**${text}**`)
    }
  })

  // Convert italic/em
  $('em, i').each((_, el) => {
    const text = $(el).text().trim()
    if (text) {
      $(el).replaceWith(`*${text}*`)
    }
  })

  // Convert links
  $('a').each((_, el) => {
    const href = $(el).attr('href')
    const text = $(el).text().trim()
    if (href && text) {
      $(el).replaceWith(`[${text}](${href})`)
    } else if (text) {
      $(el).replaceWith(text)
    }
  })

  // Convert list items
  $('li').each((_, el) => {
    const text = $(el).text().trim()
    $(el).replaceWith(`\n- ${text}`)
  })

  // Convert br to newline
  $('br').replaceWith('\n')

  // Convert p to text with double newline
  $('p').each((_, el) => {
    const text = $(el).text().trim()
    $(el).replaceWith(`\n\n${text}`)
  })

  // Get text content
  let text = $.text()

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&hellip;/gi, '...')
    .replace(/&bull;/gi, '•')

  // Convert bullet points to markdown
  text = text.replace(/^[●•◦‣⁃]\s*/gm, '- ')
  text = text.replace(/\n[●•◦‣⁃]\s*/g, '\n- ')

  // Normalize whitespace
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.replace(/[ \t]+\n/g, '\n')
  text = text.replace(/\n[ \t]+/g, '\n')
  text = text.replace(/[ \t]{2,}/g, ' ')

  return text.trim()
}

/**
 * Check if content has HTML tags
 */
function hasHtmlTags(content: string): boolean {
  if (!content) return false
  // Look for common HTML patterns
  return /<(?:p|div|span|strong|em|b|i|ul|ol|li|h[1-6]|br|a|table)[^>]*>/i.test(content)
}

async function main() {
  console.log('=== Job Description HTML Cleanup ===')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${limit} jobs`)
  console.log('')

  // Find all active jobs with descriptions
  console.log('Finding jobs with HTML in descriptions...')

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, description')
    .eq('isActive', true)
    .not('description', 'is', null)
    .order('crawledAt', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Database error:', error)
    process.exit(1)
  }

  // Filter jobs with HTML tags
  const htmlJobs = (jobs || []).filter(j => hasHtmlTags(j.description))

  console.log(`Found ${htmlJobs.length} jobs with HTML tags`)
  console.log('')

  if (htmlJobs.length === 0) {
    console.log('No jobs need HTML cleanup!')
    return
  }

  // Process jobs
  let updated = 0
  let failed = 0
  let skipped = 0

  for (const job of htmlJobs) {
    console.log(`[${updated + failed + skipped + 1}/${htmlJobs.length}] ${job.company} - ${job.title}`)

    const originalLength = job.description?.length || 0
    const cleanedDescription = cleanHtmlToMarkdown(job.description)
    const cleanedLength = cleanedDescription.length

    // Skip if cleaned version is too short (something went wrong)
    if (cleanedLength < 100) {
      console.log(`  ⚠️ Cleaned version too short (${cleanedLength} chars), skipping`)
      skipped++
      continue
    }

    // Skip if no real change
    if (cleanedDescription === job.description) {
      console.log(`  ⏭️ No change needed`)
      skipped++
      continue
    }

    console.log(`  📝 ${originalLength} → ${cleanedLength} chars`)

    if (dryRun) {
      console.log(`  [DRY RUN] Would update`)
      console.log(`  Preview: ${cleanedDescription.slice(0, 150)}...`)
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
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Updated: ${updated}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)
}

main().catch(console.error)
