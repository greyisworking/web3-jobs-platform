'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { Job } from '@/types/job'
import JobCard from './components/JobCard'
import { JobCardSkeletonGrid } from './components/JobCardSkeleton'
import IntroAnimation from './components/IntroAnimation'
import ScrollReveal from './components/ScrollReveal'
import Footer from './components/Footer'

const FEATURED_COUNT = 6

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

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
      <IntroAnimation />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-28 md:py-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center"
        >
          {/* Time-based greeting */}
          {greeting && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[11px] uppercase tracking-[0.4em] font-light text-a24-muted dark:text-a24-dark-muted mb-8"
            >
              {greeting}
            </motion.p>
          )}

          {/* Hero headline - always one line */}
          <h1 className="whitespace-nowrap text-[clamp(1.2rem,4.2vw,4.5rem)] font-light uppercase tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] lg:tracking-[0.25em] leading-[1.1] text-a24-text dark:text-a24-dark-text mb-12">
            FIND YOUR{' '}
            <em className="font-script not-italic normal-case text-[1.4em] tracking-[0.02em] leading-none">
              Next
            </em>
            {' '}CHAPTER
          </h1>

          <Link
            href="/careers"
            className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] font-light text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-10 py-4 hover:bg-a24-text hover:text-white dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-all duration-300"
          >
            Explore Careers
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>

      {/* Featured Jobs */}
      <ScrollReveal>
        <section className="max-w-6xl mx-auto px-6 pb-28">
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="text-lg md:text-xl font-light uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text">
              Featured Positions
            </h2>
            <Link
              href="/careers"
              className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              View All
              <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="w-12 h-px bg-a24-text dark:bg-a24-dark-text mb-10" />

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
      </ScrollReveal>

      <Footer />
    </div>
  )
}
