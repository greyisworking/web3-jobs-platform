'use client'

import { useCallback, useEffect, useState } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ErrorLog } from '@/types/admin'

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [sources, setSources] = useState<string[]>([])
  const pageSize = 50

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (sourceFilter !== 'all') params.set('source', sourceFilter)

    const res = await fetch(`/api/admin/errors?${params}`)
    const data = await res.json()
    setLogs(data.logs || [])
    setTotal(data.total || 0)

    // Extract unique sources for filter
    if (sources.length === 0 && data.logs) {
      const unique = [...new Set(data.logs.map((l: ErrorLog) => l.source))] as string[]
      setSources(unique)
    }

    setLoading(false)
  }, [page, statusFilter, sourceFilter, sources.length])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, sourceFilter])

  const columns: Column<ErrorLog>[] = [
    {
      key: 'createdAt',
      header: '시간',
      sortable: true,
      render: (log) => new Date(log.createdAt).toLocaleString(),
    },
    {
      key: 'status',
      header: '상태',
      render: (log) => (
        <Badge variant={log.status === 'failed' ? 'destructive' : 'secondary'}>
          {log.status === 'failed' ? '실패' : log.status}
        </Badge>
      ),
    },
    { key: 'source', header: '크롤러', sortable: true },
    {
      key: 'jobCount',
      header: '공고 수',
      render: (log) => String(log.jobCount),
    },
    {
      key: 'error',
      header: '오류 메시지',
      render: (log) =>
        log.error ? (
          <span className="text-sm text-destructive truncate max-w-xs block">
            {log.error.substring(0, 100)}
            {log.error.length > 100 ? '...' : ''}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">오류 기록</h1>

      <div className="flex gap-4">
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="failed">실패</SelectItem>
              <SelectItem value="success">성공</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="크롤러 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 크롤러</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : (
        <DataTable
          data={logs}
          columns={columns}
          keyField="id"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
