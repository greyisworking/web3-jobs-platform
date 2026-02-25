'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import Footer from '../components/Footer'
import ThemeToggle from '../components/ThemeToggle'
import { FileText, User as UserIcon, Bookmark, Settings, LogOut } from 'lucide-react'

interface Draft {
  id: string
  slug: string
  title: string
  updated_at: string
}

interface SavedJob {
  id: string
  title: string
  company: string
  location?: string
  savedAt?: string
}

interface BookmarkResponse {
  id: string
  title: string
  company: string
  location?: string
  savedAt?: string
}

type Section = 'profile' | 'bookmarks' | 'drafts' | 'settings' | 'logout'

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'My Profile', icon: <UserIcon className="w-4 h-4" /> },
  { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark className="w-4 h-4" /> },
  { id: 'drafts', label: 'My Drafts', icon: <FileText className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  { id: 'logout', label: 'Logout', icon: <LogOut className="w-4 h-4" /> },
]

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [draftsLoading, setDraftsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<Section>('profile')
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
            (data.bookmarks ?? []).map((b: BookmarkResponse) => ({
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

      // Fetch drafts
      try {
        const draftsRes = await fetch('/api/articles/drafts')
        if (draftsRes.ok) {
          const draftsData = await draftsRes.json()
          setDrafts(draftsData.drafts ?? [])
        }
      } catch {
        // ignore
      }
      setDraftsLoading(false)
    }
    init()
  }, [router, supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const removeBookmark = async (jobId: string) => {
    const prev = savedJobs
    setSavedJobs(prev.filter((j) => j.id !== jobId))

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      if (!res.ok) {
        setSavedJobs(prev)
      }
    } catch {
      setSavedJobs(prev)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
        <main className="max-w-4xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center">
            <div className="w-6 h-6 border border-a24-muted dark:border-a24-dark-muted border-t-a24-text dark:border-t-a24-dark-text rounded-full animate-spin mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-4xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-light uppercase tracking-[0.4em] text-a24-text dark:text-a24-dark-text mb-3">
            Account
          </h1>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mx-auto" />
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Sidebar */}
          <nav className="md:w-48 flex-shrink-0">
            <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => {
                      if (section.id === 'logout') {
                        handleLogout()
                      } else {
                        setActiveSection(section.id)
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-[11px] uppercase tracking-[0.25em] font-light transition-colors whitespace-nowrap ${
                      activeSection === section.id && section.id !== 'logout'
                        ? 'text-neun-success bg-neun-success/10 border-l-2 border-neun-success'
                        : section.id === 'logout'
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                        : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text hover:bg-a24-surface dark:hover:bg-a24-dark-surface'
                    }`}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* My Profile */}
            {activeSection === 'profile' && (
              <section>
                <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
                  My Profile
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
                  <div className="pt-2">
                    <Link
                      href="/profile"
                      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      Edit Profile &rarr;
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Bookmarks */}
            {activeSection === 'bookmarks' && (
              <section>
                <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
                  Bookmarks
                </h2>
                <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

                {bookmarksLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border border-a24-muted dark:border-a24-dark-muted border-t-a24-text dark:border-t-a24-dark-text rounded-full animate-spin" />
                  </div>
                ) : savedJobs.length === 0 ? (
                  <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted">
                    No saved jobs yet. Bookmark jobs from the Careers page.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {savedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between py-3 border-b border-a24-border dark:border-a24-dark-border"
                      >
                        <Link href={`/jobs/${job.id}`} className="min-w-0 mr-4 group">
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
            )}

            {/* My Drafts */}
            {activeSection === 'drafts' && (
              <section>
                <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
                  My Drafts
                </h2>
                <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

                {draftsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border border-a24-muted dark:border-a24-dark-muted border-t-a24-text dark:border-t-a24-dark-text rounded-full animate-spin" />
                  </div>
                ) : drafts.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-a24-muted/50 dark:text-a24-dark-muted/50" />
                    <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted">
                      No drafts yet. Start writing articles from the Community page.
                    </p>
                    <Link
                      href="/articles/write"
                      className="inline-block mt-4 text-[10px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      Write Article &rarr;
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drafts.map((draft) => (
                      <div
                        key={draft.id}
                        className="flex items-center justify-between py-3 border-b border-a24-border dark:border-a24-dark-border"
                      >
                        <Link href={`/articles/write?edit=${draft.slug}`} className="min-w-0 mr-4 group">
                          <p className="text-sm font-light text-a24-text dark:text-a24-dark-text truncate group-hover:underline underline-offset-2 decoration-1">
                            {draft.title || 'Untitled Draft'}
                          </p>
                          <p className="text-[11px] font-light text-a24-muted dark:text-a24-dark-muted uppercase tracking-[0.15em]">
                            Updated {new Date(draft.updated_at).toLocaleDateString()}
                          </p>
                        </Link>
                        <Link
                          href={`/articles/write?edit=${draft.slug}`}
                          className="flex-shrink-0 text-[10px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                        >
                          Edit
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Settings */}
            {activeSection === 'settings' && (
              <section>
                <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
                  Settings
                </h2>
                <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

                <div className="space-y-8">
                  {/* Theme */}
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted mb-3">
                      Theme
                    </h3>
                    <div className="flex items-center gap-3">
                      <ThemeToggle />
                      <span className="text-sm font-light text-a24-text dark:text-a24-dark-text">
                        Toggle dark / light mode
                      </span>
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted mb-3">
                      Notification Preferences
                    </h3>
                    <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted">
                      Notification settings coming soon.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
