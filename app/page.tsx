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
      <section className="max-w-6xl mx-auto px-6 py-28 md:py-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight uppercase tracking-[0.25em] leading-[1.1] text-a24-text dark:text-a24-dark-text mb-8">
            FIND YOUR{' '}
            <em className="font-script italic normal-case text-[1.15em] tracking-[0.02em] text-a24-text dark:text-a24-dark-text">Next</em>
            {' '}CHAPTER
          </h1>
          <p className="text-sm md:text-base font-light text-a24-muted dark:text-a24-dark-muted mb-12 max-w-md tracking-wide">
            당신의 다음 이야기, 여기서 시작하세요.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] font-light text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-10 py-4 hover:bg-a24-text hover:text-a24-surface dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-colors"
          >
            Explore Careers
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </section>

      {/* Featured Jobs */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="flex justify-between items-baseline mb-10">
          <h2 className="text-lg md:text-xl font-extralight uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text">
            Featured Positions
          </h2>
          <Link
            href="/careers"
            className="text-[11px] uppercase tracking-[0.3em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <JobCardSkeletonGrid count={6} />
        ) : jobs.length === 0 ? (
          <div className="py-24 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
            <p className="text-a24-muted dark:text-a24-dark-muted text-sm font-light">
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
        <div className="max-w-6xl mx-auto px-6 py-12 flex justify-between items-end">
          <div>
            <span className="text-lg font-extralight uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text">Neun</span>
            <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted mt-2 uppercase tracking-[0.3em] font-light">
              40+ sources &mdash; updated every 3h
            </p>
          </div>
          <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted font-light tracking-[0.2em]">
            neun.io
          </p>
        </div>
      </footer>
    </div>
  )
}
