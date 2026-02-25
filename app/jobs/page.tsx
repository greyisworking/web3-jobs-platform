'use client'

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import type { Job } from '@/types/job'
import { useJobs } from '@/hooks/useJobs'
import SmartFilterBar, { SmartFilters } from '../components/SmartFilterBar'
import SearchWithSuggestions from '../components/SearchWithSuggestions'
import JobCard from '../components/JobCard'
import VCBackersDashboard from '../components/VCBackersDashboard'
import { JobCardSkeletonGrid } from '../components/JobCardSkeleton'
import Pixelbara from '../components/Pixelbara'
import ScrollReveal from '../components/ScrollReveal'
import Footer from '../components/Footer'

const PAGE_SIZE = 12

function CareersContent() {
  const searchParams = useSearchParams()
  const companyFilter = searchParams.get('company') || ''
  const queryFilter = searchParams.get('q') || ''
  // Use SWR for caching and deduplication
  const { jobs, stats, isLoading } = useJobs()
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [selectedVC, setSelectedVC] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [smartFilters, setSmartFilters] = useState<SmartFilters>({
    region: '',
    type: '',
    sector: '',
    backer: '',
    role: '',
    tier1VCOnly: false,
    daoJobsOnly: false,
    tokenGatedOnly: false,
    remoteOnly: false,
    salaryRange: '',
  })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Initialize search query from URL parameter
  useEffect(() => {
    if (queryFilter && !searchQuery) {
      setSearchQuery(queryFilter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryFilter])

  // Update filtered jobs when jobs data changes or company filter changes
  useEffect(() => {
    if (jobs.length > 0) {
      applyAllFilters(smartFilters, selectedVC, searchQuery || queryFilter, companyFilter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, companyFilter, queryFilter])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filteredJobs])

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
    search: string,
    company: string = companyFilter
  ) => {
    let filtered = [...jobs]

    // Company filter from URL
    if (company) {
      const companyLower = company.toLowerCase()
      filtered = filtered.filter(
        (job) => (job.company ?? '').toLowerCase().includes(companyLower)
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (job) =>
          (job.title ?? '').toLowerCase().includes(searchLower) ||
          (job.company ?? '').toLowerCase().includes(searchLower)
      )
    }

    if (f.region) {
      if (f.region === 'Korea') {
        // For Korea filter, also check location field for Korean cities
        const koreaKeywords = ['korea', 'seoul', 'busan', 'daegu', 'incheon', 'gwangju', 'daejeon', 'ulsan', 'sejong', 'pangyo', 'gangnam', '한국', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '판교', '강남']
        filtered = filtered.filter((job) => {
          if (job.region === 'Korea') return true
          const locationLower = (job.location ?? '').toLowerCase()
          return koreaKeywords.some(k => locationLower.includes(k))
        })
      } else {
        // For Global or other regions, exclude Korea-specific jobs
        const koreaKeywords = ['korea', 'seoul', 'busan', 'daegu', 'incheon', 'gwangju', 'daejeon', 'ulsan', 'sejong', 'pangyo', 'gangnam', '한국', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '판교', '강남']
        filtered = filtered.filter((job) => {
          if (job.region === f.region) return true
          // Exclude jobs that are actually Korean
          const locationLower = (job.location ?? '').toLowerCase()
          const isKoreaJob = koreaKeywords.some(k => locationLower.includes(k))
          return !isKoreaJob
        })
      }
    }
    if (f.type) filtered = filtered.filter((job) => (job.type ?? '').includes(f.type))
    if (f.sector) filtered = filtered.filter((job) => (job.sector ?? '').toLowerCase().includes(f.sector.toLowerCase()))
    if (f.backer) filtered = filtered.filter((job) => job.backers?.includes(f.backer))
    if (f.role) {
      filtered = filtered.filter((job) => job.role === f.role)
    }
    if (vc) filtered = filtered.filter((job) => job.backers?.includes(vc))
    if (f.tier1VCOnly) filtered = filtered.filter((job) => job.backers && job.backers.length > 0)
    if (f.daoJobsOnly) filtered = filtered.filter((job) => job.is_dao_job === true)
    if (f.tokenGatedOnly) filtered = filtered.filter((job) => job.token_gate != null)

    // Remote Only filter
    if (f.remoteOnly) {
      filtered = filtered.filter((job) =>
        job.remoteType === 'Remote' ||
        (job.location ?? '').toLowerCase().includes('remote') ||
        job.region === 'Global'
      )
    }

    // Salary Range filter
    if (f.salaryRange) {
      filtered = filtered.filter((job) => {
        // Get salary values
        let minSalary = job.salaryMin
        let maxSalary = job.salaryMax

        // Try to parse from salary string if min/max not available
        if (!minSalary && !maxSalary && job.salary) {
          const salaryMatch = job.salary.match(/[\d,]+/g)
          if (salaryMatch) {
            const values = salaryMatch.map(v => parseInt(v.replace(/,/g, '')))
            minSalary = values[0]
            maxSalary = values[1] || values[0]
          }
        }

        if (!minSalary && !maxSalary) return false

        const jobMax = maxSalary || minSalary || 0
        const jobMin = minSalary || maxSalary || 0

        switch (f.salaryRange) {
          case '50k-100k':
            return jobMax >= 50000 && jobMin <= 100000
          case '100k-150k':
            return jobMax >= 100000 && jobMin <= 150000
          case '150k-200k':
            return jobMax >= 150000 && jobMin <= 200000
          case '200k+':
            return jobMax >= 200000
          default:
            return true
        }
      })
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

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  const visibleJobs = filteredJobs.slice(0, visibleCount)
  const hasMore = visibleCount < filteredJobs.length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
        <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
          <div className="flex flex-col items-center justify-center py-16">
            <Pixelbara pose="careers" size={160} />
            <p className="mt-4 text-sm font-light text-a24-muted dark:text-a24-dark-muted tracking-wide">
              searching for that bag...
            </p>
          </div>
          <JobCardSkeletonGrid count={9} showLoader={false} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 pt-24">
        {/* Compact inline stats */}
        <div className="mb-6">
          <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted tracking-wide">
            <span className="text-a24-text dark:text-a24-dark-text font-medium">{stats.total}</span> positions
            {' | '}
            <span className="text-a24-text dark:text-a24-dark-text font-medium">{stats.global}</span> global
            {' | '}
            <span className="text-a24-text dark:text-a24-dark-text font-medium">{stats.korea}</span> korea
          </p>
        </div>

        {/* Company filter badge */}
        {companyFilter && (
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neun-primary/10 text-neun-primary rounded-full text-sm">
              <span>Showing jobs from: <strong>{companyFilter}</strong></span>
              <Link
                href="/jobs"
                className="p-0.5 hover:bg-neun-primary/20 rounded-full transition-colors"
                title="Clear filter"
              >
                <X className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Search */}
        <ScrollReveal>
          <div className="mb-8">
            <div className="max-w-lg">
              <SearchWithSuggestions onSearch={handleSearch} jobs={jobs} />
            </div>
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal delay={100}>
          <SmartFilterBar onFilterChange={handleSmartFilterChange} />
        </ScrollReveal>

        {/* VC Backers */}
        <ScrollReveal delay={150}>
          <VCBackersDashboard
            vcCounts={vcCounts}
            selectedVC={selectedVC}
            onSelectVC={handleVCSelect}
          />
        </ScrollReveal>

        {/* Jobs Grid */}
        <div className="mb-16">
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="text-lg font-light uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text">
              Open Positions
            </h2>
            <span className="text-xs text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider">
              {filteredJobs.length} results
            </span>
          </div>
          <div className="w-12 h-px bg-neun-success mb-8" />

          {filteredJobs.length === 0 ? (
            <div className="py-20 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
              <Pixelbara pose="question" size={140} className="mx-auto mb-4" clickable />
              <p className="text-a24-muted dark:text-a24-dark-muted text-sm mb-2">
                {isLoading
                  ? 'Loading jobs...'
                  : jobs.length === 0
                  ? 'No jobs available'
                  : 'No matching jobs found'}
              </p>
              {jobs.length > 0 && (
                <p className="text-a24-muted/60 dark:text-a24-dark-muted/60 text-xs">
                  Try different filters or search terms
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {visibleJobs.map((job, index) => (
                    <JobCard key={job.id} job={job} index={index} />
                  ))}
                </AnimatePresence>
              </div>

              {/* View More / No More */}
              <div className="flex justify-center mt-14">
                {hasMore ? (
                  <motion.button
                    onClick={handleLoadMore}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] font-light text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-10 py-4 hover:bg-a24-text hover:text-white dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-all duration-300"
                  >
                    View More
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </motion.button>
                ) : (
                  <p className="text-[11px] uppercase tracking-[0.3em] font-light text-a24-muted/50 dark:text-a24-dark-muted/50">
                    that&apos;s all folks. touch grass.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function CareersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
        <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
          <JobCardSkeletonGrid count={9} showLoader={false} />
        </main>
      </div>
    }>
      <CareersContent />
    </Suspense>
  )
}
