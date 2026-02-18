'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Job } from '@/types/job'
import Footer from '@/app/components/Footer'
import { X, ExternalLink, MapPin, Briefcase, DollarSign, Building, Tag } from 'lucide-react'

function parseTags(tags: string | string[] | null | undefined): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return tags.split(',').map((t) => t.trim()).filter(Boolean)
  }
}

export default function CompareJobsPage() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []
    if (ids.length === 0) {
      setLoading(false)
      return
    }

    const fetchJobs = async () => {
      try {
        const results = await Promise.all(
          ids.slice(0, 4).map(async (id) => {
            const res = await fetch(`/api/jobs/${id}`)
            if (res.ok) return res.json()
            return null
          })
        )
        setJobs(results.filter(Boolean))
      } catch {
        // ignore
      }
      setLoading(false)
    }
    fetchJobs()
  }, [searchParams])

  const removeJob = (id: string) => {
    setJobs(jobs.filter((j) => j.id !== id))
    // Update URL
    const newIds = jobs.filter((j) => j.id !== id).map((j) => j.id)
    if (newIds.length > 0) {
      window.history.replaceState({}, '', `/jobs/compare?ids=${newIds.join(',')}`)
    } else {
      window.history.replaceState({}, '', '/jobs/compare')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
        <main className="max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center">
            <div className="w-6 h-6 border border-a24-muted dark:border-a24-dark-muted border-t-a24-text dark:border-t-a24-dark-text rounded-full animate-spin mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-light uppercase tracking-[0.4em] text-a24-text dark:text-a24-dark-text mb-3">
            Compare Jobs
          </h1>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mx-auto" />
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-a24-muted dark:text-a24-dark-muted mb-6">
              No jobs selected for comparison.
            </p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-[0.3em] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-a24-border dark:border-a24-dark-border">
                  <th className="text-left p-4 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted font-light w-32">
                    Field
                  </th>
                  {jobs.map((job) => (
                    <th key={job.id} className="p-4 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-sm font-light text-a24-text dark:text-a24-dark-text hover:text-emerald-500 transition-colors line-clamp-2"
                        >
                          {job.title}
                        </Link>
                        <button
                          onClick={() => removeJob(job.id)}
                          className="flex-shrink-0 p-1 text-a24-muted dark:text-a24-dark-muted hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Company */}
                <tr className="border-b border-a24-border/50 dark:border-a24-dark-border/50">
                  <td className="p-4 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted font-light">
                    <div className="flex items-center gap-2">
                      <Building size={12} />
                      Company
                    </div>
                  </td>
                  {jobs.map((job) => (
                    <td key={job.id} className="p-4 text-sm text-a24-text dark:text-a24-dark-text">
                      {job.company}
                    </td>
                  ))}
                </tr>

                {/* Location */}
                <tr className="border-b border-a24-border/50 dark:border-a24-dark-border/50">
                  <td className="p-4 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted font-light">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} />
                      Location
                    </div>
                  </td>
                  {jobs.map((job) => (
                    <td key={job.id} className="p-4 text-sm text-a24-text dark:text-a24-dark-text">
                      {job.location || job.remoteType || '—'}
                    </td>
                  ))}
                </tr>

                {/* Job Type */}
                <tr className="border-b border-a24-border/50 dark:border-a24-dark-border/50">
                  <td className="p-4 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted font-light">
                    <div className="flex items-center gap-2">
                      <Briefcase size={12} />
                      Type
                    </div>
                  </td>
                  {jobs.map((job) => (
                    <td key={job.id} className="p-4 text-sm text-a24-text dark:text-a24-dark-text">
                      {job.type || '—'}
                    </td>
                  ))}
                </tr>

                {/* Salary */}
                <tr className="border-b border-a24-border/50 dark:border-a24-dark-border/50">
                  <td className="p-4 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted font-light">
                    <div className="flex items-center gap-2">
                      <DollarSign size={12} />
                      Salary
                    </div>
                  </td>
                  {jobs.map((job) => (
                    <td key={job.id} className="p-4 text-sm text-a24-text dark:text-a24-dark-text">
                      {job.salaryMin && job.salaryMax
                        ? `${job.salaryCurrency || '$'}${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                        : job.salary || '—'}
                    </td>
                  ))}
                </tr>

                {/* Experience */}
                <tr className="border-b border-a24-border/50 dark:border-a24-dark-border/50">
                  <td className="p-4 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted font-light">
                    Experience
                  </td>
                  {jobs.map((job) => (
                    <td key={job.id} className="p-4 text-sm text-a24-text dark:text-a24-dark-text">
                      {job.experienceLevel || '—'}
                    </td>
                  ))}
                </tr>

                {/* Sector */}
                <tr className="border-b border-a24-border/50 dark:border-a24-dark-border/50">
                  <td className="p-4 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted font-light">
                    Sector
                  </td>
                  {jobs.map((job) => (
                    <td key={job.id} className="p-4 text-sm text-a24-text dark:text-a24-dark-text">
                      {job.sector || '—'}
                    </td>
                  ))}
                </tr>

                {/* Skills */}
                <tr className="border-b border-a24-border/50 dark:border-a24-dark-border/50">
                  <td className="p-4 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted font-light">
                    <div className="flex items-center gap-2">
                      <Tag size={12} />
                      Skills
                    </div>
                  </td>
                  {jobs.map((job) => (
                    <td key={job.id} className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {parseTags(job.tags).slice(0, 6).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Backers */}
                <tr className="border-b border-a24-border/50 dark:border-a24-dark-border/50">
                  <td className="p-4 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted font-light">
                    Backers
                  </td>
                  {jobs.map((job) => (
                    <td key={job.id} className="p-4 text-sm text-a24-text dark:text-a24-dark-text">
                      {job.backers?.slice(0, 3).join(', ') || '—'}
                    </td>
                  ))}
                </tr>

                {/* Posted Date */}
                <tr className="border-b border-a24-border/50 dark:border-a24-dark-border/50">
                  <td className="p-4 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted font-light">
                    Posted
                  </td>
                  {jobs.map((job) => (
                    <td key={job.id} className="p-4 text-sm text-a24-text dark:text-a24-dark-text">
                      {job.postedDate
                        ? new Date(job.postedDate).toLocaleDateString()
                        : '—'}
                    </td>
                  ))}
                </tr>

                {/* Apply Link */}
                <tr>
                  <td className="p-4 text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted font-light">
                    Apply
                  </td>
                  {jobs.map((job) => (
                    <td key={job.id} className="p-4">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-4 py-2 text-[10px] uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        Apply <ExternalLink size={10} />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/jobs"
            className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
          >
            &larr; Back to Jobs
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
