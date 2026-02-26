'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { Job } from '@/types/job'
import JobCard from './components/JobCard'
import { JobCardSkeletonGrid } from './components/JobCardSkeleton'
import Pixelbara from './components/Pixelbara'
import { MiniPixelbara, TimeAwarePixelbara, useTimeOfDay, TIME_MSGS } from './components/Pixelbara'
import SocialProof from './components/SocialProof'
// ScrollPixelbara removed - unnecessary floating element
import ScrollReveal from './components/ScrollReveal'
import Footer from './components/Footer'
import PWAInstallPrompt from './components/PWAInstallPrompt'

const FEATURED_COUNT = 6

// Custom hook to get viewport size for conditional rendering
function useViewportSize() {
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('lg')

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth >= 1024) setSize('lg')
      else if (window.innerWidth >= 768) setSize('md')
      else setSize('sm')
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return size
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const viewportSize = useViewportSize()

  const fetchFeaturedJobs = () => {
    setLoading(true)
    setError(false)
    fetch('/api/jobs/featured')
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.jobs ?? [])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchFeaturedJobs()
  }, [])

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg pixelbara-cursor">

      {/* Hero Section - BOLD & IMPACTFUL */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-spacing-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12"
        >
          {/* Left: Text - BIGGER */}
          <div className="flex-1 text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight tracking-tight text-a24-text dark:text-a24-dark-text mb-4 md:mb-6"
            >
              <span className="text-gradient-green">a16z</span>,{' '}
              <span className="text-gradient-green">Hashed</span>,{' '}
              <span className="text-gradient-green">Paradigm</span>{' '}
              + top Web3 companies.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base md:text-lg lg:text-xl font-medium text-a24-muted dark:text-a24-dark-muted mb-8 md:mb-10 tracking-wide"
            >
              no cap. only legit jobs. fr fr.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex justify-center md:justify-start"
            >
              <Link
                href="/jobs"
                className="group inline-flex items-center justify-center gap-3 text-[12px] uppercase tracking-[0.2em] font-bold text-white bg-neun-success px-6 sm:px-8 py-4 hover:bg-neun-success/90 hover:shadow-green-glow active:scale-95 transition-all duration-200 touch-target"
              >
                <MiniPixelbara className="opacity-80 group-hover:opacity-100 transition-opacity" />
                Explore Careers
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* Right: Pixelbara full body - BIGGER with animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-shrink-0 animate-float"
          >
            {/* Render only one Pixelbara based on viewport size */}
            <Pixelbara
              pose="heroLaptop"
              size={viewportSize === 'lg' ? 480 : viewportSize === 'md' ? 360 : 240}
              clickable
              suppressHover
              className="animate-pixel-blink"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof */}
      <section className="max-w-6xl mx-auto px-6">
        <SocialProof />
      </section>

      {/* Featured Jobs - BOLDER */}
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
          <div className="w-12 h-px bg-neun-success mb-8 md:mb-10" />

          {loading ? (
            <JobCardSkeletonGrid count={6} />
          ) : error ? (
            <div className="py-16 md:py-20 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
              <Pixelbara pose="empty" size={160} className="mx-auto mb-4" clickable />
              <p className="text-a24-muted dark:text-a24-dark-muted text-base font-medium mb-4">
                Failed to load jobs. Please try again.
              </p>
              <button
                onClick={fetchFeaturedJobs}
                className="text-[11px] uppercase tracking-[0.2em] font-medium text-neun-success hover:text-neun-success/80 border border-neun-success/50 px-4 py-2 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-16 md:py-20 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
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

      {/* Meme Generator CTA */}

      {/* PWA Install — mobile only, inline */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <PWAInstallPrompt />
      </section>

      <Footer />
    </div>
  )
}
