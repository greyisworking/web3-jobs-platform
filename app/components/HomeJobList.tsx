'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Job } from '@/types/job'
import JobCard from './JobCard'
import Pixelbara from './Pixelbara'
import ScrollReveal from './ScrollReveal'

interface HomeJobListProps {
  jobs: Job[]
}

export default function HomeJobList({ jobs }: HomeJobListProps) {
  return (
    <ScrollReveal>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-a24-text dark:text-a24-dark-text tracking-tight">
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
          <div className="py-12 text-center border border-a24-border/50 dark:border-a24-dark-border/50 rounded-md">
            <Pixelbara pose="empty" size={140} className="mx-auto mb-4" clickable />
            <p className="text-a24-muted/60 dark:text-a24-dark-muted/60 text-sm">
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
    </ScrollReveal>
  )
}
