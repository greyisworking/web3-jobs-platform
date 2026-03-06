import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { sanitizeDescriptionForStorage } from '../../lib/sanitize-description'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl || '', supabaseKey || '')

const DRY_RUN = process.argv.includes('--dry-run')

const HTML_TAG_RE = /<\/?(p|div|li|br|span|strong|em|b|i|u|a|ul|ol|h[1-6]|tr|td|th|table|blockquote|section|article|header|footer|img|pre|code)[\s>/]/i

async function main() {
  if (DRY_RUN) console.log('=== DRY RUN MODE ===\n')

  // Fetch all active jobs with descriptions containing < and >
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, source, description')
    .eq('isActive', true)
    .not('description', 'is', null)
    .like('description', '%<%>%')

  if (error) { console.error('Query error:', error.message); return }
  if (!jobs || jobs.length === 0) { console.log('No jobs with HTML-like content found'); return }

  // Filter to actual HTML tags
  const htmlJobs = jobs.filter(j => j.description && HTML_TAG_RE.test(j.description))
  console.log(`Found ${htmlJobs.length} jobs with HTML tags in description`)

  // Group by source for reporting
  const bySource: Record<string, number> = {}
  for (const j of htmlJobs) {
    bySource[j.source || 'unknown'] = (bySource[j.source || 'unknown'] || 0) + 1
  }
  console.log('\nBy source:')
  for (const [src, count] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src}: ${count}`)
  }
  console.log()

  let updated = 0
  let unchanged = 0
  let errors = 0

  for (const job of htmlJobs) {
    const sanitized = sanitizeDescriptionForStorage(job.description)

    // Skip if sanitization didn't change anything
    if (sanitized === job.description) {
      unchanged++
      continue
    }

    if (DRY_RUN) {
      console.log(`  [DRY] ${job.title} @ ${job.company} (${job.source})`)
      console.log(`    before: ${job.description.substring(0, 100)}...`)
      console.log(`    after:  ${sanitized.substring(0, 100)}...`)
      console.log(`    length: ${job.description.length} -> ${sanitized.length}`)
      updated++
      continue
    }

    const { error: updateError } = await supabase
      .from('Job')
      .update({ description: sanitized })
      .eq('id', job.id)

    if (updateError) {
      console.error(`  Error: ${job.title} @ ${job.company}: ${updateError.message}`)
      errors++
    } else {
      updated++
    }
  }

  console.log(`\nDone${DRY_RUN ? ' (dry run)' : ''}: ${updated} sanitized, ${unchanged} unchanged, ${errors} errors`)
}

main().catch(console.error)
