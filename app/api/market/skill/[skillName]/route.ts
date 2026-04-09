import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const SKILL_PATTERNS: Record<string, RegExp> = {
  'solidity': /\bsolidity\b/i,
  'rust': /\brust\b/i,
  'move': /\bmove\b/i,
  'typescript': /\btypescript\b/i,
  'python': /\bpython\b/i,
  'go': /\bgo(?:lang)?\b/i,
  'javascript': /\bjavascript\b/i,
  'java': /\bjava\b/i,
  'c++': /\bc\+\+\b/i,
  'cairo': /\bcairo\b/i,
  'vyper': /\bvyper\b/i,
  'ethereum': /\bethereum\b/i,
  'solana': /\bsolana\b/i,
  'base': /\bbase\b/i,
  'arbitrum': /\barbitrum\b/i,
  'polygon': /\bpolygon\b/i,
  'avalanche': /\bavalanche\b/i,
  'sui': /\bsui\b/i,
  'aptos': /\baptos\b/i,
  'ton': /\bton\b/i,
  'bitcoin': /\bbitcoin\b/i,
  'cosmos': /\bcosmos\b/i,
  'react': /\breact\b/i,
  'node.js': /\bnode\.?js\b/i,
  'aws': /\baws\b/i,
  'docker': /\bdocker\b/i,
  'kubernetes': /\bkubernetes\b/i,
  'graphql': /\bgraphql\b/i,
  'postgresql': /\bpostgre(?:sql|s)?\b/i,
  'mongodb': /\bmongodb\b/i,
  'redis': /\bredis\b/i,
  'defi': /\bdefi\b/i,
  'nft': /\bnfts?\b/i,
  'gamefi': /\bgamefi\b/i,
  'dao': /\bdaos?\b/i,
  'l2': /\bl2\b/i,
  'zk': /\bzk\b/i,
  'bridge': /\bbridge\b/i,
  'wallet': /\bwallets?\b/i,
  'dex': /\bdex(?:es)?\b/i,
  'lending': /\blending\b/i,
  'staking': /\bstaking\b/i,
}

const REGION_KEYWORDS: Record<string, string[]> = {
  korea: ['korea', 'south korea', 'seoul', '한국', '서울', '부산', '판교', '강남'],
  us: ['usa', 'united states', 'new york', 'san francisco', 'california', 'texas', 'chicago', 'miami', 'seattle', 'boston', 'los angeles'],
  remote: ['remote', 'worldwide', 'anywhere', 'global'],
}

function getISOWeek(d: Date): string {
  const year = d.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000)
  const week = Math.ceil((days + jan1.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function classifyRegion(location: string): string | null {
  const loc = location.toLowerCase()
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(kw => loc.includes(kw))) return region
  }
  return null
}

const LEVEL_PATTERNS_MAP: Record<string, string[]> = {
  entry: ['junior', 'jr.', 'jr ', 'entry level', 'entry-level', 'associate', 'graduate', 'trainee'],
  senior: ['senior', 'sr.', 'sr ', 'staff', 'principal', 'distinguished'],
  lead: [
    'head of', 'director', 'vp ', 'vice president', 'chief',
    'team lead', 'tech lead', 'c-level', 'cto', 'cfo', 'coo ', ' coo,', 'cmo',
    'engineering manager', 'general manager',
  ],
}

function classifyLevel(title: string): 'entry' | 'mid' | 'senior' | 'lead' {
  const t = title.toLowerCase()
  if (LEVEL_PATTERNS_MAP.lead.some(p => t.includes(p))) return 'lead'
  if (t.includes('lead') && !['lead generat', 'leading'].some(fp => t.includes(fp))) return 'lead'
  if (t.includes('manager') && ['engineering manager', 'general manager', 'managing director', 'country manager', 'regional manager', 'finance manager'].some(p => t.includes(p))) return 'lead'
  if (LEVEL_PATTERNS_MAP.senior.some(p => t.includes(p))) return 'senior'
  if (LEVEL_PATTERNS_MAP.entry.some(p => t.includes(p))) return 'entry'
  if (/\bintern\b/.test(t)) return 'entry'
  return 'mid'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ skillName: string }> }
) {
  const { skillName } = await params
  const decodedSkill = decodeURIComponent(skillName).toLowerCase()

  const pattern = SKILL_PATTERNS[decodedSkill]
  if (!pattern) {
    return NextResponse.json(
      { error: `Unknown skill: ${decodedSkill}` },
      { status: 404 }
    )
  }

  const regionParam = request.nextUrl.searchParams.get('region') || 'all'
  const levelParam = request.nextUrl.searchParams.get('level') || null
  if (!['korea', 'us', 'remote', 'all'].includes(regionParam)) {
    return NextResponse.json(
      { error: 'Invalid region. Must be one of: korea, us, remote, all' },
      { status: 400 }
    )
  }

  const supabase = await createSupabaseServerClient()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, description, tags, location, company, salaryMin, salaryMax, salaryCurrency, crawledAt')
    .eq('isActive', true)
    .gte('crawledAt', cutoff.toISOString())
    .limit(10000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filter by skill match
  const skillMatched = (jobs || []).filter(job => {
    const text = [job.title || '', job.description || '', job.tags || ''].join(' ')
    return pattern.test(text)
  })

  // Filter by region if specified
  let filtered = regionParam === 'all'
    ? skillMatched
    : skillMatched.filter(job => {
        const region = classifyRegion(job.location || '')
        return region === regionParam
      })

  // Filter by level if specified
  if (levelParam && ['entry', 'mid', 'senior', 'lead'].includes(levelParam)) {
    filtered = filtered.filter(job => classifyLevel(job.title || '') === levelParam)
  }

  // Job count
  const jobCount = filtered.length

  // Average salary by region
  const salaryByRegion: Record<string, number[]> = {
    all: [],
    korea: [],
    us: [],
    remote: [],
  }

  for (const job of skillMatched) {
    if (job.salaryMin != null && job.salaryMax != null && job.salaryMax <= 1_000_000) {
      const avg = (job.salaryMin + job.salaryMax) / 2
      salaryByRegion.all.push(avg)
      const region = classifyRegion(job.location || '')
      if (region && salaryByRegion[region]) {
        salaryByRegion[region].push(avg)
      }
    }
  }

  const computeAvg = (arr: number[]): number =>
    arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0

  const avgSalary = {
    all: computeAvg(salaryByRegion.all),
    korea: computeAvg(salaryByRegion.korea),
    us: computeAvg(salaryByRegion.us),
    remote: computeAvg(salaryByRegion.remote),
  }

  // Weekly trend: last 8 weeks
  const now = new Date()
  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

  const weekCounts: Record<string, number> = {}
  for (const job of filtered) {
    const crawledAt = new Date(job.crawledAt)
    if (crawledAt >= eightWeeksAgo) {
      const week = getISOWeek(crawledAt)
      weekCounts[week] = (weekCounts[week] || 0) + 1
    }
  }

  // Generate last 8 weeks in order, filling gaps with 0
  const weeklyTrend: { week: string; count: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const week = getISOWeek(d)
    if (!weeklyTrend.some(w => w.week === week)) {
      weeklyTrend.push({ week, count: weekCounts[week] || 0 })
    }
  }

  // Top 10 companies by count
  const companyCounts: Record<string, number> = {}
  for (const job of filtered) {
    const company = (job.company || '').trim()
    if (company) {
      companyCounts[company] = (companyCounts[company] || 0) + 1
    }
  }

  const topCompanies = Object.entries(companyCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const response = NextResponse.json({
    jobCount,
    avgSalary,
    weeklyTrend,
    topCompanies,
  })

  response.headers.set('Cache-Control', 'public, s-maxage=300')
  return response
}
