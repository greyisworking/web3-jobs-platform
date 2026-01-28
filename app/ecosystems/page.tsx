'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ECOSYSTEMS, type Ecosystem, detectEcosystem } from '@/lib/ecosystems'
import type { Job } from '@/types/job'
import Pixelbara from '../components/Pixelbara'

interface EcosystemWithCount extends Ecosystem {
  jobCount: number
}

function EcosystemCard({ eco, index }: { eco: EcosystemWithCount; index: number }) {
  return (
    <Link href={`/careers?ecosystem=${eco.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="group relative p-6 bg-a24-surface dark:bg-a24-dark-surface border-2 border-a24-border dark:border-a24-dark-border hover:-translate-y-2 hover:shadow-lg transition-all duration-300"
        style={{ '--tw-border-opacity': 0.5 } as React.CSSProperties}
      >
        {/* Ecosystem color indicator - BOLDER */}
        <div
          className="absolute top-0 left-0 w-full h-2"
          style={{ backgroundColor: eco.color }}
        />

        {/* Logo placeholder - LARGER */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: `${eco.color}25` }}
        >
          <span className="text-3xl font-black" style={{ color: eco.color }}>
            {eco.shortName?.[0] || eco.name[0]}
          </span>
        </div>

        {/* Name - BOLDER */}
        <h3 className="text-xl font-bold text-a24-text dark:text-a24-dark-text mb-2 group-hover:underline decoration-2 underline-offset-4">
          {eco.name}
        </h3>

        {/* Job count - BIGGER */}
        <p className="text-base text-a24-muted dark:text-a24-dark-muted mb-4">
          <span className="font-bold text-2xl text-a24-text dark:text-a24-dark-text">{eco.jobCount}</span> jobs
        </p>

        {/* View jobs link - BOLDER */}
        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted group-hover:text-a24-text dark:group-hover:text-a24-dark-text transition-colors">
          View jobs
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </span>
      </motion.div>
    </Link>
  )
}

export default function EcosystemsPage() {
  const [ecosystemsWithCounts, setEcosystemsWithCounts] = useState<EcosystemWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [totalJobs, setTotalJobs] = useState(0)

  useEffect(() => {
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => {
        const jobs: Job[] = data.jobs || []
        setTotalJobs(jobs.length)

        // Count jobs per ecosystem
        const counts: Record<string, number> = {}
        ECOSYSTEMS.forEach((eco) => {
          counts[eco.id] = 0
        })
        counts['other'] = 0

        jobs.forEach((job) => {
          const text = `${job.title} ${job.company} ${job.description || ''} ${job.category || ''}`
          const detected = detectEcosystem(text)
          detected.forEach((ecoId) => {
            counts[ecoId] = (counts[ecoId] || 0) + 1
          })
        })

        const withCounts = ECOSYSTEMS.map((eco) => ({
          ...eco,
          jobCount: counts[eco.id] || 0,
        })).sort((a, b) => b.jobCount - a.jobCount)

        setEcosystemsWithCounts(withCounts)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Header - BOLD & IMPACTFUL */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted mb-4">
              pick your chain
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-a24-text dark:text-a24-dark-text mb-4 leading-tight">
              We chill with<br />everyone ㅡ_ㅡ
            </h1>
            <p className="text-lg text-a24-muted dark:text-a24-dark-muted font-medium">
              {totalJobs} jobs across {ECOSYSTEMS.length} ecosystems
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Pixelbara pose="ecosystem" size={180} clickable />
            <p className="text-sm text-a24-muted/70 dark:text-a24-dark-muted/70 mt-3 italic font-medium">
              capybara + alligator = bestie goals
            </p>
          </div>
        </div>

        {/* Ecosystems grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-48 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ecosystemsWithCounts.map((eco, index) => (
              <EcosystemCard key={eco.id} eco={eco} index={index} />
            ))}
          </div>
        )}

        {/* Bottom CTA - BOLDER */}
        <div className="mt-16 text-center py-12 border-t-2 border-a24-border dark:border-a24-dark-border">
          <p className="text-lg text-a24-muted dark:text-a24-dark-muted font-medium mb-6">
            can&apos;t decide? just browse all
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-3 px-10 py-5 text-base font-bold uppercase tracking-wider bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg hover:scale-105 transition-transform"
          >
            Browse all jobs
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  )
}
