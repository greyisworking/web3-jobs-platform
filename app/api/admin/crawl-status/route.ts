import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type {
  CrawlSession,
  SourceHealth,
  DataQuality,
  CrawlStatusResponse,
} from '@/types/crawl-status'

export const dynamic = 'force-dynamic'

// 시간 gap 기준 세션 그루핑 (30분)
const SESSION_GAP_MS = 30 * 60 * 1000

export async function GET() {
  try {
    await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()

  const now = new Date()
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString()
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  ).toISOString()

  // 병렬로 모든 데이터 조회
  const [crawlLogsResult, activeResult, inactiveResult, todayExpiredResult, emptyDescResult, jobPairsResult] =
    await Promise.all([
      // CrawlLog 최근 200건
      supabase
        .from('CrawlLog')
        .select('id, source, status, jobCount, error, createdAt')
        .order('createdAt', { ascending: false })
        .limit(200),
      // 활성 공고 수
      supabase
        .from('Job')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true),
      // 비활성 공고 수
      supabase
        .from('Job')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', false),
      // 오늘 만료된 공고 수
      supabase
        .from('Job')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', false)
        .gte('updatedAt', todayStart),
      // 빈 description 공고 수
      supabase
        .from('Job')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true)
        .or('description.is.null,description.eq.'),
      // 중복 감지용 title+company 쌍 (활성 공고만)
      supabase
        .from('Job')
        .select('title, company')
        .eq('isActive', true),
    ])

  const crawlLogs = crawlLogsResult.data ?? []

  // ── 섹션 1: 실행 히스토리 ──
  const runHistory = buildRunHistory(crawlLogs)

  // ── 섹션 2: 소스별 헬스 ──
  const recentLogs = crawlLogs.filter(
    (log) => new Date(log.createdAt).getTime() >= new Date(sevenDaysAgo).getTime()
  )
  const sourceHealth = buildSourceHealth(recentLogs)

  // ── 섹션 3: 데이터 품질 ──
  const jobPairs = jobPairsResult.data ?? []
  const seen = new Map<string, number>()
  for (const j of jobPairs) {
    const key = `${j.title}||${j.company}`
    seen.set(key, (seen.get(key) || 0) + 1)
  }
  let duplicateCount = 0
  for (const count of seen.values()) {
    if (count > 1) duplicateCount += count
  }

  const dataQuality: DataQuality = {
    activeJobs: activeResult.count ?? 0,
    inactiveJobs: inactiveResult.count ?? 0,
    todayExpired: todayExpiredResult.count ?? 0,
    emptyDescription: emptyDescResult.count ?? 0,
    duplicateCount,
  }

  const response: CrawlStatusResponse = {
    runHistory,
    sourceHealth,
    dataQuality,
  }

  return NextResponse.json(response)
}

function buildRunHistory(
  logs: { id: string; source: string; status: string; jobCount: number; createdAt: string }[]
): CrawlSession[] {
  if (logs.length === 0) return []

  // 시간순 정렬 (오래된 것 먼저)
  const sorted = [...logs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  // 시간 gap 기준으로 세션 그루핑
  const sessions: typeof sorted[] = []
  let currentSession: typeof sorted = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const prevTime = new Date(sorted[i - 1].createdAt).getTime()
    const currTime = new Date(sorted[i].createdAt).getTime()

    if (currTime - prevTime > SESSION_GAP_MS) {
      sessions.push(currentSession)
      currentSession = [sorted[i]]
    } else {
      currentSession.push(sorted[i])
    }
  }
  sessions.push(currentSession)

  // 최근 10개 세션만 (역순)
  return sessions
    .slice(-10)
    .reverse()
    .map((entries) => {
      const startedAt = entries[0].createdAt
      const endedAt = entries[entries.length - 1].createdAt
      const duration = Math.round(
        (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
      )

      const successCount = entries.filter((e) => e.status === 'success').length
      const failedCount = entries.filter((e) => e.status !== 'success').length
      const totalJobs = entries.reduce((sum, e) => sum + (e.jobCount || 0), 0)

      return {
        sessionId: startedAt,
        startedAt,
        endedAt,
        duration,
        successCount,
        failedCount,
        totalJobs,
        sources: entries.map((e) => ({
          name: e.source,
          status: e.status,
          jobCount: e.jobCount || 0,
        })),
      }
    })
}

function buildSourceHealth(
  logs: { source: string; status: string; jobCount: number; createdAt: string }[]
): SourceHealth[] {
  // 소스별 그루핑
  const bySource = new Map<string, typeof logs>()
  for (const log of logs) {
    const arr = bySource.get(log.source) || []
    arr.push(log)
    bySource.set(log.source, arr)
  }

  const result: SourceHealth[] = []
  for (const [name, entries] of bySource) {
    // 최신순 정렬
    const sorted = entries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const last = sorted[0]
    const lastStatus = last.status === 'success' ? 'success' : 'failed'

    // 연속 실패 횟수
    let consecutiveFailures = 0
    for (const entry of sorted) {
      if (entry.status !== 'success') {
        consecutiveFailures++
      } else {
        break
      }
    }

    // 최근 5회 평균 건수
    const recent5 = sorted.slice(0, 5)
    const avgJobCount =
      recent5.length > 0
        ? Math.round(
            recent5.reduce((sum, e) => sum + (e.jobCount || 0), 0) / recent5.length
          )
        : 0

    result.push({
      name,
      lastCrawledAt: last.createdAt,
      lastJobCount: last.jobCount || 0,
      lastStatus,
      consecutiveFailures,
      avgJobCount,
    })
  }

  // 이름순 정렬
  return result.sort((a, b) => a.name.localeCompare(b.name))
}
