'use client'

import { type ReactNode, type HTMLAttributes, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Briefcase, Building2, Calendar, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Job } from '@/types/job'
import { cleanJobTitle, cleanCompanyName } from '@/lib/clean-job-title'

// ══════════════════════════════════════════════
// Base Card Component
// ══════════════════════════════════════════════

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  hover = true,
  padding = 'md',
  className,
  ...props
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-5',
    lg: 'p-6 md:p-8',
  }

  return (
    <div
      className={cn(
        'bg-a24-surface dark:bg-a24-dark-surface',
        'border border-a24-border dark:border-a24-dark-border',
        'transition-all duration-300',
        hover && 'card-hover-lift',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ══════════════════════════════════════════════
// Job Card Component
// ══════════════════════════════════════════════

interface JobCardProps {
  job: Job
  compact?: boolean
}

export const JobCard = memo(function JobCard({ job, compact = false }: JobCardProps) {
  const isNew = job.postedDate && (() => {
    const posted = new Date(job.postedDate)
    const now = new Date()
    return now.getTime() - posted.getTime() < 7 * 24 * 60 * 60 * 1000
  })()

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="group cursor-pointer h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-small font-medium text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider mb-1">
                {cleanCompanyName(job.company)}
              </p>
              <h3 className="text-body font-semibold text-a24-text dark:text-a24-dark-text line-clamp-2 group-hover:text-neun-primary transition-colors">
                {cleanJobTitle(job.title, job.company)}
              </h3>
            </div>
            {isNew && (
              <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold text-neun-primary bg-neun-primary/10 uppercase">
                NEW
              </span>
            )}
          </div>

          {/* Meta */}
          {!compact && (
            <div className="flex flex-wrap gap-3 text-small text-a24-muted dark:text-a24-dark-muted mb-4">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {job.type}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-a24-border dark:border-a24-dark-border flex items-center justify-between">
            <span className="text-small text-a24-muted dark:text-a24-dark-muted">
              {job.source}
            </span>
            <ArrowRight className="w-4 h-4 text-a24-muted group-hover:text-neun-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Card>
    </Link>
  )
})

// ══════════════════════════════════════════════
// Company Card Component
// ══════════════════════════════════════════════

interface CompanyCardProps {
  name: string
  logo?: string
  sector?: string
  jobCount?: number
  href?: string
}

export const CompanyCard = memo(function CompanyCard({ name, logo, sector, jobCount, href }: CompanyCardProps) {
  const content = (
    <Card className="group cursor-pointer text-center">
      {/* Logo */}
      <div className="w-16 h-16 mx-auto mb-3 bg-a24-bg dark:bg-a24-dark-bg rounded-full flex items-center justify-center overflow-hidden relative">
        {logo ? (
          <Image
            src={logo}
            alt={name}
            fill
            className="object-cover"
            sizes="64px"
            loading="lazy"
            unoptimized={logo.startsWith('http')}
          />
        ) : (
          <Building2 className="w-8 h-8 text-a24-muted" />
        )}
      </div>

      {/* Name */}
      <h3 className="text-body font-semibold text-a24-text dark:text-a24-dark-text mb-1 group-hover:text-neun-primary transition-colors">
        {name}
      </h3>

      {/* Meta */}
      {sector && (
        <p className="text-small text-a24-muted dark:text-a24-dark-muted mb-2">
          {sector}
        </p>
      )}

      {jobCount !== undefined && (
        <p className="text-small text-neun-primary font-medium">
          {jobCount} open {jobCount === 1 ? 'position' : 'positions'}
        </p>
      )}
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
})

// ══════════════════════════════════════════════
// Investor Card Component
// ══════════════════════════════════════════════

interface InvestorCardProps {
  name: string
  logo?: string
  portfolioCount?: number
  href?: string
}

export const InvestorCard = memo(function InvestorCard({ name, logo, portfolioCount, href }: InvestorCardProps) {
  const content = (
    <Card className="group cursor-pointer">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="w-12 h-12 bg-a24-bg dark:bg-a24-dark-bg rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 relative">
          {logo ? (
            <Image
              src={logo}
              alt={name}
              fill
              className="object-contain p-2"
              sizes="48px"
              loading="lazy"
              unoptimized={logo.startsWith('http')}
            />
          ) : (
            <span className="text-lg font-bold text-a24-muted">{name[0]}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-body font-semibold text-a24-text dark:text-a24-dark-text group-hover:text-neun-primary transition-colors">
            {name}
          </h3>
          {portfolioCount !== undefined && (
            <p className="text-small text-a24-muted dark:text-a24-dark-muted">
              {portfolioCount} portfolio companies
            </p>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-a24-muted group-hover:text-neun-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
})

// ══════════════════════════════════════════════
// Article Card Component
// ══════════════════════════════════════════════

interface ArticleCardProps {
  title: string
  excerpt?: string
  author?: string
  date?: string
  readingTime?: number
  coverImage?: string
  href: string
  tags?: string[]
}

export const ArticleCard = memo(function ArticleCard({
  title,
  excerpt,
  author,
  date,
  readingTime,
  coverImage,
  href,
  tags,
}: ArticleCardProps) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer h-full overflow-hidden" padding="none">
        {/* Cover Image */}
        {coverImage && (
          <div className="aspect-video bg-a24-bg dark:bg-a24-dark-bg overflow-hidden relative">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              unoptimized={coverImage.startsWith('http')}
            />
          </div>
        )}

        <div className="p-4 md:p-5">
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[10px] font-medium text-neun-primary bg-neun-primary/10 uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-body font-semibold text-a24-text dark:text-a24-dark-text line-clamp-2 mb-2 group-hover:text-neun-primary transition-colors">
            {title}
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-small text-a24-muted dark:text-a24-dark-muted line-clamp-2 mb-4">
              {excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between text-small text-a24-muted dark:text-a24-dark-muted">
            <span>{author}</span>
            <div className="flex items-center gap-3">
              {date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {date}
                </span>
              )}
              {readingTime && <span>{readingTime} min read</span>}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
})

export default Card
