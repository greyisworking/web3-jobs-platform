/**
 * NEUN Weekly Newsletter Generator
 *
 * Generates a newsletter with recent job postings, stats, and trends.
 *
 * Usage:
 *   npx tsx scripts/generate-weekly-newsletter.ts           # Last 7 days
 *   npx tsx scripts/generate-weekly-newsletter.ts --days 14 # Last 14 days
 *   npx tsx scripts/generate-weekly-newsletter.ts --output  # Save to files
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import 'dotenv/config'

const SITE_URL = 'https://neun.wtf'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Job {
  id: string
  title: string
  company: string
  location: string
  role: string | null
  salary: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  remoteType: string | null
  is_featured: boolean | null
  crawledAt: string | null
}

interface Stats {
  totalJobs: number
  roleBreakdown: Record<string, number>
  remoteRate: number
  locationBreakdown: Record<string, number>
  topCompanies: { name: string; count: number }[]
}

async function fetchRecentJobs(days: number): Promise<Job[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  console.log(`\n📅 Fetching jobs from last ${days} days...`)

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, location, role, salary, salaryMin, salaryMax, salaryCurrency, remoteType, is_featured, crawledAt')
    .eq('isActive', true)
    .gte('crawledAt', startDate.toISOString())
    .order('crawledAt', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  console.log(`✅ Found ${jobs?.length || 0} jobs\n`)
  return jobs || []
}

function calculateStats(jobs: Job[]): Stats {
  const roleBreakdown: Record<string, number> = {}
  const locationBreakdown: Record<string, number> = {}
  const companyCount: Record<string, number> = {}
  let remoteCount = 0

  for (const job of jobs) {
    // Role
    const role = job.role || 'Other'
    roleBreakdown[role] = (roleBreakdown[role] || 0) + 1

    // Location
    const location = normalizeLocation(job.location)
    locationBreakdown[location] = (locationBreakdown[location] || 0) + 1

    // Remote
    if (job.remoteType === 'Remote' || job.location?.toLowerCase().includes('remote')) {
      remoteCount++
    }

    // Company
    companyCount[job.company] = (companyCount[job.company] || 0) + 1
  }

  const topCompanies = Object.entries(companyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  return {
    totalJobs: jobs.length,
    roleBreakdown,
    remoteRate: jobs.length > 0 ? Math.round((remoteCount / jobs.length) * 100) : 0,
    locationBreakdown,
    topCompanies,
  }
}

function normalizeLocation(location: string): string {
  if (!location) return 'Unknown'
  const lower = location.toLowerCase()
  if (lower.includes('remote')) return 'Remote'
  if (lower.includes('korea') || lower.includes('seoul') || lower.includes('한국')) return 'Korea'
  if (lower.includes('usa') || lower.includes('united states') || lower.includes('new york') || lower.includes('san francisco')) return 'USA'
  if (lower.includes('europe') || lower.includes('london') || lower.includes('berlin')) return 'Europe'
  if (lower.includes('singapore')) return 'Singapore'
  return 'Other'
}

function getWeekLabel(): string {
  const date = new Date()
  const month = date.toLocaleString('en-US', { month: 'short' })
  const weekOfMonth = Math.ceil(date.getDate() / 7)
  return `${month} Week ${weekOfMonth}`
}

function formatSalary(job: Job): string {
  if (job.salaryMin && job.salaryMax) {
    const currency = job.salaryCurrency || 'USD'
    const symbol = currency === 'USD' ? '$' : currency === 'KRW' ? '₩' : currency
    if (currency === 'KRW') {
      return `${symbol}${Math.round(job.salaryMin / 10000)}만-${Math.round(job.salaryMax / 10000)}만`
    }
    return `${symbol}${Math.round(job.salaryMin / 1000)}K-${symbol}${Math.round(job.salaryMax / 1000)}K`
  }
  return job.salary || '-'
}

function generateMarkdown(jobs: Job[], stats: Stats): string {
  const week = getWeekLabel()
  const today = new Date().toISOString().split('T')[0]
  const utmParams = `utm_source=newsletter&utm_medium=email&utm_campaign=weekly-${today}`

  const topRole = Object.entries(stats.roleBreakdown)
    .sort((a, b) => b[1] - a[1])[0]
  const topRolePercent = topRole
    ? Math.round((topRole[1] / stats.totalJobs) * 100)
    : 0

  // Featured jobs
  const featuredJobs = jobs.filter(j => j.is_featured).slice(0, 10)
  const displayJobs = featuredJobs.length >= 5 ? featuredJobs : jobs.slice(0, 10)

  let md = `# 🚀 NEUN Weekly | ${week}

gm ser, this week's Web3 job market is heating up 🔥

## 📊 This Week's Highlights
- New listings: **${stats.totalJobs}**
- Top role: **${topRole?.[0] || 'Engineering'}** (${topRolePercent}%)
- Remote rate: **${stats.remoteRate}%**

## 🔥 Featured Positions

| Company | Role | Location | Salary |
|---------|------|----------|--------|
`

  for (const job of displayJobs) {
    const jobUrl = `${SITE_URL}/jobs/${job.id}?${utmParams}`
    const salary = formatSalary(job)
    md += `| [${job.company}](${jobUrl}) | [${job.title}](${jobUrl}) | ${job.location || 'Remote'} | ${salary} |\n`
  }

  // Role breakdown
  md += `\n## 📈 Role Breakdown\n`
  const sortedRoles = Object.entries(stats.roleBreakdown).sort((a, b) => b[1] - a[1])
  for (const [role, count] of sortedRoles) {
    const percent = Math.round((count / stats.totalJobs) * 100)
    md += `- **${role}**: ${count} (${percent}%)\n`
  }

  // Top companies
  md += `\n## 🏢 Companies to Watch\n`
  for (const company of stats.topCompanies.slice(0, 5)) {
    md += `- **${company.name}** - ${company.count} open positions\n`
  }

  // Location breakdown
  md += `\n## 🌍 Location Breakdown\n`
  const sortedLocations = Object.entries(stats.locationBreakdown).sort((a, b) => b[1] - a[1])
  for (const [location, count] of sortedLocations) {
    md += `- ${location}: ${count}\n`
  }

  md += `
---

[View all jobs →](${SITE_URL}/jobs?${utmParams})

*Powered by NEUN | Built for Web3 natives*
`

  return md
}

function generateHtml(jobs: Job[], stats: Stats): string {
  const week = getWeekLabel()
  const today = new Date().toISOString().split('T')[0]
  const utmParams = `utm_source=newsletter&utm_medium=email&utm_campaign=weekly-${today}`

  const topRole = Object.entries(stats.roleBreakdown)
    .sort((a, b) => b[1] - a[1])[0]
  const topRolePercent = topRole
    ? Math.round((topRole[1] / stats.totalJobs) * 100)
    : 0

  const featuredJobs = jobs.filter(j => j.is_featured).slice(0, 10)
  const displayJobs = featuredJobs.length >= 5 ? featuredJobs : jobs.slice(0, 10)

  let jobRows = ''
  for (const job of displayJobs) {
    const jobUrl = `${SITE_URL}/jobs/${job.id}?${utmParams}`
    const salary = formatSalary(job)
    jobRows += `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #1e293b;">
          <a href="${jobUrl}" style="color: #22c55e; text-decoration: none;">${job.company}</a>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #1e293b;">
          <a href="${jobUrl}" style="color: #ffffff; text-decoration: none;">${job.title}</a>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #1e293b; color: #94a3b8;">${job.location || 'Remote'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #1e293b; color: #22c55e;">${salary}</td>
      </tr>`
  }

  let topCompaniesHtml = ''
  for (const company of stats.topCompanies.slice(0, 5)) {
    topCompaniesHtml += `<li style="margin-bottom: 8px;"><strong>${company.name}</strong> - ${company.count} open positions</li>`
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEUN Weekly | ${week}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #22c55e; font-size: 32px; margin: 0; letter-spacing: 4px;">NEUN</h1>
      <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Web3 Jobs Platform</p>
    </div>

    <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">
      🚀 NEUN Weekly | ${week}
    </h2>
    <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
      gm ser, this week's Web3 job market is heating up 🔥
    </p>

    <div style="background-color: #1e293b; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
      <h3 style="color: #22c55e; font-size: 18px; margin: 0 0 16px 0;">📊 This Week's Highlights</h3>
      <ul style="color: #e2e8f0; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>New listings: <strong>${stats.totalJobs}</strong></li>
        <li>Top role: <strong>${topRole?.[0] || 'Engineering'}</strong> (${topRolePercent}%)</li>
        <li>Remote rate: <strong>${stats.remoteRate}%</strong></li>
      </ul>
    </div>

    <h3 style="color: #ffffff; font-size: 18px; margin-bottom: 16px;">🔥 Featured Positions</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
      <thead>
        <tr style="background-color: #1e293b;">
          <th style="padding: 12px; text-align: left; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Company</th>
          <th style="padding: 12px; text-align: left; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Role</th>
          <th style="padding: 12px; text-align: left; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Location</th>
          <th style="padding: 12px; text-align: left; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Salary</th>
        </tr>
      </thead>
      <tbody style="color: #e2e8f0; font-size: 14px;">
        ${jobRows}
      </tbody>
    </table>

    <h3 style="color: #ffffff; font-size: 18px; margin-bottom: 16px;">🏢 채용 활발 기업</h3>
    <ul style="color: #e2e8f0; margin: 0 0 32px 0; padding-left: 20px; line-height: 1.8;">
      ${topCompaniesHtml}
    </ul>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${SITE_URL}/jobs?${utmParams}"
         style="display: inline-block; background-color: #22c55e; color: #0f172a; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 4px;">
        전체 공고 보기 →
      </a>
    </div>

    <div style="border-top: 1px solid #1e293b; padding-top: 24px; text-align: center;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        Powered by <a href="${SITE_URL}" style="color: #22c55e; text-decoration: none;">NEUN</a> | Built for Web3 natives
      </p>
    </div>
  </div>
</body>
</html>`
}

async function main() {
  const args = process.argv.slice(2)
  const daysIndex = args.indexOf('--days')
  const days = daysIndex !== -1 ? parseInt(args[daysIndex + 1]) : 7
  const shouldOutput = args.includes('--output')

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  console.log('📧 NEUN Weekly Newsletter Generator')
  console.log('='.repeat(50))

  // Fetch jobs
  const jobs = await fetchRecentJobs(days)

  if (jobs.length === 0) {
    console.log('❌ No jobs found for the specified period')
    return
  }

  // Calculate stats
  const stats = calculateStats(jobs)

  console.log('📊 Stats:')
  console.log(`  Total jobs: ${stats.totalJobs}`)
  console.log(`  Remote rate: ${stats.remoteRate}%`)
  console.log(`  Top role: ${Object.entries(stats.roleBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0]}`)
  console.log(`  Top companies: ${stats.topCompanies.slice(0, 3).map(c => c.name).join(', ')}`)

  // Generate content
  const markdown = generateMarkdown(jobs, stats)
  const html = generateHtml(jobs, stats)

  if (shouldOutput) {
    const today = new Date().toISOString().split('T')[0]
    const outputDir = path.join(process.cwd(), 'outputs')

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(path.join(outputDir, `newsletter-${today}.md`), markdown)
    fs.writeFileSync(path.join(outputDir, `newsletter-${today}.html`), html)

    console.log(`\n✅ Files saved to outputs/`)
    console.log(`  - newsletter-${today}.md`)
    console.log(`  - newsletter-${today}.html`)
  } else {
    console.log('\n' + '='.repeat(50))
    console.log('📝 MARKDOWN PREVIEW:')
    console.log('='.repeat(50))
    console.log(markdown)
    console.log('\n💡 Run with --output to save files')
  }
}

main().catch(console.error)
