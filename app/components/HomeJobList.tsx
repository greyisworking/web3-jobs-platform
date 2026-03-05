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
      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-spacing">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 mb-2">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-light uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text">
            Featured Positions
          </h2>
          <Link
            href="/jobs"
            className="group inline-flex items-center gap-2 text-[11px] sm:text-[12px] uppercase tracking-[0.2em] font-medium text-neun-success hover:text-neun-success/80 transition-colors touch-target"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="w-12 h-px bg-neun-success mb-4 md:mb-6" />

        {jobs.length === 0 ? (
          <div className="py-8 md:py-10 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
            <Pixelbara pose="empty" size={160} className="mx-auto mb-4" clickable />
            <p className="text-a24-muted dark:text-a24-dark-muted text-base font-medium">
              bruh... no jobs rn. touch grass.
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
    </ScrollReveal>
  )
}
