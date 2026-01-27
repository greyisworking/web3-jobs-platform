import { supabase } from '../supabase-script'
import { jobSchema, type JobInput } from './job'
import { findPriorityCompany } from '../priority-companies'
import { computeBadges } from '../badges'

export async function validateAndSaveJob(
  rawJob: Record<string, unknown>,
  crawlerName: string
): Promise<boolean> {
  const result = jobSchema.safeParse(rawJob)

  if (!result.success) {
    // 유효성 검사 실패 → error_logs에 기록
    await supabase.from('error_logs').insert({
      level: 'WARN',
      message: `Validation failed: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
      crawler_name: crawlerName,
      stack_trace: JSON.stringify({ raw: rawJob, errors: result.error.issues }),
    })
    return false
  }

  const job = result.data
  const { data: upsertData, error } = await supabase.from('Job').upsert(
    {
      title: job.title,
      company: job.company,
      url: job.url,
      location: job.location,
      type: job.type,
      category: job.category,
      salary: job.salary || null,
      tags: JSON.stringify(job.tags),
      source: job.source,
      region: job.region,
      isActive: true,
      postedDate: job.postedDate?.toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { onConflict: 'url' }
  ).select('id').single()

  if (error) {
    await supabase.from('error_logs').insert({
      level: 'ERROR',
      message: `DB upsert failed: ${error.message}`,
      crawler_name: crawlerName,
      stack_trace: JSON.stringify({ job: job.url, code: error.code }),
    })
    return false
  }

  // Enrich after save (non-fatal)
  if (upsertData?.id) {
    await enrichJobAfterSave(upsertData.id)
  }

  return true
}

/**
 * Enrich a job row after it has been saved.
 * Looks up the company in the priority-companies registry and sets
 * backers / sector / office_location when the DB value is empty.
 * Then computes badges and writes them back.
 *
 * Non-fatal: errors are logged but never thrown.
 */
export async function enrichJobAfterSave(jobId: string): Promise<void> {
  try {
    const { data: row, error: fetchErr } = await supabase
      .from('Job')
      .select('*')
      .eq('id', jobId)
      .single()

    if (fetchErr || !row) {
      console.warn(`[enrichJob] Could not fetch job ${jobId}:`, fetchErr?.message)
      return
    }

    const match = findPriorityCompany(row.company)
    const updates: Record<string, unknown> = {}

    if (match) {
      if (!row.backers || row.backers.length === 0) {
        updates.backers = match.backers
      }
      if (!row.sector) {
        updates.sector = match.sector
      }
      if (!row.office_location) {
        updates.office_location = match.office_location
      }
    }

    const badges = computeBadges({
      backers: (updates.backers as string[] | undefined) ?? row.backers ?? [],
      description: row.description,
      location: row.location,
      postedDate: row.postedDate || row.crawledAt,
      hasToken: match?.hasToken ?? false,
      stage: match?.stage ?? null,
    })

    updates.badges = badges

    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase
        .from('Job')
        .update(updates)
        .eq('id', jobId)

      if (updateErr) {
        console.warn(`[enrichJob] Could not update job ${jobId}:`, updateErr.message)
      }
    }
  } catch (err) {
    console.error(`[enrichJob] Unexpected error for job ${jobId}:`, err)
  }
}
