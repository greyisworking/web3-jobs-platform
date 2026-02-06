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
import { Lock, Vote, Flag } from 'lucide-react'
import { toast } from 'sonner'

function isNewJob(postedDate: Date | string | null | undefined): boolean {
  if (!postedDate) return false
  const posted = new Date(postedDate)
  const now = new Date()
  const diffMs = now.getTime() - posted.getTime()
  // Changed from 7 days to 3 days to make NEW badge more meaningful
  return diffMs < 3 * 24 * 60 * 60 * 1000
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
  const [showReportMenu, setShowReportMenu] = useState(false)

  const reportReasons = ['Spam', 'Scam/Fraud', 'Expired', 'Inappropriate', 'Duplicate']

  const handleReport = async (e: React.MouseEvent, reason: string) => {
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
  }

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowReportMenu(!showReportMenu)
  }

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
          {reportReasons.map((reason) => (
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
}

export default function JobCard({ job, index }: JobCardProps) {
  const { opacity, isFading } = useDecayEffect(job.postedDate)
  const [hovered, setHovered] = useState(false)
  const displayTitle = cleanJobTitle(job.title, job.company)
  const displayCompany = cleanCompanyName(job.company)
  // Jobs marked as expired are already filtered out from the API
  // This is a fallback check for any edge cases
  const isExpired = false

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
      className={isExpired ? 'opacity-50 grayscale' : ''}
    >
      <Link
        href={`/careers/${job.id}`}
        onClick={() => {
          trackEvent('job_card_click', { job_id: job.id, title: job.title, company: job.company })
        }}
        className={`relative block p-4 sm:p-6 min-h-[160px] sm:h-[180px] bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border transition-all duration-300 ease-out group flex flex-col overflow-hidden touch-target rounded-sm ${
          isExpired
            ? 'cursor-default'
            : 'hover:-translate-y-1 hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-emerald-500/30 dark:hover:border-emerald-500/20'
        }`}
      >
        {/* Expired overlay */}
        {isExpired && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <span className="px-3 py-1.5 bg-gray-800/90 text-gray-300 text-[11px] font-medium uppercase tracking-wider">
              Closed
            </span>
          </div>
        )}

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
            {isNewJob(job.postedDate) && !job.is_urgent && !job.is_featured && (
              <span className="ml-2 badge-new-emphasis px-1.5 py-0.5 border border-neun-primary/50 text-[9px] uppercase tracking-wider rounded-sm flex-shrink-0">
                NEW
              </span>
            )}
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
