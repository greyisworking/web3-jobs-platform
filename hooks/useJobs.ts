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

const fetcher = (url: string) => fetch(url).then(res => res.json())

/**
 * Hook for fetching jobs with SWR caching
 * - Caches data for 5 minutes
 * - Revalidates on focus
 * - Deduplicates requests
 */
export function useJobs() {
  const { data, error, isLoading, mutate } = useSWR<JobsResponse>(
    '/api/jobs',
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch on window focus
      revalidateOnReconnect: true, // Refetch on reconnect
      dedupingInterval: 60000, // Dedupe requests within 1 minute
      refreshInterval: 300000, // Refresh every 5 minutes
      keepPreviousData: true, // Keep old data while fetching new
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
