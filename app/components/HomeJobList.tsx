'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Job } from '@/types/job'
import JobCard from './JobCard'
import Pixelbara from './Pixelbara'

interface HomeJobListProps {
  jobs: Job[]
}

export default function HomeJobList({ jobs }: HomeJobListProps) {
  return (
    <>
      {/* Featured Positions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 mb-6">
          <h2 className="text-lg font-semibold text-a24-text dark:text-a24-dark-text tracking-tight">
            Featured Positions
          </h2>
          <Link
            href="/jobs"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-neun-success hover:text-neun-success/80 transition-colors"
          >
            View all
            <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="py-16 text-center border border-a24-border/30 dark:border-a24-dark-border/30 rounded-md">
            <Pixelbara pose="empty" size={120} className="mx-auto mb-4" clickable />
            <p className="text-a24-muted/50 dark:text-a24-dark-muted/50 text-sm">
              No featured positions right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Intelligence CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="border border-a24-border/30 dark:border-a24-dark-border/30 rounded-md p-8 sm:p-12 text-center">
          <p className="text-[13px] text-a24-muted/50 dark:text-a24-dark-muted/50 tracking-wider mb-3">
            Go deeper
          </p>
          <h3 className="text-xl sm:text-2xl font-semibold text-a24-text dark:text-a24-dark-text tracking-tight mb-3">
            Read the market, not just the listings
          </h3>
          <p className="text-sm text-a24-muted/60 dark:text-a24-dark-muted/60 max-w-md mx-auto mb-6">
            Skill demand, salary signals, hiring trends — from 1,000+ live postings.
          </p>
          <Link
            href="/market"
            className="group inline-flex items-center gap-2 text-sm font-medium border border-neun-success/40 text-neun-success hover:bg-neun-success/5 px-6 py-3 rounded-md transition-all duration-200"
          >
            Market Intelligence
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </>
  )
}
