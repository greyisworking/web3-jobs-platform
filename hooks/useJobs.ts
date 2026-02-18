'use client'

import useSWR from 'swr'
import type { Job } from '@/types/job'

interface Stats {
  total: number
  global: number
  korea: number
  sources: { source: string; _count: number }[]
}

interface JobsResponse {
  jobs: Job[]
  stats: Stats
}

// Optimized fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

/**
 * Hook for fetching jobs with SWR caching
 * - Aggressive caching: 5 minute refresh interval
 * - Stale-while-revalidate pattern
 * - Error retry with backoff
 */
export function useJobs() {
  const { data, error, isLoading, mutate } = useSWR<JobsResponse>(
    '/api/jobs',
    fetcher,
    {
      revalidateOnFocus: false,      // Don't refetch on window focus (saves requests)
      revalidateOnReconnect: true,   // Refetch on network reconnect
      revalidateIfStale: true,       // Revalidate if data is stale
      dedupingInterval: 60000,       // Dedupe requests within 1 minute
      refreshInterval: 300000,       // Refresh every 5 minutes
      keepPreviousData: true,        // Keep old data while fetching new
      errorRetryCount: 3,            // Retry failed requests 3 times
      errorRetryInterval: 5000,      // Wait 5 seconds between retries
      focusThrottleInterval: 60000,  // Throttle focus events to 1/min
    }
  )

  return {
    jobs: data?.jobs ?? [],
    stats: data?.stats ?? { total: 0, global: 0, korea: 0, sources: [] },
    isLoading,
    isError: !!error,
    mutate,
  }
}

/**
 * Hook for fetching a single job
 */
export function useJob(id: string) {
  const { data, error, isLoading } = useSWR<Job>(
    id ? `/api/jobs/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    job: data,
    isLoading,
    isError: !!error,
  }
}
