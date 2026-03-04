/**
 * Expire old jobs
 *
 * Deactivates jobs older than EXPIRY_DAYS (default 60).
 * - jobstash.xyz: uses crawledAt (postedDate is unreliable)
 * - All other sources: uses postedDate
 *
 * Usage:
 *   npx tsx scripts/cleanup/expire-old-jobs.ts --dry-run   # Preview only
 *   npx tsx scripts/cleanup/expire-old-jobs.ts              # Execute
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EXPIRY_DAYS = 60
const SAFETY_LIMIT = 300 // Abort if more than this many would be deactivated

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  console.log(`🕐 Expire old jobs (>${EXPIRY_DAYS} days) ${dryRun ? '(DRY RUN)' : '(LIVE)'}...\n`)

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - EXPIRY_DAYS)
  const cutoffISO = cutoffDate.toISOString()

  console.log(`Cutoff date: ${cutoffISO} (${EXPIRY_DAYS} days ago)\n`)

  // Fetch all active jobs with date fields
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, source, postedDate, crawledAt, updatedAt')
    .eq('isActive', true)

  if (error || !jobs) {
    console.error('Failed to fetch jobs:', error)
    process.exit(1)
  }

  console.log(`Total active jobs: ${jobs.length}\n`)

  // Determine effective date per job and find expired ones
  const expired: typeof jobs = []
  const sourceBreakdown: Record<string, number> = {}

  for (const job of jobs) {
    // jobstash.xyz: use crawledAt (postedDate is unreliable — avg 1,443 days old)
    // All other sources: use postedDate, fallback to crawledAt
    let effectiveDate: string | null
    if (job.source === 'jobstash.xyz') {
      effectiveDate = job.crawledAt || job.updatedAt
    } else {
      effectiveDate = job.postedDate || job.crawledAt || job.updatedAt
    }

    if (!effectiveDate) continue

    if (new Date(effectiveDate) < cutoffDate) {
      expired.push(job)
      sourceBreakdown[job.source] = (sourceBreakdown[job.source] || 0) + 1
    }
  }

  // Show source-by-source breakdown
  console.log(`=== 소스별 만료 대상 (${expired.length}건) ===`)
  const sortedSources = Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])
  for (const [source, count] of sortedSources) {
    console.log(`  ${source}: ${count}건`)
  }

  if (expired.length === 0) {
    console.log('\n✅ No expired jobs found!')
    return
  }

  // Safety check: abort if too many
  if (expired.length > SAFETY_LIMIT) {
    console.error(`\n🛑 SAFETY ABORT: ${expired.length} jobs exceed limit of ${SAFETY_LIMIT}.`)
    console.error('This is unexpected. Please review the breakdown above and adjust SAFETY_LIMIT if correct.')
    process.exit(1)
  }

  console.log(`\n📊 Total to deactivate: ${expired.length}건 (safety limit: ${SAFETY_LIMIT})`)

  // Show sample of affected jobs
  console.log('\n--- Sample (first 10) ---')
  for (const job of expired.slice(0, 10)) {
    const effectiveDate = job.source === 'jobstash.xyz'
      ? (job.crawledAt || job.updatedAt)
      : (job.postedDate || job.crawledAt || job.updatedAt)
    console.log(`  "${job.title}" @ ${job.company} [${job.source}] — ${effectiveDate?.slice(0, 10)}`)
  }

  if (dryRun) {
    console.log('\n🏁 Dry run complete. Run without --dry-run to execute.')
    return
  }

  // Execute deactivation in batches
  const ids = expired.map(j => j.id)
  let deactivated = 0
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const { error: updateErr } = await supabase
      .from('Job')
      .update({ isActive: false })
      .in('id', batch)

    if (updateErr) {
      console.error(`  Error deactivating batch ${i}:`, updateErr.message)
    } else {
      deactivated += batch.length
    }
  }

  console.log(`\n✅ Deactivated ${deactivated} expired jobs`)
}

main().catch(console.error)
