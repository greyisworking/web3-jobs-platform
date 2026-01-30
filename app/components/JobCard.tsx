'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useDecayEffect } from '@/hooks/useDecayEffect'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import { cleanJobTitle, cleanCompanyName } from '@/lib/clean-job-title'
import BookmarkButton from './BookmarkButton'
import { MiniPixelbara } from './Pixelbara'
import { PixelStar } from './PixelIcons'
import { MiniTrustBadge } from './TrustBadge'
import { Lock, Vote, Flag } from 'lucide-react'
import { toast } from 'sonner'

function isNewJob(postedDate: Date | string | null | undefined): boolean {
  if (!postedDate) return false
  const posted = new Date(postedDate)
  const now = new Date()
  const diffMs = now.getTime() - posted.getTime()
  return diffMs < 7 * 24 * 60 * 60 * 1000
}

interface JobCardProps {
  job: Job
  index: number
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

function ReportButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleReport = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const reason = window.prompt('Report reason (spam, scam, inappropriate, etc.):')
    if (!reason) return

    try {
      await fetch('/api/jobs/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, reason }),
      })
      toast.success('Report submitted. Thank you!')
    } catch {
      toast.error('Failed to submit report')
    }
  }

  return (
    <button
      onClick={handleReport}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="relative p-1 text-a24-muted/40 hover:text-red-500 transition-colors"
      aria-label="Report this job"
    >
      <Flag className="w-3 h-3" />
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 text-[9px] whitespace-nowrap bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg rounded z-50">
          Report
        </span>
      )}
    </button>
  )
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
      <PixelStar className="text-amber-400" size={12} />
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
        className="relative block p-4 sm:p-6 min-h-[160px] sm:h-[180px] bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-emerald-500/30 dark:hover:border-emerald-500/20 group flex flex-col overflow-hidden touch-target rounded-sm"
      >
        {/* Von Restorff Effect: Urgent/Featured/NEW badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
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
          {isNewJob(job.postedDate) && !job.is_urgent && !job.is_featured && (
            <span className="badge-new-emphasis px-1.5 py-0.5 border border-neun-primary/50 text-[9px] uppercase tracking-wider rounded-sm">
              NEW
            </span>
          )}
        </div>

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

        {/* Trust badge + Mini pixelbara on hover */}
        {hovered && (
          <>
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <MiniTrustBadge backers={job.backers} companyName={job.company} />
              <div className="opacity-30">
                <MiniPixelbara />
              </div>
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
              <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-a24-muted dark:text-a24-dark-muted leading-tight truncate">
                {displayCompany}
              </p>
              {job.backers && job.backers.length > 0 && (
                <VCBadge backers={job.backers} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
            <ReportButton jobId={job.id} jobTitle={job.title} />
            <BookmarkButton job={{ id: job.id, title: job.title, company: job.company }} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[17px] font-semibold text-a24-text dark:text-a24-dark-text leading-snug group-hover:underline decoration-1 underline-offset-2 line-clamp-2 flex-1">
          {displayTitle}
        </h3>

        {/* Location */}
        <p className="text-[13px] font-light text-a24-muted/70 dark:text-a24-dark-muted/70 mt-2 uppercase tracking-[0.15em] truncate">
          {job.location}
        </p>
      </Link>
    </motion.div>
  )
}
