/**
 * Check for duplicate jobs in the database
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('\n🔍 Checking for duplicate jobs...\n')

  // Get all active jobs (increased limit)
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, url, source, postedDate')
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

  // Normalize for comparison
  function normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

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

  console.log(`🔴 Found ${duplicates.length} duplicate groups:\n`)

  let totalDuplicateJobs = 0
  for (const [key, dupeJobs] of duplicates.slice(0, 20)) {
    const [company, title] = key.split('|')
    console.log(`  ${dupeJobs.length}x "${dupeJobs[0].title}" @ ${dupeJobs[0].company}`)
    for (const job of dupeJobs) {
      console.log(`      - [${job.source}] ${job.url.substring(0, 60)}...`)
    }
    totalDuplicateJobs += dupeJobs.length - 1 // -1 because we keep one
  }

  if (duplicates.length > 20) {
    console.log(`  ... and ${duplicates.length - 20} more groups`)
  }

  const totalToRemove = duplicates.reduce((sum, [_, jobs]) => sum + jobs.length - 1, 0)
  console.log(`\n📈 Summary:`)
  console.log(`  Total duplicate groups: ${duplicates.length}`)
  console.log(`  Total jobs to remove: ${totalToRemove}`)
  console.log(`  Jobs after dedup: ${jobs.length - totalToRemove}`)

  // Check sources causing most duplicates
  const sourceDupes = new Map<string, number>()
  for (const [_, dupeJobs] of duplicates) {
    for (const job of dupeJobs) {
      sourceDupes.set(job.source, (sourceDupes.get(job.source) || 0) + 1)
    }
  }

  console.log(`\n📦 Duplicates by source:`)
  const sortedSources = Array.from(sourceDupes.entries()).sort((a, b) => b[1] - a[1])
  for (const [source, count] of sortedSources) {
    console.log(`  ${source}: ${count}`)
  }
}

main().catch(console.error)
