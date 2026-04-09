import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const REGION_KEYWORDS: Record<string, string[]> = {
  korea: ['korea', 'south korea', 'seoul', '한국', '서울', '부산', '판교', '강남'],
  us: ['usa', 'united states', 'new york', 'san francisco', 'california', 'texas', 'chicago', 'miami', 'seattle', 'boston', 'los angeles'],
  remote: ['remote', 'worldwide', 'anywhere', 'global'],
}

function matchesRegion(location: string, region: string): boolean {
  if (region === 'all' || !region) return true
  const keywords = REGION_KEYWORDS[region]
  if (!keywords) return true
  const lower = location.toLowerCase()
  return keywords.some(kw => lower.includes(kw))
}

const LEVEL_PATTERNS: Record<string, string[]> = {
  entry: ['junior', 'jr.', 'jr ', 'entry level', 'entry-level', 'associate', 'graduate', 'trainee'],
  senior: ['senior', 'sr.', 'sr ', 'staff', 'principal', 'distinguished'],
  lead: [
    'head of', 'director', 'vp ', 'vice president', 'chief',
    'team lead', 'tech lead', 'c-level', 'cto', 'cfo', 'coo ', ' coo,', 'cmo',
    'engineering manager', 'general manager',
  ],
}

const LEAD_FALSE_POSITIVES = ['lead generat', 'leading']
const MANAGER_LEAD_PATTERNS = [
  'engineering manager', 'general manager', 'managing director',
  'country manager', 'regional manager', 'finance manager',
]

function classifyLevel(title: string): 'entry' | 'mid' | 'senior' | 'lead' {
  const t = title.toLowerCase()
  if (LEVEL_PATTERNS.lead.some(p => t.includes(p))) return 'lead'
  if (t.includes('lead') && !LEAD_FALSE_POSITIVES.some(fp => t.includes(fp))) return 'lead'
  if (t.includes('manager') && MANAGER_LEAD_PATTERNS.some(p => t.includes(p))) return 'lead'
  if (LEVEL_PATTERNS.senior.some(p => t.includes(p))) return 'senior'
  if (LEVEL_PATTERNS.entry.some(p => t.includes(p))) return 'entry'
  if (/\bintern\b/.test(t)) return 'entry'
  return 'mid'
}

export async function GET(request: NextRequest) {
  const periodParam = request.nextUrl.searchParams.get('period') || '30'
  const regionParam = request.nextUrl.searchParams.get('region') || 'all'
  const levelParam = request.nextUrl.searchParams.get('level') || null
  const periodDays = periodParam === 'all' ? 365 : parseInt(periodParam, 10)
  if (![7, 30, 90, 365].includes(periodDays)) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - periodDays)

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, crawledAt, source, company, location, remoteType')
    .eq('isActive', true)
    .gte('crawledAt', cutoff.toISOString())
    .limit(10000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let rows = (jobs || []).filter(row => matchesRegion(row.location || '', regionParam))

  if (levelParam && ['entry', 'mid', 'senior', 'lead'].includes(levelParam)) {
    rows = rows.filter(row => classifyLevel(row.title || '') === levelParam)
  }

  // --- weeklyJobs: last 12 weeks ---
  const weeklyMap = new Map<string, number>()
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    weeklyMap.set(getISOWeek(d), 0)
  }
  for (const row of rows) {
    if (!row.crawledAt) continue
    const wk = getISOWeek(new Date(row.crawledAt))
    if (weeklyMap.has(wk)) {
      weeklyMap.set(wk, (weeklyMap.get(wk) || 0) + 1)
    }
  }
  const weeklyJobs = Array.from(weeklyMap.entries()).map(([week, count]) => ({ week, count }))

  // --- sourceBreakdown ---
  const srcMap = new Map<string, number>()
  for (const row of rows) {
    const src = row.source || 'Unknown'
    srcMap.set(src, (srcMap.get(src) || 0) + 1)
  }
  const sourceBreakdown = topN(srcMap, 10)

  // --- topCompanies ---
  const compMap = new Map<string, number>()
  for (const row of rows) {
    const comp = row.company || 'Unknown'
    compMap.set(comp, (compMap.get(comp) || 0) + 1)
  }
  const topCompanies = topN(compMap, 20, false)

  // --- workType ---
  const workMap = new Map<string, number>()
  for (const row of rows) {
    let wt = row.remoteType
    if (!wt) {
      const loc = (row.location || '').toLowerCase()
      if (loc.includes('remote')) wt = 'Remote'
      else if (loc.includes('hybrid')) wt = 'Hybrid'
      else wt = 'Onsite'
    }
    workMap.set(wt, (workMap.get(wt) || 0) + 1)
  }
  const workType = Array.from(workMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // --- locationBreakdown ---
  const locMap = new Map<string, number>()
  for (const row of rows) {
    const country = extractCountry(row.location || '')
    locMap.set(country, (locMap.get(country) || 0) + 1)
  }
  const locationBreakdown = topN(locMap, 15)

  return NextResponse.json({
    weeklyJobs,
    sourceBreakdown,
    topCompanies,
    workType,
    locationBreakdown,
    totalJobs: rows.length,
  })
}

// --- Helpers ---

function getISOWeek(d: Date): string {
  const year = d.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000)
  const week = Math.ceil((days + jan1.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function topN(map: Map<string, number>, n: number, includeOther = true) {
  const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, n).map(([name, value]) => ({ name, value }))
  if (includeOther && sorted.length > n) {
    const otherSum = sorted.slice(n).reduce((s, [, v]) => s + v, 0)
    if (otherSum > 0) top.push({ name: 'Other', value: otherSum })
  }
  return top
}

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  'United States': ['usa', 'united states', 'us', 'new york', 'san francisco', 'california', 'texas', 'chicago', 'miami', 'seattle', 'boston', 'los angeles', 'denver', 'austin'],
  'United Kingdom': ['uk', 'united kingdom', 'london', 'england', 'manchester', 'birmingham'],
  'Germany': ['germany', 'berlin', 'munich', 'frankfurt', 'hamburg'],
  'Singapore': ['singapore'],
  'Switzerland': ['switzerland', 'zurich', 'zug', 'geneva'],
  'Canada': ['canada', 'toronto', 'vancouver', 'montreal'],
  'France': ['france', 'paris'],
  'Netherlands': ['netherlands', 'amsterdam'],
  'India': ['india', 'bangalore', 'mumbai', 'delhi'],
  'Australia': ['australia', 'sydney', 'melbourne'],
  'Japan': ['japan', 'tokyo'],
  'South Korea': ['south korea', 'korea', 'seoul'],
  'China': ['china', 'beijing', 'shanghai', 'hong kong'],
  'UAE': ['uae', 'dubai', 'abu dhabi'],
  'Portugal': ['portugal', 'lisbon'],
  'Spain': ['spain', 'madrid', 'barcelona'],
  'Ireland': ['ireland', 'dublin'],
  'Brazil': ['brazil', 'são paulo'],
  'Israel': ['israel', 'tel aviv'],
  'Estonia': ['estonia', 'tallinn'],
}

function extractCountry(location: string): string {
  const lower = location.toLowerCase()
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return country
    }
  }
  return 'Other'
}
