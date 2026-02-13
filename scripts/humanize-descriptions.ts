/**
 * Humanize Job Descriptions
 *
 * Applies humanizer to existing job descriptions to remove AI-generated patterns.
 *
 * Usage:
 *   npx tsx scripts/humanize-descriptions.ts [--dry-run] [--limit=500] [--threshold=30]
 *
 * Options:
 *   --dry-run      Preview changes without saving
 *   --limit=N      Process only N jobs (default: 500)
 *   --threshold=N  Min AI score to trigger humanization (default: 30)
 */

import * as dotenv from 'dotenv'
dotenv.config()

import { createClient } from '@supabase/supabase-js'
import { calculateAIScore, humanizeRuleBased } from '../lib/humanizer'

// Parse CLI args
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 500
const thresholdArg = args.find(a => a.startsWith('--threshold='))
const threshold = thresholdArg ? parseInt(thresholdArg.split('=')[1], 10) : 30

// Check env vars
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

interface JobRow {
  id: string
  title: string
  company: string
  description: string | null
}

async function main() {
  console.log('=== Job Description Humanizer ===')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${limit} jobs`)
  console.log(`AI Score Threshold: ${threshold}`)
  console.log('')

  // Fetch jobs with descriptions
  console.log('Fetching jobs...')
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

  console.log(`Found ${jobs?.length || 0} jobs`)
  console.log('')

  // Analyze and filter jobs that need humanization
  const jobsToProcess: Array<{
    job: JobRow
    aiScore: number
    humanized: string
  }> = []

  console.log('Analyzing AI scores...')
  for (const job of jobs || []) {
    if (!job.description) continue

    const aiScore = calculateAIScore(job.description)

    if (aiScore >= threshold) {
      const humanized = humanizeRuleBased(job.description)
      // Only include if actually changed
      if (humanized !== job.description) {
        jobsToProcess.push({ job, aiScore, humanized })
      }
    }
  }

  console.log(`${jobsToProcess.length} jobs need humanization (score >= ${threshold})`)
  console.log('')

  if (jobsToProcess.length === 0) {
    console.log('No jobs need humanization!')
    return
  }

  // Show AI score distribution
  const scoreDistribution = {
    '30-50': 0,
    '51-70': 0,
    '71-100': 0,
  }
  for (const { aiScore } of jobsToProcess) {
    if (aiScore <= 50) scoreDistribution['30-50']++
    else if (aiScore <= 70) scoreDistribution['51-70']++
    else scoreDistribution['71-100']++
  }
  console.log('AI Score Distribution:')
  console.log(`  30-50:  ${scoreDistribution['30-50']} jobs`)
  console.log(`  51-70:  ${scoreDistribution['51-70']} jobs`)
  console.log(`  71-100: ${scoreDistribution['71-100']} jobs`)
  console.log('')

  // Process jobs
  let updated = 0
  let failed = 0

  for (const { job, aiScore, humanized } of jobsToProcess) {
    console.log(`[${updated + failed + 1}/${jobsToProcess.length}] ${job.company} - ${job.title}`)
    console.log(`  AI Score: ${aiScore}`)

    const originalLength = job.description!.length
    const humanizedLength = humanized.length
    const diff = originalLength - humanizedLength

    console.log(`  Length: ${originalLength} → ${humanizedLength} (${diff > 0 ? '-' : '+'}${Math.abs(diff)} chars)`)

    // Show a sample of what changed
    const sample = findChangeSample(job.description!, humanized)
    if (sample) {
      console.log(`  Sample: "${sample.before}" → "${sample.after}"`)
    }

    if (dryRun) {
      console.log('  [DRY RUN] Would update')
      updated++
    } else {
      const { error: updateError } = await supabase
        .from('Job')
        .update({
          description: humanized,
          updatedAt: new Date().toISOString()
        })
        .eq('id', job.id)

      if (updateError) {
        console.error('  ❌ Update error:', updateError.message)
        failed++
      } else {
        console.log('  ✅ Humanized')
        updated++
      }
    }
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Humanized: ${updated}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${(jobs?.length || 0) - jobsToProcess.length} (score < ${threshold} or no changes)`)
}

/**
 * Find a sample of what changed between original and humanized text
 */
function findChangeSample(
  original: string,
  humanized: string
): { before: string; after: string } | null {
  // Look for common AI words that were replaced
  const aiWords = ['leverage', 'utilize', 'facilitate', 'streamline', 'optimize', 'passionate', 'delve', 'navigate']

  for (const word of aiWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i')
    if (original.match(regex) && !humanized.match(regex)) {
      // Find the context
      const match = original.match(new RegExp(`.{0,20}\\b${word}\\b.{0,20}`, 'i'))
      if (match) {
        const before = match[0].trim()
        // Find corresponding section in humanized
        const words = before.split(/\s+/)
        const contextWord = words.find(w => !w.match(new RegExp(word, 'i')) && w.length > 3)
        if (contextWord) {
          const afterMatch = humanized.match(new RegExp(`.{0,15}${contextWord}.{0,25}`, 'i'))
          if (afterMatch) {
            return { before, after: afterMatch[0].trim() }
          }
        }
        return { before, after: '(replaced)' }
      }
    }
  }

  return null
}

main().catch(console.error)
