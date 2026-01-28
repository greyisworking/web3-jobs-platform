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
        className="group relative p-6 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border hover:-translate-y-1 hover:border-current transition-all duration-300"
        style={{ '--tw-border-opacity': 0.5, borderColor: eco.color } as React.CSSProperties}
      >
        {/* Ecosystem color indicator */}
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ backgroundColor: eco.color }}
        />

        {/* Logo placeholder - colored circle */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${eco.color}20` }}
        >
          <span className="text-2xl font-bold" style={{ color: eco.color }}>
            {eco.shortName?.[0] || eco.name[0]}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-a24-text dark:text-a24-dark-text mb-2 group-hover:underline decoration-1 underline-offset-4">
          {eco.name}
        </h3>

        {/* Job count */}
        <p className="text-[13px] text-a24-muted dark:text-a24-dark-muted mb-4">
          <span className="font-semibold text-a24-text dark:text-a24-dark-text">{eco.jobCount}</span> open positions
        </p>

        {/* View jobs link */}
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted group-hover:text-a24-text dark:group-hover:text-a24-dark-text transition-colors">
          View jobs
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-a24-text dark:text-a24-dark-text mb-3">
              Ecosystems
            </h1>
            <p className="text-a24-muted dark:text-a24-dark-muted text-sm">
              {totalJobs} jobs across {ECOSYSTEMS.length} blockchain ecosystems
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Pixelbara pose="question" size={100} clickable />
            <p className="text-[11px] text-a24-muted/60 dark:text-a24-dark-muted/60 mt-2 italic">
              pick your chain bestie
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

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-a24-muted/50 dark:text-a24-dark-muted/50 tracking-wider mb-4">
            can&apos;t decide? check all jobs
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-wider bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg hover:opacity-80 transition-opacity"
          >
            Browse all jobs
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </main>
    </div>
  )
}
