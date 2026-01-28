'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { Job } from '@/types/job'
import JobCard from './components/JobCard'
import { JobCardSkeletonGrid } from './components/JobCardSkeleton'
import Pixelbara from './components/Pixelbara'
import { MiniPixelbara, TimeAwarePixelbara, useTimeOfDay, TIME_MSGS } from './components/Pixelbara'
import SocialProof from './components/SocialProof'
import ScrollPixelbara from './components/ScrollPixelbara'
import ScrollReveal from './components/ScrollReveal'
import Footer from './components/Footer'

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
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg pixelbara-cursor">
      <ScrollPixelbara />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-28 md:py-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col md:flex-row items-center md:items-start justify-between gap-12"
        >
          {/* Left: Text */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-wide text-a24-text dark:text-a24-dark-text mb-6">
              Only from{' '}
              <span className="font-black">a16z</span>,{' '}
              <span className="font-black">Hashed</span>,{' '}
              <span className="font-black">Paradigm</span>{' '}
              portfolios.
            </h1>

            <p className="text-sm md:text-base font-light text-a24-muted dark:text-a24-dark-muted mb-10 tracking-wide">
              Only legit jobs.
            </p>

            <Link
              href="/careers"
              className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] font-light text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-10 py-4 hover:bg-a24-text hover:text-white dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-all duration-300"
            >
              <MiniPixelbara className="opacity-60 group-hover:opacity-100 transition-opacity" />
              Explore Careers
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right: Pixelbara full body with laptop */}
          <div className="flex-shrink-0">
            <Pixelbara pose="heroLaptop" size={400} clickable suppressHover className="hidden md:block" />
            <Pixelbara pose="heroLaptop" size={200} clickable suppressHover className="block md:hidden" />
          </div>
        </motion.div>
      </section>

      {/* Social Proof */}
      <section className="max-w-6xl mx-auto px-6">
        <SocialProof />
      </section>

      {/* Featured Jobs */}
      <ScrollReveal>
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="text-lg md:text-xl font-bold uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text">
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
              <Pixelbara pose="empty" size={140} className="mx-auto mb-4" clickable />
              <p className="text-a24-muted dark:text-a24-dark-muted text-sm font-light">
                No jobs found yet. ngmi.
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
