'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Copy, ExternalLink, MapPin, Briefcase, Globe, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import { cleanJobTitle, cleanCompanyName } from '@/lib/clean-job-title'
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
  'a16z': 'The most influential crypto VC, investing in leading blockchain projects.',
  Paradigm: 'A crypto-native research-driven fund leading DeFi and infrastructure innovation.',
  Hashed: 'Asia\'s largest blockchain-focused fund, discovering Web3 projects globally.',
  'Samsung Next': 'Samsung\'s strategic investment arm supporting next-gen tech startups.',
  Kakao: 'Driving blockchain and fintech innovation through the Kakao ecosystem.',
  'Kakao Ventures': 'Early-stage tech startup investor active in Web3.',
  'KB Investment': 'Investing in blockchain fintech with financial infrastructure expertise.',
  Dunamu: 'Upbit operator supporting blockchain technology and digital asset ecosystem.',
  SoftBank: 'Global tech investment leader driving large-scale growth investments.',
  'Animoca Brands': 'Global leader in GameFi and metaverse, pioneering the NFT ecosystem.',
  Binance: 'World\'s largest crypto exchange investing strategically in blockchain infrastructure.',
  'LINE Corporation': 'Building LINE-based blockchain services to accelerate Web3 adoption.',
  'Mirae Asset': 'Korea\'s leading asset manager investing in digital assets and fintech.',
  Wemade: 'Leading blockchain gaming through the Wemade game ecosystem.',
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

interface CareersDetailClientProps {
  job: Job
}

export default function CareersDetailClient({ job }: CareersDetailClientProps) {
  useEffect(() => {
    trackEvent('job_view', { job_id: job.id, title: job.title, company: job.company, source: 'page' })
  }, [job.id, job.title, job.company])

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Link copied!')
    })
    trackEvent('share_click', { job_id: job.id, method: 'copy_url', source: 'page' })
  }

  const handleShareTwitter = () => {
    const text = `${job.title} at ${job.company}`
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
    <div className="min-h-screen bg-[#FDFCF9] dark:bg-a24-dark-bg">
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Back link */}
        <Link
          href="/careers"
          className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Back to Careers
        </Link>

        {/* Company & Title */}
        <div>
          <p className="text-2xl font-extralight uppercase tracking-[0.25em] text-a24-text dark:text-a24-dark-text mb-3">
            {cleanCompanyName(job.company)}
          </p>
          <h1 className="text-base font-light text-a24-text dark:text-a24-dark-text mb-4">
            {cleanJobTitle(job.title, job.company)}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              {job.type}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {job.region}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              {job.source}
            </span>
          </div>
        </div>

        {/* Salary */}
        {job.salary && (
          <div className="py-4 border-t border-b border-a24-border dark:border-a24-dark-border">
            <p className="text-sm text-a24-text dark:text-a24-dark-text font-medium">
              {job.salary}
            </p>
          </div>
        )}

        {/* Badges */}
        {job.badges && job.badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.badges.map((b) => {
              const BadgeComponent = BADGE_COMPONENT_MAP[b]
              if (!BadgeComponent) return null
              return <BadgeComponent key={b} />
            })}
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
            <h3 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
              Description
            </h3>
            <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-4" />
            <p className="text-sm text-a24-text dark:text-a24-dark-text whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>
        )}

        {/* Tech stack */}
        {tags.length > 0 && (
          <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
            <h3 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
              Tech Stack
            </h3>
            <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-4" />
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* VC Backers */}
        {job.backers && job.backers.length > 0 && (
          <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
            <h3 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
              VC Backers
            </h3>
            <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-4" />
            <div className="flex flex-wrap gap-1.5 mb-6">
              {job.backers.map((backer) => (
                <GlowBadge key={backer} name={backer} />
              ))}
            </div>

            {(() => {
              const priorityBacker = findPriorityBacker(job.backers!)
              const reason = priorityBacker ? VC_REASONS[priorityBacker] : null
              if (!reason) return null
              return (
                <div className="p-4 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface">
                  <p className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-2">
                    Why This Company
                  </p>
                  <p className="text-sm text-a24-text dark:text-a24-dark-text leading-relaxed">
                    <strong>{priorityBacker}</strong> &mdash; {reason}
                  </p>
                </div>
              )
            })()}
          </div>
        )}
      </main>

      {/* Footer */}
      <div className="sticky bottom-0 z-40 bg-a24-surface dark:bg-a24-dark-surface border-t border-a24-border dark:border-a24-dark-border">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-a24-muted dark:text-a24-dark-muted border border-a24-border dark:border-a24-dark-border hover:text-a24-text dark:hover:text-a24-dark-text hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              URL
            </button>
            <button
              onClick={handleShareTwitter}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-a24-muted dark:text-a24-dark-muted border border-a24-border dark:border-a24-dark-border hover:text-a24-text dark:hover:text-a24-dark-text hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
            >
              Twitter
            </button>
            <button
              onClick={handleShareLinkedIn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-a24-muted dark:text-a24-dark-muted border border-a24-border dark:border-a24-dark-border hover:text-a24-text dark:hover:text-a24-dark-text hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
            >
              LinkedIn
            </button>
            <div className="ml-auto">
              <BookmarkButton job={{ id: job.id, title: job.title, company: job.company }} />
            </div>
          </div>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('job_apply_click', { job_id: job.id, title: job.title, company: job.company, source: 'page' })}
            className="group flex items-center justify-center gap-2 w-full py-3 bg-a24-text dark:bg-a24-dark-text text-a24-surface dark:text-a24-dark-bg text-[11px] font-light uppercase tracking-[0.35em] hover:opacity-80 transition-all duration-300"
          >
            <ExternalLink className="w-4 h-4" />
            Apply Now
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </div>
  )
}
