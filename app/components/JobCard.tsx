'use client'

import { useState, memo, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useDecayEffect } from '@/hooks/useDecayEffect'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import { cleanJobTitle, cleanCompanyName } from '@/lib/clean-job-title'
import BookmarkButton from './BookmarkButton'
import { MiniPixelbara } from './Pixelbara'
import { Lock, Vote, Flag } from 'lucide-react'
import { toast } from 'sonner'

// 7 days in milliseconds (hoisted constant)
const NEW_JOB_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

function isNewJob(crawledAt: Date | string | null | undefined): boolean {
  if (!crawledAt) return false
  const crawled = new Date(crawledAt)
  const diffMs = Date.now() - crawled.getTime()
  return diffMs < NEW_JOB_THRESHOLD_MS
}

// Format relative time (e.g., "2d ago", "1w ago")
function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffMonth > 0) return `${diffMonth}mo ago`
  if (diffWeek > 0) return `${diffWeek}w ago`
  if (diffDay > 0) return `${diffDay}d ago`
  if (diffHour > 0) return `${diffHour}h ago`
  if (diffMin > 0) return `${diffMin}m ago`
  return 'just now'
}

interface JobCardProps {
  job: Job
  index: number
}

// Hoisted static values (rendering-hoist-jsx)
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
} as const

const cardHoverVariants = {
  rest: { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.01 },
} as const

const REPORT_REASONS = ['Spam', 'Scam/Fraud', 'Expired', 'Inappropriate', 'Duplicate'] as const

const ReportButton = memo(function ReportButton({ jobId }: { jobId: string }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [showReportMenu, setShowReportMenu] = useState(false)

  const handleReport = useCallback(async (e: React.MouseEvent, reason: string) => {
    e.preventDefault()
    e.stopPropagation()
    setShowReportMenu(false)

    try {
      await fetch('/api/jobs/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, reason }),
      })
      toast.success('Report submitted. Thanks fren! 🙏')
    } catch {
      toast.error('Report failed... try again 😢')
    }
  }, [jobId])

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowReportMenu(prev => !prev)
  }, [])

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative p-1 text-a24-muted/40 hover:text-red-500 transition-colors"
        aria-label="Report this job"
      >
        <Flag className="w-3 h-3" />
        {showTooltip && !showReportMenu && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 text-[9px] whitespace-nowrap bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg rounded z-50">
            Report
          </span>
        )}
      </button>
      {showReportMenu && (
        <div className="absolute bottom-full right-0 mb-1 w-32 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border shadow-lg z-50">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={(e) => handleReport(e, reason)}
              className="w-full px-3 py-1.5 text-left text-[10px] text-a24-muted hover:text-a24-text hover:bg-a24-border/50 transition-colors"
            >
              {reason}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

// Memoized JobCard component (rerender-memo)
const JobCard = memo(function JobCard({ job, index }: JobCardProps) {
  const { opacity, isFading } = useDecayEffect(job.postedDate)
  const [hovered, setHovered] = useState(false)

  // Memoize expensive string operations (js-cache-function-results)
  const displayTitle = useMemo(() => cleanJobTitle(job.title, job.company), [job.title, job.company])
  const displayCompany = useMemo(() => cleanCompanyName(job.company), [job.company])
  const isNew = useMemo(() => isNewJob(job.crawledAt), [job.crawledAt])
  const relativeTime = useMemo(() => formatRelativeTime(job.postedDate || job.crawledAt), [job.postedDate, job.crawledAt])

  // Memoize event handler (rerender-functional-setstate)
  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => setHovered(false), [])
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="will-change-transform"
    >
      <motion.div
        variants={cardHoverVariants}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative block p-3 sm:p-4 min-h-[140px] sm:h-[160px] bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border transition-all duration-300 ease-out group flex flex-col overflow-hidden touch-target rounded-sm hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-emerald-500/40 dark:hover:border-emerald-500/30">
          {/* Stretched link covers full card area; sits behind interactive children */}
          <Link
            href={`/jobs/${job.id}`}
            onClick={handleClick}
            className="absolute inset-0 z-0"
            aria-label={`View ${displayTitle} at ${displayCompany}`}
          />

        {/* Von Restorff Effect: Urgent/Featured badges only */}
        {(job.is_urgent || job.is_featured) && (
          <div className="absolute top-2 right-24 flex items-center gap-1.5">
            {job.is_urgent && (
              <span className="badge-urgent px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider rounded-sm">
                URGENT
              </span>
            )}
            {job.is_featured && (
              <span className="badge-recommended px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider rounded-sm">
                FEATURED
              </span>
            )}
          </div>
        )}

        {/* Token Gate & DAO badges */}
        <div className="absolute top-2 right-12 flex items-center gap-1">
          {job.token_gate && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-[9px] uppercase tracking-wider">
              <Lock className="w-2.5 h-2.5" />
              {job.token_gate.symbol || 'TOKEN'}
            </span>
          )}
          {job.is_dao_job && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/50 text-purple-400 text-[9px] uppercase tracking-wider">
              <Vote className="w-2.5 h-2.5" />
              DAO
            </span>
          )}
          {job.is_alpha && (
            <span className="px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-[9px] uppercase tracking-wider">
              ALPHA
            </span>
          )}
        </div>

        {/* Mini pixelbara on hover */}
        {hovered && (
          <>
            <div className="absolute bottom-2 right-2 opacity-30">
              <MiniPixelbara />
            </div>
            <span className="absolute top-1 right-10 text-[9px] text-a24-muted/50 dark:text-a24-dark-muted/50 italic pointer-events-none">
              it&apos;s giving... job
            </span>
          </>
        )}

        {/* Company + Actions */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center min-w-0 mr-2">
            <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-a24-muted dark:text-a24-dark-muted leading-tight truncate">
              {displayCompany}
            </p>
            {/* NEW badge inline with company */}
            {isNew && !job.is_urgent && !job.is_featured && (
              <span className="ml-2 badge-new-emphasis px-1.5 py-0.5 border border-neun-primary/50 text-[9px] uppercase tracking-wider rounded-sm flex-shrink-0">
                NEW
              </span>
            )}
          </div>
          <div className="relative z-10 flex items-center gap-1 flex-shrink-0">
            <ReportButton jobId={job.id} />
            <BookmarkButton job={{ id: job.id, title: job.title, company: job.company }} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[17px] font-semibold text-a24-text dark:text-a24-dark-text leading-snug group-hover:underline decoration-1 underline-offset-2 line-clamp-2 flex-1">
          {displayTitle}
        </h3>

        {/* Location + Relative Time */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <p className="text-[13px] font-light text-a24-muted/70 dark:text-a24-dark-muted/70 uppercase tracking-[0.15em] truncate">
            {job.location}
          </p>
          {relativeTime && (
            <span className="text-[11px] text-a24-muted/50 dark:text-a24-dark-muted/50 flex-shrink-0">
              {relativeTime}
            </span>
          )}
        </div>
      </div>
      </motion.div>
    </motion.div>
  )
})

export default JobCard
