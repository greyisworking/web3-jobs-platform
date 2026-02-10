/**
 * Delete all jobs from JobKorea source
 *
 * Usage:
 *   npx tsx scripts/delete-jobkorea.ts          # Dry run (count only)
 *   npx tsx scripts/delete-jobkorea.ts --apply  # Delete jobs
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const dryRun = !process.argv.includes('--apply')

  console.log('🗑️  Delete JobKorea Jobs\n')

  // Find all JobKorea jobs
  const { data: jobs, error: fetchError } = await supabase
    .from('Job')
    .select('id, title, company, source')
    .or('source.ilike.%jobkorea%,source.ilike.%잡코리아%')

  if (fetchError) {
    console.error('Error fetching jobs:', fetchError)
    return
  }

  console.log(`Found ${jobs?.length || 0} JobKorea jobs\n`)

  if (!jobs || jobs.length === 0) {
    console.log('No JobKorea jobs to delete. Done!')
    return
  }

  // Preview
  console.log('Jobs to delete:')
  for (const job of jobs.slice(0, 10)) {
    console.log(`  - ${job.company}: ${job.title}`)
  }
  if (jobs.length > 10) {
    console.log(`  ... and ${jobs.length - 10} more\n`)
  }

  if (dryRun) {
    console.log('\n[DRY RUN] Add --apply to actually delete these jobs')
    return
  }

  // Delete jobs
  console.log('\nDeleting jobs...')
  const jobIds = jobs.map(j => j.id)

  const { error: deleteError } = await supabase
    .from('Job')
    .delete()
    .in('id', jobIds)

  if (deleteError) {
    console.error('Error deleting jobs:', deleteError)
    return
  }

  console.log(`✅ Deleted ${jobs.length} JobKorea jobs`)
}

main().catch(console.error)
