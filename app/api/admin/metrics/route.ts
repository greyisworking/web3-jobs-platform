import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Run all queries in parallel
    const [
      // WIG Metrics - Apply Clicks
      { count: monthlyApplyClicks },
      { data: dailyApplyClicks },

      // Lead Measures - Crawler
      { count: totalJobs },
      { count: activeJobs },
      { count: todayNewJobs },
      { data: crawlerStats },

      // Lead Measures - Users
      { count: totalBookmarks },
      { count: totalReports },

      // Weekly trend data
      { data: weeklyApplyTrend },
    ] = await Promise.all([
      // Monthly apply clicks
      supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'job_apply_click')
        .gte('created_at', startOfMonth.toISOString()),

      // Daily apply clicks for chart (last 30 days)
      supabase
        .from('analytics_events')
        .select('created_at')
        .eq('event_type', 'job_apply_click')
        .gte('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }),

      // Total jobs
      supabase.from('Job').select('*', { count: 'exact', head: true }),

      // Active jobs
      supabase
        .from('Job')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true),

      // Today's new jobs
      supabase
        .from('Job')
        .select('*', { count: 'exact', head: true })
        .gte('crawledAt', startOfDay.toISOString()),

      // Crawler stats by source (last 7 days)
      supabase
        .from('Job')
        .select('source')
        .eq('isActive', true)
        .gte('crawledAt', startOfWeek.toISOString()),

      // Total bookmarks
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }),

      // Total reports
      supabase.from('JobReport').select('*', { count: 'exact', head: true }),

      // Weekly apply trend (last 4 weeks)
      supabase
        .from('analytics_events')
        .select('created_at')
        .eq('event_type', 'job_apply_click')
        .gte('created_at', new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }),
    ])

    // Process daily clicks into chart data
    const dailyClicksMap = new Map<string, number>()
    const last30Days: string[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      last30Days.push(dateStr)
      dailyClicksMap.set(dateStr, 0)
    }

    dailyApplyClicks?.forEach((event) => {
      const dateStr = new Date(event.created_at).toISOString().split('T')[0]
      if (dailyClicksMap.has(dateStr)) {
        dailyClicksMap.set(dateStr, (dailyClicksMap.get(dateStr) || 0) + 1)
      }
    })

    const chartData = last30Days.map((date) => ({
      date,
      clicks: dailyClicksMap.get(date) || 0,
    }))

    // Process weekly trend
    const weeklyData: { week: string; clicks: number }[] = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
      const weekEnd = new Date(now)
      weekEnd.setDate(weekEnd.getDate() - i * 7)

      const count = weeklyApplyTrend?.filter((event) => {
        const eventDate = new Date(event.created_at)
        return eventDate >= weekStart && eventDate < weekEnd
      }).length || 0

      weeklyData.push({
        week: `Week ${4 - i}`,
        clicks: count,
      })
    }

    // Calculate crawler success rate by source
    const sourceStats = new Map<string, number>()
    crawlerStats?.forEach((job) => {
      sourceStats.set(job.source, (sourceStats.get(job.source) || 0) + 1)
    })

    const crawlerSources = Array.from(sourceStats.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)

    // Calculate previous period for trend
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const { count: prevMonthApplyClicks } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'job_apply_click')
      .gte('created_at', prevMonthStart.toISOString())
      .lte('created_at', prevMonthEnd.toISOString())

    // Calculate trends
    const applyTrend = prevMonthApplyClicks && prevMonthApplyClicks > 0
      ? ((monthlyApplyClicks || 0) - prevMonthApplyClicks) / prevMonthApplyClicks * 100
      : 0

    return NextResponse.json({
      wig: {
        target: 1000,
        deadline: '2026-06-30',
        current: monthlyApplyClicks || 0,
        progress: Math.min(100, ((monthlyApplyClicks || 0) / 1000) * 100),
        trend: applyTrend,
        chartData,
        weeklyData,
      },
      leadMeasures: {
        crawler: {
          totalJobs: totalJobs || 0,
          activeJobs: activeJobs || 0,
          todayNewJobs: todayNewJobs || 0,
          targetJobs: 2000,
          sources: crawlerSources,
        },
        users: {
          bookmarks: totalBookmarks || 0,
          reports: totalReports || 0,
        },
        traffic: {
          // Placeholder for future analytics integration
          dailyVisitors: null,
          weeklyVisitors: null,
        },
        marketing: {
          // Placeholder for manual input
          twitterFollowers: null,
        },
      },
      lastUpdated: now.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
