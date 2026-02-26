import { supabase, isSupabaseConfigured } from '../supabase-script'
import { PrismaClient } from '@prisma/client'
import { jobSchema } from './job'
import { findPriorityCompany } from '../priority-companies'
import { computeBadges } from '../badges'
import { detectRole, normalizeEmploymentType, detectRegion } from '../../scripts/utils'
import { containsKorean, translateJobTitle, translateCompanyName, translateLocation, translateSalary, translateTags, translateFullField } from '../translation'
import { cleanJobTitle, cleanCompanyName } from '../clean-job-title'
import { createSafeLikePattern } from '../sanitize'
// NOTE: Formatting removed - raw descriptions saved, sanitized on frontend
// import { formatJobDescription, needsFormatting } from '../description-formatter'

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
  'cryptocurrencyjobs.co': 60,
  'jobs.sui.io': 50,
  'jobs.solana.com': 50,
  'jobs.arbitrum.io': 50,
  'jobs.avax.network': 50,
  'crypto.jobs': 45,
  'talent.superteam.fun': 45,
  'wellfound.com': 40,
  'remoteok.com': 40,
  'remote3.co': 40,
  'base.hirechain.io': 35,
  'rocketpunch.com': 30,
  'wanted.co.kr': 30,
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

  // Clean up job title (remove location, experience, abbreviations, etc.)
  const cleanedTitle = cleanJobTitle(translatedTitle, job.company)

  // Translate company name (Korean → English), then clean legal suffixes
  const translatedCompany = containsKorean(job.company)
    ? translateCompanyName(job.company)
    : job.company
  const cleanedCompany = cleanCompanyName(translatedCompany)

  // Translate location (Korean → English)
  const translatedLocation = containsKorean(job.location)
    ? translateLocation(job.location)
    : job.location

  // Translate salary string (Korean → English)
  const translatedSalary = job.salary
    ? (translateSalary(job.salary ?? undefined) || job.salary)
    : job.salary

  // Translate tags (Korean → English)
  const translatedTags = translateTags(job.tags)

  // Store raw description - no formatting, frontend sanitizes
  // Truncate extremely long descriptions (50,000 char limit)
  const MAX_DESCRIPTION_LENGTH = 50000
  let rawDescription: string | null = null
  if (job.description) {
    rawDescription = job.description.length > MAX_DESCRIPTION_LENGTH
      ? job.description.slice(0, MAX_DESCRIPTION_LENGTH)
      : job.description
    // Translate Korean terms if present
    rawDescription = translateFullField(rawDescription) || rawDescription
  }

  const translatedRequirements = translateFullField(job.requirements as string | undefined)
  const translatedResponsibilities = translateFullField(job.responsibilities as string | undefined)
  const translatedBenefits = translateFullField(job.benefits as string | undefined)

  // Auto-detect role from title if not provided
  const detectedRole = job.role || detectRole(cleanedTitle)

  // Normalize employment type (Full-time, Contractor, Ambassador)
  const normalizedType = normalizeEmploymentType(job.type, cleanedTitle)

  // Auto-detect region based on location
  const detectedRegion = job.region || detectRegion(job.location)

  // Use Prisma for SQLite, Supabase for production
  if (isSupabaseConfigured) {
    // ── Cross-source dedup check ──
    // Look for existing job with same normalized title + company (regardless of URL)
    // Use cleaned values for better dedup matching
    const normTitle = normalizeText(cleanedTitle)
    const normCompany = normalizeText(cleanedCompany)
    const newPriority = getSourcePriority(job.source)

    // Query jobs from same company (case-insensitive) to check for duplicates
    const { data: sameCompanyJobs } = await supabase
      .from('Job')
      .select('id, url, source, title, company, postedDate, description')
      .eq('isActive', true)
      .ilike('company', createSafeLikePattern(cleanedCompany))
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
      .select('id, postedDate, description, raw_description')
      .eq('url', job.url)
      .single()

    // Use existing postedDate if available, otherwise use new one
    const postedDateToUse = existingJob?.postedDate || job.postedDate?.toISOString()

    // For description: use raw value if provided, otherwise keep existing
    // Frontend sanitizes during rendering
    const descriptionToUse = rawDescription || existingJob?.description || null
    // raw_description field deprecated but kept for backward compatibility
    const rawDescriptionToUse = existingJob?.raw_description || null

    const { data: upsertData, error } = await supabase.from('Job').upsert(
      {
        title: cleanedTitle,
        company: cleanedCompany,
        url: job.url,
        location: translatedLocation,
        type: normalizedType,
        category: job.category,
        role: detectedRole,
        salary: translatedSalary || null,
        tags: JSON.stringify(translatedTags),
        source: job.source,
        region: detectedRegion,
        isActive: true,
        // Preserve original postedDate on re-crawl to maintain correct sorting
        postedDate: postedDateToUse,
        updatedAt: new Date().toISOString(),
        // Enhanced job details - use translated values, preserve existing if no new value
        description: descriptionToUse,
        raw_description: rawDescriptionToUse,  // Original unformatted description for toggle
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
          title: cleanedTitle,
          company: cleanedCompany,
          location: translatedLocation,
          type: normalizedType,
          category: job.category,
          role: detectedRole,
          salary: translatedSalary || null,
          tags: JSON.stringify(translatedTags),
          source: job.source,
          region: detectedRegion,
          isActive: true,
          postedDate: job.postedDate,
          updatedAt: new Date(),
          // Enhanced job details - use formatted/translated values
          description: rawDescription || null,
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
          title: cleanedTitle,
          company: cleanedCompany,
          url: job.url,
          location: translatedLocation,
          type: normalizedType,
          category: job.category,
          role: detectedRole,
          salary: translatedSalary || null,
          tags: JSON.stringify(translatedTags),
          source: job.source,
          region: detectedRegion,
          isActive: true,
          postedDate: job.postedDate,
          // Enhanced job details - use formatted/translated values
          description: rawDescription || null,
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
