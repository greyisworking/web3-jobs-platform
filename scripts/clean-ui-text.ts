/**
 * Clean UI text from existing job descriptions
 *
 * Usage:
 *   npx tsx scripts/clean-ui-text.ts [--dry-run] [--limit=500]
 *
 * Removes:
 * - "[Apply](/i/xxx) 2d ago" patterns
 * - "Apply now" buttons
 * - "Back to jobs" navigation
 */

import * as dotenv from 'dotenv'
dotenv.config()

import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 500

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Remove UI text patterns from description
 */
function cleanUIText(text: string): string {
  if (!text) return ''

  let cleaned = text
    // Remove "[Apply](/i/xxx) Xd ago" pattern (markdown link format)
    .replace(/\[Apply\]\([^)]+\)\s*\d+[dwhm]\s*ago/gi, '')
    // Remove "Apply Xd ago" standalone
    .replace(/Apply\s+\d+[dwhm]\s+ago/gi, '')
    // Remove time indicators at start of text
    .replace(/^\s*\d+[dwhm]\s+ago\s*/gi, '')
    // Remove "Apply now" buttons
    .replace(/Apply\s*now/gi, '')
    // Remove navigation text
    .replace(/Back to jobs?/gi, '')
    .replace(/View all jobs?/gi, '')
    .replace(/Share this job/gi, '')
    // Remove common web3.career artifacts
    .replace(/Save job/gi, '')
    .replace(/Report job/gi, '')
    // Clean multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Clean leading/trailing whitespace on each line
    .replace(/^[ \t]+/gm, '')
    .replace(/[ \t]+$/gm, '')
    .trim()

  return cleaned
}

/**
 * Check if text contains UI artifacts
 */
function hasUIText(text: string): boolean {
  if (!text) return false
  return /\[Apply\]\([^)]+\)\s*\d+[dwhm]\s*ago/i.test(text) ||
         /Apply\s+\d+[dwhm]\s+ago/i.test(text) ||
         /^\s*\d+[dwhm]\s+ago/i.test(text)
}

async function main() {
  console.log('=== Clean UI Text from Job Descriptions ===')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${limit} jobs`)
  console.log('')

  // Find jobs with potential UI text
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

  // Filter jobs that have UI text
  const jobsWithUIText = (jobs || []).filter(j => hasUIText(j.description))

  console.log(`Found ${jobsWithUIText.length} jobs with UI text artifacts`)
  console.log('')

  if (jobsWithUIText.length === 0) {
    console.log('No jobs need cleaning!')
    return
  }

  let updated = 0
  let failed = 0

  for (const job of jobsWithUIText) {
    console.log(`[${updated + failed + 1}/${jobsWithUIText.length}] ${job.company} - ${job.title}`)

    const originalLength = job.description.length
    const cleanedDescription = cleanUIText(job.description)
    const cleanedLength = cleanedDescription.length

    console.log(`  📝 ${originalLength} → ${cleanedLength} chars`)

    // Preview what's being removed
    const diff = originalLength - cleanedLength
    if (diff > 0) {
      console.log(`  🧹 Removed ${diff} chars of UI text`)
    }

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
        console.log(`  ✅ Cleaned`)
        updated++
      }
    }
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Cleaned: ${updated}`)
  console.log(`Failed: ${failed}`)
}

main().catch(console.error)
