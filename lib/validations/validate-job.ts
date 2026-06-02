import { PrismaClient } from '@prisma/client'
import { jobSchema } from './job'
import { findPriorityCompany } from '../priority-companies'
import { computeBadges } from '../badges'
import { detectRole, normalizeEmploymentType, detectRegion } from '../../scripts/utils'
import { containsKorean, translateJobTitle, translateCompanyName, translateLocation, translateSalary, translateTags, translateDescriptionSafe } from '../translation'
import { cleanJobTitle, cleanCompanyName } from '../clean-job-title'
import { sanitizeDescriptionForStorage } from '../sanitize-description'

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
  'jobstash.xyz': 35,
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
  saved: boolean
  isNew: boolean
}

export async function validateAndSaveJob(
  rawJob: Record<string, unknown>,
  crawlerName: string
): Promise<SaveJobResult> {
  const result = jobSchema.safeParse(rawJob)

  if (!result.success) {
    const errorMsg = `Validation failed: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`
    console.warn(`[${crawlerName}] ${errorMsg}`)
    return { saved: false, isNew: false }
  }

  const job = result.data

  // Auto-translate Korean to English
  const translatedTitle = containsKorean(job.title) ? translateJobTitle(job.title) : job.title
  const cleanedTitle = cleanJobTitle(translatedTitle, job.company)
  const translatedCompany = containsKorean(job.company) ? translateCompanyName(job.company) : job.company
  const cleanedCompany = cleanCompanyName(translatedCompany)
  const translatedLocation = containsKorean(job.location) ? translateLocation(job.location) : job.location
  const translatedSalary = job.salary ? (translateSalary(job.salary ?? undefined) || job.salary) : job.salary
  const translatedTags = translateTags(job.tags)

  // Sanitize and translate description
  const MAX_DESCRIPTION_LENGTH = 50000
  let rawDescription: string | null = null
  if (job.description) {
    let desc = job.description.length > MAX_DESCRIPTION_LENGTH
      ? job.description.slice(0, MAX_DESCRIPTION_LENGTH)
      : job.description
    desc = sanitizeDescriptionForStorage(desc)
    rawDescription = translateDescriptionSafe(desc)
  }

  const translatedRequirements = translateDescriptionSafe(
    job.requirements ? sanitizeDescriptionForStorage(job.requirements as string) : undefined
  )
  const translatedResponsibilities = translateDescriptionSafe(
    job.responsibilities ? sanitizeDescriptionForStorage(job.responsibilities as string) : undefined
  )
  const translatedBenefits = translateDescriptionSafe(
    job.benefits ? sanitizeDescriptionForStorage(job.benefits as string) : undefined
  )

  const detectedRole = job.role || detectRole(cleanedTitle)
  const normalizedType = normalizeEmploymentType(job.type, cleanedTitle)
  const detectedRegion = job.region || detectRegion(job.location)

  try {
    // ── Dedup check (cross-source) ──
    const normTitle = normalizeText(cleanedTitle)
    const normCompany = normalizeText(cleanedCompany)
    const newPriority = getSourcePriority(job.source)

    const sameCompanyJobs = await prisma.job.findMany({
      where: {
        isActive: true,
        company: { contains: cleanedCompany, mode: 'insensitive' },
        url: { not: job.url },
      },
      select: { id: true, url: true, source: true, title: true, company: true, description: true },
      take: 50,
    })

    const crossDupe = sameCompanyJobs.find(
      (existing) =>
        normalizeText(existing.title) === normTitle &&
        normalizeText(existing.company) === normCompany
    )

    if (crossDupe) {
      if (crossDupe.source === job.source) {
        return { saved: true, isNew: false }
      }
      const existingPriority = getSourcePriority(crossDupe.source)
      if (existingPriority >= newPriority) {
        if (job.description && !crossDupe.description) {
          await prisma.job.update({
            where: { id: crossDupe.id },
            data: { description: rawDescription },
          })
        }
        return { saved: true, isNew: false }
      }
      await prisma.job.update({
        where: { id: crossDupe.id },
        data: { isActive: false },
      })
    }

    // Check existing by URL
    const existingJob = await prisma.job.findUnique({
      where: { url: job.url },
      select: { id: true, postedDate: true, description: true, raw_description: true },
    })

    const postedDateToUse = existingJob?.postedDate || job.postedDate || null
    const descriptionToUse = rawDescription || existingJob?.description || null
    const rawDescriptionToUse = existingJob?.raw_description || null

    const jobData = {
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
      postedDate: postedDateToUse,
      description: descriptionToUse,
      raw_description: rawDescriptionToUse,
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
    }

    const saved = await prisma.job.upsert({
      where: { url: job.url },
      update: jobData,
      create: { ...jobData, url: job.url },
      select: { id: true },
    })

    // Enrich after save (non-fatal)
    if (saved?.id) {
      await enrichJobAfterSave(saved.id)
    }

    return { saved: true, isNew: !existingJob }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[${crawlerName}] Prisma upsert failed:`, message)
    return { saved: false, isNew: false }
  }
}

/**
 * Enrich a job row after save — look up priority company registry,
 * set backers/sector/office_location, compute badges.
 */
export async function enrichJobAfterSave(jobId: string): Promise<void> {
  try {
    const row = await prisma.job.findUnique({ where: { id: jobId } })
    if (!row) return

    const match = findPriorityCompany(row.company)
    const updates: Record<string, unknown> = {}

    if (match) {
      if (!row.backers || row.backers.length === 0) updates.backers = match.backers
      if (!row.sector) updates.sector = match.sector
      if (!row.office_location) updates.office_location = match.office_location
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
      await prisma.job.update({ where: { id: jobId }, data: updates })
    }
  } catch (err) {
    console.error(`[enrichJob] Error for ${jobId}:`, err)
  }
}
