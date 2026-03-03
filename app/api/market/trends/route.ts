import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const periodParam = request.nextUrl.searchParams.get('period') || '30'
  const periodDays = periodParam === 'all' ? 365 : parseInt(periodParam, 10)
  if (![7, 30, 90, 365].includes(periodDays)) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - periodDays)

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, crawledAt, source, company, location, remoteType')
    .eq('isActive', true)
    .gte('crawledAt', cutoff.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = jobs || []

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
