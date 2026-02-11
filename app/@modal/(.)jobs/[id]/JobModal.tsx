'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { X, MapPin, Briefcase, Clock, ExternalLink, Bookmark } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Job } from '@/types/job'
import GlowBadge from '@/app/components/GlowBadge'

interface JobModalProps {
  job: Job
}

export default function JobModal({ job }: JobModalProps) {
  const router = useRouter()

  const handleClose = useCallback(() => {
    router.back()
  }, [router])

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const logoUrl = `https://logo.clearbit.com/${encodeURIComponent(
    job.company.toLowerCase().replace(/\s+/g, '')
  )}.com`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-a24-bg dark:bg-a24-dark-bg border border-a24-border dark:border-a24-dark-border shadow-xl"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <img
                src={logoUrl}
                alt={job.company}
                className="w-14 h-14 rounded-lg object-contain bg-white border border-a24-border dark:border-a24-dark-border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-a24-text dark:text-a24-dark-text mb-1 pr-8">
                  {job.title}
                </h2>
                <p className="text-a24-muted dark:text-a24-dark-muted">
                  {job.company}
                </p>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 mb-6">
              {job.location && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-a24-surface dark:bg-a24-dark-surface text-a24-muted dark:text-a24-dark-muted">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location}
                </span>
              )}
              {job.type && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-a24-surface dark:bg-a24-dark-surface text-a24-muted dark:text-a24-dark-muted">
                  <Briefcase className="w-3.5 h-3.5" />
                  {job.type}
                </span>
              )}
              {job.postedDate && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-a24-surface dark:bg-a24-dark-surface text-a24-muted dark:text-a24-dark-muted">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(job.postedDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* VC Backers */}
            {job.backers && job.backers.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider mb-2">
                  Backed by
                </p>
                <div className="flex flex-wrap gap-2">
                  {job.backers.map((backer) => (
                    <GlowBadge key={backer} name={backer} />
                  ))}
                </div>
              </div>
            )}

            {/* Description preview */}
            {job.description && (
              <div className="mb-6">
                <p className="text-sm text-a24-text dark:text-a24-dark-text leading-relaxed line-clamp-6">
                  {job.description.replace(/<[^>]*>/g, '').slice(0, 500)}
                  {job.description.length > 500 && '...'}
                </p>
              </div>
            )}

            {/* Salary */}
            {job.salary && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  {job.salary}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-a24-border dark:border-a24-dark-border">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg hover:opacity-90 transition-opacity"
              >
                Apply Now
                <ExternalLink className="w-4 h-4" />
              </a>
              <button className="p-3 border border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>

            {/* View full page link */}
            <div className="mt-4 text-center">
              <a
                href={`/jobs/${job.id}`}
                className="text-xs text-a24-muted dark:text-a24-dark-muted hover:text-neun-primary transition-colors"
              >
                View full job posting →
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
