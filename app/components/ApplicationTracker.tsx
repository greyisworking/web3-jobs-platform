'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useApplications, APPLICATION_STATUS_CONFIG, type ApplicationStatus } from '@/hooks/useApplications'
import { ChevronDown, Check, Briefcase, X } from 'lucide-react'
import { toast } from 'sonner'

interface ApplicationTrackerProps {
  jobId: string
  jobTitle: string
  company: string
}

const STATUS_ORDER: ApplicationStatus[] = [
  'interested',
  'applied',
  'phone_screen',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
]

export default function ApplicationTracker({ jobId, jobTitle, company }: ApplicationTrackerProps) {
  const { applications, trackApplication, removeApplication, loading } = useApplications()
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const currentApp = applications.find(app => app.job_id === jobId)
  const currentStatus = currentApp?.status

  const handleStatusChange = async (status: ApplicationStatus) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please log in to track applications')
      router.push('/login')
      return
    }

    const result = await trackApplication(jobId, status, { notes: notes || undefined })
    if (result) {
      toast.success(`Status updated to ${APPLICATION_STATUS_CONFIG[status].label}`)
      setIsOpen(false)
      setNotes('')
      setShowNotes(false)
    }
  }

  const handleRemove = async () => {
    const success = await removeApplication(jobId)
    if (success) {
      toast.success('Application removed from tracker')
    }
  }

  if (loading) {
    return (
      <div className="p-4 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted">
          Track Application
        </span>

        {currentStatus ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition-colors ${
                ['offer', 'accepted'].includes(currentStatus)
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : ['rejected', 'withdrawn'].includes(currentStatus)
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              }`}
            >
              {APPLICATION_STATUS_CONFIG[currentStatus]?.emoji}{' '}
              {APPLICATION_STATUS_CONFIG[currentStatus]?.label}
              <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={handleRemove}
              className="p-1.5 text-a24-muted dark:text-a24-dark-muted hover:text-red-500 transition-colors"
              title="Remove from tracker"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <Briefcase size={12} />
            Track
            <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Status Dropdown */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-a24-border dark:border-a24-dark-border">
          <div className="grid grid-cols-2 gap-2">
            {STATUS_ORDER.map((status) => {
              const config = APPLICATION_STATUS_CONFIG[status]
              const isSelected = currentStatus === status

              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`flex items-center gap-2 px-3 py-2 text-left text-[10px] uppercase tracking-[0.1em] transition-colors border ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-a24-border dark:border-a24-dark-border hover:border-emerald-500/50 text-a24-text dark:text-a24-dark-text'
                  }`}
                >
                  <span>{config.emoji}</span>
                  <span>{config.label}</span>
                  {isSelected && <Check size={10} className="ml-auto" />}
                </button>
              )
            })}
          </div>

          {/* Notes toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="mt-3 text-[10px] uppercase tracking-[0.15em] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
          >
            {showNotes ? '- Hide notes' : '+ Add notes'}
          </button>

          {showNotes && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this application..."
              className="mt-2 w-full px-3 py-2 text-sm bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-emerald-500 focus:outline-none resize-none"
              rows={3}
            />
          )}
        </div>
      )}

      {/* Show current notes if exists */}
      {currentApp?.notes && !isOpen && (
        <p className="mt-2 text-[11px] text-a24-muted dark:text-a24-dark-muted italic truncate">
          {currentApp.notes}
        </p>
      )}
    </div>
  )
}
