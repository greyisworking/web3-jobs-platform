'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import Footer from '../components/Footer'
import { useAlerts, type AlertFrequency } from '@/hooks/useAlerts'
import { useApplications, APPLICATION_STATUS_CONFIG } from '@/hooks/useApplications'
import { Bell, BellOff, Plus, X, Clock } from 'lucide-react'

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

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [newAlertKeywords, setNewAlertKeywords] = useState('')
  const [newAlertFrequency, setNewAlertFrequency] = useState<AlertFrequency>('daily')
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  // Hooks for alerts and applications
  const { alerts, loading: alertsLoading, createAlert, deleteAlert, updateAlert } = useAlerts()
  const { applications, loading: appsLoading, removeApplication } = useApplications()

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

        {/* Job Alerts */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted">
              Job Alerts
            </h2>
            <button
              onClick={() => setShowAlertForm(!showAlertForm)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <Plus size={12} />
              New Alert
            </button>
          </div>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

          {/* New Alert Form */}
          {showAlertForm && (
            <div className="mb-6 p-4 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                    Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newAlertKeywords}
                    onChange={(e) => setNewAlertKeywords(e.target.value)}
                    placeholder="e.g., solidity, rust, defi"
                    className="w-full mt-2 px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted">
                    Frequency
                  </label>
                  <select
                    value={newAlertFrequency}
                    onChange={(e) => setNewAlertFrequency(e.target.value as AlertFrequency)}
                    className="w-full mt-2 px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="instant">Instant</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      const keywords = newAlertKeywords.split(',').map(k => k.trim()).filter(Boolean)
                      await createAlert({ keywords, frequency: newAlertFrequency })
                      setNewAlertKeywords('')
                      setShowAlertForm(false)
                    }}
                    className="px-4 py-2 text-[10px] uppercase tracking-[0.25em] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    Create Alert
                  </button>
                  <button
                    onClick={() => setShowAlertForm(false)}
                    className="px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {alertsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border border-a24-muted dark:border-a24-dark-muted border-t-a24-text dark:border-t-a24-dark-text rounded-full animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted">
              No job alerts yet. Create an alert to get notified about new jobs.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between py-3 border-b border-a24-border dark:border-a24-dark-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {alert.is_active ? (
                      <Bell size={14} className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <BellOff size={14} className="text-a24-muted dark:text-a24-dark-muted flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-light text-a24-text dark:text-a24-dark-text truncate">
                        {alert.keywords?.join(', ') || 'All jobs'}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-a24-muted dark:text-a24-dark-muted">
                        {alert.frequency} • {alert.is_active ? 'Active' : 'Paused'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateAlert(alert.id, { isActive: !alert.is_active })}
                      className="text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted hover:text-emerald-500 transition-colors"
                    >
                      {alert.is_active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Application Tracker */}
        <section className="mb-16">
          <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
            Application Tracker
          </h2>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

          {appsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border border-a24-muted dark:border-a24-dark-muted border-t-a24-text dark:border-t-a24-dark-text rounded-full animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted">
              No applications tracked yet. Start tracking from job detail pages.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const statusConfig = APPLICATION_STATUS_CONFIG[app.status]
                const isPositive = ['offer', 'accepted'].includes(app.status)
                const isNegative = ['rejected', 'withdrawn'].includes(app.status)

                return (
                  <div
                    key={app.id}
                    className="py-3 border-b border-a24-border dark:border-a24-dark-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 mr-4">
                        <Link href={`/jobs/${app.job_id}`} className="group">
                          <p className="text-sm font-light text-a24-text dark:text-a24-dark-text truncate group-hover:underline underline-offset-2 decoration-1">
                            {app.job?.title || 'Unknown Job'}
                          </p>
                          <p className="text-[11px] font-light text-a24-muted dark:text-a24-dark-muted uppercase tracking-[0.15em]">
                            {app.job?.company || '—'}
                          </p>
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-[0.15em] ${
                          isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                          isNegative ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {statusConfig?.emoji} {statusConfig?.label || app.status}
                        </span>
                        <button
                          onClick={() => removeApplication(app.job_id)}
                          className="text-a24-muted dark:text-a24-dark-muted hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    {app.next_step && (
                      <p className="mt-2 text-[11px] text-a24-muted dark:text-a24-dark-muted flex items-center gap-1">
                        <Clock size={10} />
                        Next: {app.next_step}
                        {app.next_step_date && ` (${new Date(app.next_step_date).toLocaleDateString()})`}
                      </p>
                    )}
                    {app.notes && (
                      <p className="mt-1 text-[11px] text-a24-muted dark:text-a24-dark-muted italic">
                        {app.notes}
                      </p>
                    )}
                  </div>
                )
              })}
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
