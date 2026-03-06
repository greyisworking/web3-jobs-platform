'use client'

import { memo, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useDecayEffect } from '@/hooks/useDecayEffect'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import { cleanJobTitle, cleanCompanyName } from '@/lib/clean-job-title'

// NEW badge: postedDate within 7 days only
const NEW_JOB_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

function isNewJob(postedDate: Date | string | null | undefined): boolean {
  if (!postedDate) return false
  const posted = new Date(postedDate)
  const diffMs = Date.now() - posted.getTime()
  return diffMs >= 0 && diffMs < NEW_JOB_THRESHOLD_MS
}

// Format relative time:
// 0-7d: "Xd ago" (but these get NEW badge)
// 7-30d: hidden (return '')
// 30d+: "Xmo ago"
function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  const now = Date.now()
  const diffMs = now - d.getTime()
  if (diffMs < 0) return ''
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffMonth = Math.floor(diffDay / 30)

  if (diffMonth > 0) return `${diffMonth}mo ago`
  if (diffDay > 7) return '' // 7-30d: no label
  if (diffDay > 0) return `${diffDay}d ago`
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHour > 0) return `${diffHour}h ago`
  return 'just now'
}

interface JobCardProps {
  job: Job
  index: number
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
} as const

const cardHoverVariants = {
  rest: { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.01 },
} as const

const JobCard = memo(function JobCard({ job, index }: JobCardProps) {
  const { opacity, isFading } = useDecayEffect(job.postedDate)

  const displayTitle = useMemo(() => cleanJobTitle(job.title, job.company), [job.title, job.company])
  const displayCompany = useMemo(() => cleanCompanyName(job.company), [job.company])
  const isNew = useMemo(() => isNewJob(job.postedDate), [job.postedDate])
  const relativeTime = useMemo(() => formatRelativeTime(job.postedDate || job.crawledAt), [job.postedDate, job.crawledAt])

  const handleClick = useCallback(() => {
    trackEvent('job_card_click', { job_id: job.id, title: job.title, company: job.company })
  }, [job.id, job.title, job.company])

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      whileHover="hover"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ opacity: isFading ? opacity : undefined }}
      className="will-change-transform"
    >
      <motion.div
        variants={cardHoverVariants}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          href={`/jobs/${job.id}`}
          onClick={handleClick}
          className="block p-3 sm:p-4 min-h-[130px] sm:h-[150px] bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border transition-all duration-300 ease-out group flex flex-col overflow-hidden rounded-sm hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-neun-success/40 dark:hover:border-neun-success/30"
          aria-label={`View ${displayTitle} at ${displayCompany}`}
        >
          {/* Company + NEW badge */}
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-a24-muted dark:text-a24-dark-muted leading-tight truncate">
              {displayCompany}
            </p>
            {isNew && (
              <span className="badge-new-emphasis px-1.5 py-0.5 border border-neun-primary/50 text-[9px] uppercase tracking-wider rounded-sm flex-shrink-0">
                NEW
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[17px] font-semibold text-a24-text dark:text-a24-dark-text leading-snug group-hover:underline decoration-1 underline-offset-2 line-clamp-2 flex-1">
            {displayTitle}
          </h3>

          {/* Location + Relative Time */}
          <div className="flex items-center justify-between mt-2 gap-2">
            <p className="text-[13px] font-light text-a24-muted/70 dark:text-a24-dark-muted/70 uppercase tracking-[0.15em] truncate" title={job.location}>
              {job.location && job.location.length > 40 ? job.location.slice(0, 40) + '...' : job.location}
            </p>
            {relativeTime && (
              <span className="text-[11px] text-a24-muted/50 dark:text-a24-dark-muted/50 flex-shrink-0">
                {relativeTime}
              </span>
            )}
          </div>
        </Link>
      </motion.div>
    </motion.div>
  )
})

export default JobCard
