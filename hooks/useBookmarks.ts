'use client'

import { useEffect, useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ensureCSRFToken } from '@/lib/csrf-client'

export interface BookmarkItem {
  jobId: string
  savedAt: string
  title: string
  company: string
  location?: string
}

interface UseBookmarksReturn {
  bookmarks: BookmarkItem[]
  toggle: (job: { id: string; title: string; company: string }) => void
  isBookmarked: (jobId: string) => boolean
  loading: boolean
}

// ── Global shared state (all useBookmarks instances stay in sync) ──

let globalBookmarks: BookmarkItem[] = []
let globalLoading = true
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

function setBookmarks(items: BookmarkItem[]) {
  globalBookmarks = items
  emitChange()
}

// Fetch bookmarks from Supabase API
let initialized = false

async function fetchBookmarks() {
  try {
    const res = await fetch('/api/bookmarks')
    if (!res.ok) {
      globalLoading = false
      emitChange()
      return
    }
    const data = await res.json()
    const items: BookmarkItem[] = (data.bookmarks ?? []).map((b: any) => ({
      jobId: b.id,
      savedAt: b.savedAt,
      title: b.title,
      company: b.company,
      location: b.location,
    }))
    globalBookmarks = items
    globalLoading = false
    emitChange()
  } catch {
    globalLoading = false
    emitChange()
  }
}

function ensureInitialized() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  fetchBookmarks()
}

export function useBookmarks(): UseBookmarksReturn {
  useEffect(() => {
    ensureInitialized()
  }, [])

  const bookmarks = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(
    async (job: { id: string; title: string; company: string }) => {
      // Check auth first
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Not logged in — redirect handled by BookmarkButton
        return
      }

      const exists = globalBookmarks.some((b) => b.jobId === job.id)

      if (exists) {
        // Optimistic remove
        const prev = globalBookmarks
        setBookmarks(prev.filter((b) => b.jobId !== job.id))

        const res = await fetch('/api/bookmarks', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': ensureCSRFToken(),
          },
          body: JSON.stringify({ jobId: job.id }),
        })

        if (!res.ok) {
          setBookmarks(prev) // rollback
          toast.error('Failed to remove bookmark')
          return
        }

        toast.success('removed... ngmi', {
          description: `${job.title} has been unsaved`,
        })
      } else {
        // Optimistic add
        const prev = globalBookmarks
        const newItem: BookmarkItem = {
          jobId: job.id,
          savedAt: new Date().toISOString(),
          title: job.title,
          company: job.company,
        }
        setBookmarks([newItem, ...prev])

        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': ensureCSRFToken(),
          },
          body: JSON.stringify({ jobId: job.id }),
        })

        if (!res.ok) {
          setBookmarks(prev) // rollback
          toast.error('Failed to add bookmark')
          return
        }

        toast.success('saved! wagmi', {
          description: `${job.title} has been bookmarked`,
        })
      }
    },
    []
  )

  const isBookmarked = useCallback(
    (jobId: string) => bookmarks.some((b) => b.jobId === jobId),
    [bookmarks]
  )

  return { bookmarks, toggle, isBookmarked, loading: globalLoading }
}

// Force re-fetch (call after login/logout)
export function refreshBookmarks() {
  initialized = false
  globalBookmarks = []
  globalLoading = true
  emitChange()
  ensureInitialized()
}
