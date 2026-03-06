'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import { cleanJobTitle, cleanCompanyName } from '@/lib/clean-job-title'
import { MapPin, Clock, DollarSign } from 'lucide-react'

// Accent colors by source type — not random, but source-deterministic
const SOURCE_ACCENTS: Record<string, string> = {
  'priority:lever': '#22C55E',
  'priority:greenhouse': '#3B82F6',
  'priority:ashby': '#A855F7',
  'cryptocurrencyjobs.co': '#F59E0B',
  'jobs.solana.com': '#9945FF',
  'jobs.arbitrum.io': '#28A0F0',
  'jobs.avax.network': '#E84142',
  'jobs.sui.io': '#6FBCF0',
  'web3.career': '#FF6B6B',
  'manual': '#22C55E',
}

function getAccent(source: string | undefined): string {
  if (!source) return '#22C55E'
  return SOURCE_ACCENTS[source] || '#22C55E'
}

function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  const diffMs = Date.now() - d.getTime()
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffDay > 0) return `${diffDay}d`
  if (diffHour > 0) return `${diffHour}h`
  return 'now'
}

function parseTags(tags: string | string[] | null | undefined): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) return tags.slice(0, 3)
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed.slice(0, 3) : []
  } catch {
    return []
  }
}

interface FeaturedCardProps {
  job: Job
  index: number
  variant: 'hero' | 'default'
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
} as const

const FeaturedCard = memo(function FeaturedCard({ job, index, variant }: FeaturedCardProps) {
  const displayTitle = useMemo(() => cleanJobTitle(job.title, job.company), [job.title, job.company])
  const displayCompany = useMemo(() => cleanCompanyName(job.company), [job.company])
  const accent = useMemo(() => getAccent(job.source), [job.source])
  const relTime = useMemo(() => formatRelativeTime(job.postedDate || job.crawledAt), [job.postedDate, job.crawledAt])
  const tags = useMemo(() => parseTags(job.tags), [job.tags])
  const seq = String(index + 1).padStart(2, '0')

  const isHero = variant === 'hero'

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/jobs/${job.id}`}
        onClick={() => trackEvent('featured_card_click', { job_id: job.id, title: job.title, company: job.company })}
        className="group relative block border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface overflow-hidden transition-all duration-300 hover:border-transparent"
        style={{
          // On hover, CSS handles the glow via the pseudo-element
        }}
      >
        {/* Left accent stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 group-hover:w-[5px]"
          style={{ backgroundColor: accent }}
        />

        {/* Hover glow overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${accent}08 0%, transparent 60%)`,
          }}
        />

        <div className={`relative pl-5 pr-4 ${isHero ? 'py-5 sm:py-6' : 'py-4'}`}>
          {/* Sequence number — large, faded, top-right */}
          <span
            className="absolute top-3 right-4 font-[var(--font-space)] text-[32px] font-bold leading-none select-none pointer-events-none"
            style={{ color: `${accent}12` }}
          >
            {seq}
          </span>

          {/* Company row */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`font-medium uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted ${isHero ? 'text-[13px]' : 'text-[11px]'}`}>
              {displayCompany}
            </span>
            {job.is_featured && (
              <span className="badge-recommended px-1.5 py-0.5 font-bold text-[8px] uppercase tracking-wider rounded-sm">
                FEATURED
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className={`font-[var(--font-space)] font-semibold text-a24-text dark:text-a24-dark-text leading-tight group-hover:underline decoration-1 underline-offset-4 ${isHero ? 'text-[20px] sm:text-[22px] line-clamp-2 mb-3' : 'text-[16px] sm:text-[17px] line-clamp-2 mb-2'}`}
            style={{ textDecorationColor: accent }}
          >
            {displayTitle}
          </h3>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-a24-muted/70 dark:text-a24-dark-muted/70">
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[140px]">{job.location}</span>
              </span>
            )}
            {(job.salary || (job.salaryMin && job.salaryMax)) && (
              <span className="inline-flex items-center gap-1">
                <DollarSign className="w-3 h-3 flex-shrink-0" />
                {job.salary || `${(job.salaryMin! / 1000).toFixed(0)}k–${(job.salaryMax! / 1000).toFixed(0)}k`}
              </span>
            )}
            {relTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" />
                {relTime}
              </span>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className={`flex items-center gap-0 ${isHero ? 'mt-3' : 'mt-2'}`}>
              {tags.map((tag, i) => (
                <span key={tag}>
                  <span
                    className="text-[10px] uppercase tracking-[0.15em] font-medium"
                    style={{ color: `${accent}CC` }}
                  >
                    {tag}
                  </span>
                  {i < tags.length - 1 && (
                    <span className="mx-1.5 text-[10px] text-a24-muted/30 dark:text-a24-dark-muted/30">/</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
})

export default FeaturedCard
