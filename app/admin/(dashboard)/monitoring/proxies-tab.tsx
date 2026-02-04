'use client'

import { useProxyStatus } from '@/hooks/use-proxy-status'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProxyStatus, ProxyStatusType } from '@/types/monitoring'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const statusColors: Record<ProxyStatusType, string> = {
  active: 'bg-green-600 text-white hover:bg-green-700',
  blocked: 'bg-red-600 text-white hover:bg-red-700',
  slow: 'bg-yellow-500 text-black hover:bg-yellow-600',
}

function latencyColor(ms: number | null): string {
  if (ms === null) return 'text-muted-foreground'
  if (ms < 200) return 'text-green-600'
  if (ms < 500) return 'text-yellow-500'
  return 'text-red-600'
}

function latencyProgress(ms: number | null): number {
  if (ms === null) return 0
  return Math.min((ms / 1000) * 100, 100)
}

function successRateColor(rate: number | null): string {
  if (rate === null) return 'text-muted-foreground'
  if (rate >= 90) return 'text-green-600'
  if (rate >= 70) return 'text-yellow-500'
  return 'text-red-600'
}

export function MonitoringProxiesTab() {
  const { proxies, isLoading } = useProxyStatus()

  const chartData = proxies
    .filter((p: ProxyStatus) => p.latency_ms !== null)
    .map((p: ProxyStatus) => ({
      name: p.proxy_url.replace(/https?:\/\//, '').slice(0, 20),
      latency: p.latency_ms,
    }))

  return (
    <div className="space-y-4 mt-4">
      <p className="text-xs text-muted-foreground">
        10초마다 자동 새로고침
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">지연시간 개요</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis unit="ms" fontSize={11} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>프록시 URL</TableHead>
                  <TableHead className="w-24">상태</TableHead>
                  <TableHead className="w-40">지연시간</TableHead>
                  <TableHead className="w-32">성공률</TableHead>
                  <TableHead className="w-28">요청 수</TableHead>
                  <TableHead className="w-40">마지막 확인</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proxies.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      프록시 미설정
                    </TableCell>
                  </TableRow>
                ) : (
                  proxies.map((proxy: ProxyStatus) => (
                    <TableRow key={proxy.id}>
                      <TableCell className="font-mono text-sm">
                        {proxy.proxy_url}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[proxy.status]}>
                          {proxy.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={latencyProgress(proxy.latency_ms)}
                            className="h-2 w-20"
                          />
                          <span
                            className={`text-sm font-medium ${latencyColor(proxy.latency_ms)}`}
                          >
                            {proxy.latency_ms !== null
                              ? `${proxy.latency_ms}ms`
                              : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${successRateColor(proxy.success_rate !== null ? Number(proxy.success_rate) : null)}`}
                        >
                          {proxy.success_rate !== null
                            ? `${Number(proxy.success_rate).toFixed(1)}%`
                            : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {proxy.total_requests}
                        {proxy.failed_requests > 0 && (
                          <span className="text-destructive ml-1">
                            ({proxy.failed_requests}개 실패)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(proxy.last_checked).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
