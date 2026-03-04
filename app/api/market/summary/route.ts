import { NextResponse } from 'next/server'
import { createPublicSupabaseClient } from '@/lib/supabase-public'

const TOP_SKILL_KEYWORDS: Record<string, string[]> = {
  'Solidity': ['solidity'],
  'Rust': ['rust'],
  'TypeScript': ['typescript', 'ts '],
  'JavaScript': ['javascript'],
  'Python': ['python'],
  'Go': ['golang', ' go ', 'go,', 'go.'],
  'React': ['react', 'reactjs'],
  'Next.js': ['next.js', 'nextjs'],
  'Node.js': ['node.js', 'nodejs'],
  'DeFi': ['defi', 'decentralized finance'],
}

const US_LOCATION_PATTERNS = [
  'united states', 'usa', 'u.s.', 'new york', 'san francisco',
  'los angeles', 'chicago', 'austin', 'miami', 'seattle',
  'denver', 'boston', 'washington', 'california', 'texas',
  ', ny', ', ca', ', tx',
]

export async function GET() {
  try {
    const supabase = createPublicSupabaseClient()

    const [liveJobsRes, skillsRes, salaryRes, remoteRes] = await Promise.all([
      // 1. liveJobs count
      supabase
        .from('Job')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true),

      // 2. topSkill: title + tags only
      supabase
        .from('Job')
        .select('title, tags')
        .eq('isActive', true)
        .limit(10000),

      // 3. avgSalary: salary fields + location
      supabase
        .from('Job')
        .select('salaryMin, salaryMax, salaryCurrency, location')
        .eq('isActive', true)
        .not('salaryMin', 'is', null)
        .not('salaryMax', 'is', null)
        .limit(10000),

      // 4. remoteRate count
      supabase
        .from('Job')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true)
        .or('location.ilike.%remote%,location.ilike.%worldwide%,location.ilike.%anywhere%'),
    ])

    // liveJobs
    const liveJobs = liveJobsRes.count ?? 0

    // topSkill
    const skillCounts: Record<string, number> = {}
    for (const job of skillsRes.data ?? []) {
      const text = [job.title || '', job.tags || ''].join(' ').toLowerCase()
      for (const [skill, keywords] of Object.entries(TOP_SKILL_KEYWORDS)) {
        if (keywords.some(kw => text.includes(kw))) {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1
        }
      }
    }
    const topSkill = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Solidity'

    // avgSalary (US region, USD only)
    const usSalaries: number[] = []
    for (const job of salaryRes.data ?? []) {
      const currency = (job.salaryCurrency || 'USD').toUpperCase()
      if (currency !== 'USD') continue
      const loc = (job.location || '').toLowerCase()
      if (!US_LOCATION_PATTERNS.some(p => loc.includes(p))) continue
      if (job.salaryMax > 1000000) continue
      usSalaries.push((job.salaryMin + job.salaryMax) / 2)
    }
    const avgSalary = usSalaries.length > 0
      ? Math.round(usSalaries.reduce((s, v) => s + v, 0) / usSalaries.length / 1000) * 1000
      : 0

    // remoteRate
    const remoteCount = remoteRes.count ?? 0
    const remoteRate = liveJobs > 0 ? Math.round((remoteCount / liveJobs) * 100) : 0

    return NextResponse.json(
      { liveJobs, topSkill, avgSalary, remoteRate },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
      }
    )
  } catch {
    return NextResponse.json(
      { liveJobs: 0, topSkill: 'Solidity', avgSalary: 0, remoteRate: 0 },
      { status: 500 }
    )
  }
}
