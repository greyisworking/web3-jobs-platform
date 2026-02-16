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

function hasHtmlEntities(text: string | null): boolean {
  if (!text) return false
  return HTML_ENTITY_PATTERNS.some(pattern => pattern.test(text))
}

interface JobRow {
  source: string
  description: string | null
  company: string | null
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // Fetch active jobs with relevant fields for quality analysis
    // Using pagination to handle large datasets
    const BATCH_SIZE = 1000
    let allJobs: JobRow[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const { data: jobs, error } = await supabase
        .from('Job')
        .select('source, description, company')
        .eq('isActive', true)
        .range(offset, offset + BATCH_SIZE - 1)

      if (error) throw error

      if (jobs && jobs.length > 0) {
        allJobs = allJobs.concat(jobs)
        offset += BATCH_SIZE
        hasMore = jobs.length === BATCH_SIZE
      } else {
        hasMore = false
      }
    }

    // Group jobs by source and calculate metrics
    const sourceMetrics = new Map<string, {
      total: number
      withDescription: number
      withValidCompany: number
      withHtmlErrors: number
    }>()

    for (const job of allJobs) {
      const source = job.source || 'unknown'

      if (!sourceMetrics.has(source)) {
        sourceMetrics.set(source, {
          total: 0,
          withDescription: 0,
          withValidCompany: 0,
          withHtmlErrors: 0,
        })
      }

      const metrics = sourceMetrics.get(source)!
      metrics.total++

      // Check JD success (non-empty description)
      if (job.description && job.description.trim().length > 50) {
        metrics.withDescription++
      }

      // Check company success (not UNKNOWN or empty)
      const company = job.company?.trim().toUpperCase()
      if (company && company !== 'UNKNOWN' && company !== '') {
        metrics.withValidCompany++
      }

      // Check for HTML entity errors
      if (hasHtmlEntities(job.description)) {
        metrics.withHtmlErrors++
      }
    }

    // Convert to array with calculated rates
    const qualityData = Array.from(sourceMetrics.entries())
      .map(([source, metrics]) => {
        const jdSuccessRate = metrics.total > 0
          ? (metrics.withDescription / metrics.total) * 100
          : 0
        const companySuccessRate = metrics.total > 0
          ? (metrics.withValidCompany / metrics.total) * 100
          : 0
        const htmlErrorRate = metrics.total > 0
          ? (metrics.withHtmlErrors / metrics.total) * 100
          : 0

        // Quality score calculation:
        // - JD success: 40% weight
        // - Company success: 30% weight
        // - HTML error (inverted): 30% weight
        const qualityScore = Math.round(
          (jdSuccessRate * 0.4) +
          (companySuccessRate * 0.3) +
          ((100 - htmlErrorRate) * 0.3)
        )

        return {
          source,
          total: metrics.total,
          jdSuccessRate: Math.round(jdSuccessRate * 10) / 10,
          companySuccessRate: Math.round(companySuccessRate * 10) / 10,
          htmlErrorRate: Math.round(htmlErrorRate * 10) / 10,
          qualityScore,
        }
      })
      .sort((a, b) => b.total - a.total) // Sort by total count

    // Calculate overall summary
    const totalJobs = allJobs.length
    const totalWithDescription = allJobs.filter(j => j.description && j.description.trim().length > 50).length
    const totalWithValidCompany = allJobs.filter(j => {
      const company = j.company?.trim().toUpperCase()
      return company && company !== 'UNKNOWN' && company !== ''
    }).length
    const totalWithHtmlErrors = allJobs.filter(j => hasHtmlEntities(j.description)).length

    const overallJdSuccessRate = totalJobs > 0 ? (totalWithDescription / totalJobs) * 100 : 0
    const overallCompanySuccessRate = totalJobs > 0 ? (totalWithValidCompany / totalJobs) * 100 : 0
    const overallHtmlErrorRate = totalJobs > 0 ? (totalWithHtmlErrors / totalJobs) * 100 : 0
    const overallQualityScore = Math.round(
      (overallJdSuccessRate * 0.4) +
      (overallCompanySuccessRate * 0.3) +
      ((100 - overallHtmlErrorRate) * 0.3)
    )

    return NextResponse.json({
      sources: qualityData,
      summary: {
        totalJobs,
        totalSources: qualityData.length,
        jdSuccessRate: Math.round(overallJdSuccessRate * 10) / 10,
        companySuccessRate: Math.round(overallCompanySuccessRate * 10) / 10,
        htmlErrorRate: Math.round(overallHtmlErrorRate * 10) / 10,
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
