'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, ExternalLink, MapPin, Briefcase, Globe, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import BookmarkButton from '@/app/components/BookmarkButton'
import GlowBadge from '@/app/components/GlowBadge'
import {
  VerifiedBadge,
  PreIPOBadge,
  RemoteBadge,
  ActiveBadge,
  Web3PerksBadge,
  EnglishBadge,
} from '@/app/components/badges'

const BADGE_COMPONENT_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Verified: VerifiedBadge,
  'Pre-IPO': PreIPOBadge,
  Remote: RemoteBadge,
  Active: ActiveBadge,
  'Web3 Perks': Web3PerksBadge,
  English: EnglishBadge,
}

const VC_REASONS: Record<string, string> = {
  'a16z': '크립토 생태계의 가장 영향력 있는 VC로, 선도적 블록체인 프로젝트에 집중 투자합니다.',
  Paradigm: '크립토 네이티브 리서치 중심 펀드로, DeFi와 인프라 혁신을 이끕니다.',
  Hashed: '아시아 최대 블록체인 전문 펀드로, 한국과 글로벌 Web3 프로젝트를 발굴합니다.',
  'Samsung Next': '삼성의 전략적 투자 부문으로, 차세대 기술 스타트업을 지원합니다.',
  Kakao: '카카오 생태계를 기반으로 블록체인과 핀테크 혁신을 추진합니다.',
  'Kakao Ventures': '초기 단계 기술 스타트업에 투자하며, Web3 분야에 적극적입니다.',
  'KB Investment': '금융 인프라 전문성을 바탕으로 블록체인 핀테크에 투자합니다.',
  Dunamu: '업비트 운영사로, 블록체인 기술과 디지털 자산 생태계를 지원합니다.',
  SoftBank: '글로벌 기술 투자의 선두주자로, 대규모 성장 단계 투자를 주도합니다.',
  'Animoca Brands': 'GameFi와 메타버스 분야의 글로벌 리더로, NFT 생태계를 선도합니다.',
  Binance: '세계 최대 가상자산 거래소로, 블록체인 인프라에 전략적 투자합니다.',
  'LINE Corporation': '라인 메신저 기반 블록체인 서비스를 구축하며 Web3 채택을 가속합니다.',
  'Mirae Asset': '한국 대표 자산운용사로, 디지털 자산과 핀테크 혁신에 투자합니다.',
  Wemade: '위메이드 게임 생태계 기반으로 블록체인 게이밍을 선도합니다.',
}

function findPriorityBacker(backers: string[]): string | null {
  const priority = ['a16z', 'Paradigm', 'Hashed', 'Samsung Next', 'Binance', 'SoftBank', 'Animoca Brands']
  for (const p of priority) {
    if (backers.includes(p)) return p
  }
  return backers[0] ?? null
}

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return tags.split(',').map((t) => t.trim()).filter(Boolean)
  }
}

interface JobDetailPageClientProps {
  job: Job
}

export default function JobDetailPageClient({ job }: JobDetailPageClientProps) {
  const companyInitial = (job.company ?? '?')[0]?.toUpperCase() ?? '?'

  useEffect(() => {
    trackEvent('job_view', { job_id: job.id, title: job.title, company: job.company, source: 'page' })
  }, [job.id, job.title, job.company])

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('링크가 복사되었습니다!')
    })
    trackEvent('share_click', { job_id: job.id, method: 'copy_url', source: 'page' })
  }

  const handleShareTwitter = () => {
    const text = `${job.title} at ${job.company} - Web3 채용 공고`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`,
      '_blank'
    )
    trackEvent('share_click', { job_id: job.id, method: 'twitter', source: 'page' })
  }

  const handleShareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
      '_blank'
    )
    trackEvent('share_click', { job_id: job.id, method: 'linkedin', source: 'page' })
  }

  const tags = parseTags(job.tags)

  return (
    <div className="min-h-screen bg-sub-offwhite dark:bg-sub-dark-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-sub-dark-surface border-b border-sub-border dark:border-sub-border-dark">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 border border-sub-border dark:border-sub-border-dark hover:bg-sub-offwhite dark:hover:bg-sub-dark-bg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-sub-charcoal dark:text-gray-400" />
          </Link>
          <h1 className="text-lg font-heading uppercase tracking-widest text-sub-charcoal dark:text-gray-200 truncate">
            JOB DETAIL
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Company info */}
        <div className="bg-white dark:bg-sub-dark-surface border border-sub-border dark:border-sub-border-dark p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-sub-sky/15/20 dark:bg-sub-sky/15/10 text-sub-charcoal dark:text-gray-200 font-heading text-2xl uppercase">
              {companyInitial}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-heading uppercase tracking-wide text-sub-charcoal dark:text-gray-200">
                {job.title}
              </h2>
              <p className="text-base text-sub-muted dark:text-gray-400 mt-1">
                {job.company}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="flex items-center gap-2 text-sm text-sub-charcoal dark:text-gray-400">
              <MapPin className="w-4 h-4 flex-shrink-0 text-sub-muted" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-sub-charcoal dark:text-gray-400">
              <Briefcase className="w-4 h-4 flex-shrink-0 text-sub-muted" />
              <span>{job.type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-sub-charcoal dark:text-gray-400">
              <Globe className="w-4 h-4 flex-shrink-0 text-sub-muted" />
              <span>{job.region}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-sub-charcoal dark:text-gray-400">
              <Building2 className="w-4 h-4 flex-shrink-0 text-sub-muted" />
              <span>{job.source}</span>
            </div>
          </div>

          {/* Salary */}
          {job.salary && (
            <div className="mt-4 p-3 bg-sub-sky/15/10 border border-sub-sky/30">
              <p className="text-sm font-medium text-sub-hotpink">
                {job.salary}
              </p>
            </div>
          )}

          {/* Badges */}
          {job.badges && job.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {job.badges.map((b) => {
                const BadgeComponent = BADGE_COMPONENT_MAP[b]
                if (!BadgeComponent) return null
                return <BadgeComponent key={b} />
              })}
            </div>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <div className="bg-white dark:bg-sub-dark-surface border border-sub-border dark:border-sub-border-dark p-6">
            <h3 className="text-sm font-heading uppercase tracking-widest text-sub-charcoal dark:text-gray-200 mb-3">
              DESCRIPTION
            </h3>
            <p className="text-sm text-sub-charcoal dark:text-gray-400 whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>
        )}

        {/* Tech stack */}
        {tags.length > 0 && (
          <div className="bg-white dark:bg-sub-dark-surface border border-sub-border dark:border-sub-border-dark p-6">
            <h3 className="text-sm font-heading uppercase tracking-widest text-sub-charcoal dark:text-gray-200 mb-3">
              TECH STACK
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-medium bg-sub-sky/15/10 text-sub-hotpink border border-sub-sky/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* VC Backers */}
        {job.backers && job.backers.length > 0 && (
          <div className="bg-white dark:bg-sub-dark-surface border border-sub-border dark:border-sub-border-dark p-6">
            <h3 className="text-sm font-heading uppercase tracking-widest text-sub-charcoal dark:text-gray-200 mb-3">
              VC BACKERS
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {job.backers.map((backer) => (
                <GlowBadge key={backer} name={backer} />
              ))}
            </div>

            {(() => {
              const priorityBacker = findPriorityBacker(job.backers!)
              const reason = priorityBacker ? VC_REASONS[priorityBacker] : null
              if (!reason) return null
              return (
                <div className="p-4 bg-sub-offwhite dark:bg-sub-dark-bg border border-sub-border dark:border-sub-border-dark">
                  <p className="text-xs font-heading uppercase tracking-widest text-sub-hotpink mb-1">
                    WHY THIS COMPANY
                  </p>
                  <p className="text-sm text-sub-charcoal dark:text-gray-400 leading-relaxed">
                    <strong>{priorityBacker}</strong> — {reason}
                  </p>
                </div>
              )
            })()}
          </div>
        )}
      </main>

      {/* Footer */}
      <div className="sticky bottom-0 z-40 bg-white dark:bg-sub-dark-surface border-t border-sub-border dark:border-sub-border-dark">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sub-charcoal dark:text-gray-400 border border-sub-border dark:border-sub-border-dark hover:bg-sub-offwhite dark:hover:bg-sub-dark-bg transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              URL
            </button>
            <button
              onClick={handleShareTwitter}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sub-charcoal dark:text-gray-400 border border-sub-border dark:border-sub-border-dark hover:bg-sub-offwhite dark:hover:bg-sub-dark-bg transition-colors"
            >
              Twitter
            </button>
            <button
              onClick={handleShareLinkedIn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sub-charcoal dark:text-gray-400 border border-sub-border dark:border-sub-border-dark hover:bg-sub-offwhite dark:hover:bg-sub-dark-bg transition-colors"
            >
              LinkedIn
            </button>
            <div className="ml-auto">
              <BookmarkButton job={{ id: job.id, title: job.title, company: job.company }} />
            </div>
          </div>
          <Link
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('job_apply_click', { job_id: job.id, title: job.title, company: job.company, source: 'page' })}
            className="flex items-center justify-center gap-2 w-full py-3 bg-sub-hotpink text-white font-heading uppercase tracking-widest hover:bg-sub-hotpink/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            APPLY NOW
          </Link>
        </div>
      </div>
    </div>
  )
}
