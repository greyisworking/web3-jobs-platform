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
      <div className="min-h-screen bg-sub-offwhite dark:bg-sub-dark-bg">
        <header className="sticky top-0 z-50 bg-white dark:bg-sub-dark-surface border-b border-sub-border dark:border-sub-border-dark">
          <div className="max-w-7xl mx-auto px-4 py-5 flex justify-between items-center">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-sub-charcoal dark:text-gray-100 leading-none">는</span>
              <span className="text-sm font-heading uppercase tracking-[0.2em] text-sub-muted">neun</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <JobCardSkeletonGrid count={8} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sub-offwhite dark:bg-sub-dark-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-sub-dark-surface border-b border-sub-border dark:border-sub-border-dark">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-sub-charcoal dark:text-gray-100 leading-none">는</span>
              <span className="text-sm font-heading uppercase tracking-[0.2em] text-sub-muted">neun</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBookmarksPanelOpen(true)}
                className="p-2.5 border border-sub-border dark:border-sub-border-dark hover:bg-sub-offwhite dark:hover:bg-sub-dark-bg transition-colors"
                aria-label="저장된 공고 보기"
              >
                <Bookmark className="w-5 h-5 text-sub-charcoal dark:text-gray-300" />
              </button>
              <ThemeToggle />
            </div>
          </div>
          <SearchWithSuggestions onSearch={handleSearch} jobs={jobs} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Smart Filters */}
        <SmartFilterBar onFilterChange={handleSmartFilterChange} />

        {/* VC Backers Dashboard */}
        <VCBackersDashboard
          vcCounts={vcCounts}
          selectedVC={selectedVC}
          onSelectVC={handleVCSelect}
        />

        {/* Stats — SUBSTANCE colored tiles */}
        <div className="grid grid-cols-3 mb-8 border border-sub-border dark:border-sub-border-dark">
          <div className="bg-tile-1 dark:bg-tile-1-dark p-6 border-r border-white/30 dark:border-white/5">
            <h3 className="text-[#1a3a5c] dark:text-[#a8d4f0] text-xs font-heading uppercase tracking-widest opacity-70">
              TOTAL
            </h3>
            <p className="text-3xl font-heading text-[#1a3a5c] dark:text-[#a8d4f0] mt-1">
              {stats.total}
            </p>
          </div>
          <div className="bg-tile-2 dark:bg-tile-2-dark p-6 border-r border-white/30 dark:border-white/5">
            <h3 className="text-[#5c1a35] dark:text-[#f0a8c4] text-xs font-heading uppercase tracking-widest opacity-70">
              GLOBAL
            </h3>
            <p className="text-3xl font-heading text-[#5c1a35] dark:text-[#f0a8c4] mt-1">
              {stats.global}
            </p>
          </div>
          <div className="bg-tile-4 dark:bg-tile-4-dark p-6">
            <h3 className="text-[#5c2a2a] dark:text-[#f0c4c4] text-xs font-heading uppercase tracking-widest opacity-70">
              KOREA
            </h3>
            <p className="text-3xl font-heading text-[#5c2a2a] dark:text-[#f0c4c4] mt-1">
              {stats.korea}
            </p>
          </div>
        </div>

        {/* Source Stats */}
        <div className="bg-white dark:bg-sub-dark-surface border border-sub-border dark:border-sub-border-dark p-6 mb-8">
          <h2 className="text-sm font-heading uppercase tracking-widest text-sub-charcoal dark:text-gray-200 mb-4">
            BY SOURCE
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.sources.map((source) => (
              <div key={source.source} className="text-center">
                <p className="text-xs text-sub-muted dark:text-gray-400">
                  {source.source}
                </p>
                <p className="text-2xl font-heading text-sub-charcoal dark:text-gray-200">
                  {source._count}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-heading uppercase tracking-widest text-sub-charcoal dark:text-gray-200">
              JOBS
            </h2>
            <span className="text-sm text-sub-muted dark:text-gray-400">
              {filteredJobs.length}
            </span>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center text-sub-muted dark:text-gray-400 border border-sub-border dark:border-sub-border-dark bg-white dark:bg-sub-dark-surface">
              {jobs.length === 0 ? (
                <>
                  No jobs found yet. <br />
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 mt-2 inline-block text-sm">
                    npm run crawl
                  </code>{' '}
                  to collect job data.
                </>
              ) : (
                'No jobs match your filters.'
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-sub-border dark:bg-sub-border-dark border border-sub-border dark:border-sub-border-dark">
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
      <footer className="py-6 bg-white dark:bg-sub-dark-surface border-t border-sub-border dark:border-sub-border-dark">
        <div className="max-w-7xl mx-auto px-4 text-center text-sub-muted dark:text-gray-400 text-xs uppercase tracking-wider">
          <p>는 neun — 40+ sources — updated every 3h</p>
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
      <div className="min-h-screen bg-sub-offwhite dark:bg-sub-dark-bg flex items-center justify-center">
        <span className="text-5xl font-black text-sub-charcoal dark:text-gray-100">는</span>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
