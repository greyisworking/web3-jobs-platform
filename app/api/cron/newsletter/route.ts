import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

// Vercel Cron: runs every Thursday 8:30 AM KST (Wednesday 23:30 UTC)
// vercel.json: { "path": "/api/cron/newsletter", "schedule": "30 23 * * 3" }

export const maxDuration = 120
export const dynamic = 'force-dynamic'

const SITE_URL = 'https://neun.wtf'
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || ''

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface Job {
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
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  console.log('📧 Starting weekly newsletter generation...')

  try {
    // Fetch recent jobs
    const { data: jobs, error } = await supabase
      .from('Job')
      .select('id, title, company, location, url, role, salary, salaryMin, salaryMax, salaryCurrency, is_featured')
      .eq('isActive', true)
      .gte('crawledAt', startDate.toISOString())
      .order('crawledAt', { ascending: false })
      .limit(200)

    if (error) throw error

    if (!jobs || jobs.length === 0) {
      console.log('No new jobs this week')
      return NextResponse.json({ success: true, message: 'No new jobs' })
    }

    // Calculate stats
    const stats = calculateStats(jobs)

    // Generate content
    const today = new Date()
    const week = getWeekLabel(today)
    const dateStr = today.toISOString().split('T')[0]
    const utmParams = `utm_source=newsletter&utm_medium=email&utm_campaign=weekly-${dateStr}`

    const markdown = generateMarkdown(jobs.slice(0, 50), stats, week, utmParams)
    const html = generateHtml(jobs.slice(0, 50), stats, week, utmParams)

    // Save to newsletter_history
    const title = `NEUN Weekly | ${week}`
    try {
      await supabase.from('newsletter_history').insert({
        title,
        content_md: markdown,
        content_html: html,
        job_ids: jobs.map(j => j.id),
      })
    } catch {
      console.log('Could not save to newsletter_history table')
    }

    // Send Discord notification
    await sendDiscordNotification(stats.totalJobs, week)

    console.log(`✅ Newsletter generated: ${stats.totalJobs} jobs`)

    return NextResponse.json({
      success: true,
      title,
      jobCount: stats.totalJobs,
      week,
    })
  } catch (error: any) {
    console.error('❌ Newsletter generation failed:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function getWeekLabel(date: Date): string {
  const month = date.toLocaleString('en-US', { month: 'short' })
  const weekOfMonth = Math.ceil(date.getDate() / 7)
  return `${month} Week ${weekOfMonth}`
}

function calculateStats(jobs: Job[]) {
  const roleBreakdown: Record<string, number> = {}
  const companyCount: Record<string, number> = {}
  let remoteCount = 0

  for (const job of jobs) {
    const role = job.role || 'Other'
    roleBreakdown[role] = (roleBreakdown[role] || 0) + 1

    if (job.location?.toLowerCase().includes('remote')) {
      remoteCount++
    }

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
    topCompanies,
  }
}

function formatSalary(job: Job): string {
  if (job.salaryMin && job.salaryMax) {
    const currency = job.salaryCurrency || 'USD'
    const symbol = currency === 'USD' ? '$' : currency
    return `${symbol}${Math.round(job.salaryMin / 1000)}K-${symbol}${Math.round(job.salaryMax / 1000)}K`
  }
  return job.salary || '-'
}

function generateMarkdown(jobs: Job[], stats: ReturnType<typeof calculateStats>, week: string, utmParams: string): string {
  const topRole = Object.entries(stats.roleBreakdown).sort((a, b) => b[1] - a[1])[0]
  const topRolePercent = topRole ? Math.round((topRole[1] / stats.totalJobs) * 100) : 0

  const featuredJobs = jobs.filter(j => j.is_featured).slice(0, 10)
  const displayJobs = featuredJobs.length >= 5 ? featuredJobs : jobs.slice(0, 10)

  let md = `# 🚀 NEUN Weekly | ${week}

gm ser, this week's Web3 job market is heating up 🔥

## 📊 This Week's Highlights
- New positions: **${stats.totalJobs}**
- Top role: **${topRole?.[0] || 'Engineering'}** (${topRolePercent}%)
- Remote ratio: **${stats.remoteRate}%**

## 🔥 Featured Positions

| Company | Role | Location | Salary |
|---------|------|----------|--------|
`

  for (const job of displayJobs) {
    const jobUrl = `${SITE_URL}/jobs/${job.id}?${utmParams}`
    const salary = formatSalary(job)
    md += `| [${job.company}](${jobUrl}) | [${job.title}](${jobUrl}) | ${job.location || 'Remote'} | ${salary} |\n`
  }

  md += `
## 🏢 Companies to Watch

`
  for (const company of stats.topCompanies.slice(0, 5)) {
    md += `- **${company.name}** - ${company.count} open positions\n`
  }

  md += `
---

[View all positions →](${SITE_URL}/jobs?${utmParams})

📊 Job data powered by [NEUN](${SITE_URL}) | Web3 Job Board
`

  return md
}

function generateHtml(jobs: Job[], stats: ReturnType<typeof calculateStats>, week: string, utmParams: string): string {
  const topRole = Object.entries(stats.roleBreakdown).sort((a, b) => b[1] - a[1])[0]
  const topRolePercent = topRole ? Math.round((topRole[1] / stats.totalJobs) * 100) : 0

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

    <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">🚀 NEUN Weekly | ${week}</h2>
    <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
      gm ser, this week's Web3 job market is heating up 🔥
    </p>

    <div style="background-color: #1e293b; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
      <h3 style="color: #22c55e; font-size: 18px; margin: 0 0 16px 0;">📊 This Week's Highlights</h3>
      <ul style="color: #e2e8f0; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>New positions: <strong>${stats.totalJobs}</strong></li>
        <li>Top role: <strong>${topRole?.[0] || 'Engineering'}</strong> (${topRolePercent}%)</li>
        <li>Remote ratio: <strong>${stats.remoteRate}%</strong></li>
      </ul>
    </div>

    <h3 style="color: #ffffff; font-size: 18px; margin-bottom: 16px;">🔥 Featured Positions</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
      <thead>
        <tr style="background-color: #1e293b;">
          <th style="padding: 12px; text-align: left; color: #94a3b8; font-size: 12px;">COMPANY</th>
          <th style="padding: 12px; text-align: left; color: #94a3b8; font-size: 12px;">ROLE</th>
          <th style="padding: 12px; text-align: left; color: #94a3b8; font-size: 12px;">LOCATION</th>
          <th style="padding: 12px; text-align: left; color: #94a3b8; font-size: 12px;">SALARY</th>
        </tr>
      </thead>
      <tbody style="color: #e2e8f0; font-size: 14px;">${jobRows}</tbody>
    </table>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${SITE_URL}/jobs?${utmParams}" style="display: inline-block; background-color: #22c55e; color: #0f172a; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 4px;">
        View All Positions →
      </a>
    </div>

    <div style="border-top: 1px solid #1e293b; padding-top: 24px; text-align: center;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        📊 Job data powered by <a href="${SITE_URL}" style="color: #22c55e; text-decoration: none;">NEUN</a> | Web3 Job Board
      </p>
    </div>
  </div>
</body>
</html>`
}

async function sendDiscordNotification(jobCount: number, week: string) {
  if (!DISCORD_WEBHOOK_URL) return

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: 'NEUN 봇',
      embeds: [{
        title: `📧 뉴스레터 생성 완료!`,
        description: `${week} 주간 뉴스레터가 준비됐어요.\n공고 ${jobCount}개가 포함되어 있어요!`,
        color: 0x22c55e,
        fields: [
          { name: '📋 포함된 공고', value: `${jobCount}개`, inline: true },
          { name: '📅 기간', value: week, inline: true },
        ],
        footer: { text: 'NEUN 주간 뉴스레터' },
        timestamp: new Date().toISOString(),
      }],
    })
  } catch (error) {
    console.error('Failed to send Discord notification:', error)
  }
}
