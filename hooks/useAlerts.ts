'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

export type AlertFrequency = 'daily' | 'weekly' | 'instant'

export interface JobAlert {
  id: string
  email: string
  keywords: string[] | null
  categories: string[] | null
  regions: string[] | null
  min_salary: number | null
  frequency: AlertFrequency
  is_active: boolean
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

export function useAlerts() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<JobAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([])
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/alerts')
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      setAlerts(data.alerts || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const createAlert = useCallback(async (options: {
    keywords?: string[]
    categories?: string[]
    regions?: string[]
    minSalary?: number
    frequency?: AlertFrequency
  }) => {
    if (!user) return null

    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(options),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Add to local state
      setAlerts(prev => [data.alert, ...prev])

      return data.alert
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert')
      return null
    }
  }, [user])

  const updateAlert = useCallback(async (id: string, updates: Partial<{
    keywords: string[]
    categories: string[]
    regions: string[]
    minSalary: number
    frequency: AlertFrequency
    isActive: boolean
  }>) => {
    if (!user) return null

    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content

      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({ id, ...updates }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Update local state
      setAlerts(prev => prev.map(a => a.id === id ? data.alert : a))

      return data.alert
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert')
      return null
    }
  }, [user])

  const deleteAlert = useCallback(async (id: string) => {
    if (!user) return false

    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content

      const res = await fetch(`/api/alerts?id=${id}`, {
        method: 'DELETE',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Remove from local state
      setAlerts(prev => prev.filter(a => a.id !== id))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert')
      return false
    }
  }, [user])

  return {
    alerts,
    loading,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
    refreshAlerts: fetchAlerts,
  }
}
