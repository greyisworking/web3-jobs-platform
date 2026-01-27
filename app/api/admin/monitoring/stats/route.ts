import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { MonitoringStats } from '@/types/monitoring'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()

  const [
    { count: todayErrors },
    { count: yesterdayErrors },
    { count: activeProxies },
    { count: totalProxies },
    { data: todayCrawls },
    { count: todayJobsCrawled },
  ] = await Promise.all([
    supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', todayStart),
    supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', yesterdayStart)
      .lt('timestamp', todayStart),
    supabase
      .from('proxy_status')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('proxy_status')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('crawl_runs')
      .select('status')
      .gte('started_at', todayStart),
    supabase
      .from('crawl_runs')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', todayStart)
      .not('jobs_saved', 'is', null),
  ])

  const todayErrCount = todayErrors ?? 0
  const yesterdayErrCount = yesterdayErrors ?? 0
  const errorsTrend =
    yesterdayErrCount === 0
      ? todayErrCount > 0
        ? 100
        : 0
      : Math.round(
          ((todayErrCount - yesterdayErrCount) / yesterdayErrCount) * 100
        )

  const completedCrawls = todayCrawls?.filter((c) => c.status === 'completed').length ?? 0
  const totalCrawls = todayCrawls?.length ?? 0
  const todaySuccessRate =
    totalCrawls === 0 ? 100 : Math.round((completedCrawls / totalCrawls) * 100)

  const stats: MonitoringStats = {
    todayErrors: todayErrCount,
    yesterdayErrors: yesterdayErrCount,
    errorsTrend,
    activeProxies: activeProxies ?? 0,
    totalProxies: totalProxies ?? 0,
    todaySuccessRate,
    todayJobsCrawled: todayJobsCrawled ?? 0,
  }

  return NextResponse.json(stats)
}
