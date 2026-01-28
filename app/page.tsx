'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import { Bookmark } from 'lucide-react'
import type { Job } from '@/types/job'
import SmartFilterBar, { SmartFilters } from './components/SmartFilterBar'
import SearchWithSuggestions from './components/SearchWithSuggestions'
import JobCard from './components/JobCard'
import VCBackersDashboard from './components/VCBackersDashboard'
import { JobCardSkeletonGrid } from './components/JobCardSkeleton'
import ThemeToggle from './components/ThemeToggle'

const BookmarksPanel = dynamic(() => import('./components/BookmarksPanel'), { ssr: false })

interface Stats {
  total: number
  global: number
  korea: number
  sources: { source: string; _count: number }[]
}

function HomeContent() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    global: 0,
    korea: 0,
    sources: [],
  })
  const [loading, setLoading] = useState(true)
  const [selectedVC, setSelectedVC] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [smartFilters, setSmartFilters] = useState<SmartFilters>({
    region: '',
    type: '',
    sector: '',
    backer: '',
    techStack: '',
  })
  const [bookmarksPanelOpen, setBookmarksPanelOpen] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      const data = await response.json()
      setJobs(data.jobs)
      setFilteredJobs(data.jobs)
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const vcCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const job of jobs) {
      if (job.backers) {
        for (const backer of job.backers) {
          counts[backer] = (counts[backer] ?? 0) + 1
        }
      }
    }
    return counts
  }, [jobs])

  const applyAllFilters = (
    f: SmartFilters,
    vc: string,
    search: string
  ) => {
    let filtered = [...jobs]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (job) =>
          (job.title ?? '').toLowerCase().includes(searchLower) ||
          (job.company ?? '').toLowerCase().includes(searchLower)
      )
    }

    if (f.region) {
      filtered = filtered.filter((job) => job.region === f.region)
    }

    if (f.type) {
      filtered = filtered.filter((job) => (job.type ?? '').includes(f.type))
    }

    if (f.sector) {
      filtered = filtered.filter((job) =>
        (job.sector ?? '').toLowerCase().includes(f.sector.toLowerCase())
      )
    }

    if (f.backer) {
      filtered = filtered.filter((job) => job.backers?.includes(f.backer))
    }

    if (f.techStack) {
      const tech = f.techStack.toLowerCase()
      filtered = filtered.filter(
        (job) =>
          (job.title ?? '').toLowerCase().includes(tech) ||
          (job.category ?? '').toLowerCase().includes(tech)
      )
    }

    if (vc) {
      filtered = filtered.filter((job) => job.backers?.includes(vc))
    }

    setFilteredJobs(filtered)
  }

  const handleSmartFilterChange = (newFilters: SmartFilters) => {
    setSmartFilters(newFilters)
    applyAllFilters(newFilters, selectedVC, searchQuery)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applyAllFilters(smartFilters, selectedVC, query)
  }

  const handleVCSelect = (vc: string) => {
    setSelectedVC(vc)
    applyAllFilters(smartFilters, vc, searchQuery)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
        <header className="border-b border-a24-border dark:border-a24-dark-border">
          <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-end">
            <span className="text-6xl font-black text-a24-text dark:text-a24-dark-text leading-none select-none">는</span>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-12">
          <JobCardSkeletonGrid count={6} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-a24-surface dark:bg-a24-dark-surface border-b border-a24-border dark:border-a24-dark-border">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex justify-between items-end">
            <div className="flex items-baseline gap-4">
              <span className="text-6xl font-black text-a24-text dark:text-a24-dark-text leading-none select-none">는</span>
            </div>
            <nav className="flex items-center gap-6">
              <span className="text-xs font-heading uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text">
                Jobs
              </span>
              <button
                onClick={() => setBookmarksPanelOpen(true)}
                className="flex items-center gap-1.5 text-xs font-heading uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Saved
              </button>
              <ThemeToggle />
            </nav>
          </div>

          <div className="mt-8 max-w-lg">
            <SearchWithSuggestions onSearch={handleSearch} jobs={jobs} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Filters */}
        <SmartFilterBar onFilterChange={handleSmartFilterChange} />

        {/* VC Backers */}
        <VCBackersDashboard
          vcCounts={vcCounts}
          selectedVC={selectedVC}
          onSelectVC={handleVCSelect}
        />

        {/* Stats line */}
        <div className="flex items-baseline gap-8 mb-10 pb-6 border-b border-a24-border dark:border-a24-dark-border">
          <div>
            <span className="text-4xl font-heading text-a24-text dark:text-a24-dark-text">{stats.total}</span>
            <span className="ml-2 text-xs uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted">positions</span>
          </div>
          <div>
            <span className="text-4xl font-heading text-a24-text dark:text-a24-dark-text">{stats.global}</span>
            <span className="ml-2 text-xs uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted">global</span>
          </div>
          <div>
            <span className="text-4xl font-heading text-a24-text dark:text-a24-dark-text">{stats.korea}</span>
            <span className="ml-2 text-xs uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted">korea</span>
          </div>
        </div>

        {/* Source stats */}
        <div className="mb-12">
          <h2 className="text-xs font-heading uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted mb-4">
            Sources
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {stats.sources.map((source) => (
              <span key={source.source} className="text-xs text-a24-muted dark:text-a24-dark-muted">
                {source.source} <span className="text-a24-text dark:text-a24-dark-text font-medium">{source._count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="mb-16">
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-heading uppercase tracking-[0.15em] text-a24-text dark:text-a24-dark-text">
              Open Positions
            </h2>
            <span className="text-xs text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider">
              {filteredJobs.length} results
            </span>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="py-20 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
              <p className="text-a24-muted dark:text-a24-dark-muted text-sm">
                {jobs.length === 0 ? (
                  <>
                    No jobs found yet.{' '}
                    <code className="text-a24-text dark:text-a24-dark-text">npm run crawl</code>{' '}
                    to collect job data.
                  </>
                ) : (
                  'No jobs match your filters.'
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredJobs.map((job, index) => (
                  <JobCard key={job.id} job={job} index={index} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-a24-border dark:border-a24-dark-border">
        <div className="max-w-6xl mx-auto px-6 py-10 flex justify-between items-end">
          <div>
            <span className="text-3xl font-black text-a24-text dark:text-a24-dark-text leading-none">는</span>
            <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-2 uppercase tracking-[0.2em]">
              40+ sources — updated every 3h
            </p>
          </div>
          <p className="text-xs text-a24-muted dark:text-a24-dark-muted">
            neun.io
          </p>
        </div>
      </footer>

      {/* Bookmarks Panel */}
      <BookmarksPanel
        open={bookmarksPanelOpen}
        onClose={() => setBookmarksPanelOpen(false)}
      />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center">
        <span className="text-6xl font-black text-a24-text dark:text-a24-dark-text">는</span>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
