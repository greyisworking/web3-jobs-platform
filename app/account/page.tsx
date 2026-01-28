'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import Footer from '../components/Footer'

interface SavedJob {
  id: string
  title: string
  company: string
  location?: string
  savedAt?: string
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)

      // Fetch bookmarks from Supabase
      try {
        const res = await fetch('/api/bookmarks')
        if (res.ok) {
          const data = await res.json()
          setSavedJobs(
            (data.bookmarks ?? []).map((b: any) => ({
              id: b.id,
              title: b.title,
              company: b.company,
              location: b.location,
              savedAt: b.savedAt,
            }))
          )
        }
      } catch {
        // ignore
      }
      setBookmarksLoading(false)
    }
    init()
  }, [router, supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const removeBookmark = async (jobId: string) => {
    // Optimistic remove
    const prev = savedJobs
    setSavedJobs(prev.filter((j) => j.id !== jobId))

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      if (!res.ok) {
        setSavedJobs(prev) // rollback
      }
    } catch {
      setSavedJobs(prev) // rollback
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
        <main className="max-w-2xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center">
            <div className="w-6 h-6 border border-a24-muted dark:border-a24-dark-muted border-t-a24-text dark:border-t-a24-dark-text rounded-full animate-spin mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-2xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-light uppercase tracking-[0.4em] text-a24-text dark:text-a24-dark-text mb-3">
            Account
          </h1>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mx-auto" />
        </div>

        {/* Profile */}
        <section className="mb-16">
          <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
            Profile
          </h2>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                Email
              </span>
              <p className="text-sm font-light text-a24-text dark:text-a24-dark-text mt-1">
                {user?.email ?? '—'}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                Provider
              </span>
              <p className="text-sm font-light text-a24-text dark:text-a24-dark-text mt-1 capitalize">
                {user?.app_metadata?.provider ?? 'email'}
              </p>
            </div>
          </div>
        </section>

        {/* Saved Jobs */}
        <section className="mb-16">
          <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
            Saved Jobs
          </h2>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

          {bookmarksLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border border-a24-muted dark:border-a24-dark-muted border-t-a24-text dark:border-t-a24-dark-text rounded-full animate-spin" />
            </div>
          ) : savedJobs.length === 0 ? (
            <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted">
              저장된 공고가 없습니다. Careers 페이지에서 북마크해 보세요.
            </p>
          ) : (
            <div className="space-y-3">
              {savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-3 border-b border-a24-border dark:border-a24-dark-border"
                >
                  <Link href={`/careers/${job.id}`} className="min-w-0 mr-4 group">
                    <p className="text-sm font-light text-a24-text dark:text-a24-dark-text truncate group-hover:underline underline-offset-2 decoration-1">
                      {job.title}
                    </p>
                    <p className="text-[11px] font-light text-a24-muted dark:text-a24-dark-muted uppercase tracking-[0.15em]">
                      {job.company}
                    </p>
                  </Link>
                  <button
                    onClick={() => removeBookmark(job.id)}
                    className="flex-shrink-0 text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Logout */}
        <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
          <button
            onClick={handleLogout}
            className="text-[11px] uppercase tracking-[0.3em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
          >
            Log Out
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
