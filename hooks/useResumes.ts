'use client'

import useSWR from 'swr'
import { toast } from 'sonner'

interface Resume {
  name: string
  size: number
  created_at: string
  url: string | null
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export function useResumes() {
  const { data, error, isLoading, mutate } = useSWR<{ resumes: Resume[] }>(
    '/api/resume',
    fetcher
  )

  const uploadResume = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to upload')
      }

      toast.success('Resume uploaded successfully')
      mutate()
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload resume')
      return false
    }
  }

  const deleteResume = async (filename: string) => {
    try {
      const res = await fetch('/api/resume', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })

      if (!res.ok) {
        throw new Error('Failed to delete')
      }

      toast.success('Resume deleted')
      mutate()
      return true
    } catch {
      toast.error('Failed to delete resume')
      return false
    }
  }

  return {
    resumes: data?.resumes ?? [],
    isLoading,
    isError: !!error,
    uploadResume,
    deleteResume,
    mutate,
  }
}
