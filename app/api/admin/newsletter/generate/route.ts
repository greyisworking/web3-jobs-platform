import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://neun.wtf'

interface JobData {
  id: string
  title: string
  company: string
  location: string
  role: string | null
  salary: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  is_featured: boolean | null
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
}

// POST: Generate newsletter content (markdown + HTML)
export async function POST(request: Request) {
  try {
    await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: GenerateRequest = await request.json()
  const { jobs, stats, customIntro, weekLabel } = body

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ error: 'No jobs provided' }, { status: 400 })
  }

  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const week = weekLabel || getWeekLabel(today)
  const utmParams = `utm_source=newsletter&utm_medium=email&utm_campaign=weekly-${dateStr}`

  // Generate markdown
  const markdown = generateMarkdown(jobs, stats, week, customIntro, utmParams)

  // Generate HTML
  const html = generateHtml(jobs, stats, week, customIntro, utmParams)

  return NextResponse.json({
    markdown,
    html,
    filename: `newsletter-${dateStr}`,
  })
}

function getWeekLabel(date: Date): string {
  const month = date.getMonth() + 1
  const weekOfMonth = Math.ceil(date.getDate() / 7)
  return `${month}월 ${weekOfMonth}주차`
}

function formatSalary(job: JobData): string {
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

function generateMarkdown(
  jobs: JobData[],
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

  const intro = customIntro || 'gm ser, 이번 주 Web3 채용 시장 핫합니다. 🔥'

  // Featured jobs (is_featured or top 10)
  const featuredJobs = jobs
    .filter(j => j.is_featured)
    .slice(0, 10)

  // If not enough featured, fill with first jobs
  const displayJobs = featuredJobs.length >= 5
    ? featuredJobs
    : jobs.slice(0, 10)

  let md = `# 🚀 NEUN Weekly | ${week}

${intro}

## 📊 이번 주 하이라이트
- 신규 공고: **${stats.totalJobs}개**
- Top 직무: **${topRole?.[0] || 'Engineering'}** (${topRolePercent}%)
- Remote 비율: **${stats.remoteRate}%**

## 🔥 Featured Positions

| Company | Role | Location | Salary |
|---------|------|----------|--------|
`

  for (const job of displayJobs) {
    const jobUrl = `${SITE_URL}/jobs/${job.id}?${utmParams}`
    const salary = formatSalary(job)
    md += `| [${job.company}](${jobUrl}) | [${job.title}](${jobUrl}) | ${job.location || 'Remote'} | ${salary} |\n`
  }

  // Trends section
  md += `
## 📈 이번 주 트렌드
`

  // Korea jobs
  const koreaCompanies = jobs
    .filter(j => j.location?.toLowerCase().includes('korea') || j.location?.toLowerCase().includes('seoul'))
    .map(j => j.company)
  const uniqueKoreaCompanies = [...new Set(koreaCompanies)]

  if (uniqueKoreaCompanies.length > 0) {
    md += `- 한국 기업 채용 활발: ${uniqueKoreaCompanies.slice(0, 5).join(', ')}\n`
  }

  // Top companies
  if (stats.topCompanies.length > 0) {
    md += `- 채용 활발 기업: ${stats.topCompanies.slice(0, 5).map(c => c.name).join(', ')}\n`
  }

  md += `
## 🏢 주목할 회사

`

  for (const company of stats.topCompanies.slice(0, 5)) {
    md += `- **${company.name}** - ${company.count}개 포지션 채용 중\n`
  }

  md += `
---

[전체 공고 보기 →](${SITE_URL}/jobs?${utmParams})

*Powered by NEUN | Built for Web3 natives*
`

  return md
}

function generateHtml(
  jobs: JobData[],
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

  const intro = customIntro || 'gm ser, 이번 주 Web3 채용 시장 핫합니다. 🔥'

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

  // Top companies list
  let topCompaniesHtml = ''
  for (const company of stats.topCompanies.slice(0, 5)) {
    topCompaniesHtml += `<li style="margin-bottom: 8px;"><strong>${company.name}</strong> - ${company.count}개 포지션 채용 중</li>`
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
      <h3 style="color: #22c55e; font-size: 18px; margin: 0 0 16px 0;">📊 이번 주 하이라이트</h3>
      <ul style="color: #e2e8f0; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>신규 공고: <strong>${stats.totalJobs}개</strong></li>
        <li>Top 직무: <strong>${topRole?.[0] || 'Engineering'}</strong> (${topRolePercent}%)</li>
        <li>Remote 비율: <strong>${stats.remoteRate}%</strong></li>
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
    <h3 style="color: #ffffff; font-size: 18px; margin-bottom: 16px;">🏢 주목할 회사</h3>
    <ul style="color: #e2e8f0; margin: 0 0 32px 0; padding-left: 20px; line-height: 1.8;">
      ${topCompaniesHtml}
    </ul>

    <!-- CTA -->
    <div style="text-align: center; margin: 40px 0;">
      <a href="${SITE_URL}/jobs?${utmParams}"
         style="display: inline-block; background-color: #22c55e; color: #0f172a; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 4px;">
        전체 공고 보기 →
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
