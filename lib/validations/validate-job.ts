import { supabase, isSupabaseConfigured } from '../supabase-script'
import { PrismaClient } from '@prisma/client'
import { jobSchema, type JobInput } from './job'
import { findPriorityCompany } from '../priority-companies'
import { computeBadges } from '../badges'

// Prisma client for SQLite fallback
const prisma = new PrismaClient()

export async function validateAndSaveJob(
  rawJob: Record<string, unknown>,
  crawlerName: string
): Promise<boolean> {
  const result = jobSchema.safeParse(rawJob)

  if (!result.success) {
    // Validation failed - log error
    const errorMsg = `Validation failed: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`
    console.warn(`[${crawlerName}] ${errorMsg}`)

    if (isSupabaseConfigured) {
      await supabase.from('error_logs').insert({
        level: 'WARN',
        message: errorMsg,
        crawler_name: crawlerName,
        stack_trace: JSON.stringify({ raw: rawJob, errors: result.error.issues }),
      })
    }
    return false
  }

  const job = result.data

  // Use Prisma for SQLite, Supabase for production
  if (isSupabaseConfigured) {
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
        // Enhanced job details
        description: job.description || null,
        requirements: job.requirements || null,
        responsibilities: job.responsibilities || null,
        benefits: job.benefits || null,
        salaryMin: job.salaryMin || null,
        salaryMax: job.salaryMax || null,
        salaryCurrency: job.salaryCurrency || null,
        deadline: job.deadline?.toISOString() || null,
        experienceLevel: job.experienceLevel || null,
        remoteType: job.remoteType || null,
        companyLogo: job.companyLogo || null,
        companyWebsite: job.companyWebsite || null,
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
  } else {
    // Use Prisma/SQLite
    try {
      await prisma.job.upsert({
        where: { url: job.url },
        update: {
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          category: job.category,
          salary: job.salary || null,
          tags: JSON.stringify(job.tags),
          source: job.source,
          region: job.region,
          isActive: true,
          postedDate: job.postedDate,
          updatedAt: new Date(),
          // Enhanced job details
          description: job.description || null,
          requirements: job.requirements || null,
          responsibilities: job.responsibilities || null,
          benefits: job.benefits || null,
          salaryMin: job.salaryMin || null,
          salaryMax: job.salaryMax || null,
          salaryCurrency: job.salaryCurrency || null,
          deadline: job.deadline || null,
          experienceLevel: job.experienceLevel || null,
          remoteType: job.remoteType || null,
          companyLogo: job.companyLogo || null,
          companyWebsite: job.companyWebsite || null,
        },
        create: {
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
          postedDate: job.postedDate,
          // Enhanced job details
          description: job.description || null,
          requirements: job.requirements || null,
          responsibilities: job.responsibilities || null,
          benefits: job.benefits || null,
          salaryMin: job.salaryMin || null,
          salaryMax: job.salaryMax || null,
          salaryCurrency: job.salaryCurrency || null,
          deadline: job.deadline || null,
          experienceLevel: job.experienceLevel || null,
          remoteType: job.remoteType || null,
          companyLogo: job.companyLogo || null,
          companyWebsite: job.companyWebsite || null,
        },
      })
    } catch (error: any) {
      console.error(`[${crawlerName}] Prisma upsert failed:`, error.message)
      return false
    }
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
  if (!isSupabaseConfigured) return // Skip enrichment for SQLite

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
