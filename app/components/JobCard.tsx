'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useDecayEffect } from '@/hooks/useDecayEffect'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import BookmarkButton from './BookmarkButton'

interface JobCardProps {
  job: Job
  index: number
}

// THE SUBSTANCE pastels — 5 vibrant alternating colors
const CARD_TINTS = [
  { light: 'bg-card-sky', dark: 'dark:bg-card-sky-dark' },
  { light: 'bg-card-pink', dark: 'dark:bg-card-pink-dark' },
  { light: 'bg-card-cream', dark: 'dark:bg-card-cream-dark' },
  { light: 'bg-card-mint', dark: 'dark:bg-card-mint-dark' },
  { light: 'bg-card-coral', dark: 'dark:bg-card-coral-dark' },
]

const cardVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export default function JobCard({ job, index }: JobCardProps) {
  const { opacity, isFading } = useDecayEffect(job.postedDate)
  const tint = CARD_TINTS[index % CARD_TINTS.length]

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.2 }}
      style={{ opacity: isFading ? opacity : undefined }}
    >
      <Link
        href={`/careers/${job.id}`}
        onClick={() => {
          trackEvent('job_card_click', { job_id: job.id, title: job.title, company: job.company })
        }}
        className={`block p-6 ${tint.light} ${tint.dark} border border-a24-border dark:border-a24-dark-border -mt-px -ml-px hover:opacity-80 transition-opacity group cursor-pointer`}
      >
        {/* Company */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-extralight uppercase tracking-[0.25em] text-a24-text dark:text-a24-dark-text leading-tight">
            {job.company}
          </p>
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
            <BookmarkButton job={{ id: job.id, title: job.title, company: job.company }} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-light text-a24-text dark:text-a24-dark-text leading-snug group-hover:underline decoration-1 underline-offset-2">
          {job.title}
        </h3>

        {/* Location */}
        <p className="text-[11px] font-light text-a24-muted dark:text-a24-dark-muted mt-3 uppercase tracking-[0.2em]">
          {job.location}
        </p>
      </Link>
    </motion.div>
  )
}
