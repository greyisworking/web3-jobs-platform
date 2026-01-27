'use client'

import { AlertTriangle, Server, CheckCircle, Briefcase } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { MonitoringStats } from '@/types/monitoring'

interface SummaryCardsProps {
  stats: MonitoringStats
  isLoading: boolean
}

export function SummaryCards({ stats, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const trendUp = stats.errorsTrend > 0
  const trendDown = stats.errorsTrend < 0
  const trendColor = trendUp
    ? 'text-destructive'
    : trendDown
      ? 'text-green-600'
      : 'text-muted-foreground'

  const proxyHealthy = stats.totalProxies > 0
    ? stats.activeProxies / stats.totalProxies >= 0.7
    : true
  const successHealthy = stats.todaySuccessRate >= 80

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Today's Errors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Today&apos;s Errors
          </CardTitle>
          <AlertTriangle
            className={
              stats.todayErrors > 0
                ? 'h-4 w-4 text-destructive'
                : 'h-4 w-4 text-muted-foreground'
            }
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayErrors}</div>
          <p className={`text-xs ${trendColor}`}>
            {trendUp && '+'}
            {stats.errorsTrend}% vs yesterday ({stats.yesterdayErrors})
          </p>
        </CardContent>
      </Card>

      {/* Active Proxies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Proxies</CardTitle>
          <Server
            className={
              proxyHealthy
                ? 'h-4 w-4 text-green-600'
                : 'h-4 w-4 text-destructive'
            }
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.activeProxies}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              / {stats.totalProxies}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalProxies > 0
              ? `${Math.round((stats.activeProxies / stats.totalProxies) * 100)}% healthy`
              : 'No proxies configured'}
          </p>
        </CardContent>
      </Card>

      {/* Crawl Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle
            className={
              successHealthy
                ? 'h-4 w-4 text-green-600'
                : 'h-4 w-4 text-yellow-500'
            }
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todaySuccessRate}%</div>
          <p className="text-xs text-muted-foreground">
            Crawl success rate today
          </p>
        </CardContent>
      </Card>

      {/* Jobs Crawled Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Jobs Crawled Today
          </CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayJobsCrawled}</div>
          <p className="text-xs text-muted-foreground">
            Total jobs saved today
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
