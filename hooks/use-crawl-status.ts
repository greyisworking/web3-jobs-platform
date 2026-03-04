import useSWR from 'swr'
import type { CrawlStatusResponse } from '@/types/crawl-status'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const defaultData: CrawlStatusResponse = {
  runHistory: [],
  sourceHealth: [],
  dataQuality: {
    activeJobs: 0,
    inactiveJobs: 0,
    todayExpired: 0,
    emptyDescription: 0,
    duplicateCount: 0,
  },
}

export function useCrawlStatus() {
  const { data, error, isLoading, mutate } = useSWR<CrawlStatusResponse>(
    '/api/admin/crawl-status',
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
