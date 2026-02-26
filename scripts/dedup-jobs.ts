/**
 * Deduplicate jobs in the database
 * Keeps the job from the highest priority source and deactivates others
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Source priority (higher = keep this one)
const SOURCE_PRIORITY: Record<string, number> = {
  'priority:greenhouse': 100,
  'priority:lever': 100,
  'priority:ashby': 100,
  'greenhouse': 90,
  'lever': 90,
  'ashby': 90,
  'web3kr.jobs': 80,
  'web3.career': 70,
  'cryptojobslist.com': 60,
  'jobs.sui.io': 50,
  'jobs.solana.com': 50,
  'jobs.arbitrum.io': 50,
  'jobs.avax.network': 50,
  'remoteok.com': 40,
  'remote3.co': 40,
  'rocketpunch.com': 30,
}

function getSourcePriority(source: string): number {
  // Check for exact match first
  if (SOURCE_PRIORITY[source]) return SOURCE_PRIORITY[source]
  // Check for partial match
  for (const [key, priority] of Object.entries(SOURCE_PRIORITY)) {
    if (source.toLowerCase().includes(key.toLowerCase())) return priority
  }
  return 0
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No changes will be made\n')
  } else {
    console.log('\n🧹 DEDUP MODE - Will deactivate duplicates\n')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get all active jobs (no limit)
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, url, source, postedDate, description')
    .eq('isActive', true)
    .order('company', { ascending: true })
    .limit(5000)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!jobs) {
    console.log('No jobs found')
    return
  }

  console.log(`📊 Total active jobs: ${jobs.length}\n`)

  // Group by normalized title + company
  const groups = new Map<string, typeof jobs>()

  for (const job of jobs) {
    const key = `${normalize(job.company)}|${normalize(job.title)}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(job)
  }

  // Find duplicates (groups with more than 1 job)
  const duplicates = Array.from(groups.entries())
    .filter(([_, jobs]) => jobs.length > 1)
    .sort((a, b) => b[1].length - a[1].length)

  console.log(`🔴 Found ${duplicates.length} duplicate groups\n`)

  const idsToDeactivate: string[] = []

  for (const [_key, dupeJobs] of duplicates) {
    // Sort by priority (highest first), then by description length (prefer jobs with descriptions)
    const sorted = [...dupeJobs].sort((a, b) => {
      const priorityDiff = getSourcePriority(b.source) - getSourcePriority(a.source)
      if (priorityDiff !== 0) return priorityDiff
      // If same priority, prefer job with description
      const descA = a.description?.length || 0
      const descB = b.description?.length || 0
      return descB - descA
    })

    const keep = sorted[0]
    const remove = sorted.slice(1)

    console.log(`✅ Keep: "${keep.title}" @ ${keep.company}`)
    console.log(`   [${keep.source}] ${keep.url.substring(0, 50)}...`)

    for (const job of remove) {
      console.log(`   ❌ Remove: [${job.source}] ${job.url.substring(0, 50)}...`)
      idsToDeactivate.push(job.id)
    }
    console.log('')
  }

  console.log(`\n📈 Summary:`)
  console.log(`  Duplicate groups: ${duplicates.length}`)
  console.log(`  Jobs to deactivate: ${idsToDeactivate.length}`)
  console.log(`  Jobs remaining: ${jobs.length - idsToDeactivate.length}`)

  if (!dryRun && idsToDeactivate.length > 0) {
    console.log('\n🔄 Deactivating duplicates...')

    // Deactivate in batches
    const batchSize = 50
    for (let i = 0; i < idsToDeactivate.length; i += batchSize) {
      const batch = idsToDeactivate.slice(i, i + batchSize)
      const { error: updateError } = await supabase
        .from('Job')
        .update({ isActive: false })
        .in('id', batch)

      if (updateError) {
        console.error(`Error deactivating batch ${i / batchSize + 1}:`, updateError)
      } else {
        console.log(`  ✅ Deactivated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(idsToDeactivate.length / batchSize)}`)
      }
    }

    console.log('\n✅ Deduplication complete!')
  } else if (dryRun) {
    console.log('\n💡 Run without --dry-run to actually deactivate duplicates')
  }
}

main().catch(console.error)
