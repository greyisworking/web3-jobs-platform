import useSWR from 'swr'
import type { MonitoringStats } from '@/types/monitoring'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const defaultStats: MonitoringStats = {
  todayErrors: 0,
  yesterdayErrors: 0,
  errorsTrend: 0,
  activeProxies: 0,
  totalProxies: 0,
  todaySuccessRate: 0,
  todayJobsCrawled: 0,
}

export function useMonitoringStats() {
  const { data, error, isLoading, mutate } = useSWR<MonitoringStats>(
    '/api/admin/monitoring/stats',
    fetcher,
    { refreshInterval: 60000 }
  )

  return {
    stats: data ?? defaultStats,
    isLoading,
    isError: !!error,
    mutate,
  }
}
