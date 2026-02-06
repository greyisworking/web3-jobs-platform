'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Copy, ExternalLink, MapPin, Briefcase, Globe, Building2, AlertTriangle, Search, Flag, User } from 'lucide-react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import type { Job } from '@/types/job'
import { trackEvent } from '@/lib/analytics'
import { cleanJobTitle, cleanCompanyName } from '@/lib/clean-job-title'
import { cleanJobDisplay, cleanJobDisplayWithSections } from '@/lib/clean-job-display'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'
import BookmarkButton from '@/app/components/BookmarkButton'
import GlowBadge from '@/app/components/GlowBadge'
import { TrustCheckList, SimpleTrustCheckList, hasVCBacking } from '@/app/components/TrustBadge'
import { simpleCompanyTrustCheck, isTrustedSource, isUserPostedJob } from '@/lib/trust-check'
import TrustVerifiedBadge from '@/app/components/badges/TrustVerifiedBadge'
import UnverifiedBadge from '@/app/components/badges/UnverifiedBadge'
import VCVerifiedBadge from '@/app/components/badges/VCVerifiedBadge'
import { TokenInfoSection, useTokenData } from '@/app/components/TokenInfo'
import { calculateTrustScore } from '@/lib/trust-check'
import { findPriorityCompany } from '@/lib/priority-companies'
import {
  VerifiedBadge,
  PreIPOBadge,
  RemoteBadge,
  ActiveBadge,
  Web3PerksBadge,
  EnglishBadge,
} from '@/app/components/badges'

/**
 * Check if a URL is valid and accessible
 */
function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

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
  const [urlStatus, setUrlStatus] = useState<'valid' | 'invalid' | 'checking'>('checking')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [showRawDescription, setShowRawDescription] = useState(false)
  const hasValidUrl = isValidUrl(job.url)
  const { address } = useAccount()
  // Check if job is expired (isActive=false means expired)
  const isExpired = job.isActive === false
  // Check if raw description is available (different from formatted)
  const hasRawDescription = job.raw_description && job.raw_description !== job.description

  useEffect(() => {
    trackEvent('job_view', { job_id: job.id, title: job.title, company: job.company, source: 'page' })
    // Set URL status based on basic validation
    setUrlStatus(hasValidUrl ? 'valid' : 'invalid')
  }, [job.id, job.title, job.company, hasValidUrl])

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason for reporting')
      return
    }

    setReportSubmitting(true)
    try {
      const res = await fetch('/api/jobs/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          reason: reportReason,
          walletAddress: address,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report')
      }

      toast.success('Report submitted. Thank you!')
      setShowReportModal(false)
      setReportReason('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report')
    } finally {
      setReportSubmitting(false)
    }
  }

  // Truncate address helper
  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  // Get priority company data for trust check
  const priorityCompany = findPriorityCompany(job.company)

  // Calculate trust score
  const trustScore = calculateTrustScore({
    name: job.company,
    backers: job.backers,
    hasToken: priorityCompany?.hasToken,
    isDoxxed: true, // Assume doxxed if in priority list
    isAudited: undefined, // Unknown
  })

  // Fetch token/TVL data
  const { tokenInfo, tvlInfo, loading: tokenLoading } = useTokenData({
    company: job.company,
    hasToken: priorityCompany?.hasToken,
    sector: priorityCompany?.sector || job.sector || undefined,
  })

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Copied! now go shill it ser')
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

  const handleShareTelegram = () => {
    const text = `${job.title} at ${job.company}`
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`,
      '_blank'
    )
    trackEvent('share_click', { job_id: job.id, method: 'telegram', source: 'page' })
  }

  const tags = parseTags(job.tags)
  const isNew = job.postedDate && (() => {
    const posted = new Date(job.postedDate!)
    const now = new Date()
    return now.getTime() - posted.getTime() < 7 * 24 * 60 * 60 * 1000
  })()

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href="/careers"
          className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors mb-8 block"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Back to Careers
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* ── Left column: Content ── */}
          <div className="space-y-8">
            {/* Company & Title */}
            <div>
              <p className="text-2xl font-light uppercase tracking-[0.25em] text-a24-text dark:text-a24-dark-text mb-3">
                {cleanCompanyName(job.company)}
              </p>
              <div className="flex items-center gap-3">
                <h1 className="text-base font-light text-a24-text dark:text-a24-dark-text">
                  {cleanJobTitle(job.title, job.company)}
                </h1>
                {isNew && (
                  <span className="font-semibold text-[9px] text-neun-success uppercase tracking-wider">
                    NEW
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-xs text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider mt-4">
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

            {/* Salary & Experience */}
            {(job.salary || job.salaryMin || job.salaryMax || job.experienceLevel || job.remoteType) && (
              <div className="py-4 border-t border-b border-a24-border dark:border-a24-dark-border space-y-2">
                {/* Salary display */}
                {(job.salaryMin || job.salaryMax || job.salary) && (
                  <p className="text-sm text-a24-text dark:text-a24-dark-text font-medium">
                    {job.salaryMin && job.salaryMax ? (
                      <>💰 {job.salaryCurrency || 'USD'} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}/yr</>
                    ) : job.salaryMin ? (
                      <>💰 {job.salaryCurrency || 'USD'} {job.salaryMin.toLocaleString()}+/yr</>
                    ) : (
                      <>💰 {job.salary}</>
                    )}
                  </p>
                )}
                {/* Experience & Remote badges */}
                <div className="flex flex-wrap gap-2">
                  {job.experienceLevel && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider border border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted">
                      📊 {job.experienceLevel}
                    </span>
                  )}
                  {job.remoteType && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider border border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted">
                      🏠 {job.remoteType}
                    </span>
                  )}
                </div>
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

            {/* Job Description Section */}
            {job.description ? (
              <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted">
                    Job Description
                  </h3>
                  {hasRawDescription && (
                    <button
                      onClick={() => setShowRawDescription(!showRawDescription)}
                      className="text-[10px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text border border-a24-border dark:border-a24-dark-border px-2 py-1 transition-colors"
                    >
                      {showRawDescription ? '📝 View formatted' : '📄 View raw'}
                    </button>
                  )}
                </div>
                <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-4" />
                {showRawDescription && hasRawDescription ? (
                  <div className="text-sm text-a24-text dark:text-a24-dark-text leading-relaxed whitespace-pre-wrap font-mono bg-a24-surface dark:bg-a24-dark-surface p-4 border border-a24-border dark:border-a24-dark-border overflow-x-auto">
                    {job.raw_description}
                  </div>
                ) : (
                  <MarkdownRenderer
                    content={job.description}
                    className="text-sm text-a24-text dark:text-a24-dark-text leading-relaxed"
                  />
                )}
              </div>
            ) : (
              <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
                <div className="p-8 bg-gradient-to-br from-neun-primary/10 via-a24-surface/50 to-neun-primary/5 dark:from-neun-primary/20 dark:via-a24-dark-surface/50 dark:to-neun-primary/10 border-2 border-neun-primary/30 text-center relative overflow-hidden">
                  {/* Animated background pulse */}
                  <div className="absolute inset-0 bg-neun-primary/5 animate-pulse" />

                  <div className="relative z-10">
                    <div className="mb-4">
                      <ExternalLink className="w-8 h-8 mx-auto text-neun-primary mb-3" />
                      <p className="text-base font-medium text-a24-text dark:text-a24-dark-text mb-2">
                        상세 내용은 원본 사이트에서 확인하세요
                      </p>
                      <p className="text-xs text-a24-muted dark:text-a24-dark-muted">
                        Full job description available on the original posting
                      </p>
                    </div>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackEvent('job_apply_click', { job_id: job.id, title: job.title, company: job.company, source: 'no_description_cta' })}
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-neun-primary text-white font-bold text-base uppercase tracking-wider hover:bg-neun-primary-hover hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-neun-primary/30"
                    >
                      <ExternalLink className="w-5 h-5" />
                      View Full Details & Apply
                      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Requirements Section */}
            {job.requirements && (
              <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
                <h3 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
                  Requirements
                </h3>
                <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-4" />
                <MarkdownRenderer
                  content={job.requirements}
                  className="text-sm text-a24-text dark:text-a24-dark-text leading-relaxed"
                />
              </div>
            )}

            {/* Responsibilities Section */}
            {job.responsibilities && (
              <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
                <h3 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
                  Responsibilities
                </h3>
                <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-4" />
                <MarkdownRenderer
                  content={job.responsibilities}
                  className="text-sm text-a24-text dark:text-a24-dark-text leading-relaxed"
                />
              </div>
            )}

            {/* Benefits Section */}
            {job.benefits && (
              <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
                <h3 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
                  Benefits & Perks
                </h3>
                <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-4" />
                <MarkdownRenderer
                  content={job.benefits}
                  className="text-sm text-a24-text dark:text-a24-dark-text leading-relaxed"
                />
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
          </div>

          {/* ── Right column: Sidebar ── */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
            {/* Apply Now CTA */}
            {isExpired ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 w-full py-3 bg-gray-500/20 text-gray-400 text-[11px] font-light uppercase tracking-[0.35em] border border-gray-500/30">
                  <AlertTriangle className="w-4 h-4" />
                  이 공고는 마감되었습니다
                </div>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(`${job.company} careers ${job.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('job_search_fallback', { job_id: job.id, company: job.company })}
                  className="group flex items-center justify-center gap-2 w-full py-2.5 border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text text-[10px] font-light uppercase tracking-[0.25em] hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search Similar Jobs
                </a>
              </div>
            ) : urlStatus === 'valid' ? (
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
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 w-full py-3 bg-a24-muted/20 dark:bg-a24-dark-muted/20 text-a24-muted dark:text-a24-dark-muted text-[11px] font-light uppercase tracking-[0.35em] border border-a24-border dark:border-a24-dark-border">
                  <AlertTriangle className="w-4 h-4" />
                  Expired / Unavailable
                </div>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(`${job.company} careers ${job.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('job_search_fallback', { job_id: job.id, company: job.company })}
                  className="group flex items-center justify-center gap-2 w-full py-2.5 border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text text-[10px] font-light uppercase tracking-[0.25em] hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search on Google
                </a>
              </div>
            )}

            {/* Share section */}
            <div className="p-4 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface space-y-3">
              <h3 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted">
                Share
              </h3>
              <div className="flex flex-wrap gap-2">
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
                  onClick={handleShareTelegram}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-a24-muted dark:text-a24-dark-muted border border-a24-border dark:border-a24-dark-border hover:text-a24-text dark:hover:text-a24-dark-text hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
                >
                  Telegram
                </button>
                <button
                  onClick={handleShareLinkedIn}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-a24-muted dark:text-a24-dark-muted border border-a24-border dark:border-a24-dark-border hover:text-a24-text dark:hover:text-a24-dark-text hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
                >
                  LinkedIn
                </button>
              </div>
            </div>

            {/* Bookmark */}
            <div className="p-4 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface flex items-center justify-between">
              <span className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted">
                Bookmark
              </span>
              <BookmarkButton job={{ id: job.id, title: job.title, company: job.company }} />
            </div>

            {/* Trust Status - Different display based on verification level */}
            {hasVCBacking(job.backers) ? (
              // VC Portfolio Company - No warnings needed
              <div className="p-4 border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <VCVerifiedBadge />
                </div>
                <p className="text-[11px] text-amber-400/80">
                  Backed by top-tier VC investors. ser this ones legit fr.
                </p>
              </div>
            ) : isTrustedSource(job.source) ? (
              // Crawled from trusted job board - Verified
              <div className="p-4 border border-emerald-500/30 bg-emerald-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrustVerifiedBadge />
                </div>
                <p className="text-[11px] text-emerald-400/80">
                  Sourced from {job.source}. established job board, looking good ser.
                </p>
              </div>
            ) : isUserPostedJob(job.source) ? (
              // User-posted job - Show warning and trust check
              <div className="p-4 border border-red-500/30 bg-red-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <UnverifiedBadge />
                  <span className="text-[10px] text-red-400/80">User posted job</span>
                </div>
                <h3 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-3">
                  Trust Check
                </h3>
                <SimpleTrustCheckList
                  result={simpleCompanyTrustCheck({
                    website: job.companyWebsite,
                    twitter: undefined,
                    linkedin: undefined,
                    foundedYear: undefined,
                    teamDoxxed: trustScore.checks.find(c => c.id === 'doxxed')?.passed,
                  })}
                />
              </div>
            ) : (
              // Other sources - Show as verified (trusted by default)
              <div className="p-4 border border-emerald-500/30 bg-emerald-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrustVerifiedBadge />
                </div>
                <p className="text-[11px] text-emerald-400/80">
                  Sourced from {job.source}. looking good ser.
                </p>
              </div>
            )}

            {/* Token/TVL Info */}
            {!tokenLoading && (tokenInfo || tvlInfo) && (
              <TokenInfoSection tokenInfo={tokenInfo} tvlInfo={tvlInfo} />
            )}

            {/* VC Backers in sidebar */}
            {job.backers && job.backers.length > 0 && (
              <div className="p-4 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface space-y-3">
                <h3 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted">
                  VC Backers
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {job.backers.map((backer) => (
                    <GlowBadge key={backer} name={backer} />
                  ))}
                </div>

                {(() => {
                  const priorityBacker = findPriorityBacker(job.backers!)
                  const reason = priorityBacker ? VC_REASONS[priorityBacker] : null
                  if (!reason) return null
                  return (
                    <div className="pt-3 border-t border-a24-border dark:border-a24-dark-border">
                      <p className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-2">
                        Why This Company
                      </p>
                      <p className="text-xs text-a24-text dark:text-a24-dark-text leading-relaxed">
                        <strong>{priorityBacker}</strong> &mdash; {reason}
                      </p>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Posted by (for user-posted jobs) */}
            {(job as any).postedBy && (
              <div className="p-4 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface">
                <h3 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-2">
                  Posted By
                </h3>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-a24-muted dark:text-a24-dark-muted" />
                  <span className="text-xs font-mono text-a24-text dark:text-a24-dark-text">
                    {truncateAddress((job as any).postedBy)}
                  </span>
                </div>
              </div>
            )}

            {/* Report button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full p-3 border border-a24-border dark:border-a24-dark-border text-[10px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted hover:text-red-500 hover:border-red-500/50 transition-colors flex items-center justify-center gap-2"
            >
              🚩 Report this company
            </button>
          </aside>
        </div>
      </main>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReportModal(false)}>
          <div
            className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-a24-text dark:text-a24-dark-text mb-2">
              Report Job
            </h3>
            <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-4">
              Help us keep NEUN safe. Report spam, scams, or inappropriate content.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-2">
                Reason for report *
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text focus:outline-none focus:border-a24-text dark:focus:border-a24-dark-text"
              >
                <option value="">Select a reason</option>
                <option value="spam">Spam or fake job</option>
                <option value="scam">Suspected scam</option>
                <option value="expired">Job no longer available</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="misleading">Misleading information</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 text-[11px] uppercase tracking-wider border border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reportSubmitting || !reportReason}
                className="flex-1 px-4 py-2 text-[11px] uppercase tracking-wider bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile fixed bottom Apply button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-a24-surface dark:bg-a24-dark-surface border-t border-a24-border dark:border-a24-dark-border p-4">
        {isExpired ? (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-500/20 text-gray-400 text-[10px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              마감됨
            </div>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${job.company} careers ${job.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('job_search_fallback', { job_id: job.id, company: job.company })}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-a24-text dark:bg-a24-dark-text text-a24-surface dark:text-a24-dark-bg text-[10px] uppercase tracking-wider"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </a>
          </div>
        ) : urlStatus === 'valid' ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('job_apply_click', { job_id: job.id, title: job.title, company: job.company, source: 'mobile' })}
            className="group flex items-center justify-center gap-2 w-full py-3 bg-a24-text dark:bg-a24-dark-text text-a24-surface dark:text-a24-dark-bg text-[11px] font-light uppercase tracking-[0.35em] hover:opacity-80 transition-all duration-300"
          >
            <ExternalLink className="w-4 h-4" />
            Apply Now
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-a24-muted/20 text-a24-muted text-[10px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              Expired
            </div>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${job.company} careers ${job.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('job_search_fallback', { job_id: job.id, company: job.company })}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-a24-text dark:bg-a24-dark-text text-a24-surface dark:text-a24-dark-bg text-[10px] uppercase tracking-wider"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
