'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { Job } from '@/types/job'
import JobCard from './components/JobCard'
import { JobCardSkeletonGrid } from './components/JobCardSkeleton'

const FEATURED_COUNT = 6

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.jobs?.slice(0, FEATURED_COUNT) ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading uppercase leading-[0.95] text-a24-text dark:text-a24-dark-text mb-6">
            FIND YOUR <em className="not-italic font-body italic text-a24-muted dark:text-a24-dark-muted">Next</em> CHAPTER
          </h1>
          <p className="text-base md:text-lg text-a24-muted dark:text-a24-dark-muted mb-10 max-w-lg">
            당신의 다음 이야기, 여기서 시작하세요.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-8 py-4 hover:bg-a24-text hover:text-a24-surface dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-colors"
          >
            Explore Careers
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Featured Jobs */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex justify-between items-baseline mb-8">
          <h2 className="text-2xl font-heading uppercase tracking-[0.15em] text-a24-text dark:text-a24-dark-text">
            Featured Positions
          </h2>
          <Link
            href="/careers"
            className="text-xs uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <JobCardSkeletonGrid count={6} />
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
            <p className="text-a24-muted dark:text-a24-dark-muted text-sm">
              No jobs found yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-a24-border dark:border-a24-dark-border">
        <div className="max-w-6xl mx-auto px-6 py-10 flex justify-between items-end">
          <div>
            <span className="text-xl font-heading font-bold tracking-[0.05em] text-a24-text dark:text-a24-dark-text">NEUN</span>
            <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-2 uppercase tracking-[0.2em]">
              40+ sources &mdash; updated every 3h
            </p>
          </div>
          <p className="text-xs text-a24-muted dark:text-a24-dark-muted">
            neun.io
          </p>
        </div>
      </footer>
    </div>
  )
}
