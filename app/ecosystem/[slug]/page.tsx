'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowLeft, Briefcase, MapPin, ExternalLink } from 'lucide-react'
import { findCompanyBySlug } from '@/lib/company-slug'
import { useJobs } from '@/hooks/useJobs'
import JobCard from '@/app/components/JobCard'
import GlowBadge from '@/app/components/GlowBadge'
import type { Job } from '@/types/job'

export default function CompanyDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const company = findCompanyBySlug(slug)
  const { jobs } = useJobs()

  const companyJobs = useMemo(() => {
    if (!company || !jobs.length) return []
    const names = [company.name.toLowerCase(), ...company.aliases.map(a => a.toLowerCase())]
    return jobs.filter((job: Job) => {
      const jobCompany = job.company?.toLowerCase() || ''
      return names.some(name => jobCompany.includes(name) || name.includes(jobCompany))
    })
  }, [company, jobs])

  if (!company) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-a24-muted dark:text-a24-dark-muted mb-4">Company not found</p>
        <Link href="/ecosystem" className="text-neun-success hover:underline text-sm">
          ← Back to Ecosystem
        </Link>
      </div>
    )
  }

  const tierStyle = company.tier === 'P0'
    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
    : company.tier === 'P1'
      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        href="/ecosystem"
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Ecosystem
      </Link>

      {/* Company header */}
      <div className="border border-a24-border dark:border-a24-dark-border p-6 sm:p-8 mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-a24-text dark:text-a24-dark-text">
            {company.name}
          </h1>
          <span className={`px-2 py-0.5 text-[10px] font-medium tracking-wider ${tierStyle}`}>
            {company.tier}
          </span>
          {company.hasToken && (
            <span className="px-2 py-0.5 text-[10px] bg-neun-success/10 text-neun-success tracking-wider">
              HAS TOKEN
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-a24-muted dark:text-a24-dark-muted mb-4">
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            {company.sector}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {company.office_location}
          </span>
          {company.stage && (
            <span className="text-[12px] text-a24-muted/70 dark:text-a24-dark-muted/70">
              {company.stage}
            </span>
          )}
        </div>

        {/* Backers */}
        {company.backers.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-a24-muted/60 dark:text-a24-dark-muted/60 mb-2">
              Backed by
            </p>
            <div className="flex flex-wrap gap-1.5">
              {company.backers.map(backer => (
                <GlowBadge key={backer} name={backer} />
              ))}
            </div>
          </div>
        )}

        {/* Career page link */}
        {company.careerUrl && (
          <a
            href={company.careerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors"
          >
            Official careers page
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Open positions */}
      <div className="mb-8">
        <h2 className="text-[11px] uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          Open Positions
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-4" />

        {companyJobs.length > 0 ? (
          <>
            <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-4">
              {companyJobs.length} active {companyJobs.length === 1 ? 'position' : 'positions'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {companyJobs.map((job: Job, i: number) => (
                <JobCard key={job.id} job={job} index={i} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-a24-muted/70 dark:text-a24-dark-muted/70 py-8 text-center">
            No open positions right now. Check back later or visit their{' '}
            {company.careerUrl ? (
              <a href={company.careerUrl} target="_blank" rel="noopener noreferrer" className="text-neun-success hover:underline">
                careers page
              </a>
            ) : (
              'careers page'
            )}
            .
          </p>
        )}
      </div>

      {/* Bottom back link */}
      <Link
        href="/ecosystem"
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Ecosystem
      </Link>
    </div>
  )
}
