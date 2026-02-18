/**
 * Prefetch utilities for improving navigation performance
 */

// Track prefetched URLs to avoid duplicate requests
const prefetchedUrls = new Set<string>()

/**
 * Prefetch a URL's data (for API routes)
 */
export function prefetchData(url: string): void {
  if (prefetchedUrls.has(url)) return
  prefetchedUrls.add(url)

  // Use fetch with low priority
  fetch(url, {
    method: 'GET',
    priority: 'low' as RequestPriority,
    cache: 'force-cache',
  }).catch(() => {
    // Silently fail - prefetch is best-effort
    prefetchedUrls.delete(url)
  })
}

/**
 * Prefetch job data when user hovers over a job card
 */
export function prefetchJob(jobId: string): void {
  prefetchData(`/api/jobs/${jobId}`)
}

/**
 * Prefetch multiple jobs (useful for visible cards)
 */
export function prefetchJobs(jobIds: string[]): void {
  jobIds.slice(0, 5).forEach(id => prefetchJob(id))
}

/**
 * Create intersection observer for lazy prefetching
 */
export function createPrefetchObserver(
  onIntersect: (element: HTMLElement) => void
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onIntersect(entry.target as HTMLElement)
        }
      })
    },
    {
      rootMargin: '200px', // Prefetch when 200px away from viewport
      threshold: 0,
    }
  )
}
