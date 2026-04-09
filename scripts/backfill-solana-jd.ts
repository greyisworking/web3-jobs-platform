/**
 * Backfill JD for jobs.solana.com jobs that have empty descriptions.
 * Uses the same fetchJobDescription logic as the crawler (Greenhouse API,
 * Lever API, Ashby JSON-LD scrape, Getro __NEXT_DATA__ initialState, JSON-LD fallback).
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { fetchJobDescription } from './crawlers/platforms'
import { delay } from './utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DRY_RUN = process.argv.includes('--dry-run')
const LIMIT = process.argv.find(a => a.startsWith('--limit='))
  ? parseInt(process.argv.find(a => a.startsWith('--limit='))!.split('=')[1])
  : undefined

async function main() {
  console.log(`🔄 Backfilling JD for jobs.solana.com...${DRY_RUN ? ' (DRY RUN)' : ''}\n`)

  // Get jobs without description or with very short description
  const { data: allJobs, error } = await supabase
    .from('Job')
    .select('id, url, title, company, description')
    .eq('source', 'jobs.solana.com')
    .eq('isActive', true)

  if (error) {
    console.error('Error fetching jobs:', error)
    return
  }

  const noDescJobs = (allJobs || []).filter(
    j => !j.description || j.description.length < 50,
  )

  const toProcess = LIMIT ? noDescJobs.slice(0, LIMIT) : noDescJobs
  console.log(`Found ${noDescJobs.length} jobs without JD (processing ${toProcess.length})\n`)

  let updated = 0
  let failed = 0
  let skipped = 0
  const platformStats: Record<string, { ok: number; fail: number }> = {}

  for (const job of toProcess) {
    let platform = 'unknown'
    try { platform = new URL(job.url).hostname } catch {}
    if (!platformStats[platform]) platformStats[platform] = { ok: 0, fail: 0 }

    const description = await fetchJobDescription(job.url)

    if (description && description.length > 50) {
      if (DRY_RUN) {
        console.log(`✅ [DRY] ${platform}: ${job.title.slice(0, 50)} (${description.length} chars)`)
      } else {
        const { error: updateError } = await supabase
          .from('Job')
          .update({ description, raw_description: description })
          .eq('id', job.id)

        if (!updateError) {
          console.log(`✅ ${platform}: ${job.title.slice(0, 50)} (${description.length} chars)`)
        } else {
          console.log(`❌ Update failed: ${job.title.slice(0, 50)}`)
          failed++
          platformStats[platform].fail++
          continue
        }
      }
      updated++
      platformStats[platform].ok++
    } else {
      console.log(`⚠️  ${platform}: No JD - ${job.title.slice(0, 50)}`)
      skipped++
      platformStats[platform].fail++
    }

    await delay(300)
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Failed:  ${failed}`)
  console.log(`   No JD:   ${skipped}`)
  console.log(`\n   By platform:`)
  for (const [p, c] of Object.entries(platformStats).sort((a, b) => (b[1].ok + b[1].fail) - (a[1].ok + a[1].fail))) {
    console.log(`     ${p}: ${c.ok}/${c.ok + c.fail}`)
  }
}

main().catch(console.error)
