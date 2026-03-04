'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Job } from '@/types/job'
import JobCard from './components/JobCard'
import { JobCardSkeletonGrid } from './components/JobCardSkeleton'
import Pixelbara from './components/Pixelbara'
import HeroTrendDashboard from './components/HeroTrendDashboard'
import ScrollReveal from './components/ScrollReveal'
import Footer from './components/Footer'
import PWAInstallPrompt from './components/PWAInstallPrompt'

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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

      {/* Hero Trend Dashboard */}
      <HeroTrendDashboard />

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
