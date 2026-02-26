import useSWR from 'swr'
import type { ProxyStatusResponse } from '@/types/monitoring'
import { fetcher } from '@/lib/fetcher'

export function useProxyStatus() {
  const { data, error, isLoading, mutate } = useSWR<ProxyStatusResponse>(
    '/api/admin/monitoring/proxies',
    fetcher,
    { refreshInterval: 10000 }
  )

  return {
    proxies: data?.proxies ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  }
}
