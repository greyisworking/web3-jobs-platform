/**
 * Expire old jobs — importable module
 *
 * Deactivates jobs older than 60 days.
 * - jobstash.xyz: uses crawledAt (postedDate is unreliable)
 * - All other sources: uses postedDate, fallback to crawledAt
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabase-script'

const EXPIRY_DAYS = 60
const SAFETY_LIMIT = 300

/**
 * Deactivate expired jobs. Returns count of deactivated jobs.
 * Aborts if count exceeds SAFETY_LIMIT.
 */
export async function cleanupExpiredJobs(): Promise<number> {
  if (!isSupabaseConfigured) return 0

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - EXPIRY_DAYS)

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, source, postedDate, crawledAt, updatedAt')
    .eq('isActive', true)

  if (error || !jobs) return 0

  const expiredIds: string[] = []

  for (const job of jobs) {
    let effectiveDate: string | null
    if (job.source === 'jobstash.xyz') {
      effectiveDate = job.crawledAt || job.updatedAt
    } else {
      effectiveDate = job.postedDate || job.crawledAt || job.updatedAt
    }

    if (!effectiveDate) continue
    if (new Date(effectiveDate) < cutoffDate) {
      expiredIds.push(job.id)
    }
  }

  if (expiredIds.length === 0) return 0

  // Safety check
  if (expiredIds.length > SAFETY_LIMIT) {
    console.warn(`[expire] ${expiredIds.length} jobs exceed safety limit (${SAFETY_LIMIT}) — skipping`)
    return 0
  }

  // Deactivate in batches
  let deactivated = 0
  for (let i = 0; i < expiredIds.length; i += 50) {
    const batch = expiredIds.slice(i, i + 50)
    const { error: updateErr } = await supabase
      .from('Job')
      .update({ isActive: false })
      .in('id', batch)

    if (!updateErr) deactivated += batch.length
  }

  return deactivated
}
