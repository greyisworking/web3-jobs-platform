'use client'

import { useErrorLogs } from '@/hooks/use-error-logs'
import { useProxyStatus } from '@/hooks/use-proxy-status'
import { useCrawlHistory } from '@/hooks/use-crawl-history'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { ErrorLevel } from '@/types/monitoring'

const levelColors: Record<ErrorLevel, string> = {
  CRITICAL: 'bg-red-600 text-white hover:bg-red-700',
  ERROR: 'bg-orange-500 text-white hover:bg-orange-600',
  WARN: 'bg-yellow-500 text-black hover:bg-yellow-600',
  INFO: 'bg-blue-500 text-white hover:bg-blue-600',
}

export function MonitoringOverview() {
  const { logs: recentErrors, isLoading: errorsLoading } = useErrorLogs({
    pageSize: 5,
  })
  const { proxies, isLoading: proxiesLoading } = useProxyStatus()
  const { runs: recentRuns, isLoading: runsLoading } = useCrawlHistory(1, 5)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          {errorsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : recentErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent errors</p>
          ) : (
            <div className="space-y-2">
              {recentErrors.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 text-sm border-b pb-2 last:border-0"
                >
                  <Badge className={`${levelColors[log.level]} shrink-0 text-xs`}>
                    {log.level}
                  </Badge>
                  <div className="min-w-0">
                    <p className="truncate">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.crawler_name || 'system'} &middot;{' '}
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proxy Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proxy Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {proxiesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : proxies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No proxies configured
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {proxies.filter((p) => p.status === 'active').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">
                    {proxies.filter((p) => p.status === 'slow').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Slow</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {proxies.filter((p) => p.status === 'blocked').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Blocked</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Avg latency:{' '}
                {Math.round(
                  proxies.reduce(
                    (sum, p) => sum + (p.latency_ms ?? 0),
                    0
                  ) / (proxies.filter((p) => p.latency_ms !== null).length || 1)
                )}
                ms
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Crawl Runs */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Recent Crawl Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No crawl runs yet</p>
          ) : (
            <div className="space-y-2">
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        run.status === 'completed'
                          ? 'default'
                          : run.status === 'running'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {run.status}
                    </Badge>
                    <span>{run.crawler_name || 'all'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{run.jobs_saved} saved</span>
                    {run.errors_count > 0 && (
                      <span className="text-destructive">
                        {run.errors_count} errors
                      </span>
                    )}
                    <span className="text-xs">
                      {new Date(run.started_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
