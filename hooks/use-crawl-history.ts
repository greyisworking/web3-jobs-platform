import useSWR from 'swr'
import type { CrawlHistoryResponse } from '@/types/monitoring'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useCrawlHistory(page = 1, pageSize = 20) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })

  const { data, error, isLoading, mutate } = useSWR<CrawlHistoryResponse>(
    `/api/admin/monitoring/crawl-history?${params}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  return {
    runs: data?.runs ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
    isLoading,
    isError: !!error,
    mutate,
  }
}
