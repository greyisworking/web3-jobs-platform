/**
 * Deduplicate active jobs
 *
 * Finds same-source duplicates (same normalized title+company)
 * and deactivates all but the most recent one.
 * Also deactivates jobs with empty/garbage company names.
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  console.log(`🔍 Deduplication ${dryRun ? '(DRY RUN)' : '(LIVE)'}...\n`)

  // Fetch all active jobs
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, source, url, postedDate, updatedAt')
    .eq('isActive', true)
    .order('updatedAt', { ascending: false })

  if (error || !jobs) {
    console.error('Failed to fetch jobs:', error)
    process.exit(1)
  }

  console.log(`Total active jobs: ${jobs.length}\n`)

  // 1. Find same-source duplicates (same normalized title+company+source)
  const groupMap = new Map<string, typeof jobs>()
  for (const job of jobs) {
    const key = `${normalizeText(job.title)}||${normalizeText(job.company)}||${job.source}`
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(job)
  }

  const dupeGroups = [...groupMap.entries()].filter(([_, v]) => v.length > 1)
  const toDeactivate: string[] = []

  console.log(`=== Same-source duplicates: ${dupeGroups.length} groups ===`)
  for (const [_, group] of dupeGroups) {
    // Keep the first (most recent by updatedAt), deactivate the rest
    const [keep, ...rest] = group
    console.log(`  "${keep.title}" @ ${keep.company} [${keep.source}]: keep 1, deactivate ${rest.length}`)
    toDeactivate.push(...rest.map(j => j.id))
  }

  // 2. Find jobs with empty/garbage company names
  const garbageCompanies = jobs.filter(j => {
    const c = normalizeText(j.company)
    return c === '' || c === '( )' || c === 'unknown'
  })

  console.log(`\n=== Garbage company names: ${garbageCompanies.length} jobs ===`)
  for (const j of garbageCompanies) {
    console.log(`  "${j.title}" @ "${j.company}" [${j.source}]`)
    if (!toDeactivate.includes(j.id)) {
      toDeactivate.push(j.id)
    }
  }

  console.log(`\n📊 Total to deactivate: ${toDeactivate.length} jobs`)

  if (toDeactivate.length === 0) {
    console.log('✅ No duplicates found!')
    return
  }

  if (dryRun) {
    console.log('🏁 Dry run complete. Run without --dry-run to execute.')
    return
  }

  // Execute deactivation in batches of 50
  let deactivated = 0
  for (let i = 0; i < toDeactivate.length; i += 50) {
    const batch = toDeactivate.slice(i, i + 50)
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

  console.log(`✅ Deactivated ${deactivated} duplicate jobs`)
}

main().catch(console.error)
