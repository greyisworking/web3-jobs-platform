'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import type { DuplicateGroup, JobWithStatus } from '@/types/admin'

export default function DuplicatesPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [mergeDialog, setMergeDialog] = useState<{
    open: boolean
    keepId: string
    deleteIds: string[]
    groupKey: string
  }>({ open: false, keepId: '', deleteIds: [], groupKey: '' })
  const [markDialog, setMarkDialog] = useState<{
    open: boolean
    ids: string[]
    groupKey: string
  }>({ open: false, ids: [], groupKey: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchDuplicates = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/jobs/duplicates')
    const data = await res.json()
    setGroups(data.groups || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDuplicates()
  }, [])

  const handleMerge = async () => {
    setActionLoading(true)
    await fetch('/api/admin/jobs/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keepId: mergeDialog.keepId,
        deleteIds: mergeDialog.deleteIds,
      }),
    })
    setActionLoading(false)
    setMergeDialog({ open: false, keepId: '', deleteIds: [], groupKey: '' })
    fetchDuplicates()
  }

  const handleMarkDifferent = async () => {
    setActionLoading(true)
    // Approve all to mark them as different / reviewed
    await fetch('/api/admin/jobs/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: markDialog.ids }),
    })
    setActionLoading(false)
    setMarkDialog({ open: false, ids: [], groupKey: '' })
    fetchDuplicates()
  }

  const openMergeDialog = (
    keepJob: JobWithStatus,
    group: DuplicateGroup
  ) => {
    setMergeDialog({
      open: true,
      keepId: keepJob.id,
      deleteIds: group.jobs.filter((j) => j.id !== keepJob.id).map((j) => j.id),
      groupKey: group.key,
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">중복 감지</h1>
        <p className="text-muted-foreground">중복 공고 검색 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">중복 감지</h1>
      <p className="text-sm text-muted-foreground">
        {groups.length}개의 중복 그룹 발견
      </p>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            중복 공고 없음
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.key}>
            <CardHeader
              className=""
              onClick={() =>
                setExpandedGroup(
                  expandedGroup === group.key ? null : group.key
                )
              }
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {group.jobs[0].company} - {group.jobs.length}개 유사 공고
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {group.similarity}% 유사
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {expandedGroup === group.key ? '[-]' : '[+]'}
                  </span>
                </div>
              </div>
            </CardHeader>
            {expandedGroup === group.key && (
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {group.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border rounded-md p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.company} - {job.location}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Source: {job.source} | URL:{' '}
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              {job.url.substring(0, 50)}...
                            </a>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => openMergeDialog(job, group)}
                        >
                          선택
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMarkDialog({
                        open: true,
                        ids: group.jobs.map((j) => j.id),
                        groupKey: group.key,
                      })
                    }
                  >
                    다른 공고로 표시
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))
      )}

      <ConfirmDialog
        open={mergeDialog.open}
        onOpenChange={(open) => setMergeDialog({ ...mergeDialog, open })}
        title="중복 병합"
        description={`선택한 공고를 유지하고 ${mergeDialog.deleteIds.length}개 중복 공고를 삭제합니다. 태그는 병합됩니다.`}
        confirmLabel="병합"
        onConfirm={handleMerge}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={markDialog.open}
        onOpenChange={(open) => setMarkDialog({ ...markDialog, open })}
        title="다른 공고로 표시"
        description="이 그룹의 모든 공고를 중복이 아닌 것으로 승인합니다."
        confirmLabel="확인"
        onConfirm={handleMarkDifferent}
        loading={actionLoading}
      />
    </div>
  )
}
