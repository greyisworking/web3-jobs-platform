import { supabase, isSupabaseConfigured } from '../supabase-script'
import { PrismaClient } from '@prisma/client'
import { jobSchema, type JobInput } from './job'
import { findPriorityCompany } from '../priority-companies'
import { computeBadges } from '../badges'
import { detectRole } from '../../scripts/utils'
import { containsKorean, translateJobTitle, quickTranslateTerms } from '../translation'

// Prisma client for SQLite fallback
const prisma = new PrismaClient()

// ══════════════════════════════════════════════════════════
// Cross-source deduplication
// ══════════════════════════════════════════════════════════

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Source priority (higher = better, skip if existing job has higher priority)
const SOURCE_PRIORITY: Record<string, number> = {
  'priority:greenhouse': 100,
  'priority:lever': 100,
  'priority:ashby': 100,
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
  if (SOURCE_PRIORITY[source]) return SOURCE_PRIORITY[source]
  for (const [key, priority] of Object.entries(SOURCE_PRIORITY)) {
    if (source.toLowerCase().includes(key.toLowerCase())) return priority
  }
  return 0
}

export interface SaveJobResult {
  saved: boolean    // Whether the job was saved/updated successfully
  isNew: boolean    // Whether this is a brand new job (not an update)
}

export async function validateAndSaveJob(
  rawJob: Record<string, unknown>,
  crawlerName: string
): Promise<SaveJobResult> {
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
    return { saved: false, isNew: false }
  }

  const job = result.data

  // Auto-translate Korean to English for better searchability
  const translatedTitle = containsKorean(job.title)
    ? translateJobTitle(job.title)
    : job.title

  // Also translate description if it contains Korean
  const translateField = (text: string | null | undefined): string | null => {
    if (!text) return null
    if (!containsKorean(text)) return text
    return quickTranslateTerms(text)
      .replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  const translatedDescription = translateField(job.description)
  const translatedRequirements = translateField(job.requirements)
  const translatedResponsibilities = translateField(job.responsibilities)
  const translatedBenefits = translateField(job.benefits)

  // Auto-detect role from title if not provided
  const detectedRole = job.role || detectRole(translatedTitle)

  // Use Prisma for SQLite, Supabase for production
  if (isSupabaseConfigured) {
    // ── Cross-source dedup check ──
    // Look for existing job with same normalized title + company (regardless of URL)
    const normTitle = normalizeText(job.title)
    const normCompany = normalizeText(job.company)
    const newPriority = getSourcePriority(job.source)

    // Query jobs from same company (case-insensitive) to check for duplicates
    const { data: sameCompanyJobs } = await supabase
      .from('Job')
      .select('id, url, source, title, company, postedDate, description')
      .eq('isActive', true)
      .ilike('company', `%${job.company.replace(/[%_]/g, '')}%`)
      .neq('url', job.url)
      .limit(50)

    // Find cross-source duplicate (same normalized title + company)
    const crossDupe = sameCompanyJobs?.find((existing) => {
      return (
        normalizeText(existing.title) === normTitle &&
        normalizeText(existing.company) === normCompany
      )
    })

    if (crossDupe) {
      const existingPriority = getSourcePriority(crossDupe.source)
      if (existingPriority >= newPriority) {
        // Existing job has equal or higher priority - skip this one
        // But update description if we have one and they don't
        if (job.description && !crossDupe.description) {
          await supabase
            .from('Job')
            .update({ description: job.description })
            .eq('id', crossDupe.id)
        }
        return { saved: true, isNew: false } // Duplicate from different source - not a new job
      }
      // New source has higher priority - deactivate the old one and continue with insert
      await supabase
        .from('Job')
        .update({ isActive: false })
        .eq('id', crossDupe.id)
    }

    // Check if job already exists by URL to preserve original values
    const { data: existingJob } = await supabase
      .from('Job')
      .select('id, postedDate, description')
      .eq('url', job.url)
      .single()

    // Use existing postedDate if available, otherwise use new one
    const postedDateToUse = existingJob?.postedDate || job.postedDate?.toISOString()

    // For description: use translated value if provided, otherwise keep existing
    // This allows re-crawl to ADD descriptions to jobs that didn't have them
    const descriptionToUse = translatedDescription || existingJob?.description || null

    const { data: upsertData, error } = await supabase.from('Job').upsert(
      {
        title: translatedTitle,
        company: job.company,
        url: job.url,
        location: job.location,
        type: job.type,
        category: job.category,
        role: detectedRole,
        salary: job.salary || null,
        tags: JSON.stringify(job.tags),
        source: job.source,
        region: job.region,
        isActive: true,
        // Preserve original postedDate on re-crawl to maintain correct sorting
        postedDate: postedDateToUse,
        updatedAt: new Date().toISOString(),
        // Enhanced job details - use translated values, preserve existing if no new value
        description: descriptionToUse,
        requirements: translatedRequirements || null,
        responsibilities: translatedResponsibilities || null,
        benefits: translatedBenefits || null,
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
      return { saved: false, isNew: false }
    }

    // Enrich after save (non-fatal)
    if (upsertData?.id) {
      await enrichJobAfterSave(upsertData.id)
    }

    // Return whether this was a new job or an update
    return { saved: true, isNew: !existingJob }
  } else {
    // Use Prisma/SQLite
    // Check if job exists to determine if this is new or update
    let existingJob: { id: string } | null = null
    try {
      existingJob = await prisma.job.findUnique({
        where: { url: job.url },
        select: { id: true },
      })

      await prisma.job.upsert({
        where: { url: job.url },
        update: {
          title: translatedTitle,
          company: job.company,
          location: job.location,
          type: job.type,
          category: job.category,
          role: detectedRole,
          salary: job.salary || null,
          tags: JSON.stringify(job.tags),
          source: job.source,
          region: job.region,
          isActive: true,
          postedDate: job.postedDate,
          updatedAt: new Date(),
          // Enhanced job details - use translated values
          description: translatedDescription || null,
          requirements: translatedRequirements || null,
          responsibilities: translatedResponsibilities || null,
          benefits: translatedBenefits || null,
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
          title: translatedTitle,
          company: job.company,
          url: job.url,
          location: job.location,
          type: job.type,
          category: job.category,
          role: detectedRole,
          salary: job.salary || null,
          tags: JSON.stringify(job.tags),
          source: job.source,
          region: job.region,
          isActive: true,
          postedDate: job.postedDate,
          // Enhanced job details - use translated values
          description: translatedDescription || null,
          requirements: translatedRequirements || null,
          responsibilities: translatedResponsibilities || null,
          benefits: translatedBenefits || null,
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[${crawlerName}] Prisma upsert failed:`, message)
      return { saved: false, isNew: false }
    }

    return { saved: true, isNew: !existingJob }
  }
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
