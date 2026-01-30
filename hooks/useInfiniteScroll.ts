'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseInfiniteScrollOptions<T> {
  items: T[]
  pageSize?: number
  threshold?: number // Pixels from bottom to trigger load
  rootMargin?: string // IntersectionObserver margin
}

interface UseInfiniteScrollReturn<T> {
  visibleItems: T[]
  hasMore: boolean
  loadMore: () => void
  reset: () => void
  sentinelRef: React.RefObject<HTMLDivElement | null>
  isLoadingMore: boolean
}

/**
 * Optimized infinite scroll hook using IntersectionObserver
 */
export function useInfiniteScroll<T>({
  items,
  pageSize = 12,
  threshold = 200,
  rootMargin = '0px 0px 200px 0px',
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const visibleItems = items.slice(0, visibleCount)
  const hasMore = visibleCount < items.length

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    // Use requestAnimationFrame for smooth loading
    requestAnimationFrame(() => {
      setVisibleCount((prev) => Math.min(prev + pageSize, items.length))
      setIsLoadingMore(false)
    })
  }, [hasMore, isLoadingMore, pageSize, items.length])

  const reset = useCallback(() => {
    setVisibleCount(pageSize)
  }, [pageSize])

  // Reset when items change significantly
  useEffect(() => {
    setVisibleCount(pageSize)
  }, [items.length, pageSize])

  // IntersectionObserver for auto-loading
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      {
        rootMargin,
        threshold: 0,
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore, rootMargin])

  return {
    visibleItems,
    hasMore,
    loadMore,
    reset,
    sentinelRef,
    isLoadingMore,
  }
}

export default useInfiniteScroll
