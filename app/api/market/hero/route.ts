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
  'Ethereum': /\bethereum\b/i,
  'Solana': /\bsolana\b/i,
  'Bitcoin': /\bbitcoin\b/i,
}

function getISOWeek(d: Date): string {
  const year = d.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000)
  const week = Math.ceil((days + jan1.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function parseTags(tags: unknown): string {
  if (!tags) return ''
  if (Array.isArray(tags)) return tags.join(' ')
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? parsed.join(' ') : tags
    } catch {
      return tags
    }
  }
  return ''
}

function countSkills(
  jobs: { title: string | null; tags: unknown }[]
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const job of jobs) {
    const text = ((job.title || '') + ' ' + parseTags(job.tags)).toLowerCase()
    for (const [name, regex] of Object.entries(SKILL_KEYWORDS)) {
      if (regex.test(text)) {
        counts.set(name, (counts.get(name) || 0) + 1)
      }
    }
  }
  return counts
}

export async function GET() {
  try {
    const supabase = createPublicSupabaseClient()

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const fiftySixDaysAgo = new Date(now)
    fiftySixDaysAgo.setDate(fiftySixDaysAgo.getDate() - 56)

    // Phase 1: Lightweight count queries + skill data (parallel)
    const [thisWeekRes, lastWeekRes, totalCountRes, thisWeekCountRes, lastWeekCountRes, trendRes] = await Promise.all([
      // Skills: this week (title + tags only, limited set)
      supabase
        .from('Job')
        .select('title, tags')
        .eq('isActive', true)
        .gte('crawledAt', sevenDaysAgo.toISOString())
        .limit(3000),

      // Skills: last week
      supabase
        .from('Job')
        .select('title, tags')
        .eq('isActive', true)
        .gte('crawledAt', fourteenDaysAgo.toISOString())
        .lt('crawledAt', sevenDaysAgo.toISOString())
        .limit(3000),

      // Total active count (head-only, no row data)
      supabase
        .from('Job')
        .select('id', { count: 'exact', head: true })
        .eq('isActive', true),

      // New this week count
      supabase
        .from('Job')
        .select('id', { count: 'exact', head: true })
        .eq('isActive', true)
        .gte('crawledAt', sevenDaysAgo.toISOString()),

      // New last week count
      supabase
        .from('Job')
        .select('id', { count: 'exact', head: true })
        .eq('isActive', true)
        .gte('crawledAt', fourteenDaysAgo.toISOString())
        .lt('crawledAt', sevenDaysAgo.toISOString()),

      // Weekly trend: just crawledAt
      supabase
        .from('Job')
        .select('crawledAt')
        .eq('isActive', true)
        .gte('crawledAt', fiftySixDaysAgo.toISOString())
        .limit(10000),
    ])

    // Check for critical errors
    const firstError = thisWeekRes.error || lastWeekRes.error || totalCountRes.error
    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 })
    }

    const thisWeekJobs = thisWeekRes.data || []
    const lastWeekJobs = lastWeekRes.data || []
    const trendJobs = trendRes.data || []

    // -- Skills --
    const thisWeekSkills = countSkills(thisWeekJobs)
    const lastWeekSkills = countSkills(lastWeekJobs)
    const thisWeekTotal = thisWeekJobs.length || 1
    const lastWeekTotal = lastWeekJobs.length || 1

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

    skillChanges.sort((a, b) => b.count - a.count)
    const hotSkills = skillChanges.slice(0, 3)

    const trendingUp = [...skillChanges]
      .filter(s => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)[0]
      || { name: hotSkills[0]?.name || '-', changePercent: 0 }

    const coolingDown = [...skillChanges]
      .filter(s => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)[0]
      || { name: '-', changePercent: 0 }

    // -- Market Pulse (from count queries) --
    const totalJobs = totalCountRes.count ?? 0
    const newThisWeek = thisWeekCountRes.count ?? 0
    const newLastWeek = lastWeekCountRes.count ?? 0

    const totalChange = newLastWeek > 0
      ? Math.round(((newThisWeek - newLastWeek) / newLastWeek) * 100)
      : (newThisWeek > 0 ? 100 : 0)

    // Remote rate: estimate from this week's skill query data (already fetched)
    // Not perfect but avoids an extra heavy query
    const remoteRate = 0 // Simplified: skip remote calculation to stay within timeout
    const remoteChange = 0

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
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
