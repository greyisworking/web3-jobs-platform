'use client'

import { useEffect, useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import JobFilters, { Filters } from './components/JobFilters'
import JobCard from './components/JobCard'
import GlassContainer from './components/GlassContainer'
import VCBackersDashboard from './components/VCBackersDashboard'
import { JobCardSkeletonGrid } from './components/JobCardSkeleton'
import ThemeToggle from './components/ThemeToggle'

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  category: string
  url: string
  salary: string | null
  source: string
  region: string
  postedDate: Date | null
  backers?: string[] | null
  sector?: string | null
  office_location?: string | null
  badges?: string[] | null
}

interface Stats {
  total: number
  global: number
  korea: number
  sources: { source: string; _count: number }[]
}

export default function Home() {
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
  const [filters, setFilters] = useState<Filters>({
    search: '',
    region: '',
    type: '',
    location: '',
    source: '',
    badge: '',
    backer: '',
  })

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

  /** 각 VC별 공고 수 계산 — jobs가 변경될 때만 재계산 */
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

  /** 필터 + VC 선택 모두 적용 */
  const applyAllFilters = (f: Filters, vc: string) => {
    let filtered = [...jobs]

    if (f.search) {
      const searchLower = f.search.toLowerCase()
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

    if (f.location) {
      filtered = filtered.filter((job) =>
        (job.location ?? '').toLowerCase().includes(f.location.toLowerCase())
      )
    }

    if (f.source) {
      filtered = filtered.filter((job) => job.source === f.source)
    }

    if (f.badge) {
      filtered = filtered.filter((job) => job.badges?.includes(f.badge))
    }

    if (f.backer) {
      filtered = filtered.filter((job) => job.backers?.includes(f.backer))
    }

    // VC 대시보드 필터 적용
    if (vc) {
      filtered = filtered.filter((job) => job.backers?.includes(vc))
    }

    setFilteredJobs(filtered)
  }

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
    applyAllFilters(newFilters, selectedVC)
  }

  const handleVCSelect = (vc: string) => {
    setSelectedVC(vc)
    applyAllFilters(filters, vc)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-web3-ice-white to-web3-frost dark:from-web3-deep-navy dark:to-web3-midnight">
        {/* 로딩 헤더 */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/50 dark:bg-white/5 border-b border-hairline border-white/20 shadow-glass">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-start">
            <div>
              <div className="h-10 w-64 rounded-lg bg-gradient-to-r from-gray-200/50 via-gray-100/50 to-gray-200/50 dark:from-white/5 dark:via-white/10 dark:to-white/5 animate-pulse" />
              <div className="h-4 w-48 mt-2 rounded bg-gray-200/50 dark:bg-white/5 animate-pulse" />
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* 스탯 스켈레톤 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="backdrop-blur-md bg-white/70 dark:bg-white/10 border-hairline border-white/20 rounded-xl shadow-glass p-6">
                <div className="h-4 w-20 rounded bg-gray-200/50 dark:bg-white/10 animate-pulse" />
                <div className="h-8 w-24 mt-2 rounded bg-gray-200/50 dark:bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>

          {/* 카드 스켈레톤 */}
          <GlassContainer className="overflow-hidden p-4">
            <JobCardSkeletonGrid count={6} />
          </GlassContainer>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-web3-ice-white to-web3-frost dark:from-web3-deep-navy dark:to-web3-midnight">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/50 dark:bg-white/5 border-b border-hairline border-white/20 shadow-glass">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-web3-electric-blue to-web3-neon-cyan bg-clip-text text-transparent">
              Web3 Jobs Platform
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Find Web3 jobs from global and Korean sources
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <JobFilters onFilterChange={handleFilterChange} />

        {/* VC Backers Dashboard */}
        <VCBackersDashboard
          vcCounts={vcCounts}
          selectedVC={selectedVC}
          onSelectVC={handleVCSelect}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassContainer hover className="p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Total Jobs
            </h3>
            <p className="text-3xl font-bold text-web3-electric-blue dark:text-web3-ice-blue mt-2">
              {stats.total}
            </p>
          </GlassContainer>
          <GlassContainer hover className="p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Global
            </h3>
            <p className="text-3xl font-bold text-web3-neon-cyan dark:text-web3-neon-cyan mt-2">
              {stats.global}
            </p>
          </GlassContainer>
          <GlassContainer hover className="p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Korea
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {stats.korea}
            </p>
          </GlassContainer>
        </div>

        {/* Source Stats */}
        <GlassContainer className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Jobs by Source
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.sources.map((source) => (
              <div key={source.source} className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {source.source}
                </p>
                <p className="text-2xl font-bold text-web3-electric-blue dark:text-web3-ice-blue">
                  {source._count}
                </p>
              </div>
            ))}
          </div>
        </GlassContainer>

        {/* Jobs List */}
        <GlassContainer className="overflow-hidden">
          <div className="p-6 border-b border-white/20 dark:border-white/10">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Latest Jobs
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredJobs.length} jobs
              </span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {jobs.length === 0 ? (
                  <>
                    No jobs found yet. <br />
                    <code className="bg-gray-100/50 dark:bg-gray-700/50 px-2 py-1 rounded mt-2 inline-block">
                      npm run crawl
                    </code>{' '}
                    to collect job data.
                  </>
                ) : (
                  'No jobs match your filters. Try adjusting your search criteria.'
                )}
              </div>
            ) : (
              /* AnimatePresence로 리스트 전환 애니메이션 적용 */
              <AnimatePresence mode="popLayout">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </GlassContainer>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 backdrop-blur-md bg-white/50 dark:bg-white/5 border-t border-hairline border-white/20">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>Aggregating jobs from 40+ sources | Updated every 3 hours</p>
        </div>
      </footer>
    </div>
  )
}
