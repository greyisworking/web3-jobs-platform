/**
 * AI Job Description Summarizer - Batch Processing Script
 *
 * Processes job descriptions through Claude API to create
 * NEUN-style summaries with pixelbara tone.
 *
 * Usage:
 *   npx tsx scripts/ai-summarize-jobs.ts [options]
 *
 * Options:
 *   --dry-run       Estimate cost without processing
 *   --limit=N       Process only N jobs (default: 10)
 *   --source=X      Only process jobs from specific source
 *   --vc-only       Only process VC-backed jobs (priority)
 *   --force         Re-process even if already summarized
 *   --delay=N       Delay between API calls in ms (default: 1000)
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { summarizeJobDescription, estimateCost, type JobContext } from '../lib/ai-summarizer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// Args Parsing
// ============================================================================

interface Args {
  dryRun: boolean
  limit: number
  source: string | null
  vcOnly: boolean
  force: boolean
  delay: number
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    limit: (() => {
      const limitArg = args.find(a => a.startsWith('--limit='))
      return limitArg ? parseInt(limitArg.split('=')[1], 10) : 10
    })(),
    source: (() => {
      const sourceArg = args.find(a => a.startsWith('--source='))
      return sourceArg ? sourceArg.split('=')[1] : null
    })(),
    vcOnly: args.includes('--vc-only'),
    force: args.includes('--force'),
    delay: (() => {
      const delayArg = args.find(a => a.startsWith('--delay='))
      return delayArg ? parseInt(delayArg.split('=')[1], 10) : 1000
    })(),
  }
}

// ============================================================================
// Database Operations
// ============================================================================

async function getJobsToProcess(args: Args) {
  let query = supabase
    .from('Job')
    .select(`
      id, title, company, location, type, source,
      salary, salaryMin, salaryMax, salaryCurrency,
      backers, sector, tags, remoteType, experienceLevel,
      description, raw_description
    `)
    .eq('isActive', true)
    .not('raw_description', 'is', null)
    .neq('raw_description', '')

  if (args.source) {
    query = query.eq('source', args.source)
  }

  if (args.vcOnly) {
    // Only jobs with VC backers
    query = query.not('backers', 'is', null)
  }

  // Order VC-backed jobs first
  query = query.order('backers', { ascending: false, nullsFirst: false })

  if (args.limit) {
    query = query.limit(args.limit)
  }

  const { data: jobs, error } = await query

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }

  return jobs || []
}

async function updateJobSummary(jobId: string, summary: string) {
  const { error } = await supabase
    .from('Job')
    .update({ description: summary })
    .eq('id', jobId)

  if (error) {
    throw new Error(`Failed to update job ${jobId}: ${error.message}`)
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = parseArgs()

  console.log('🤖 AI Job Description Summarizer')
  console.log('='.repeat(60))
  console.log(`  Mode: ${args.dryRun ? '🔍 DRY RUN (cost estimate only)' : '💾 LIVE (will update DB)'}`)
  console.log(`  Limit: ${args.limit} jobs`)
  console.log(`  Source: ${args.source || 'All sources'}`)
  console.log(`  VC-only: ${args.vcOnly ? 'Yes' : 'No'}`)
  console.log(`  Delay: ${args.delay}ms between API calls`)
  console.log('')

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY && !args.dryRun) {
    console.log('❌ ANTHROPIC_API_KEY environment variable is required')
    console.log('   Add to .env: ANTHROPIC_API_KEY=your-key-here')
    process.exit(1)
  }

  // Get jobs
  console.log('📦 Fetching jobs to process...')
  const jobs = await getJobsToProcess(args)
  console.log(`   Found ${jobs.length} jobs`)

  if (jobs.length === 0) {
    console.log('\n✅ No jobs to process')
    return
  }

  // Calculate average description length
  const avgLength = jobs.reduce((sum, j) => sum + (j.raw_description?.length || 0), 0) / jobs.length
  console.log(`   Average description length: ${Math.round(avgLength)} chars`)

  // Estimate cost
  const costEstimate = estimateCost(jobs.length, avgLength)
  console.log('\n💰 Cost Estimate:')
  console.log(`   Input tokens: ~${costEstimate.estimatedInputTokens.toLocaleString()}`)
  console.log(`   Output tokens: ~${costEstimate.estimatedOutputTokens.toLocaleString()}`)
  console.log(`   Estimated cost: $${costEstimate.estimatedCostUsd.toFixed(4)} USD`)

  if (args.dryRun) {
    console.log('\n🔍 This was a dry run. No API calls made.')
    console.log('   Run without --dry-run to process jobs.')

    // Show sample jobs
    console.log('\n📋 Sample jobs to process:')
    jobs.slice(0, 5).forEach((job, i) => {
      const hasVC = job.backers && job.backers.length > 0
      console.log(`   ${i + 1}. ${job.title} @ ${job.company} ${hasVC ? '(VC-backed)' : ''}`)
    })
    return
  }

  // Process jobs
  console.log('\n🚀 Processing jobs...\n')

  let processed = 0
  let succeeded = 0
  let failed = 0
  let totalCost = 0
  let totalTokens = 0

  for (const job of jobs) {
    processed++
    const prefix = `[${processed}/${jobs.length}]`

    try {
      const context: JobContext = {
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        backers: job.backers,
        sector: job.sector,
        tags: job.tags,
        source: job.source,
        type: job.type,
        remoteType: job.remoteType,
        experienceLevel: job.experienceLevel,
      }

      const result = await summarizeJobDescription(job.raw_description, context)

      if (result.success) {
        await updateJobSummary(job.id, result.summary)

        const hasVC = job.backers && job.backers.length > 0
        console.log(`${prefix} ✅ ${job.title.substring(0, 40)}... @ ${job.company} ${hasVC ? '🏦' : ''}`)
        console.log(`       ${result.tokensUsed} tokens, $${result.costUsd?.toFixed(4)}`)

        succeeded++
        totalCost += result.costUsd || 0
        totalTokens += result.tokensUsed || 0
      } else {
        console.log(`${prefix} ❌ ${job.title.substring(0, 40)}... - ${result.error}`)
        failed++
      }

      // Rate limiting
      if (processed < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, args.delay))
      }
    } catch (err: any) {
      console.log(`${prefix} ❌ ${job.title.substring(0, 40)}... - ${err.message}`)
      failed++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary:')
  console.log(`   Processed: ${processed}`)
  console.log(`   Succeeded: ${succeeded}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Total tokens: ${totalTokens.toLocaleString()}`)
  console.log(`   Total cost: $${totalCost.toFixed(4)} USD`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
