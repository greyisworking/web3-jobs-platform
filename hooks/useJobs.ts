'use client'

import useSWR from 'swr'
import type { Job } from '@/types/job'

interface JobsResponse {
  jobs: Job[]
  stats: {
    total: number
    global: number
    korea: number
    sources: { source: string; _count: number }[]
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// SWR configuration for jobs - cache for 5 minutes, revalidate on focus
const swrOptions = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // Dedupe requests within 1 minute
  refreshInterval: 300000, // Auto refresh every 5 minutes
}

/**
 * Hook to fetch all jobs with SWR caching
 */
export function useJobs() {
  const { data, error, isLoading, mutate } = useSWR<JobsResponse>(
    '/api/jobs',
    fetcher,
    swrOptions
  )

  return {
    jobs: data?.jobs || [],
    stats: data?.stats || { total: 0, global: 0, korea: 0, sources: [] },
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook to fetch a single job by ID
 */
export function useJob(id: string | null) {
  const { data, error, isLoading } = useSWR<{ job: Job }>(
    id ? `/api/jobs/${id}` : null,
    fetcher,
    {
      ...swrOptions,
      revalidateOnFocus: false, // Don't revalidate single job on focus
    }
  )

  return {
    job: data?.job || null,
    isLoading,
    isError: error,
  }
}

/**
 * Prefetch jobs for better UX
 */
export function prefetchJobs() {
  // Trigger a prefetch by calling the API
  fetch('/api/jobs').then((res) => res.json())
}

export default useJobs
