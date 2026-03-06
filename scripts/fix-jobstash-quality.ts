/**
 * One-time cleanup script for existing jobstash data:
 * 1. Deactivate jobs with title > 50 chars
 * 2. Fix salary data (monthly→annual correction)
 * 3. Mark AI-summarized descriptions
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MONTHLY_THRESHOLDS: Record<string, number> = {
  USD: 15000,
  EUR: 14000,
  GBP: 12000,
  MYR: 30000,
  SGD: 20000,
  INR: 200000,
}
const GARBAGE_SALARY = 500

async function main() {
  console.log('=== JobStash Data Quality Cleanup ===\n')

  // 1. Deactivate title > 50 chars
  console.log('--- 1. Title > 50 chars ---')
  const { data: longTitles, error: e1 } = await supabase
    .from('Job')
    .select('id, title, company')
    .eq('source', 'jobstash.xyz')
    .eq('isActive', true)

  if (e1) { console.error('Query error:', e1); return }

  const toDeactivate = (longTitles || []).filter(j => j.title && j.title.length > 50)
  console.log(`Found ${toDeactivate.length} jobs with title > 50 chars`)

  for (const job of toDeactivate) {
    console.log(`  Deactivate: "${job.title.substring(0, 60)}..." (${job.company})`)
    await supabase.from('Job').update({ isActive: false }).eq('id', job.id)
  }

  // 2. Fix salary anomalies
  console.log('\n--- 2. Salary normalization ---')
  const { data: salaryJobs, error: e2 } = await supabase
    .from('Job')
    .select('id, title, company, salaryMin, salaryMax, salaryCurrency, salary')
    .eq('source', 'jobstash.xyz')
    .eq('isActive', true)

  if (e2) { console.error('Query error:', e2); return }

  let salaryFixed = 0
  let salaryCleared = 0

  for (const job of salaryJobs || []) {
    const min = job.salaryMin as number | null
    const max = job.salaryMax as number | null
    if (!min && !max) continue

    const cur = ((job.salaryCurrency as string) || 'USD').toUpperCase()
    const threshold = MONTHLY_THRESHOLDS[cur] || MONTHLY_THRESHOLDS.USD
    const ref = max || min || 0

    if (ref > 0 && ref < GARBAGE_SALARY) {
      // Clear garbage salary
      console.log(`  Clear: ${job.title?.substring(0, 40)} — ${cur} ${ref}`)
      await supabase.from('Job').update({
        salaryMin: null, salaryMax: null, salary: null,
      }).eq('id', job.id)
      salaryCleared++
    } else if (ref > 0 && ref < threshold) {
      // Monthly → annual
      const newMin = min ? min * 12 : null
      const newMax = max ? max * 12 : null
      const salaryStr = formatSalary(newMin, newMax, cur)
      console.log(`  Fix: ${job.title?.substring(0, 40)} — ${cur} ${ref} → ${newMax || newMin}`)
      await supabase.from('Job').update({
        salaryMin: newMin, salaryMax: newMax, salary: salaryStr,
      }).eq('id', job.id)
      salaryFixed++
    }
  }
  console.log(`Salary: ${salaryFixed} corrected, ${salaryCleared} cleared`)

  // 3. Mark AI-summarized descriptions
  console.log('\n--- 3. AI description marking ---')
  const { data: descJobs, error: e3 } = await supabase
    .from('Job')
    .select('id, description')
    .eq('source', 'jobstash.xyz')
    .eq('isActive', true)

  if (e3) { console.error('Query error:', e3); return }

  let aiMarked = 0
  for (const job of descJobs || []) {
    const desc = job.description as string | null
    if (!desc) continue
    if (desc.startsWith('[AI-summarized')) continue // already marked
    if (/^you will\b/i.test(desc.trim())) {
      await supabase.from('Job').update({
        description: `[AI-summarized by JobStash]\n\n${desc}`,
      }).eq('id', job.id)
      aiMarked++
    }
  }
  console.log(`Marked ${aiMarked} AI-summarized descriptions`)

  console.log('\n=== Done ===')
}

function formatSalary(min: number | null, max: number | null, currency: string): string | null {
  if (!min && !max) return null
  if (min && max) return `${currency} ${min.toLocaleString()}–${max.toLocaleString()}`
  if (min) return `${currency} ${min.toLocaleString()}+`
  if (max) return `${currency} up to ${max.toLocaleString()}`
  return null
}

main().catch(console.error)
