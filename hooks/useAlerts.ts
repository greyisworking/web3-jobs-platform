'use client'

import { useState, useCallback, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

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
  const [, setUser] = useState<unknown>(null)
  const [alerts, setAlerts] = useState<JobAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  // Fetch user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase.auth])

  const fetchAlerts = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
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
  }, [supabase.auth])

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
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return null

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
  }, [supabase.auth])

  const updateAlert = useCallback(async (id: string, updates: Partial<{
    keywords: string[]
    categories: string[]
    regions: string[]
    minSalary: number
    frequency: AlertFrequency
    isActive: boolean
  }>) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return null

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
  }, [supabase.auth])

  const deleteAlert = useCallback(async (id: string) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return false

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
  }, [supabase.auth])

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
