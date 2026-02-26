import useSWR from 'swr'
import type { SearchAnalyticsResponse } from '@/types/analytics'
import { fetcher } from '@/lib/fetcher'

const defaultData: SearchAnalyticsResponse = {
  topQueries: [],
  trends: [],
  techStacks: [],
  totalSearches: 0,
}

export function useSearchAnalytics(dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)

  const query = params.toString()
  const url = `/api/admin/analytics/searches${query ? `?${query}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<SearchAnalyticsResponse>(
    url,
    fetcher,
    { refreshInterval: 60000 }
  )

  return {
    data: data ?? defaultData,
    isLoading,
    isError: !!error,
    mutate,
  }
}
