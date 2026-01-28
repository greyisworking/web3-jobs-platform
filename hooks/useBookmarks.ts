'use client'

import { useEffect, useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

const STORAGE_KEY = 'web3-bookmarks'

export interface BookmarkItem {
  jobId: string
  savedAt: string
  title: string
  company: string
  verified?: boolean
}

interface UseBookmarksReturn {
  bookmarks: BookmarkItem[]
  toggle: (job: { id: string; title: string; company: string }) => void
  isBookmarked: (jobId: string) => boolean
}

// ── 글로벌 공유 상태 (모든 useBookmarks 인스턴스가 동기화) ──

let globalBookmarks: BookmarkItem[] = []
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((fn) => fn())
}

function getSnapshot(): BookmarkItem[] {
  return globalBookmarks
}

function getServerSnapshot(): BookmarkItem[] {
  return []
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function loadBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistBookmarks(items: BookmarkItem[]) {
  globalBookmarks = items
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }
  emitChange()
}

// 클라이언트 초기화 (한 번만)
let initialized = false

function ensureInitialized() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  globalBookmarks = loadBookmarks()

  if (globalBookmarks.length > 0) {
    const ids = globalBookmarks.map((b) => b.jobId)
    fetch('/api/bookmarks/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobIds: ids }),
    })
      .then((res) => res.json())
      .then((data: { verified: string[] }) => {
        const verifiedSet = new Set(data.verified)
        const updated = globalBookmarks.map((b) => ({
          ...b,
          verified: verifiedSet.has(b.jobId),
        }))
        persistBookmarks(updated)
      })
      .catch(() => {})
  }
}

export function useBookmarks(): UseBookmarksReturn {
  // 초기화
  useEffect(() => {
    ensureInitialized()
  }, [])

  const bookmarks = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(
    (job: { id: string; title: string; company: string }) => {
      const prev = globalBookmarks
      const exists = prev.some((b) => b.jobId === job.id)
      let next: BookmarkItem[]

      if (exists) {
        next = prev.filter((b) => b.jobId !== job.id)
        toast.success('북마크 제거', {
          description: `${job.title} 북마크가 해제되었습니다`,
        })
      } else {
        next = [
          ...prev,
          {
            jobId: job.id,
            savedAt: new Date().toISOString(),
            title: job.title,
            company: job.company,
          },
        ]
        toast.success('북마크 추가', {
          description: `${job.title} 북마크에 저장되었습니다`,
        })
      }

      persistBookmarks(next)
    },
    []
  )

  const isBookmarked = useCallback(
    (jobId: string) => bookmarks.some((b) => b.jobId === jobId),
    [bookmarks]
  )

  return { bookmarks, toggle, isBookmarked }
}
