'use client'

import { useCallback, useEffect, useState } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pin, PinOff, RefreshCw } from 'lucide-react'
import type { JobWithStatus } from '@/types/admin'

export default function FeaturedJobsPage() {
  const [jobs, setJobs] = useState<JobWithStatus[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pinLoading, setPinLoading] = useState<string | null>(null)
  const pageSize = 50

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    const res = await fetch(
      `/api/admin/jobs?status=active&page=${page}&pageSize=${pageSize}&sort=featured_score&order=desc`
    )
    const data = await res.json()
    // Sort: pinned first, then by score DESC
    const sorted = (data.jobs || []).sort((a: JobWithStatus, b: JobWithStatus) => {
      if (a.featured_pinned && !b.featured_pinned) return -1
      if (!a.featured_pinned && b.featured_pinned) return 1
      return (b.featured_score ?? 0) - (a.featured_score ?? 0)
    })
    setJobs(sorted)
    setTotal(data.total || 0)
    setLoading(false)
  }, [page])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/admin/jobs/featured/refresh', { method: 'POST' })
      await fetchJobs()
    } catch (err) {
      console.error('Failed to refresh featured:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleTogglePin = async (jobId: string, currentPinned: boolean) => {
    setPinLoading(jobId)
    try {
      await fetch('/api/admin/jobs/featured/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [jobId], pinned: !currentPinned }),
      })
      await fetchJobs()
    } catch (err) {
      console.error('Failed to toggle pin:', err)
    } finally {
      setPinLoading(null)
    }
  }

  const columns: Column<JobWithStatus>[] = [
    { key: 'title', header: '제목', sortable: true },
    { key: 'company', header: '회사', sortable: true },
    {
      key: 'featured_score',
      header: '점수',
      sortable: true,
      render: (job) => (
        <span className="font-mono font-semibold">
          {job.featured_score ?? 0}
        </span>
      ),
    },
    {
      key: 'featured_pinned',
      header: '고정',
      render: (job) =>
        job.featured_pinned ? (
          <Pin className="h-4 w-4 text-amber-500" />
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'is_featured' as any,
      header: '추천',
      render: (job) =>
        (job as any).is_featured ? (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            Featured
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'salary',
      header: '연봉',
      render: (job) => job.salary || '-',
    },
    {
      key: 'postedDate',
      header: '게시일',
      sortable: true,
      render: (job) =>
        job.postedDate
          ? new Date(job.postedDate).toLocaleDateString()
          : '-',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">추천 공고 관리</h1>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '새로고침 중...' : '점수 새로고침'}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : (
        <DataTable
          data={jobs}
          columns={columns}
          keyField="id"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          actions={(job) => (
            <Button
              size="sm"
              variant="ghost"
              disabled={pinLoading === job.id}
              onClick={() => handleTogglePin(job.id, job.featured_pinned)}
              title={job.featured_pinned ? '고정 해제' : '고정'}
            >
              {job.featured_pinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </Button>
          )}
        />
      )}
    </div>
  )
}
