/**
 * Job Summarizer - Batch Processing Script (Rule-based)
 *
 * Processes job descriptions through rule-based parser to create
 * NEUN-style structured summaries.
 *
 * Usage:
 *   npx tsx scripts/summarize-jobs.ts [options]
 *
 * Options:
 *   --dry-run       Preview changes without saving
 *   --limit=N       Process only N jobs (default: all)
 *   --source=X      Only process jobs from specific source
 *   --vc-only       Only process VC-backed jobs (priority)
 *   --force         Re-process even if already summarized
 *   --test          Test with OnePay, Binance, Somnia jobs
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { summarizeJob, cleanRawDescription, type JobMetadata } from '../lib/job-summarizer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// Args Parsing
// ============================================================================

interface Args {
  dryRun: boolean
  limit: number | null
  source: string | null
  vcOnly: boolean
  force: boolean
  test: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    limit: (() => {
      const limitArg = args.find(a => a.startsWith('--limit='))
      return limitArg ? parseInt(limitArg.split('=')[1], 10) : null
    })(),
    source: (() => {
      const sourceArg = args.find(a => a.startsWith('--source='))
      return sourceArg ? sourceArg.split('=')[1] : null
    })(),
    vcOnly: args.includes('--vc-only'),
    force: args.includes('--force'),
    test: args.includes('--test'),
  }
}

// ============================================================================
// Database Operations
// ============================================================================

interface JobRecord {
  id: string
  title: string
  company: string
  location: string | null
  type: string | null
  source: string
  salary: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  experienceLevel: string | null
  remoteType: string | null
  backers: string[] | null
  sector: string | null
  tags: string | null
  description: string | null
  raw_description: string | null
}

async function getJobsToProcess(args: Args): Promise<JobRecord[]> {
  let query = supabase
    .from('Job')
    .select(`
      id, title, company, location, type, source,
      salary, salaryMin, salaryMax, salaryCurrency,
      experienceLevel, remoteType, backers, sector, tags,
      description, raw_description
    `)
    .eq('isActive', true)

  // For test mode, get specific companies
  if (args.test) {
    query = query.or('company.ilike.%onepay%,company.ilike.%binance%,company.ilike.%somnia%')
  } else {
    // Need raw_description to process
    query = query.not('raw_description', 'is', null)
      .neq('raw_description', '')

    if (args.source) {
      query = query.eq('source', args.source)
    }

    if (args.vcOnly) {
      query = query.not('backers', 'is', null)
    }
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

  return (jobs || []) as JobRecord[]
}

async function updateJobSummary(jobId: string, summary: string, rawDescription: string) {
  // Clean the raw description (decode entities, strip HTML)
  const cleanedRaw = cleanRawDescription(rawDescription)

  const { error } = await supabase
    .from('Job')
    .update({
      description: summary,
      raw_description: cleanedRaw,
    })
    .eq('id', jobId)

  if (error) {
    throw new Error(`Failed to update job ${jobId}: ${error.message}`)
  }
}

// ============================================================================
// Main
// ============================================================================

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.substring(0, len) + '...'
}

async function main() {
  const args = parseArgs()

  console.log('📝 Job Summarizer (Rule-based)')
  console.log('='.repeat(60))
  console.log(`  Mode: ${args.dryRun ? '🔍 DRY RUN (no changes)' : '💾 LIVE (will update DB)'}`)
  console.log(`  Limit: ${args.limit || 'All jobs'}`)
  console.log(`  Source: ${args.source || 'All sources'}`)
  console.log(`  VC-only: ${args.vcOnly ? 'Yes' : 'No'}`)
  console.log(`  Test mode: ${args.test ? 'Yes (OnePay, Binance, Somnia)' : 'No'}`)
  console.log('')

  // Get jobs
  console.log('📦 Fetching jobs to process...')
  const jobs = await getJobsToProcess(args)
  console.log(`   Found ${jobs.length} jobs`)

  if (jobs.length === 0) {
    console.log('\n✅ No jobs to process')
    return
  }

  // Process jobs
  console.log('\n🚀 Processing jobs...\n')

  let processed = 0
  let succeeded = 0
  let failed = 0
  let vcBacked = 0

  for (const job of jobs) {
    processed++
    const prefix = `[${processed}/${jobs.length}]`

    try {
      const textToProcess = job.raw_description || job.description
      if (!textToProcess) {
        console.log(`${prefix} ⏭️  ${truncate(job.title, 40)} - No description`)
        continue
      }

      const metadata: JobMetadata = {
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        experienceLevel: job.experienceLevel,
        remoteType: job.remoteType,
        type: job.type,
        backers: job.backers,
        sector: job.sector,
        tags: job.tags,
      }

      const result = summarizeJob(textToProcess, metadata)

      const hasVC = result.hasVCBacking
      if (hasVC) vcBacked++

      console.log(`${prefix} ${hasVC ? '🏦' : '📝'} ${truncate(job.title, 35)} @ ${job.company}`)
      console.log(`       ${textToProcess.length} → ${result.summary.length} chars`)
      console.log(`       Sections: ${Object.keys(result.sections).filter(k => result.sections[k as keyof typeof result.sections]).join(', ')}`)

      if (args.dryRun) {
        // Show preview
        console.log('\n       --- Preview ---')
        console.log(result.summary.substring(0, 600).split('\n').map(l => '       ' + l).join('\n'))
        console.log('       --- End preview ---\n')
      } else {
        // Update database
        await updateJobSummary(job.id, result.summary, textToProcess)
      }

      succeeded++
    } catch (err: any) {
      console.log(`${prefix} ❌ ${truncate(job.title, 40)} - ${err.message}`)
      failed++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary:')
  console.log(`   Processed: ${processed}`)
  console.log(`   Succeeded: ${succeeded}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   VC-backed: ${vcBacked}`)

  if (args.dryRun) {
    console.log('\n🔍 This was a dry run. No changes were made.')
    console.log('   Run without --dry-run to apply changes.')
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
