import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// HTML entity patterns to detect
const HTML_ENTITY_PATTERNS = [
  /&lt;/i,
  /&gt;/i,
  /&amp;(?!amp;|lt;|gt;|nbsp;|quot;|#\d+;)/i, // &amp; that's not a valid entity
  /&nbsp;/i,
  /&quot;/i,
  /&#\d+;/i,
]

// Generic/placeholder title patterns
const GENERIC_TITLE_PATTERNS = [
  /^untitled$/i,
  /^job$/i,
  /^position$/i,
  /^hiring$/i,
  /^new\s+job$/i,
  /^job\s+opening$/i,
  /^#\d+$/,
]

function hasHtmlEntities(text: string | null): boolean {
  if (!text) return false
  return HTML_ENTITY_PATTERNS.some(pattern => pattern.test(text))
}

function isValidTitle(title: string | null): boolean {
  if (!title) return false
  const trimmed = title.trim()
  if (trimmed.length < 5) return false
  if (GENERIC_TITLE_PATTERNS.some(p => p.test(trimmed))) return false
  return true
}

function isValidLocation(location: string | null): boolean {
  if (!location) return false
  const trimmed = location.trim().toUpperCase()
  if (trimmed === '' || trimmed === 'N/A' || trimmed === 'UNKNOWN' || trimmed === 'REMOTE') return false
  // Remote is valid but we want to track specific locations too
  return true
}

function hasSkills(skills: string | null): boolean {
  if (!skills) return false
  // Skills stored as JSON array or comma-separated
  try {
    const parsed = JSON.parse(skills)
    return Array.isArray(parsed) && parsed.length > 0
  } catch {
    return skills.trim().length > 0
  }
}

interface JobRow {
  source: string
  title: string | null
  description: string | null
  company: string | null
  location: string | null
  salary: string | null
  employmentType: string | null
  skills: string | null
  applyUrl: string | null
  crawledAt: string | null
  isActive: boolean
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // Fetch active jobs with all relevant fields for quality analysis
    const BATCH_SIZE = 1000
    let allJobs: JobRow[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const { data: jobs, error } = await supabase
        .from('Job')
        .select('source, title, description, company, location, salary, employmentType, skills, applyUrl, crawledAt, isActive')
        .eq('isActive', true)
        .range(offset, offset + BATCH_SIZE - 1)

      if (error) throw error

      if (jobs && jobs.length > 0) {
        allJobs = allJobs.concat(jobs as JobRow[])
        offset += BATCH_SIZE
        hasMore = jobs.length === BATCH_SIZE
      } else {
        hasMore = false
      }
    }

    // Group jobs by source and calculate detailed metrics
    const sourceMetrics = new Map<string, {
      total: number
      // Basic info
      withValidTitle: number
      withValidCompany: number
      withLocation: number
      // JD quality
      withDescription: number
      descriptionLengths: number[]
      shortDescriptions: number // < 200 chars
      withHtmlErrors: number
      // Metadata
      withSalary: number
      withEmploymentType: number
      withSkills: number
      // Links
      withApplyUrl: number
      // Staleness
      oldJobs: number // > 60 days
    }>()

    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    for (const job of allJobs) {
      const source = job.source || 'unknown'

      if (!sourceMetrics.has(source)) {
        sourceMetrics.set(source, {
          total: 0,
          withValidTitle: 0,
          withValidCompany: 0,
          withLocation: 0,
          withDescription: 0,
          descriptionLengths: [],
          shortDescriptions: 0,
          withHtmlErrors: 0,
          withSalary: 0,
          withEmploymentType: 0,
          withSkills: 0,
          withApplyUrl: 0,
          oldJobs: 0,
        })
      }

      const metrics = sourceMetrics.get(source)!
      metrics.total++

      // Title quality
      if (isValidTitle(job.title)) {
        metrics.withValidTitle++
      }

      // Company success
      const company = job.company?.trim().toUpperCase()
      if (company && company !== 'UNKNOWN' && company !== '') {
        metrics.withValidCompany++
      }

      // Location
      if (isValidLocation(job.location)) {
        metrics.withLocation++
      }

      // JD quality
      const descLength = job.description?.trim().length || 0
      if (descLength > 50) {
        metrics.withDescription++
        metrics.descriptionLengths.push(descLength)
      }
      if (descLength > 0 && descLength < 200) {
        metrics.shortDescriptions++
      }

      // HTML errors
      if (hasHtmlEntities(job.description)) {
        metrics.withHtmlErrors++
      }

      // Metadata
      if (job.salary && job.salary.trim()) {
        metrics.withSalary++
      }
      if (job.employmentType && job.employmentType.trim()) {
        metrics.withEmploymentType++
      }
      if (hasSkills(job.skills)) {
        metrics.withSkills++
      }

      // Link quality
      if (job.applyUrl && job.applyUrl.startsWith('http')) {
        metrics.withApplyUrl++
      }

      // Staleness
      if (job.crawledAt && new Date(job.crawledAt) < sixtyDaysAgo) {
        metrics.oldJobs++
      }
    }

    // Convert to array with calculated rates
    const qualityData = Array.from(sourceMetrics.entries())
      .map(([source, metrics]) => {
        const rate = (v: number) => metrics.total > 0 ? (v / metrics.total) * 100 : 0

        const titleSuccessRate = rate(metrics.withValidTitle)
        const companySuccessRate = rate(metrics.withValidCompany)
        const locationRate = rate(metrics.withLocation)
        const jdSuccessRate = rate(metrics.withDescription)
        const shortJdRate = rate(metrics.shortDescriptions)
        const htmlErrorRate = rate(metrics.withHtmlErrors)
        const salaryRate = rate(metrics.withSalary)
        const employmentTypeRate = rate(metrics.withEmploymentType)
        const skillsRate = rate(metrics.withSkills)
        const applyUrlRate = rate(metrics.withApplyUrl)
        const oldJobsRate = rate(metrics.oldJobs)

        // Average JD length (only for jobs with JD)
        const avgJdLength = metrics.descriptionLengths.length > 0
          ? Math.round(metrics.descriptionLengths.reduce((a, b) => a + b, 0) / metrics.descriptionLengths.length)
          : 0

        // New quality score calculation (more comprehensive):
        // - Title quality: 10%
        // - Company success: 15%
        // - JD success: 25%
        // - HTML error (inverted): 15%
        // - Location: 10%
        // - Metadata (salary + employmentType + skills avg): 15%
        // - Link quality: 10%
        const metadataAvg = (salaryRate + employmentTypeRate + skillsRate) / 3
        const qualityScore = Math.round(
          (titleSuccessRate * 0.10) +
          (companySuccessRate * 0.15) +
          (jdSuccessRate * 0.25) +
          ((100 - htmlErrorRate) * 0.15) +
          (locationRate * 0.10) +
          (metadataAvg * 0.15) +
          (applyUrlRate * 0.10)
        )

        return {
          source,
          total: metrics.total,
          // Basic info
          titleSuccessRate: Math.round(titleSuccessRate * 10) / 10,
          companySuccessRate: Math.round(companySuccessRate * 10) / 10,
          locationRate: Math.round(locationRate * 10) / 10,
          // JD quality
          jdSuccessRate: Math.round(jdSuccessRate * 10) / 10,
          avgJdLength,
          shortJdRate: Math.round(shortJdRate * 10) / 10,
          htmlErrorRate: Math.round(htmlErrorRate * 10) / 10,
          // Metadata
          salaryRate: Math.round(salaryRate * 10) / 10,
          employmentTypeRate: Math.round(employmentTypeRate * 10) / 10,
          skillsRate: Math.round(skillsRate * 10) / 10,
          // Links
          applyUrlRate: Math.round(applyUrlRate * 10) / 10,
          // Staleness
          oldJobsRate: Math.round(oldJobsRate * 10) / 10,
          oldJobs: metrics.oldJobs,
          // Overall
          qualityScore,
        }
      })
      .sort((a, b) => b.total - a.total) // Sort by total count

    // Calculate overall summary
    const totalJobs = allJobs.length
    const calcRate = (filter: (j: JobRow) => boolean) => {
      const count = allJobs.filter(filter).length
      return totalJobs > 0 ? (count / totalJobs) * 100 : 0
    }

    const overallTitleRate = calcRate(j => isValidTitle(j.title))
    const overallCompanyRate = calcRate(j => {
      const company = j.company?.trim().toUpperCase()
      return !!(company && company !== 'UNKNOWN' && company !== '')
    })
    const overallLocationRate = calcRate(j => isValidLocation(j.location))
    const overallJdRate = calcRate(j => (j.description?.trim().length || 0) > 50)
    const overallHtmlErrorRate = calcRate(j => hasHtmlEntities(j.description))
    const overallSalaryRate = calcRate(j => !!(j.salary && j.salary.trim()))
    const overallEmploymentTypeRate = calcRate(j => !!(j.employmentType && j.employmentType.trim()))
    const overallSkillsRate = calcRate(j => hasSkills(j.skills))
    const overallApplyUrlRate = calcRate(j => !!(j.applyUrl && j.applyUrl.startsWith('http')))
    const overallOldJobsRate = calcRate(j => j.crawledAt ? new Date(j.crawledAt) < sixtyDaysAgo : false)

    const overallMetadataAvg = (overallSalaryRate + overallEmploymentTypeRate + overallSkillsRate) / 3
    const overallQualityScore = Math.round(
      (overallTitleRate * 0.10) +
      (overallCompanyRate * 0.15) +
      (overallJdRate * 0.25) +
      ((100 - overallHtmlErrorRate) * 0.15) +
      (overallLocationRate * 0.10) +
      (overallMetadataAvg * 0.15) +
      (overallApplyUrlRate * 0.10)
    )

    // Count sources at 90+ quality
    const sourcesAt90Plus = qualityData.filter(s => s.qualityScore >= 90).length
    const totalSources = qualityData.length

    return NextResponse.json({
      sources: qualityData,
      summary: {
        totalJobs,
        totalSources,
        sourcesAt90Plus,
        // Basic info
        titleSuccessRate: Math.round(overallTitleRate * 10) / 10,
        companySuccessRate: Math.round(overallCompanyRate * 10) / 10,
        locationRate: Math.round(overallLocationRate * 10) / 10,
        // JD quality
        jdSuccessRate: Math.round(overallJdRate * 10) / 10,
        htmlErrorRate: Math.round(overallHtmlErrorRate * 10) / 10,
        // Metadata
        salaryRate: Math.round(overallSalaryRate * 10) / 10,
        employmentTypeRate: Math.round(overallEmploymentTypeRate * 10) / 10,
        skillsRate: Math.round(overallSkillsRate * 10) / 10,
        // Links
        applyUrlRate: Math.round(overallApplyUrlRate * 10) / 10,
        // Staleness
        oldJobsRate: Math.round(overallOldJobsRate * 10) / 10,
        oldJobs: allJobs.filter(j => j.crawledAt && new Date(j.crawledAt) < sixtyDaysAgo).length,
        // Overall
        qualityScore: overallQualityScore,
      },
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching crawler quality:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crawler quality metrics' },
      { status: 500 }
    )
  }
}
