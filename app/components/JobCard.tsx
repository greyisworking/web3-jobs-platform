'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useDecayEffect } from '@/hooks/useDecayEffect'
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

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  category: string
  url: string
  salary: string | null
  source: string
  region: string
  postedDate: Date | null
  backers?: string[] | null
  sector?: string | null
  office_location?: string | null
  badges?: string[] | null
}

interface JobCardProps {
  job: Job
}

/**
 * 뱃지 이름 → 전용 컴포넌트 매핑
 * Active, English은 숨김 처리하지 않고 아이콘 뱃지로 표시
 */
const BADGE_COMPONENT_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Verified: VerifiedBadge,
  'Pre-IPO': PreIPOBadge,
  Remote: RemoteBadge,
  Active: ActiveBadge,
  'Web3 Perks': Web3PerksBadge,
  English: EnglishBadge,
}

/** Framer Motion 카드 진입 애니메이션 설정 */
const cardVariants = {
  // 초기 상태: 약간 아래에서 투명하게
  hidden: { opacity: 0, y: 12 },
  // 표시 상태: 제자리에 불투명하게
  visible: { opacity: 1, y: 0 },
}

export default function JobCard({ job }: JobCardProps) {
  const { opacity, blur, grayscale, isFading, freshness, hoverResetStyles, tooltipText } =
    useDecayEffect(job.postedDate)
  const [hovered, setHovered] = useState(false)
  const companyInitial = (job.company ?? '?')[0]?.toUpperCase() ?? '?'

  const allBadges = job.badges ?? []

  const decayStyle: React.CSSProperties = hovered
    ? hoverResetStyles
    : {
        opacity,
        filter:
          blur > 0 || grayscale > 0
            ? `blur(${blur}px) grayscale(${grayscale})`
            : undefined,
      }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.3, ease: 'easeOut' }}
      // 호버 시 미세 확대 + 글로우
      whileHover={{ scale: 1.015 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative p-6 backdrop-blur-md bg-white/70 dark:bg-white/10 border-hairline border-white/20 rounded-xl hover:bg-white/80 dark:hover:bg-white/15 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 ease-out cursor-default"
      style={decayStyle}
    >
      {/* 마감 임박 툴팁 */}
      {isFading && tooltipText && hovered && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap z-10">
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className="flex gap-4 flex-1">
          {/* 회사 이니셜 아바타 — 그래디언트 배경 */}
          <motion.div
            whileHover={{ rotate: [0, -6, 6, 0] }}
            transition={{ duration: 0.4 }}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-web3-ice-blue/30 to-web3-electric-blue/30 flex items-center justify-center"
          >
            <span className="text-lg font-bold text-web3-electric-blue dark:text-web3-ice-blue">
              {companyInitial}
            </span>
          </motion.div>

          <div className="flex-1 min-w-0">
            {/* 제목 + 회사명 */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5 truncate">
              {job.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {job.company}
            </p>

            {/* VC 투자사 글로우 뱃지 */}
            {job.backers && job.backers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {job.backers.map((backer) => (
                  <GlowBadge key={backer} name={backer} />
                ))}
              </div>
            )}

            {/* 동적 뱃지 시스템 — 아이콘 + 툴팁 포함 */}
            {allBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allBadges.map((b) => {
                  const BadgeComponent = BADGE_COMPONENT_MAP[b]
                  if (!BadgeComponent) return null
                  return <BadgeComponent key={b} />
                })}
              </div>
            )}

            {/* 급여 */}
            {job.salary && (
              <p className="text-sm font-medium text-web3-electric-blue dark:text-web3-ice-blue mb-2">
                {job.salary}
              </p>
            )}

            {/* 메타 태그 — 반투명 배경 */}
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="bg-blue-100/50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                {job.location}
              </span>
              <span className="bg-green-100/50 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-3 py-1 rounded-full">
                {job.type}
              </span>
              <span className="bg-purple-100/50 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full">
                {job.region}
              </span>
              <span className="bg-gray-100/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full">
                {job.source}
              </span>
              {isFading && (
                <span className="bg-amber-100/50 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-xs">
                  {freshness}
                </span>
              )}
            </div>

            {/* 높은 감쇄 경고 — 오래된 공고 표시 */}
            {(freshness === 'Stale' || freshness === 'Expired') && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">
                This listing may be outdated
              </p>
            )}
          </div>
        </div>

        {/* 우측 액션: 북마크 + 지원 버튼 */}
        <div className="flex items-start gap-2 ml-4 flex-shrink-0">
          <BookmarkButton job={{ id: job.id, title: job.title, company: job.company }} />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-web3-electric-blue/90 hover:bg-web3-electric-blue text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-glow text-sm font-medium"
            >
              Apply
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
