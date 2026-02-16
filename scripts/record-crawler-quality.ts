/**
 * Record Crawler Quality Metrics
 *
 * This script calculates and logs crawler quality metrics to CrawlerQualityLog table.
 * Run after crawling or on a daily schedule.
 *
 * Usage:
 *   npx tsx scripts/record-crawler-quality.ts
 *
 * Can be called via cron or after crawler runs.
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// HTML entity patterns to detect
const HTML_ENTITY_PATTERNS = [
  /&lt;/i,
  /&gt;/i,
  /&amp;(?!amp;|lt;|gt;|nbsp;|quot;|#\d+;)/i,
  /&nbsp;/i,
  /&#\d+;/i,
]

function hasHtmlEntities(text: string | null): boolean {
  if (!text) return false
  return HTML_ENTITY_PATTERNS.some(pattern => pattern.test(text))
}

async function main() {
  console.log('📊 Recording Crawler Quality Metrics')
  console.log('=' .repeat(50))
  console.log('')

  // Fetch all active jobs
  const BATCH_SIZE = 1000
  let allJobs: { source: string; description: string | null; company: string | null }[] = []
  let offset = 0
  let hasMore = true

  console.log('Fetching active jobs...')

  while (hasMore) {
    const { data: jobs, error } = await supabase
      .from('Job')
      .select('source, description, company')
      .eq('isActive', true)
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      console.error('Error fetching jobs:', error)
      process.exit(1)
    }

    if (jobs && jobs.length > 0) {
      allJobs = allJobs.concat(jobs)
      offset += BATCH_SIZE
      hasMore = jobs.length === BATCH_SIZE
      process.stdout.write(`\rFetched ${allJobs.length} jobs...`)
    } else {
      hasMore = false
    }
  }

  console.log(`\nTotal active jobs: ${allJobs.length}`)
  console.log('')

  // Group by source and calculate metrics
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

    if (job.description && job.description.trim().length > 50) {
      metrics.withDescription++
    }

    const company = job.company?.trim().toUpperCase()
    if (company && company !== 'UNKNOWN' && company !== '') {
      metrics.withValidCompany++
    }

    if (hasHtmlEntities(job.description)) {
      metrics.withHtmlErrors++
    }
  }

  // Calculate rates and prepare records
  const records = Array.from(sourceMetrics.entries()).map(([source, metrics]) => {
    const jdSuccessRate = metrics.total > 0
      ? Math.round((metrics.withDescription / metrics.total) * 1000) / 10
      : 0
    const companySuccessRate = metrics.total > 0
      ? Math.round((metrics.withValidCompany / metrics.total) * 1000) / 10
      : 0
    const htmlErrorRate = metrics.total > 0
      ? Math.round((metrics.withHtmlErrors / metrics.total) * 1000) / 10
      : 0

    const qualityScore = Math.round(
      (jdSuccessRate * 0.4) +
      (companySuccessRate * 0.3) +
      ((100 - htmlErrorRate) * 0.3)
    )

    return {
      source,
      total_jobs: metrics.total,
      jd_success_rate: jdSuccessRate,
      company_success_rate: companySuccessRate,
      html_error_rate: htmlErrorRate,
      quality_score: qualityScore,
    }
  })

  // Print summary
  console.log('Quality Metrics by Source:')
  console.log('-'.repeat(100))
  console.log(
    'Source'.padEnd(30) +
    'Jobs'.padStart(8) +
    'JD%'.padStart(10) +
    'Company%'.padStart(10) +
    'HTML Err%'.padStart(10) +
    'Score'.padStart(8) +
    'Status'.padStart(10)
  )
  console.log('-'.repeat(100))

  records
    .sort((a, b) => b.total_jobs - a.total_jobs)
    .forEach(r => {
      const status = r.quality_score >= 90 ? '✅ 정상' : r.quality_score >= 70 ? '⚠️ 주의' : '❌ 부족'
      console.log(
        r.source.padEnd(30) +
        r.total_jobs.toString().padStart(8) +
        (r.jd_success_rate + '%').padStart(10) +
        (r.company_success_rate + '%').padStart(10) +
        (r.html_error_rate + '%').padStart(10) +
        r.quality_score.toString().padStart(8) +
        status.padStart(10)
      )
    })

  console.log('')

  // Insert into database
  console.log('Saving to CrawlerQualityLog table...')

  const { error: insertError } = await supabase
    .from('CrawlerQualityLog')
    .insert(records)

  if (insertError) {
    // Check if table doesn't exist
    if (insertError.code === '42P01') {
      console.error('❌ CrawlerQualityLog table does not exist.')
      console.error('   Please run the migration: docs/migrations/crawler_quality_log.sql')
      process.exit(1)
    }
    console.error('Error inserting records:', insertError)
    process.exit(1)
  }

  console.log(`✅ Recorded ${records.length} source quality metrics`)
  console.log('')

  // Print overall summary
  const overallTotal = allJobs.length
  const overallJd = allJobs.filter(j => j.description && j.description.trim().length > 50).length
  const overallCompany = allJobs.filter(j => {
    const c = j.company?.trim().toUpperCase()
    return c && c !== 'UNKNOWN' && c !== ''
  }).length
  const overallHtml = allJobs.filter(j => hasHtmlEntities(j.description)).length

  console.log('📈 Overall Summary:')
  console.log(`   Total Jobs: ${overallTotal}`)
  console.log(`   JD Success Rate: ${(overallJd / overallTotal * 100).toFixed(1)}%`)
  console.log(`   Company Success Rate: ${(overallCompany / overallTotal * 100).toFixed(1)}%`)
  console.log(`   HTML Error Rate: ${(overallHtml / overallTotal * 100).toFixed(1)}%`)
}

main().catch(console.error)
