'use client'

import { useCallback, useEffect, useState } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  const columns: Column<JobWithStatus>[] = [
    { key: 'title', header: 'Title', sortable: true },
    { key: 'company', header: 'Company', sortable: true },
    { key: 'location', header: 'Location' },
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
    </div>
  )
}
