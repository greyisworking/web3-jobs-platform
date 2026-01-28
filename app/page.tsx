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

      {/* Hero Section - BOLD & IMPACTFUL */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4"
        >
          {/* Left: Text - BIGGER */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight tracking-tight text-a24-text dark:text-a24-dark-text mb-4">
              Only from{' '}
              <span className="text-neun-success">a16z</span>,{' '}
              <span className="text-neun-success">Hashed</span>,{' '}
              <span className="text-neun-success">Paradigm</span>{' '}
              portfolios.
            </h1>

            <p className="text-base md:text-lg font-medium text-a24-muted dark:text-a24-dark-muted mb-8 tracking-wide">
              no cap. only legit jobs. fr fr.
            </p>

            <Link
              href="/careers"
              className="group inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.3em] font-bold text-white dark:text-a24-dark-bg bg-a24-text dark:bg-a24-dark-text px-8 py-4 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <MiniPixelbara className="opacity-80 group-hover:opacity-100 transition-opacity" />
              Explore Careers
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right: Pixelbara full body - BIGGER */}
          <div className="flex-shrink-0">
            <Pixelbara pose="heroLaptop" size={480} clickable suppressHover className="hidden lg:block" />
            <Pixelbara pose="heroLaptop" size={360} clickable suppressHover className="hidden md:block lg:hidden" />
            <Pixelbara pose="heroLaptop" size={240} clickable suppressHover className="block md:hidden" />
          </div>
        </motion.div>
      </section>

      {/* Social Proof */}
      <section className="max-w-6xl mx-auto px-6">
        <SocialProof />
      </section>

      {/* Featured Jobs - BOLDER */}
      <ScrollReveal>
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-[0.2em] text-a24-text dark:text-a24-dark-text">
              Featured Positions
            </h2>
            <Link
              href="/careers"
              className="group inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em] font-bold text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="w-16 h-0.5 bg-a24-text dark:bg-a24-dark-text mb-8" />

          {loading ? (
            <JobCardSkeletonGrid count={6} />
          ) : jobs.length === 0 ? (
            <div className="py-20 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
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

      <Footer />
    </div>
  )
}
