/**
 * Migration Script: Format Job Descriptions
 *
 * This script:
 * 1. Adds raw_description column if it doesn't exist
 * 2. Copies current description to raw_description (preserves original)
 * 3. Formats description using the new formatter
 *
 * Usage:
 *   npx tsx scripts/migrate-descriptions.ts [--dry-run] [--limit=100] [--source=web3.career]
 *
 * Options:
 *   --dry-run    Preview changes without saving
 *   --limit=N    Process only N jobs (default: all)
 *   --source=X   Only process jobs from specific source
 *   --force      Re-format even if raw_description exists
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { formatJobDescription, needsFormatting } from '../lib/description-formatter'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface Args {
  dryRun: boolean
  limit: number | null
  source: string | null
  force: boolean
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
    force: args.includes('--force'),
  }
}

async function ensureRawDescriptionColumn() {
  console.log('📋 Checking raw_description column...')

  // Try to select from raw_description to see if it exists
  const { error } = await supabase
    .from('Job')
    .select('raw_description')
    .limit(1)

  if (error && error.message.includes('does not exist')) {
    console.log('  ⚠️  raw_description column does not exist')
    console.log('  📝 Please run this SQL in Supabase:')
    console.log('')
    console.log('    ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS raw_description TEXT;')
    console.log('')
    return false
  }

  console.log('  ✅ raw_description column exists')
  return true
}

interface JobRecord {
  id: string
  title: string
  company: string
  source: string
  description: string | null
  raw_description?: string | null
}

async function getJobsToProcess(args: Args, columnExists: boolean): Promise<JobRecord[]> {
  // Always select all fields - handle missing column at runtime
  let query = supabase
    .from('Job')
    .select('id, title, company, source, description, raw_description')
    .eq('isActive', true)
    .not('description', 'is', null)
    .neq('description', '')

  if (args.source) {
    query = query.eq('source', args.source)
  }

  // Only process jobs that haven't been formatted yet (unless --force)
  // Skip this filter if column doesn't exist (all jobs need processing)
  if (!args.force && columnExists) {
    query = query.is('raw_description', null)
  }

  if (args.limit) {
    query = query.limit(args.limit)
  }

  const { data: jobs, error } = await query

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }

  return (jobs || []) as JobRecord[]
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.substring(0, len) + '...'
}

async function main() {
  const args = parseArgs()

  console.log('🔄 Job Description Migration Script')
  console.log('='.repeat(50))
  console.log(`  Mode: ${args.dryRun ? '🔍 DRY RUN (no changes)' : '💾 LIVE (will update DB)'}`)
  console.log(`  Limit: ${args.limit || 'All jobs'}`)
  console.log(`  Source: ${args.source || 'All sources'}`)
  console.log(`  Force: ${args.force ? 'Yes' : 'No'}`)
  console.log('')

  // Check column exists
  const columnExists = await ensureRawDescriptionColumn()
  if (!columnExists && !args.dryRun) {
    console.log('\n❌ Cannot proceed without raw_description column')
    process.exit(1)
  }

  // Get jobs to process
  console.log('\n📦 Fetching jobs to process...')
  const jobs = await getJobsToProcess(args, columnExists)
  console.log(`  Found ${jobs.length} jobs to process`)

  if (jobs.length === 0) {
    console.log('\n✅ No jobs need formatting')
    return
  }

  // Process jobs
  let processed = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  console.log('\n🔧 Processing jobs...\n')

  for (const job of jobs) {
    processed++
    const prefix = `[${processed}/${jobs.length}]`

    try {
      // Skip if no description (shouldn't happen but check anyway)
      if (!job.description) {
        console.log(`${prefix} ⏭️  ${truncate(job.title, 40)} - No description`)
        skipped++
        continue
      }

      // Check if needs formatting
      if (!needsFormatting(job.description) && !args.force) {
        console.log(`${prefix} ⏭️  ${truncate(job.title, 40)} - Already formatted`)
        skipped++
        continue
      }

      // Format description
      const result = formatJobDescription(job.description)

      // Calculate improvement metrics
      const originalLength = job.description.length
      const formattedLength = result.formatted.length
      const hasHeaders = result.formatted.includes('## ')
      const hasBullets = result.formatted.includes('- ')

      console.log(`${prefix} 📝 ${truncate(job.title, 40)}`)
      console.log(`       ${job.company} | ${job.source}`)
      console.log(`       ${originalLength} chars → ${formattedLength} chars`)
      console.log(`       Headers: ${hasHeaders ? '✓' : '✗'} | Bullets: ${hasBullets ? '✓' : '✗'} | Sections: ${result.metadata.hasStructuredSections ? '✓' : '✗'}`)

      if (args.dryRun) {
        // Show preview
        console.log('\n       --- Preview (first 500 chars) ---')
        console.log(result.formatted.substring(0, 500).split('\n').map(l => '       ' + l).join('\n'))
        console.log('       --- End preview ---\n')
      } else {
        // Update database
        const { error: updateError } = await supabase
          .from('Job')
          .update({
            raw_description: job.description,  // Preserve original
            description: result.formatted,     // Save formatted
          })
          .eq('id', job.id)

        if (updateError) {
          throw new Error(updateError.message)
        }
      }

      updated++
    } catch (err: any) {
      console.log(`${prefix} ❌ ${truncate(job.title, 40)} - Error: ${err.message}`)
      errors++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary:')
  console.log(`  Processed: ${processed}`)
  console.log(`  Updated:   ${updated}`)
  console.log(`  Skipped:   ${skipped}`)
  console.log(`  Errors:    ${errors}`)

  if (args.dryRun) {
    console.log('\n🔍 This was a dry run. No changes were made.')
    console.log('   Run without --dry-run to apply changes.')
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
