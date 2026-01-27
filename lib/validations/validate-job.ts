import { supabase } from '../supabase-script'
import { jobSchema, type JobInput } from './job'

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
  const { error } = await supabase.from('Job').upsert(
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
  )

  if (error) {
    await supabase.from('error_logs').insert({
      level: 'ERROR',
      message: `DB upsert failed: ${error.message}`,
      crawler_name: crawlerName,
      stack_trace: JSON.stringify({ job: job.url, code: error.code }),
    })
    return false
  }

  return true
}
