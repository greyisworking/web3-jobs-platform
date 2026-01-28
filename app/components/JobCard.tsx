'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useDecayEffect } from '@/hooks/useDecayEffect'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import { cleanJobTitle, cleanCompanyName } from '@/lib/clean-job-title'
import BookmarkButton from './BookmarkButton'
import { MiniPixelbara } from './Pixelbara'

interface JobCardProps {
  job: Job
  index: number
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

function VCBadge({ backers }: { backers: string[] }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const displayCount = Math.min(backers.length, 2)
  const remaining = backers.length - displayCount
  const tooltipText = backers.slice(0, displayCount).join(', ') + (remaining > 0 ? ` +${remaining}` : '')

  return (
    <span
      className="relative inline-flex items-center ml-1.5"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] whitespace-nowrap bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg rounded z-50">
          Backed by {tooltipText}
        </span>
      )}
    </span>
  )
}

export default function JobCard({ job, index }: JobCardProps) {
  const { opacity, isFading } = useDecayEffect(job.postedDate)
  const [hovered, setHovered] = useState(false)
  const number = String(index + 1).padStart(3, '0')
  const displayTitle = cleanJobTitle(job.title, job.company)
  const displayCompany = cleanCompanyName(job.company)

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ opacity: isFading ? opacity : undefined }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/careers/${job.id}`}
        onClick={() => {
          trackEvent('job_card_click', { job_id: job.id, title: job.title, company: job.company })
        }}
        className="relative block p-6 h-[180px] bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border -mt-px -ml-px transition-all duration-300 ease-out hover:-translate-y-1 group flex flex-col overflow-hidden"
      >
        {/* Mini pixelbara + meme tooltip on hover */}
        {hovered && (
          <>
            <div className="absolute bottom-2 right-2 opacity-30 transition-opacity">
              <MiniPixelbara />
            </div>
            <span className="absolute top-1 right-10 text-[9px] text-a24-muted/50 dark:text-a24-dark-muted/50 italic pointer-events-none">
              it&apos;s giving... job
            </span>
          </>
        )}

        {/* Number + Company */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-baseline gap-3 min-w-0 mr-2">
            <span className="text-[10px] font-light text-a24-muted/40 dark:text-a24-dark-muted/40 tracking-wider flex-shrink-0">
              {number}
            </span>
            <div className="flex items-center min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted leading-tight truncate">
                {displayCompany}
              </p>
              {job.backers && job.backers.length > 0 && (
                <VCBadge backers={job.backers} />
              )}
            </div>
          </div>
          <div className="flex-shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
            <BookmarkButton job={{ id: job.id, title: job.title, company: job.company }} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold text-a24-text dark:text-a24-dark-text leading-snug group-hover:underline decoration-1 underline-offset-2 line-clamp-2 flex-1">
          {displayTitle}
        </h3>

        {/* Location */}
        <p className="text-[11px] font-light text-a24-muted/70 dark:text-a24-dark-muted/70 mt-2 uppercase tracking-[0.2em] truncate">
          {job.location}
        </p>
      </Link>
    </motion.div>
  )
}
