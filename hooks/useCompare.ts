'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'job_compare_list'
const MAX_COMPARE = 4

export function useCompare() {
  const [compareIds, setCompareIds] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setCompareIds(JSON.parse(stored))
      } catch {
        // ignore
      }
    }
  }, [])

  // Save to localStorage when changed
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds))
  }, [compareIds])

  const addToCompare = useCallback((jobId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(jobId)) return prev
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, jobId]
    })
  }, [])

  const removeFromCompare = useCallback((jobId: string) => {
    setCompareIds((prev) => prev.filter((id) => id !== jobId))
  }, [])

  const toggleCompare = useCallback((jobId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(jobId)) {
        return prev.filter((id) => id !== jobId)
      }
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, jobId]
    })
  }, [])

  const clearCompare = useCallback(() => {
    setCompareIds([])
  }, [])

  const isInCompare = useCallback(
    (jobId: string) => compareIds.includes(jobId),
    [compareIds]
  )

  const getCompareUrl = useCallback(() => {
    if (compareIds.length === 0) return '/jobs/compare'
    return `/jobs/compare?ids=${compareIds.join(',')}`
  }, [compareIds])

  return {
    compareIds,
    compareCount: compareIds.length,
    maxCompare: MAX_COMPARE,
    addToCompare,
    removeFromCompare,
    toggleCompare,
    clearCompare,
    isInCompare,
    getCompareUrl,
    canAddMore: compareIds.length < MAX_COMPARE,
  }
}
