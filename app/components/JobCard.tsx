'use client'

import { motion } from 'framer-motion'
import { useDecayEffect } from '@/hooks/useDecayEffect'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import BookmarkButton from './BookmarkButton'

interface JobCardProps {
  job: Job
  index: number
}

// A24 editorial — 4 subtle alternating tints
const CARD_TINTS = [
  { light: 'bg-card-white', dark: 'dark:bg-card-white-dark' },
  { light: 'bg-card-cream', dark: 'dark:bg-card-cream-dark' },
  { light: 'bg-card-blue',  dark: 'dark:bg-card-blue-dark' },
  { light: 'bg-card-pink',  dark: 'dark:bg-card-pink-dark' },
]

const cardVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export default function JobCard({ job, index }: JobCardProps) {
  const { opacity, isFading } = useDecayEffect(job.postedDate)
  const tint = CARD_TINTS[index % CARD_TINTS.length]

  return (
    <motion.a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent('job_apply_click', { job_id: job.id, title: job.title, company: job.company, source: 'card' })
      }}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.2 }}
      className={`block p-6 ${tint.light} ${tint.dark} border border-a24-border dark:border-a24-dark-border -mt-px -ml-px hover:bg-a24-bg dark:hover:bg-a24-dark-bg transition-colors group cursor-pointer`}
      style={{ opacity: isFading ? opacity : undefined }}
    >
      {/* Company */}
      <div className="flex items-start justify-between mb-4">
        <p className="text-lg font-heading uppercase tracking-[0.1em] text-a24-text dark:text-a24-dark-text leading-tight">
          {job.company}
        </p>
        <div onClick={(e) => e.preventDefault()}>
          <BookmarkButton job={{ id: job.id, title: job.title, company: job.company }} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm text-a24-text dark:text-a24-dark-text leading-snug group-hover:underline decoration-1 underline-offset-2">
        {job.title}
      </h3>

      {/* Location */}
      <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-2 uppercase tracking-wider">
        {job.location}
      </p>
    </motion.a>
  )
}
