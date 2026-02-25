'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import Footer from '../components/Footer'
import ThemeToggle from '../components/ThemeToggle'
import { FileText, User as UserIcon, Bookmark, Settings, LogOut, X, ExternalLink, Briefcase, PenLine } from 'lucide-react'

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

  const displayName = user?.user_metadata?.name ||
    user?.email?.split('@')[0] || 'User'
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  const sectionItems: { id: Section; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'profile', label: 'My Profile', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark className="w-4 h-4" />, count: savedJobs.length },
    { id: 'drafts', label: 'My Drafts', icon: <FileText className="w-4 h-4" />, count: drafts.length },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'logout', label: 'Logout', icon: <LogOut className="w-4 h-4" /> },
  ]

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
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Sidebar */}
          <nav className="md:w-52 flex-shrink-0">
            {/* User card */}
            <div className="mb-6 pb-6 border-b border-a24-border dark:border-a24-dark-border">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-a24-border dark:border-a24-dark-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neun-success/20 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-neun-success" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-light text-a24-text dark:text-a24-dark-text truncate">
                    {displayName}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-a24-muted dark:text-a24-dark-muted truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-1 md:mx-0">
              {sectionItems.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => {
                      if (section.id === 'logout') {
                        handleLogout()
                      } else {
                        setActiveSection(section.id)
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-[11px] uppercase tracking-[0.25em] font-light transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      activeSection === section.id && section.id !== 'logout'
                        ? 'text-neun-success bg-neun-success/10'
                        : section.id === 'logout'
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                        : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text hover:bg-a24-surface dark:hover:bg-a24-dark-surface'
                    }`}
                  >
                    {section.icon}
                    <span className="flex-1 text-left">{section.label}</span>
                    {section.count !== undefined && section.count > 0 && (
                      <span className="text-[9px] tabular-nums px-1.5 py-0.5 rounded-full bg-a24-border dark:bg-a24-dark-border text-a24-muted dark:text-a24-dark-muted">
                        {section.count}
                      </span>
                    )}
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

                <div className="p-5 border border-a24-border dark:border-a24-dark-border rounded bg-a24-surface/50 dark:bg-a24-dark-surface/50">
                  <div className="flex items-start gap-4 mb-6">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-14 h-14 rounded-full object-cover border border-a24-border dark:border-a24-dark-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-neun-success/20 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-7 h-7 text-neun-success" />
                      </div>
                    )}
                    <div className="min-w-0 pt-1">
                      <p className="text-lg font-light text-a24-text dark:text-a24-dark-text">
                        {displayName}
                      </p>
                      <p className="text-[11px] font-light text-a24-muted dark:text-a24-dark-muted mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 border border-a24-border dark:border-a24-dark-border rounded">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                        Provider
                      </span>
                      <p className="text-sm font-light text-a24-text dark:text-a24-dark-text mt-1 capitalize">
                        {user?.app_metadata?.provider ?? 'email'}
                      </p>
                    </div>
                    <div className="p-3 border border-a24-border dark:border-a24-dark-border rounded">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                        Member Since
                      </span>
                      <p className="text-sm font-light text-a24-text dark:text-a24-dark-text mt-1">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-a24-border dark:border-a24-dark-border">
                    <Link
                      href="/profile"
                      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-neun-success hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      Edit Profile <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Bookmarks */}
            {activeSection === 'bookmarks' && (
              <section>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted">
                    Bookmarks
                  </h2>
                  {savedJobs.length > 0 && (
                    <span className="text-[10px] tabular-nums text-a24-muted dark:text-a24-dark-muted">
                      {savedJobs.length} saved
                    </span>
                  )}
                </div>
                <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

                {bookmarksLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border border-a24-muted dark:border-a24-dark-muted border-t-a24-text dark:border-t-a24-dark-text rounded-full animate-spin" />
                  </div>
                ) : savedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-a24-surface dark:bg-a24-dark-surface flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-a24-muted/50 dark:text-a24-dark-muted/50" />
                    </div>
                    <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted mb-1">
                      No saved jobs yet
                    </p>
                    <p className="text-[11px] text-a24-muted/60 dark:text-a24-dark-muted/60 mb-4">
                      Bookmark jobs you&apos;re interested in to find them here
                    </p>
                    <Link
                      href="/jobs"
                      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-neun-success hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      Browse Jobs <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 border border-a24-border dark:border-a24-dark-border rounded hover:border-a24-muted/60 dark:hover:border-a24-dark-muted/60 transition-colors group"
                      >
                        <Link href={`/jobs/${job.id}`} className="min-w-0 mr-4 cursor-pointer">
                          <p className="text-sm font-light text-a24-text dark:text-a24-dark-text truncate group-hover:text-neun-success transition-colors">
                            {job.title}
                          </p>
                          <p className="text-[11px] font-light text-a24-muted dark:text-a24-dark-muted uppercase tracking-[0.15em]">
                            {job.company}
                          </p>
                        </Link>
                        <button
                          onClick={() => removeBookmark(job.id)}
                          className="flex-shrink-0 p-1.5 text-a24-muted dark:text-a24-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                          aria-label={`Remove ${job.title} bookmark`}
                        >
                          <X className="w-3.5 h-3.5" />
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
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted">
                    My Drafts
                  </h2>
                  {drafts.length > 0 && (
                    <Link
                      href="/articles/write"
                      className="text-[10px] uppercase tracking-[0.2em] text-neun-success hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      + New
                    </Link>
                  )}
                </div>
                <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

                {draftsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border border-a24-muted dark:border-a24-dark-muted border-t-a24-text dark:border-t-a24-dark-text rounded-full animate-spin" />
                  </div>
                ) : drafts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-a24-surface dark:bg-a24-dark-surface flex items-center justify-center">
                      <PenLine className="w-6 h-6 text-a24-muted/50 dark:text-a24-dark-muted/50" />
                    </div>
                    <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted mb-1">
                      No drafts yet
                    </p>
                    <p className="text-[11px] text-a24-muted/60 dark:text-a24-dark-muted/60 mb-4">
                      Share your knowledge with the Web3 community
                    </p>
                    <Link
                      href="/articles/write"
                      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-neun-success hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      Write Article <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {drafts.map((draft) => (
                      <Link
                        key={draft.id}
                        href={`/articles/write?edit=${draft.slug}`}
                        className="flex items-center justify-between p-3 border border-a24-border dark:border-a24-dark-border rounded hover:border-a24-muted/60 dark:hover:border-a24-dark-muted/60 transition-colors group cursor-pointer"
                      >
                        <div className="min-w-0 mr-4">
                          <p className="text-sm font-light text-a24-text dark:text-a24-dark-text truncate group-hover:text-neun-success transition-colors">
                            {draft.title || 'Untitled Draft'}
                          </p>
                          <p className="text-[11px] font-light text-a24-muted dark:text-a24-dark-muted uppercase tracking-[0.15em]">
                            Updated {new Date(draft.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors" />
                      </Link>
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

                <div className="space-y-4">
                  {/* Theme */}
                  <div className="p-4 border border-a24-border dark:border-a24-dark-border rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted mb-1">
                          Theme
                        </h3>
                        <p className="text-sm font-light text-a24-text dark:text-a24-dark-text">
                          Toggle dark / light mode
                        </p>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className="p-4 border border-a24-border dark:border-a24-dark-border rounded">
                    <h3 className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted mb-1">
                      Notification Preferences
                    </h3>
                    <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted">
                      Coming soon
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
