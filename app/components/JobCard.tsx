'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useDecayEffect } from '@/hooks/useDecayEffect'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import { cleanJobTitle } from '@/lib/clean-job-title'
import BookmarkButton from './BookmarkButton'

interface JobCardProps {
  job: Job
  index: number
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

export default function JobCard({ job, index }: JobCardProps) {
  const { opacity, isFading } = useDecayEffect(job.postedDate)
  const number = String(index + 1).padStart(3, '0')
  const displayTitle = cleanJobTitle(job.title)

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ opacity: isFading ? opacity : undefined }}
    >
      <Link
        href={`/careers/${job.id}`}
        onClick={() => {
          trackEvent('job_card_click', { job_id: job.id, title: job.title, company: job.company })
        }}
        className="block p-6 h-[180px] bg-white dark:bg-a24-dark-surface border border-[#e5e7eb] dark:border-a24-dark-border -mt-px -ml-px transition-all duration-300 ease-out hover:-translate-y-1 group flex flex-col"
      >
        {/* Number + Company */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-baseline gap-3 min-w-0 mr-2">
            <span className="text-[10px] font-light text-a24-muted/40 dark:text-a24-dark-muted/40 tracking-wider flex-shrink-0">
              {number}
            </span>
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted leading-tight truncate">
              {job.company}
            </p>
          </div>
          <div className="flex-shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
            <BookmarkButton job={{ id: job.id, title: job.title, company: job.company }} />
          </div>
        </div>

        {/* Title — main info, most prominent */}
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
