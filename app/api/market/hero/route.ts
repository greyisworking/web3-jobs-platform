import { NextResponse } from 'next/server'
import { createPublicSupabaseClient } from '@/lib/supabase-public'

const SKILL_KEYWORDS: Record<string, RegExp> = {
  'Solidity': /\bsolidity\b/i,
  'Rust': /\brust\b/i,
  'Move': /\bmove\b/i,
  'TypeScript': /\btypescript\b/i,
  'Python': /\bpython\b/i,
  'Go': /\bgo(?:lang)?\b/i,
  'JavaScript': /\bjavascript\b/i,
  'Java': /\bjava\b/i,
  'C++': /\bc\+\+\b/i,
  'Cairo': /\bcairo\b/i,
  'Vyper': /\bvyper\b/i,
  'Ethereum': /\bethereum\b/i,
  'Solana': /\bsolana\b/i,
  'Base': /\bbase\b/i,
  'Arbitrum': /\barbitrum\b/i,
  'Polygon': /\bpolygon\b/i,
  'Avalanche': /\bavalanche\b/i,
  'Sui': /\bsui\b/i,
  'Aptos': /\baptos\b/i,
  'TON': /\bton\b/i,
  'Bitcoin': /\bbitcoin\b/i,
  'Cosmos': /\bcosmos\b/i,
}

function getISOWeek(d: Date): string {
  const year = d.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000)
  const week = Math.ceil((days + jan1.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function countSkills(
  jobs: { title: string | null; tags: string[] | null }[]
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const job of jobs) {
    const text = ((job.title || '') + ' ' + (job.tags || []).join(' ')).toLowerCase()
    for (const [name, regex] of Object.entries(SKILL_KEYWORDS)) {
      if (regex.test(text)) {
        counts.set(name, (counts.get(name) || 0) + 1)
      }
    }
  }
  return counts
}

function isRemote(location: string | null): boolean {
  if (!location) return false
  const l = location.toLowerCase()
  return l.includes('remote') || l.includes('worldwide') || l.includes('anywhere')
}

export async function GET() {
  const supabase = createPublicSupabaseClient()

  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const fiftySixDaysAgo = new Date(now)
  fiftySixDaysAgo.setDate(fiftySixDaysAgo.getDate() - 56)

  const [thisWeekRes, lastWeekRes, marketRes, trendRes] = await Promise.all([
    // 1. This week jobs for skills
    supabase
      .from('Job')
      .select('title, tags')
      .eq('isActive', true)
      .gte('crawledAt', sevenDaysAgo.toISOString()),

    // 2. Last week jobs for skills
    supabase
      .from('Job')
      .select('title, tags')
      .eq('isActive', true)
      .gte('crawledAt', fourteenDaysAgo.toISOString())
      .lt('crawledAt', sevenDaysAgo.toISOString()),

    // 3. Market pulse - all active jobs with location
    supabase
      .from('Job')
      .select('crawledAt, location')
      .eq('isActive', true),

    // 4. Weekly trend - last 56 days
    supabase
      .from('Job')
      .select('crawledAt')
      .eq('isActive', true)
      .gte('crawledAt', fiftySixDaysAgo.toISOString()),
  ])

  if (thisWeekRes.error || lastWeekRes.error || marketRes.error || trendRes.error) {
    const err = thisWeekRes.error || lastWeekRes.error || marketRes.error || trendRes.error
    return NextResponse.json({ error: err!.message }, { status: 500 })
  }

  const thisWeekJobs = thisWeekRes.data || []
  const lastWeekJobs = lastWeekRes.data || []
  const allActiveJobs = marketRes.data || []
  const trendJobs = trendRes.data || []

  // -- Skills --
  const thisWeekSkills = countSkills(thisWeekJobs)
  const lastWeekSkills = countSkills(lastWeekJobs)
  const thisWeekTotal = thisWeekJobs.length || 1
  const lastWeekTotal = lastWeekJobs.length || 1

  // Compute change percent for each skill
  const skillChanges: { name: string; count: number; changePercent: number }[] = []
  for (const [name, count] of thisWeekSkills) {
    const thisRate = count / thisWeekTotal
    const lastCount = lastWeekSkills.get(name) || 0
    const lastRate = lastCount / lastWeekTotal
    const changePercent = lastRate > 0
      ? Math.round(((thisRate - lastRate) / lastRate) * 100)
      : (count > 0 ? 100 : 0)
    skillChanges.push({ name, count, changePercent })
  }

  // Hot skills: top 3 by count
  skillChanges.sort((a, b) => b.count - a.count)
  const hotSkills = skillChanges.slice(0, 3)

  // Trending up: highest positive changePercent
  const trendingUp = [...skillChanges]
    .filter(s => s.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)[0]
    || { name: hotSkills[0]?.name || '-', changePercent: 0 }

  // Cooling down: most negative changePercent
  const coolingDown = [...skillChanges]
    .filter(s => s.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)[0]
    || { name: '-', changePercent: 0 }

  // -- Market Pulse --
  const totalJobs = allActiveJobs.length
  const newThisWeek = allActiveJobs.filter(
    j => j.crawledAt && new Date(j.crawledAt) >= sevenDaysAgo
  ).length
  const newLastWeek = allActiveJobs.filter(
    j => j.crawledAt && new Date(j.crawledAt) >= fourteenDaysAgo && new Date(j.crawledAt) < sevenDaysAgo
  ).length
  const remoteCount = allActiveJobs.filter(j => isRemote(j.location)).length
  const remoteRate = totalJobs > 0 ? Math.round((remoteCount / totalJobs) * 100) : 0

  // Last week remote rate for comparison
  const lastWeekActive = allActiveJobs.filter(
    j => j.crawledAt && new Date(j.crawledAt) < sevenDaysAgo
  )
  const lastWeekRemoteCount = lastWeekActive.filter(j => isRemote(j.location)).length
  const lastWeekRemoteRate = lastWeekActive.length > 0
    ? Math.round((lastWeekRemoteCount / lastWeekActive.length) * 100)
    : 0

  const totalChange = newLastWeek > 0
    ? Math.round(((newThisWeek - newLastWeek) / newLastWeek) * 100)
    : (newThisWeek > 0 ? 100 : 0)
  const remoteChange = remoteRate - lastWeekRemoteRate

  // -- Weekly Trend (8 weeks) --
  const weeklyMap = new Map<string, number>()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    weeklyMap.set(getISOWeek(d), 0)
  }
  for (const row of trendJobs) {
    if (!row.crawledAt) continue
    const wk = getISOWeek(new Date(row.crawledAt))
    if (weeklyMap.has(wk)) {
      weeklyMap.set(wk, (weeklyMap.get(wk) || 0) + 1)
    }
  }
  const weeklyTrend = Array.from(weeklyMap.entries()).map(([week, count]) => ({ week, count }))

  const response = NextResponse.json({
    hotSkills,
    trendingUp: { name: trendingUp.name, changePercent: trendingUp.changePercent },
    coolingDown: { name: coolingDown.name, changePercent: coolingDown.changePercent },
    marketPulse: {
      totalJobs,
      newThisWeek,
      remoteRate,
      totalChange,
      remoteChange,
    },
    weeklyTrend,
  })

  response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=600')
  return response
}
