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
  if (trimmed === '' || trimmed === 'N/A' || trimmed === 'UNKNOWN') return false
  return true
}

function hasSkills(skills: string | null): boolean {
  if (!skills) return false
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
}

async function main() {
  console.log('📊 Recording Crawler Quality Metrics (Detailed)')
  console.log('=' .repeat(60))
  console.log('')

  // Fetch all active jobs with all fields
  const BATCH_SIZE = 1000
  let allJobs: JobRow[] = []
  let offset = 0
  let hasMore = true

  console.log('Fetching active jobs...')

  while (hasMore) {
    const { data: jobs, error } = await supabase
      .from('Job')
      .select('source, title, description, company, location, salary, employmentType, skills, applyUrl, crawledAt')
      .eq('isActive', true)
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      console.error('Error fetching jobs:', error)
      process.exit(1)
    }

    if (jobs && jobs.length > 0) {
      allJobs = allJobs.concat(jobs as JobRow[])
      offset += BATCH_SIZE
      hasMore = jobs.length === BATCH_SIZE
      process.stdout.write(`\rFetched ${allJobs.length} jobs...`)
    } else {
      hasMore = false
    }
  }

  console.log(`\nTotal active jobs: ${allJobs.length}`)
  console.log('')

  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  // Group by source and calculate detailed metrics
  const sourceMetrics = new Map<string, {
    total: number
    withValidTitle: number
    withDescription: number
    withValidCompany: number
    withLocation: number
    withHtmlErrors: number
    withSalary: number
    withEmploymentType: number
    withSkills: number
    withApplyUrl: number
    oldJobs: number
    descriptionLengths: number[]
  }>()

  for (const job of allJobs) {
    const source = job.source || 'unknown'

    if (!sourceMetrics.has(source)) {
      sourceMetrics.set(source, {
        total: 0,
        withValidTitle: 0,
        withDescription: 0,
        withValidCompany: 0,
        withLocation: 0,
        withHtmlErrors: 0,
        withSalary: 0,
        withEmploymentType: 0,
        withSkills: 0,
        withApplyUrl: 0,
        oldJobs: 0,
        descriptionLengths: [],
      })
    }

    const metrics = sourceMetrics.get(source)!
    metrics.total++

    if (isValidTitle(job.title)) metrics.withValidTitle++

    const descLength = job.description?.trim().length || 0
    if (descLength > 50) {
      metrics.withDescription++
      metrics.descriptionLengths.push(descLength)
    }

    const company = job.company?.trim().toUpperCase()
    if (company && company !== 'UNKNOWN' && company !== '') {
      metrics.withValidCompany++
    }

    if (isValidLocation(job.location)) metrics.withLocation++
    if (hasHtmlEntities(job.description)) metrics.withHtmlErrors++
    if (job.salary?.trim()) metrics.withSalary++
    if (job.employmentType?.trim()) metrics.withEmploymentType++
    if (hasSkills(job.skills)) metrics.withSkills++
    if (job.applyUrl?.startsWith('http')) metrics.withApplyUrl++
    if (job.crawledAt && new Date(job.crawledAt) < sixtyDaysAgo) metrics.oldJobs++
  }

  // Calculate rates and prepare records
  const records = Array.from(sourceMetrics.entries()).map(([source, metrics]) => {
    const rate = (v: number) => metrics.total > 0
      ? Math.round((v / metrics.total) * 1000) / 10
      : 0

    const titleSuccessRate = rate(metrics.withValidTitle)
    const jdSuccessRate = rate(metrics.withDescription)
    const companySuccessRate = rate(metrics.withValidCompany)
    const locationRate = rate(metrics.withLocation)
    const htmlErrorRate = rate(metrics.withHtmlErrors)
    const salaryRate = rate(metrics.withSalary)
    const employmentTypeRate = rate(metrics.withEmploymentType)
    const skillsRate = rate(metrics.withSkills)
    const applyUrlRate = rate(metrics.withApplyUrl)
    const oldJobsRate = rate(metrics.oldJobs)

    const avgJdLength = metrics.descriptionLengths.length > 0
      ? Math.round(metrics.descriptionLengths.reduce((a, b) => a + b, 0) / metrics.descriptionLengths.length)
      : 0

    // New comprehensive quality score
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
      total_jobs: metrics.total,
      title_success_rate: titleSuccessRate,
      jd_success_rate: jdSuccessRate,
      company_success_rate: companySuccessRate,
      location_rate: locationRate,
      html_error_rate: htmlErrorRate,
      salary_rate: salaryRate,
      employment_type_rate: employmentTypeRate,
      skills_rate: skillsRate,
      apply_url_rate: applyUrlRate,
      old_jobs_rate: oldJobsRate,
      avg_jd_length: avgJdLength,
      quality_score: qualityScore,
    }
  })

  // Print summary
  console.log('Quality Metrics by Source (Detailed):')
  console.log('-'.repeat(120))
  console.log(
    'Source'.padEnd(25) +
    'Jobs'.padStart(7) +
    'Title%'.padStart(8) +
    'JD%'.padStart(7) +
    'Co%'.padStart(6) +
    'Loc%'.padStart(6) +
    'HTML%'.padStart(7) +
    'Sal%'.padStart(6) +
    'Skill%'.padStart(7) +
    'Link%'.padStart(7) +
    'Old%'.padStart(6) +
    'Score'.padStart(7) +
    'Status'.padStart(10)
  )
  console.log('-'.repeat(120))

  records
    .sort((a, b) => b.total_jobs - a.total_jobs)
    .forEach(r => {
      const status = r.quality_score >= 90 ? '✅ 정상' : r.quality_score >= 70 ? '⚠️ 주의' : '❌ 부족'
      console.log(
        r.source.substring(0, 24).padEnd(25) +
        r.total_jobs.toString().padStart(7) +
        (r.title_success_rate + '%').padStart(8) +
        (r.jd_success_rate + '%').padStart(7) +
        (r.company_success_rate + '%').padStart(6) +
        (r.location_rate + '%').padStart(6) +
        (r.html_error_rate + '%').padStart(7) +
        (r.salary_rate + '%').padStart(6) +
        (r.skills_rate + '%').padStart(7) +
        (r.apply_url_rate + '%').padStart(7) +
        (r.old_jobs_rate + '%').padStart(6) +
        r.quality_score.toString().padStart(7) +
        status.padStart(10)
      )
    })

  console.log('')

  // Insert into database (basic fields for backward compatibility)
  console.log('Saving to CrawlerQualityLog table...')

  // Transform to the database schema (basic fields)
  const dbRecords = records.map(r => ({
    source: r.source,
    total_jobs: r.total_jobs,
    jd_success_rate: r.jd_success_rate,
    company_success_rate: r.company_success_rate,
    html_error_rate: r.html_error_rate,
    quality_score: r.quality_score,
  }))

  const { error: insertError } = await supabase
    .from('CrawlerQualityLog')
    .insert(dbRecords)

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
  const overallTitle = allJobs.filter(j => isValidTitle(j.title)).length
  const overallJd = allJobs.filter(j => j.description && j.description.trim().length > 50).length
  const overallCompany = allJobs.filter(j => {
    const c = j.company?.trim().toUpperCase()
    return c && c !== 'UNKNOWN' && c !== ''
  }).length
  const overallLocation = allJobs.filter(j => isValidLocation(j.location)).length
  const overallHtml = allJobs.filter(j => hasHtmlEntities(j.description)).length
  const overallSalary = allJobs.filter(j => j.salary?.trim()).length
  const overallSkills = allJobs.filter(j => hasSkills(j.skills)).length
  const overallApplyUrl = allJobs.filter(j => j.applyUrl?.startsWith('http')).length
  const overallOld = allJobs.filter(j => j.crawledAt && new Date(j.crawledAt) < sixtyDaysAgo).length

  // Count sources at 90+
  const sourcesAt90Plus = records.filter(r => r.quality_score >= 90).length
  const totalSources = records.length

  console.log('📈 Overall Summary:')
  console.log('-'.repeat(40))
  console.log(`   Total Jobs:            ${overallTotal.toLocaleString()}`)
  console.log(`   Sources at 90+:        ${sourcesAt90Plus}/${totalSources}`)
  console.log('')
  console.log('   Basic Info:')
  console.log(`     Title Success:       ${(overallTitle / overallTotal * 100).toFixed(1)}%`)
  console.log(`     Company Success:     ${(overallCompany / overallTotal * 100).toFixed(1)}%`)
  console.log(`     Location Success:    ${(overallLocation / overallTotal * 100).toFixed(1)}%`)
  console.log('')
  console.log('   JD Quality:')
  console.log(`     JD Success:          ${(overallJd / overallTotal * 100).toFixed(1)}%`)
  console.log(`     HTML Error Rate:     ${(overallHtml / overallTotal * 100).toFixed(1)}%`)
  console.log('')
  console.log('   Metadata:')
  console.log(`     Salary Info:         ${(overallSalary / overallTotal * 100).toFixed(1)}%`)
  console.log(`     Skills Info:         ${(overallSkills / overallTotal * 100).toFixed(1)}%`)
  console.log(`     Apply URL Valid:     ${(overallApplyUrl / overallTotal * 100).toFixed(1)}%`)
  console.log('')
  console.log('   Staleness:')
  console.log(`     60+ Days Old:        ${overallOld.toLocaleString()} (${(overallOld / overallTotal * 100).toFixed(1)}%)`)
}

main().catch(console.error)
