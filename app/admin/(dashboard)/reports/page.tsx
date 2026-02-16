'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Report {
  id: string
  job_id: string
  reason: string
  details: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  created_at: string
  job?: {
    title: string
    company: string
    source: string
  }
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reports')
      if (!res.ok) throw new Error('Failed to fetch reports')
      const data = await res.json()
      setReports(data.reports)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const updateStatus = async (reportId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setReports(prev => prev.map(r =>
          r.id === reportId ? { ...r, status: status as Report['status'] } : r
        ))
      }
    } catch (error) {
      console.error('Failed to update report:', error)
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-800',
  }

  const statusLabels = {
    pending: '대기중',
    reviewed: '검토중',
    resolved: '해결됨',
    dismissed: '기각',
  }

  const pendingCount = reports.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            대시보드로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            신고 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            총 {reports.length}건의 신고
            {pendingCount > 0 && (
              <span className="text-yellow-600 ml-2">({pendingCount}건 대기중)</span>
            )}
          </p>
        </div>
        <Button onClick={fetchReports} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* Reports Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              신고가 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>공고</TableHead>
                  <TableHead>신고 사유</TableHead>
                  <TableHead>상세 내용</TableHead>
                  <TableHead>신고일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="font-medium line-clamp-1">
                          {report.job?.title || 'Unknown Job'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.job?.company} · {report.job?.source}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.reason}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-[200px] line-clamp-2">
                        {report.details || '-'}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[report.status]}`}>
                        {statusLabels[report.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Link
                          href={`/jobs/${report.job_id}`}
                          target="_blank"
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="공고 보기"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {report.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(report.id, 'resolved')}
                              className="p-1.5 hover:bg-green-100 rounded text-green-600"
                              title="해결됨"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateStatus(report.id, 'dismissed')}
                              className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                              title="기각"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
