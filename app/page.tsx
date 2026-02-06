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
  const viewportSize = useViewportSize()

  useEffect(() => {
    fetch('/api/jobs/featured')
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.jobs ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg pixelbara-cursor">

      {/* Hero Section - BOLD & IMPACTFUL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 section-spacing-lg">
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
                href="/careers"
                className="group inline-flex items-center justify-center gap-3 text-[12px] uppercase tracking-[0.2em] font-bold text-white bg-emerald-500 px-6 sm:px-8 py-4 hover:bg-emerald-400 hover:shadow-green-glow active:scale-95 transition-all duration-200 touch-target"
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 section-spacing">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 mb-2">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-[0.15em] text-a24-text dark:text-a24-dark-text">
              Featured Positions
            </h2>
            <Link
              href="/careers"
              className="group inline-flex items-center gap-2 text-[11px] sm:text-[12px] uppercase tracking-[0.2em] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors touch-target"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="w-16 h-0.5 bg-emerald-500 mb-8 md:mb-10" />

          {loading ? (
            <JobCardSkeletonGrid count={6} />
          ) : jobs.length === 0 ? (
            <div className="py-16 md:py-20 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
              <Pixelbara pose="empty" size={160} className="mx-auto mb-4" clickable />
              <p className="text-a24-muted dark:text-a24-dark-muted text-base font-medium">
                bruh... no jobs rn. touch grass.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {jobs.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} />
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* Meme Generator CTA */}
      <ScrollReveal>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 p-6 sm:p-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-4 sm:gap-6">
              <Pixelbara pose="bling" size={80} clickable className="flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 sm:mb-2">
                  Make Memes Not War
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Create viral pixelbara memes. fr fr.
                </p>
              </div>
            </div>
            <Link
              href="/meme"
              className="group flex items-center justify-center gap-2 sm:gap-3 w-full md:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-105 whitespace-nowrap flex-shrink-0"
            >
              <span className="text-base sm:text-xl" aria-hidden="true">:3</span>
              <span className="text-sm sm:text-base">Generate Meme</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1 flex-shrink-0" />
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {/* PWA Install — mobile only, inline */}
      <section className="max-w-7xl mx-auto px-6 pb-6">
        <PWAInstallPrompt />
      </section>

      <Footer />
    </div>
  )
}
