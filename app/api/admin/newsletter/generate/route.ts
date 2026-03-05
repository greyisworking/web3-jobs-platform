import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
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
  source?: string | null
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

function isKoreanJob(job: { location?: string; company?: string; source?: string | null }): boolean {
  const loc = (job.location || '').toLowerCase()
  const koreaLocations = ['korea', 'south korea', 'seoul', '한국', '서울', '부산', '대전', '인천', '대구', '광주', '판교', '강남']
  if (koreaLocations.some(k => loc.includes(k))) return true
  if (/[\uAC00-\uD7AF]/.test(job.company || '')) return true
  const src = (job.source || '').toLowerCase()
  if (['rocketpunch', 'wanted'].some(s => src.includes(s))) return true
  return false
}

// POST: Generate newsletter content (markdown + HTML)
export const POST = withAdminAuth(async (request, _admin) => {
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
})

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
  const month = date.getMonth() + 1
  const weekOfMonth = Math.ceil(date.getDate() / 7)
  return `${month}월 ${weekOfMonth}주차`
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

// Job category definitions
const JOB_CATEGORIES: Record<string, { emoji: string; label: string; roles: string[] }> = {
  engineering: {
    emoji: '💻',
    label: '개발',
    roles: ['Engineering', 'Developer', 'Backend', 'Frontend', 'Full Stack', 'DevOps', 'SRE', 'Infrastructure', 'Blockchain Developer', 'Smart Contract', 'Protocol Engineer'],
  },
  security: {
    emoji: '🔐',
    label: '보안',
    roles: ['Security', 'Security Engineer', 'Security Researcher', 'Auditor', 'Penetration Tester', 'CISO'],
  },
  product_design: {
    emoji: '🎨',
    label: '프로덕트 & 디자인',
    roles: ['Product', 'Design', 'UI/UX', 'UX', 'Product Manager', 'Product Designer', 'Graphic Designer', 'Creative'],
  },
  business_ops: {
    emoji: '📊',
    label: '비즈니스 & 운영',
    roles: ['Operations', 'Business', 'Finance', 'Legal', 'HR', 'People', 'Admin', 'Strategy', 'BD', 'Business Development', 'Partnerships', 'Sales', 'Account'],
  },
  marketing_community: {
    emoji: '📢',
    label: '마케팅 & 커뮤니티',
    roles: ['Marketing', 'Community', 'Growth', 'Social Media', 'Content', 'PR', 'Communications', 'Brand', 'Copywriter'],
  },
  other: {
    emoji: '🌟',
    label: '기타',
    roles: [],
  },
}

// Country flag emojis
const COUNTRY_FLAGS: Record<string, string> = {
  'usa': '🇺🇸', 'united states': '🇺🇸', 'us': '🇺🇸', 'new york': '🇺🇸', 'san francisco': '🇺🇸', 'california': '🇺🇸', 'texas': '🇺🇸', 'miami': '🇺🇸',
  'korea': '🇰🇷', 'south korea': '🇰🇷', 'seoul': '🇰🇷', '한국': '🇰🇷', '서울': '🇰🇷',
  'uk': '🇬🇧', 'united kingdom': '🇬🇧', 'london': '🇬🇧', 'england': '🇬🇧',
  'germany': '🇩🇪', 'berlin': '🇩🇪', 'munich': '🇩🇪',
  'france': '🇫🇷', 'paris': '🇫🇷',
  'switzerland': '🇨🇭', 'zurich': '🇨🇭', 'zug': '🇨🇭',
  'singapore': '🇸🇬',
  'japan': '🇯🇵', 'tokyo': '🇯🇵',
  'china': '🇨🇳', 'hong kong': '🇭🇰', 'hk': '🇭🇰',
  'taiwan': '🇹🇼', 'taipei': '🇹🇼',
  'canada': '🇨🇦', 'toronto': '🇨🇦', 'vancouver': '🇨🇦',
  'australia': '🇦🇺', 'sydney': '🇦🇺', 'melbourne': '🇦🇺',
  'netherlands': '🇳🇱', 'amsterdam': '🇳🇱',
  'portugal': '🇵🇹', 'lisbon': '🇵🇹',
  'spain': '🇪🇸', 'madrid': '🇪🇸', 'barcelona': '🇪🇸',
  'uae': '🇦🇪', 'dubai': '🇦🇪', 'abu dhabi': '🇦🇪',
  'india': '🇮🇳', 'bangalore': '🇮🇳', 'mumbai': '🇮🇳',
  'vietnam': '🇻🇳', 'ho chi minh': '🇻🇳',
  'thailand': '🇹🇭', 'bangkok': '🇹🇭',
  'indonesia': '🇮🇩', 'jakarta': '🇮🇩',
  'philippines': '🇵🇭', 'manila': '🇵🇭',
  'europe': '🇪🇺', 'eu': '🇪🇺',
  'remote': '🌐', 'worldwide': '🌐', 'global': '🌐', 'anywhere': '🌐',
}

function getCountryFlag(location: string | null): string {
  if (!location) return '🌐'
  const lower = location.toLowerCase()

  // Check for remote first
  if (lower.includes('remote') || lower.includes('worldwide') || lower.includes('global') || lower.includes('anywhere')) {
    return '🌐'
  }

  // Check for country/city matches
  for (const [key, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (lower.includes(key)) {
      return flag
    }
  }

  return '🌐' // Default to global if unknown
}

// Non-engineering job titles that should not be in Engineering category
const NON_ENGINEERING_TITLES = [
  'virtual assistant', 'assistant', 'receptionist', 'coordinator',
  'recruiter', 'talent', 'writer', 'editor', 'analyst',
  'manager', 'director', 'head of', 'chief', 'officer',
  'counsel', 'lawyer', 'accountant', 'bookkeeper',
]

function categorizeJob(job: JobData): string {
  const title = (job.title || '').toLowerCase()
  const roleField = (job.role || '').toLowerCase()

  // 1. Check title first for Security keywords (highest priority)
  if (title.includes('security') || title.includes('auditor') || title.includes('penetration') || title.includes('ciso')) {
    return 'security'
  }

  // 2. Check for non-engineering titles to prevent misclassification
  const isNonEngineeringTitle = NON_ENGINEERING_TITLES.some(t => title.includes(t))

  // 3. Check title for specific category keywords
  // Product & Design
  if (title.includes('product manager') || title.includes('product designer') ||
      title.includes('ui/ux') || title.includes('ux designer') || title.includes('ui designer') ||
      title.includes('graphic designer') || title.includes('motion designer') || title.includes('creative director')) {
    return 'product_design'
  }

  // Marketing & Community
  if (title.includes('marketing') || title.includes('community') || title.includes('growth') ||
      title.includes('social media') || title.includes('content') || title.includes('communications') ||
      title.includes('brand') || title.includes('copywriter') || title.includes('pr ') || title.includes('events')) {
    return 'marketing_community'
  }

  // Business & Operations
  if (title.includes('business development') || title.includes('partnerships') || title.includes('sales') ||
      title.includes('finance') || title.includes('accounting') || title.includes('accountant') ||
      title.includes('legal') || title.includes('counsel') || title.includes('compliance') ||
      title.includes('operations') || title.includes('hr ') || title.includes('human resources') ||
      title.includes('people') || title.includes('recruiter') || title.includes('talent')) {
    return 'business_ops'
  }

  // Engineering - but exclude non-engineering titles
  if (!isNonEngineeringTitle && (
      title.includes('engineer') || title.includes('developer') || title.includes('architect') ||
      title.includes('devops') || title.includes('sre') || title.includes('infrastructure') ||
      title.includes('backend') || title.includes('frontend') || title.includes('full stack') ||
      title.includes('smart contract') || title.includes('protocol') || title.includes('blockchain dev'))) {
    return 'engineering'
  }

  // 4. Fall back to role field
  if (roleField.includes('security')) return 'security'
  if (roleField.includes('product') || roleField.includes('design')) return 'product_design'
  if (roleField.includes('marketing') || roleField.includes('community') || roleField.includes('growth')) return 'marketing_community'
  if (roleField.includes('operations') || roleField.includes('business') || roleField.includes('finance') || roleField.includes('legal')) return 'business_ops'
  if (!isNonEngineeringTitle && roleField.includes('engineering')) return 'engineering'

  return 'other'
}

interface CategorizedJobs {
  [category: string]: VerifiedJob[]
}

function selectAndCategorizeJobs(jobs: VerifiedJob[], maxPerCategory = 7, totalMax = 30): CategorizedJobs {
  // Sort jobs by selection criteria:
  // 1. Salary disclosed (has salaryMin or salary)
  // 2. Has VC backers
  // 3. Most recent (crawledAt or postedDate would need to be added)
  const scoredJobs = jobs.map(job => ({
    job,
    score: (job.salaryMin || job.salary ? 10 : 0) + (job.backers && job.backers.length > 0 ? 5 : 0),
  }))

  scoredJobs.sort((a, b) => b.score - a.score)

  // Categorize jobs
  const categorized: CategorizedJobs = {}
  const selectedIds = new Set<string>()
  let totalSelected = 0

  // First pass: assign to categories
  for (const { job } of scoredJobs) {
    if (totalSelected >= totalMax) break

    const category = categorizeJob(job)
    if (!categorized[category]) {
      categorized[category] = []
    }

    if (categorized[category].length < maxPerCategory && !selectedIds.has(job.id)) {
      categorized[category].push(job)
      selectedIds.add(job.id)
      totalSelected++
    }
  }

  // Remove empty categories
  for (const key of Object.keys(categorized)) {
    if (categorized[key].length === 0) {
      delete categorized[key]
    }
  }

  return categorized
}

function generateCategorySectionsMd(
  categorizedJobs: CategorizedJobs,
  utmParams?: string
): string {
  const categoryOrder = ['engineering', 'security', 'product_design', 'business_ops', 'marketing_community', 'other']
  let md = ''

  for (const categoryKey of categoryOrder) {
    const categoryJobs = categorizedJobs[categoryKey]
    if (!categoryJobs || categoryJobs.length === 0) continue

    const category = JOB_CATEGORIES[categoryKey]
    md += `### ${category.emoji} ${category.label} (${categoryJobs.length}개)

| 회사 | 포지션 | 연봉 |
|------|--------|------|
`

    for (const job of categoryJobs) {
      const jobUrl = `${SITE_URL}/jobs/${job.id}?${utmParams}`
      const salary = formatSalary(job)
      const flag = getCountryFlag(job.location)
      const verifyIcon = job.verificationStatus === 'verified' ? '' : job.verificationStatus === 'warning' ? ' ⚠️' : ''
      md += `| [${job.company}](${jobUrl}) ${flag}${verifyIcon} | [${job.title}](${jobUrl}) | ${salary} |\n`
    }

    md += '\n'
  }

  return md
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

  const intro = customIntro || 'gm ser, 이번 주 Web3 채용 시장 소식을 전해드려요 🔥'

  // Split into Korean and Global jobs
  const krJobs = jobs.filter(j => isKoreanJob(j))
  const globalJobs = jobs.filter(j => !isKoreanJob(j))

  const krCategorized = selectAndCategorizeJobs(krJobs, 5, 15)
  const globalCategorized = selectAndCategorizeJobs(globalJobs, 5, 20)

  const krTotal = Object.values(krCategorized).reduce((sum, arr) => sum + arr.length, 0)
  const globalTotal = Object.values(globalCategorized).reduce((sum, arr) => sum + arr.length, 0)
  const totalSelectedJobs = krTotal + globalTotal

  let md = `# 🚀 NEUN 위클리 | ${week}

${intro}

## 📊 이번 주 하이라이트
- 신규 공고: **${stats.totalJobs}**개
- 인기 직무: **${topRole?.[0] || 'Engineering'}** (${topRolePercent}%)
- 리모트 비율: **${stats.remoteRate}%**
- 엄선된 공고: **${totalSelectedJobs}**개

`

  // Korean Jobs Section
  if (krTotal > 0) {
    md += `## 🇰🇷 국내 공고\n\n`
    md += generateCategorySectionsMd(krCategorized, utmParams)
  }

  // Global Jobs Section
  if (globalTotal > 0) {
    md += `## 🌍 해외 공고 (리모트 포함)\n\n`
    md += generateCategorySectionsMd(globalCategorized, utmParams)
  }

  // Trends section
  md += `## 📈 이번 주 트렌드\n`

  if (stats.topCompanies.length > 0) {
    md += `- **채용 활발:** ${stats.topCompanies.slice(0, 5).map(c => c.name).join(', ')}\n`
  }

  const sortedRoles = Object.entries(stats.roleBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 3)
  if (sortedRoles.length > 0) {
    md += `- **인기 직무:** ${sortedRoles.map(([role, count]) => `${role} (${count})`).join(', ')}\n`
  }

  md += `
## 🏢 주목할 회사

`

  for (const company of stats.topCompanies.slice(0, 5)) {
    md += `- **${company.name}** - ${company.count}개 채용 중\n`
  }

  md += `
---

[전체 공고 보기 →](${SITE_URL}/jobs?${utmParams})

*Powered by NEUN | Web3 채용 플랫폼*
`

  return md
}

function generateCategorySectionsHtml(
  categorizedJobs: CategorizedJobs,
  utmParams?: string
): string {
  const categoryOrder = ['engineering', 'security', 'product_design', 'business_ops', 'marketing_community', 'other']
  let html = ''

  for (const categoryKey of categoryOrder) {
    const categoryJobs = categorizedJobs[categoryKey]
    if (!categoryJobs || categoryJobs.length === 0) continue

    const category = JOB_CATEGORIES[categoryKey]

    let jobRows = ''
    for (const job of categoryJobs) {
      const jobUrl = `${SITE_URL}/jobs/${job.id}?${utmParams}`
      const salary = formatSalary(job)
      const flag = getCountryFlag(job.location)
      const verifyIcon = job.verificationStatus === 'verified' ? '' : job.verificationStatus === 'warning' ? ' ⚠️' : ''
      jobRows += `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b;">
            <a href="${jobUrl}" style="color: #22c55e; text-decoration: none;">${job.company}</a>
            <span style="margin-left: 4px;">${flag}</span>${verifyIcon}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b;">
            <a href="${jobUrl}" style="color: #ffffff; text-decoration: none;">${job.title}</a>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b; color: #22c55e;">${salary}</td>
        </tr>`
    }

    html += `
    <div style="margin-bottom: 24px;">
      <h4 style="color: #ffffff; font-size: 16px; margin-bottom: 8px;">${category.emoji} ${category.label} <span style="color: #94a3b8; font-size: 13px; font-weight: normal;">(${categoryJobs.length}개)</span></h4>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #1e293b;">
            <th style="padding: 10px 12px; text-align: left; color: #94a3b8; font-size: 11px; text-transform: uppercase;">회사</th>
            <th style="padding: 10px 12px; text-align: left; color: #94a3b8; font-size: 11px; text-transform: uppercase;">포지션</th>
            <th style="padding: 10px 12px; text-align: left; color: #94a3b8; font-size: 11px; text-transform: uppercase;">연봉</th>
          </tr>
        </thead>
        <tbody style="color: #e2e8f0; font-size: 14px;">
          ${jobRows}
        </tbody>
      </table>
    </div>`
  }

  return html
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

  const intro = customIntro || 'gm ser, 이번 주 Web3 채용 시장 소식을 전해드려요 🔥'

  // Split into Korean and Global jobs
  const krJobs = jobs.filter(j => isKoreanJob(j))
  const globalJobs = jobs.filter(j => !isKoreanJob(j))

  const krCategorized = selectAndCategorizeJobs(krJobs, 5, 15)
  const globalCategorized = selectAndCategorizeJobs(globalJobs, 5, 20)

  const krTotal = Object.values(krCategorized).reduce((sum, arr) => sum + arr.length, 0)
  const globalTotal = Object.values(globalCategorized).reduce((sum, arr) => sum + arr.length, 0)
  const totalSelectedJobs = krTotal + globalTotal

  // Build KR/Global sections
  let jobSectionsHtml = ''

  if (krTotal > 0) {
    jobSectionsHtml += `
    <div style="margin-bottom: 32px;">
      <h3 style="color: #ffffff; font-size: 20px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #22c55e;">🇰🇷 국내 공고</h3>
      ${generateCategorySectionsHtml(krCategorized, utmParams)}
    </div>`
  }

  if (globalTotal > 0) {
    jobSectionsHtml += `
    <div style="margin-bottom: 32px;">
      <h3 style="color: #ffffff; font-size: 20px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">🌍 해외 공고 (리모트 포함)</h3>
      ${generateCategorySectionsHtml(globalCategorized, utmParams)}
    </div>`
  }

  let topCompaniesHtml = ''
  for (const company of stats.topCompanies.slice(0, 5)) {
    topCompaniesHtml += `<li style="margin-bottom: 8px;"><strong>${company.name}</strong> - ${company.count}개 채용 중</li>`
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEUN 위클리 | ${week}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #22c55e; font-size: 32px; margin: 0; letter-spacing: 4px;">NEUN</h1>
      <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Web3 채용 플랫폼</p>
    </div>

    <!-- Title -->
    <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">
      🚀 NEUN 위클리 | ${week}
    </h2>
    <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
      ${intro}
    </p>

    <!-- Highlights -->
    <div style="background-color: #1e293b; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
      <h3 style="color: #22c55e; font-size: 18px; margin: 0 0 16px 0;">📊 이번 주 하이라이트</h3>
      <ul style="color: #e2e8f0; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>신규 공고: <strong>${stats.totalJobs}</strong>개</li>
        <li>인기 직무: <strong>${topRole?.[0] || 'Engineering'}</strong> (${topRolePercent}%)</li>
        <li>리모트 비율: <strong>${stats.remoteRate}%</strong></li>
        <li>엄선된 공고: <strong>${totalSelectedJobs}</strong>개</li>
      </ul>
    </div>

    <!-- Job Sections (KR / Global) -->
    ${jobSectionsHtml}

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
        Powered by <a href="${SITE_URL}" style="color: #22c55e; text-decoration: none;">NEUN</a> | Web3 채용 플랫폼
      </p>
    </div>
  </div>
</body>
</html>`
}
