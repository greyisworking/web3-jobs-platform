'use client'

import { motion } from 'framer-motion'
import { useDecayEffect } from '@/hooks/useDecayEffect'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import GlowBadge from './GlowBadge'
import BookmarkButton from './BookmarkButton'
import {
  VerifiedBadge,
  PreIPOBadge,
  RemoteBadge,
  ActiveBadge,
  Web3PerksBadge,
  EnglishBadge,
} from './badges'

interface JobCardProps {
  job: Job
  index: number
}

const BADGE_COMPONENT_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Verified: VerifiedBadge,
  'Pre-IPO': PreIPOBadge,
  Remote: RemoteBadge,
  Active: ActiveBadge,
  'Web3 Perks': Web3PerksBadge,
  English: EnglishBadge,
}

// THE SUBSTANCE — 5-tile rotation from the movie
// Sky Blue → Hot Pink → Cream → Coral → Off White → repeat
const TILE_COLORS = [
  { light: 'bg-tile-1',   dark: 'dark:bg-tile-1-dark',  text: 'text-[#1a3a5c]', textDark: 'dark:text-[#a8d4f0]' },
  { light: 'bg-tile-2',   dark: 'dark:bg-tile-2-dark',  text: 'text-[#5c1a35]', textDark: 'dark:text-[#f0a8c4]' },
  { light: 'bg-tile-3',   dark: 'dark:bg-tile-3-dark',  text: 'text-[#4a4530]', textDark: 'dark:text-[#e8e4d0]' },
  { light: 'bg-tile-4',   dark: 'dark:bg-tile-4-dark',  text: 'text-[#5c2a2a]', textDark: 'dark:text-[#f0c4c4]' },
  { light: 'bg-tile-5',   dark: 'dark:bg-tile-5-dark',  text: 'text-[#3a3a3a]', textDark: 'dark:text-[#c8c8c8]' },
]

const cardVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export default function JobCard({ job, index }: JobCardProps) {
  const { opacity, isFading, freshness } = useDecayEffect(job.postedDate)
  const companyInitial = (job.company ?? '?')[0]?.toUpperCase() ?? '?'
  const allBadges = job.badges ?? []
  const tile = TILE_COLORS[index % TILE_COLORS.length]

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
      className={`block p-5 ${tile.light} ${tile.dark} hover:brightness-[0.92] dark:hover:brightness-125 transition-all duration-150 group cursor-pointer`}
      style={{ opacity: isFading ? opacity : undefined }}
    >
      {/* Top row: initial + bookmark */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 flex items-center justify-center bg-white/50 dark:bg-white/10 ${tile.text} ${tile.textDark} font-heading text-base`}>
          {companyInitial}
        </div>
        <div onClick={(e) => e.preventDefault()}>
          <BookmarkButton job={{ id: job.id, title: job.title, company: job.company }} />
        </div>
      </div>

      {/* Title */}
      <h3 className={`text-[13px] font-bold leading-snug group-hover:underline decoration-1 underline-offset-2 ${tile.text} ${tile.textDark}`}>
        {job.title}
      </h3>
      <p className={`text-xs mt-0.5 opacity-70 ${tile.text} ${tile.textDark}`}>
        {job.company}
      </p>

      {/* VC Backers */}
      {job.backers && job.backers.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {job.backers.map((backer) => (
            <GlowBadge key={backer} name={backer} />
          ))}
        </div>
      )}

      {/* Badges */}
      {allBadges.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {allBadges.map((b) => {
            const BadgeComponent = BADGE_COMPONENT_MAP[b]
            if (!BadgeComponent) return null
            return <BadgeComponent key={b} />
          })}
        </div>
      )}

      {/* Salary */}
      {job.salary && (
        <p className={`text-xs font-semibold mt-2 ${tile.text} ${tile.textDark}`}>
          {job.salary}
        </p>
      )}

      {/* Meta tags */}
      <div className="flex flex-wrap gap-1 mt-3 text-[10px] uppercase tracking-wider font-medium">
        <span className={`bg-white/40 dark:bg-white/10 px-2 py-0.5 ${tile.text} ${tile.textDark}`}>
          {job.location}
        </span>
        <span className={`bg-white/40 dark:bg-white/10 px-2 py-0.5 ${tile.text} ${tile.textDark}`}>
          {job.type}
        </span>
        <span className={`bg-white/40 dark:bg-white/10 px-2 py-0.5 opacity-60 ${tile.text} ${tile.textDark}`}>
          {job.source}
        </span>
        {isFading && (
          <span className={`bg-white/40 dark:bg-white/10 px-2 py-0.5 opacity-60 ${tile.text} ${tile.textDark}`}>
            {freshness}
          </span>
        )}
      </div>

      {(freshness === 'Stale' || freshness === 'Expired') && (
        <p className={`text-[10px] mt-2 italic opacity-50 ${tile.text} ${tile.textDark}`}>
          This listing may be outdated
        </p>
      )}
    </motion.a>
  )
}
