import useSWR from 'swr'
import type { ErrorLogsFilters, ErrorLogsResponse } from '@/types/monitoring'
import { fetcher } from '@/lib/fetcher'

export function useErrorLogs(filters: ErrorLogsFilters = {}) {
  const params = new URLSearchParams()
  if (filters.level) params.set('level', filters.level)
  if (filters.keyword) params.set('keyword', filters.keyword)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

  const query = params.toString()
  const url = `/api/admin/monitoring/errors${query ? `?${query}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<ErrorLogsResponse>(
    url,
    fetcher,
    { refreshInterval: 30000 }
  )

  return {
    logs: data?.logs ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 50,
    isLoading,
    isError: !!error,
    mutate,
  }
}
