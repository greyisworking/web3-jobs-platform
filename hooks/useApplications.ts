'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

export type ApplicationStatus =
  | 'interested'
  | 'applied'
  | 'phone_screen'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export interface JobApplication {
  id: string
  job_id: string
  status: ApplicationStatus
  notes: string | null
  applied_at: string | null
  next_step: string | null
  next_step_date: string | null
  created_at: string
  updated_at: string
  job?: {
    id: string
    title: string
    company: string
    location: string
    url: string
  }
}

export function useApplications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApplications = useCallback(async () => {
    if (!user) {
      setApplications([])
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/applications')
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      setApplications(data.applications || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const trackApplication = useCallback(async (
    jobId: string,
    status: ApplicationStatus,
    options?: {
      notes?: string
      nextStep?: string
      nextStepDate?: string
    }
  ) => {
    if (!user) return null

    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({
          jobId,
          status,
          notes: options?.notes,
          nextStep: options?.nextStep,
          nextStepDate: options?.nextStepDate,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Refresh applications list
      await fetchApplications()

      return data.application
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track application')
      return null
    }
  }, [user, fetchApplications])

  const removeApplication = useCallback(async (jobId: string) => {
    if (!user) return false

    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content

      const res = await fetch(`/api/applications?jobId=${jobId}`, {
        method: 'DELETE',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Remove from local state
      setApplications(prev => prev.filter(a => a.job_id !== jobId))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove application')
      return false
    }
  }, [user])

  const getApplicationStatus = useCallback((jobId: string) => {
    return applications.find(a => a.job_id === jobId)
  }, [applications])

  return {
    applications,
    loading,
    error,
    trackApplication,
    removeApplication,
    getApplicationStatus,
    refreshApplications: fetchApplications,
  }
}

// Status labels and colors
export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; emoji: string }> = {
  interested: { label: 'Interested', color: 'gray', emoji: '👀' },
  applied: { label: 'Applied', color: 'blue', emoji: '📤' },
  phone_screen: { label: 'Phone Screen', color: 'purple', emoji: '📞' },
  interview: { label: 'Interview', color: 'yellow', emoji: '💼' },
  offer: { label: 'Offer', color: 'green', emoji: '🎉' },
  accepted: { label: 'Accepted', color: 'emerald', emoji: '✅' },
  rejected: { label: 'Rejected', color: 'red', emoji: '❌' },
  withdrawn: { label: 'Withdrawn', color: 'gray', emoji: '🚫' },
}
