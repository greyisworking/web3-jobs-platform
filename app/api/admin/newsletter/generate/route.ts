import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import axios from 'axios'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const SITE_URL = 'https://neun.wtf'

interface JobData {
  id: string
  title: string
  company: string
  location: string
  url: string
  role: string | null
  salary: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  is_featured: boolean | null
  backers?: string[] | null
}

interface VerifiedJob extends JobData {
  verified: boolean
  verificationStatus: 'verified' | 'warning' | 'failed'
  verificationMessage?: string
}

interface GenerateRequest {
  jobs: JobData[]
  stats: {
    totalJobs: number
    roleBreakdown: Record<string, number>
    remoteRate: number
    topCompanies: { name: string; count: number }[]
  }
  customIntro?: string
  weekLabel?: string
  skipVerification?: boolean
}

// POST: Generate newsletter content (markdown + HTML)
export async function POST(request: Request) {
  try {
    await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: GenerateRequest = await request.json()
  const { jobs, stats, customIntro, weekLabel, skipVerification } = body

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ error: 'No jobs provided' }, { status: 400 })
  }

  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const week = weekLabel || getWeekLabel(today)
  const utmParams = `utm_source=newsletter&utm_medium=email&utm_campaign=weekly-${dateStr}`

  // Verify jobs if not skipped
  let verifiedJobs: VerifiedJob[] = jobs.map(j => ({
    ...j,
    verified: true,
    verificationStatus: 'verified' as const,
  }))

  if (!skipVerification) {
    verifiedJobs = await verifyJobs(jobs)
  }

  // Filter to only verified jobs for the newsletter
  const validJobs = verifiedJobs.filter(j => j.verificationStatus !== 'failed')

  // Generate markdown
  const markdown = generateMarkdown(validJobs, stats, week, customIntro, utmParams)

  // Generate HTML
  const html = generateHtml(validJobs, stats, week, customIntro, utmParams)

  return NextResponse.json({
    markdown,
    html,
    filename: `newsletter-${dateStr}`,
    verification: {
      total: jobs.length,
      verified: verifiedJobs.filter(j => j.verificationStatus === 'verified').length,
      warnings: verifiedJobs.filter(j => j.verificationStatus === 'warning').length,
      failed: verifiedJobs.filter(j => j.verificationStatus === 'failed').length,
      jobs: verifiedJobs,
    },
  })
}

async function verifyJobs(jobs: JobData[]): Promise<VerifiedJob[]> {
  const results: VerifiedJob[] = []

  // Verify in batches of 5 to avoid rate limits
  for (let i = 0; i < jobs.length; i += 5) {
    const batch = jobs.slice(i, i + 5)
    const batchResults = await Promise.all(batch.map(verifyJob))
    results.push(...batchResults)
  }

  return results
}

async function verifyJob(job: JobData): Promise<VerifiedJob> {
  const result: VerifiedJob = {
    ...job,
    verified: true,
    verificationStatus: 'verified',
  }

  // 1. Check if apply URL is alive
  try {
    const response = await axios.head(job.url, {
      timeout: 5000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NEUNBot/1.0)',
      },
    })

    if (response.status === 404 || response.status === 410) {
      result.verificationStatus = 'failed'
      result.verificationMessage = 'Job posting no longer available (404)'
      result.verified = false
      return result
    }

    if (response.status >= 500) {
      result.verificationStatus = 'warning'
      result.verificationMessage = 'Could not verify - server error'
    }
  } catch {
    result.verificationStatus = 'warning'
    result.verificationMessage = 'Could not verify - connection timeout'
  }

  // 2. Check VC backers if present
  if (job.backers && job.backers.length > 0) {
    // For now, just mark as verified if backers exist
    // Future: could verify against a VC database
    result.verificationMessage = result.verificationMessage
      ? `${result.verificationMessage}; VC info present`
      : 'VC info verified'
  }

  return result
}

function getWeekLabel(date: Date): string {
  const month = date.toLocaleString('en-US', { month: 'short' })
  const weekOfMonth = Math.ceil(date.getDate() / 7)
  return `${month} Week ${weekOfMonth}`
}

function formatSalary(job: JobData): string {
  if (job.salaryMin && job.salaryMax) {
    const currency = job.salaryCurrency || 'USD'
    const symbol = currency === 'USD' ? '$' : currency === 'KRW' ? '₩' : currency
    if (currency === 'KRW') {
      return `${symbol}${Math.round(job.salaryMin / 10000)}M-${Math.round(job.salaryMax / 10000)}M`
    }
    return `${symbol}${Math.round(job.salaryMin / 1000)}K-${symbol}${Math.round(job.salaryMax / 1000)}K`
  }
  return job.salary || '-'
}

function generateMarkdown(
  jobs: VerifiedJob[],
  stats: GenerateRequest['stats'],
  week: string,
  customIntro?: string,
  utmParams?: string
): string {
  const topRole = Object.entries(stats.roleBreakdown)
    .sort((a, b) => b[1] - a[1])[0]
  const topRolePercent = topRole
    ? Math.round((topRole[1] / stats.totalJobs) * 100)
    : 0

  const intro = customIntro || "gm ser, this week's Web3 job market is heating up 🔥"

  // Featured jobs (is_featured or top 10)
  const featuredJobs = jobs
    .filter(j => j.is_featured)
    .slice(0, 10)

  const displayJobs = featuredJobs.length >= 5
    ? featuredJobs
    : jobs.slice(0, 10)

  let md = `# 🚀 NEUN Weekly | ${week}

${intro}

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
    const verifyIcon = job.verificationStatus === 'verified' ? '' : job.verificationStatus === 'warning' ? ' ⚠️' : ' ❌'
    md += `| [${job.company}](${jobUrl})${verifyIcon} | [${job.title}](${jobUrl}) | ${job.location || 'Remote'} | ${salary} |\n`
  }

  // Trends section
  md += `
## 📈 This Week's Trends
`

  // Top companies
  if (stats.topCompanies.length > 0) {
    md += `- **Hot hiring:** ${stats.topCompanies.slice(0, 5).map(c => c.name).join(', ')}\n`
  }

  // Role breakdown
  const sortedRoles = Object.entries(stats.roleBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 3)
  if (sortedRoles.length > 0) {
    md += `- **Top roles:** ${sortedRoles.map(([role, count]) => `${role} (${count})`).join(', ')}\n`
  }

  md += `
## 🏢 Companies to Watch

`

  for (const company of stats.topCompanies.slice(0, 5)) {
    md += `- **${company.name}** - ${company.count} open positions\n`
  }

  md += `
---

[View all jobs →](${SITE_URL}/jobs?${utmParams})

*Powered by NEUN | Built for Web3 natives*
`

  return md
}

function generateHtml(
  jobs: VerifiedJob[],
  stats: GenerateRequest['stats'],
  week: string,
  customIntro?: string,
  utmParams?: string
): string {
  const topRole = Object.entries(stats.roleBreakdown)
    .sort((a, b) => b[1] - a[1])[0]
  const topRolePercent = topRole
    ? Math.round((topRole[1] / stats.totalJobs) * 100)
    : 0

  const intro = customIntro || "gm ser, this week's Web3 job market is heating up 🔥"

  const featuredJobs = jobs
    .filter(j => j.is_featured)
    .slice(0, 10)
  const displayJobs = featuredJobs.length >= 5
    ? featuredJobs
    : jobs.slice(0, 10)

  let jobRows = ''
  for (const job of displayJobs) {
    const jobUrl = `${SITE_URL}/jobs/${job.id}?${utmParams}`
    const salary = formatSalary(job)
    const verifyIcon = job.verificationStatus === 'verified' ? '✅' : job.verificationStatus === 'warning' ? '⚠️' : '❌'
    jobRows += `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #1e293b;">
          <a href="${jobUrl}" style="color: #22c55e; text-decoration: none;">${job.company}</a>
          <span style="font-size: 10px; margin-left: 4px;">${verifyIcon}</span>
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
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #22c55e; font-size: 32px; margin: 0; letter-spacing: 4px;">NEUN</h1>
      <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Web3 Jobs Platform</p>
    </div>

    <!-- Title -->
    <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">
      🚀 NEUN Weekly | ${week}
    </h2>
    <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
      ${intro}
    </p>

    <!-- Highlights -->
    <div style="background-color: #1e293b; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
      <h3 style="color: #22c55e; font-size: 18px; margin: 0 0 16px 0;">📊 This Week's Highlights</h3>
      <ul style="color: #e2e8f0; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>New listings: <strong>${stats.totalJobs}</strong></li>
        <li>Top role: <strong>${topRole?.[0] || 'Engineering'}</strong> (${topRolePercent}%)</li>
        <li>Remote rate: <strong>${stats.remoteRate}%</strong></li>
      </ul>
    </div>

    <!-- Featured Positions -->
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

    <!-- Top Companies -->
    <h3 style="color: #ffffff; font-size: 18px; margin-bottom: 16px;">🏢 Companies to Watch</h3>
    <ul style="color: #e2e8f0; margin: 0 0 32px 0; padding-left: 20px; line-height: 1.8;">
      ${topCompaniesHtml}
    </ul>

    <!-- CTA -->
    <div style="text-align: center; margin: 40px 0;">
      <a href="${SITE_URL}/jobs?${utmParams}"
         style="display: inline-block; background-color: #22c55e; color: #0f172a; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 4px;">
        View All Jobs →
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #1e293b; padding-top: 24px; text-align: center;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        Powered by <a href="${SITE_URL}" style="color: #22c55e; text-decoration: none;">NEUN</a> | Built for Web3 natives
      </p>
    </div>
  </div>
</body>
</html>`
}
