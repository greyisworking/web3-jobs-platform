'use client'

import { useCallback, useEffect, useState } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BADGE_VALUES, BADGE_CONFIG, type BadgeValue } from '@/lib/badges'
import type { JobWithStatus } from '@/types/admin'

export default function PendingJobsPage() {
  const [jobs, setJobs] = useState<JobWithStatus[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<{
    open: boolean
    action: 'approve' | 'reject' | 'delete'
    ids: string[]
  }>({ open: false, action: 'approve', ids: [] })
  const [actionLoading, setActionLoading] = useState(false)
  const [showBadgeDialog, setShowBadgeDialog] = useState(false)
  const [selectedBadges, setSelectedBadges] = useState<Set<string>>(new Set())
  const [badgeAssigning, setBadgeAssigning] = useState(false)
  const pageSize = 20

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    const res = await fetch(
      `/api/admin/jobs?status=pending&page=${page}&pageSize=${pageSize}`
    )
    const data = await res.json()
    setJobs(data.jobs || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleAction = async () => {
    setActionLoading(true)
    const endpoint = `/api/admin/jobs/${dialog.action}`
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: dialog.ids }),
    })
    setActionLoading(false)
    setDialog({ ...dialog, open: false })
    setSelectedIds(new Set())
    fetchJobs()
  }

  const openDialog = (
    action: 'approve' | 'reject' | 'delete',
    ids: string[]
  ) => {
    setDialog({ open: true, action, ids })
  }

  const toggleBadge = (badge: string) => {
    setSelectedBadges((prev) => {
      const next = new Set(prev)
      if (next.has(badge)) {
        next.delete(badge)
      } else {
        next.add(badge)
      }
      return next
    })
  }

  const assignBadges = async () => {
    setBadgeAssigning(true)
    try {
      await fetch('/api/admin/jobs/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          badges: Array.from(selectedBadges),
        }),
      })
      setShowBadgeDialog(false)
      setSelectedIds(new Set())
      setSelectedBadges(new Set())
      fetchJobs()
    } catch (err) {
      console.error('Failed to assign badges:', err)
    } finally {
      setBadgeAssigning(false)
    }
  }

  const columns: Column<JobWithStatus>[] = [
    { key: 'title', header: 'Title', sortable: true },
    { key: 'company', header: 'Company', sortable: true },
    { key: 'location', header: 'Location' },
    {
      key: 'sector',
      header: 'Sector',
      render: (job) => job.sector || '-',
    },
    {
      key: 'backers',
      header: 'Backers',
      render: (job) =>
        job.backers && job.backers.length > 0
          ? job.backers.join(', ')
          : '-',
    },
    {
      key: 'badges',
      header: 'Badges',
      render: (job) =>
        job.badges && job.badges.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {job.badges.map((b) => {
              const config = BADGE_CONFIG[b as BadgeValue]
              return (
                <span
                  key={b}
                  className={`px-1.5 py-0.5 text-xs rounded-full ${config?.bg ?? 'bg-gray-100'} ${config?.text ?? 'text-gray-800'}`}
                >
                  {b}
                </span>
              )
            })}
          </div>
        ) : (
          '-'
        ),
    },
    {
      key: 'salary',
      header: 'Salary',
      render: (job) => job.salary || '-',
    },
    {
      key: 'source',
      header: 'Source',
      render: (job) => <Badge variant="secondary">{job.source}</Badge>,
    },
    {
      key: 'crawledAt',
      header: 'Crawled',
      sortable: true,
      render: (job) => new Date(job.crawledAt).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pending Jobs</h1>
        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBadgeDialog(true)}
            >
              Assign Badges ({selectedIds.size})
            </Button>
            <Button
              size="sm"
              onClick={() =>
                openDialog('approve', [...selectedIds])
              }
            >
              Approve ({selectedIds.size})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openDialog('reject', [...selectedIds])
              }
            >
              Reject ({selectedIds.size})
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                openDialog('delete', [...selectedIds])
              }
            >
              Delete ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          data={jobs}
          columns={columns}
          keyField="id"
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          actions={(job) => (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openDialog('approve', [job.id])}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openDialog('reject', [job.id])}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => openDialog('delete', [job.id])}
              >
                Delete
              </Button>
            </div>
          )}
        />
      )}

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog({ ...dialog, open })}
        title={`${dialog.action.charAt(0).toUpperCase() + dialog.action.slice(1)} Jobs`}
        description={`Are you sure you want to ${dialog.action} ${dialog.ids.length} job(s)?`}
        confirmLabel={
          dialog.action.charAt(0).toUpperCase() + dialog.action.slice(1)
        }
        variant={dialog.action === 'delete' ? 'destructive' : 'default'}
        onConfirm={handleAction}
        loading={actionLoading}
      />

      {/* Badge Assignment Dialog */}
      {showBadgeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Assign Badges
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Assigning to {selectedIds.size} job{selectedIds.size !== 1 ? 's' : ''}
            </p>
            <div className="space-y-3">
              {BADGE_VALUES.map((badge) => {
                const config = BADGE_CONFIG[badge]
                return (
                  <label
                    key={badge}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBadges.has(badge)}
                      onChange={() => toggleBadge(badge)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
                    >
                      {badge}
                    </span>
                  </label>
                )
              })}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBadgeDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={assignBadges}
                disabled={badgeAssigning}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition"
              >
                {badgeAssigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
