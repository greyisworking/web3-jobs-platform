'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileEdit, Trash2, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import Pixelbara from '@/app/components/Pixelbara'

interface Draft {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image: string | null
  tags: string[] | null
  reading_time: number
  created_at: string
  updated_at: string
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function DraftsPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    if (user) {
      fetchDrafts()
    }
  }, [user])

  const fetchDrafts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/articles/drafts')
      if (res.ok) {
        const data = await res.json()
        setDrafts(data.drafts)
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (draft: Draft) => {
    if (!confirm(`Delete "${draft.title || 'Untitled'}"? This cannot be undone.`)) {
      return
    }

    setDeleting(draft.id)
    try {
      const res = await fetch(`/api/articles/${draft.slug}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draft.id))
        toast.success('Draft deleted')
      } else {
        toast.error('Failed to delete draft')
      }
    } catch (error) {
      toast.error('Failed to delete draft')
    } finally {
      setDeleting(null)
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-a24-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-a24-muted animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-a24-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <Pixelbara pose="question" size={140} className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-a24-text mb-2">
            Log In to View Drafts
          </h1>
          <p className="text-sm text-a24-muted mb-8">
            You need to be logged in to see your drafts.
          </p>
          <Link
            href="/login?next=/articles/drafts"
            className="inline-block px-6 py-3 bg-neun-success hover:bg-neun-success/90 text-white font-medium transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/articles"
            className="block mt-6 text-sm text-a24-muted hover:text-a24-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Back to Articles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 text-sm text-a24-muted hover:text-a24-text transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Articles
            </Link>
            <h1 className="text-2xl font-bold text-a24-text">My Drafts</h1>
            <p className="text-sm text-a24-muted mt-1">
              {drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <Link
            href="/articles/write"
            className="px-4 py-2 bg-neun-success hover:bg-neun-success/90 text-white text-sm font-medium transition-colors"
          >
            New Article
          </Link>
        </div>

        {/* Drafts List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-a24-muted animate-spin" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-20">
            <Pixelbara pose="sparkle" size={120} className="mx-auto mb-6 opacity-50" />
            <h2 className="text-lg font-medium text-a24-text mb-2">No drafts yet</h2>
            <p className="text-sm text-a24-muted mb-6">
              Start writing and save your work as a draft anytime.
            </p>
            <Link
              href="/articles/write"
              className="inline-block px-6 py-3 bg-neun-success hover:bg-neun-success/90 text-white font-medium transition-colors"
            >
              Start Writing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map(draft => (
              <div
                key={draft.id}
                className="border border-a24-border bg-a24-surface p-5 hover:border-neun-success/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Cover Image */}
                  {draft.cover_image && (
                    <div className="hidden sm:block w-24 h-16 flex-shrink-0 bg-gray-800 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={draft.cover_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-a24-text truncate">
                      {draft.title || 'Untitled'}
                    </h3>
                    {draft.excerpt && (
                      <p className="text-sm text-a24-muted mt-1 line-clamp-2">
                        {draft.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-a24-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Updated {formatTimeAgo(draft.updated_at)}
                      </span>
                      {draft.tags && draft.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {draft.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-neun-success/20 text-neun-success text-[10px]">
                              {tag}
                            </span>
                          ))}
                          {draft.tags.length > 2 && (
                            <span className="text-a24-muted">+{draft.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/articles/write?edit=${draft.slug}`}
                      className="p-2 text-a24-muted hover:text-neun-success hover:bg-neun-success/10 transition-colors"
                      title="Edit"
                    >
                      <FileEdit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(draft)}
                      disabled={deleting === draft.id}
                      className="p-2 text-a24-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === draft.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
