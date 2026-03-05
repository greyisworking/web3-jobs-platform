import { NextRequest, NextResponse } from 'next/server'
import { createPublicSupabaseClient } from '@/lib/supabase-public'
import { careerPathsMap } from '@/lib/career-paths'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug || !careerPathsMap[slug]) {
    return NextResponse.json({ error: 'Invalid career path' }, { status: 400 })
  }

  const career = careerPathsMap[slug]
  const supabase = createPublicSupabaseClient()

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: jobs } = await supabase
    .from('Job')
    .select('title, description, tags, company, salaryMin, salaryMax, salaryCurrency, location')
    .eq('isActive', true)
    .gte('crawledAt', threeMonthsAgo.toISOString())
    .limit(10000)

  const allJobs = jobs || []

  // Filter by title patterns
  const matching = allJobs.filter(job => {
    const t = (job.title || '').toLowerCase()
    return career.titlePatterns.some(p => t.includes(p))
  })

  // Top skills from descriptions
  const SKILL_KEYWORDS: Record<string, string[]> = {
    'Solidity': ['solidity'], 'Rust': ['rust'], 'TypeScript': ['typescript'],
    'Python': ['python'], 'Go': ['golang', ' go '], 'JavaScript': ['javascript'],
    'React': ['react'], 'Node.js': ['node.js', 'nodejs'],
    'Ethereum': ['ethereum'], 'Solana': ['solana'], 'DeFi': ['defi'],
    'AWS': ['aws'], 'Docker': ['docker'], 'Kubernetes': ['kubernetes'],
    'GraphQL': ['graphql'], 'PostgreSQL': ['postgresql', 'postgres'],
    'Hardhat': ['hardhat'], 'Foundry': ['foundry'], 'Discord': ['discord'],
    'Telegram': ['telegram'], 'Twitter/X': ['twitter', 'x.com'],
    'SQL': ['sql'], 'Excel': ['excel'], 'Figma': ['figma'],
    'Compliance': ['compliance'], 'KYC': ['kyc'], 'AML': ['aml'],
  }

  const skillCounts: Record<string, number> = {}
  for (const job of matching) {
    const text = [job.title || '', job.description || '', job.tags || ''].join(' ').toLowerCase()
    for (const [skill, kws] of Object.entries(SKILL_KEYWORDS)) {
      if (kws.some(kw => text.includes(kw))) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1
      }
    }
  }
  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill]) => skill)

  // Salary (USD only, reasonable range)
  const salaries = matching
    .filter(j => j.salaryMin && j.salaryMax && (j.salaryCurrency === 'USD' || !j.salaryCurrency) && j.salaryMax < 1000000)
    .map(j => (j.salaryMin! + j.salaryMax!) / 2)
  const avgSalary = salaries.length >= 3
    ? Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length / 1000) * 1000
    : 0

  // Remote %
  const remoteCount = matching.filter(j =>
    (j.location || '').toLowerCase().match(/remote|worldwide|anywhere/)
  ).length
  const remotePercent = matching.length > 0 ? Math.round((remoteCount / matching.length) * 100) : 0

  // Top companies
  const compCounts: Record<string, number> = {}
  for (const j of matching) {
    if (j.company) compCounts[j.company] = (compCounts[j.company] || 0) + 1
  }
  const topCompanies = Object.entries(compCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)

  const response = NextResponse.json({
    jobCount: matching.length,
    avgSalary,
    remotePercent,
    topSkills,
    topCompanies,
  })

  response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=600')
  return response
}
