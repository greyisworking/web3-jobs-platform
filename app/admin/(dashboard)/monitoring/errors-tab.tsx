'use client'

import { useState } from 'react'
import { useErrorLogs } from '@/hooks/use-error-logs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { ErrorLevel, ErrorLog } from '@/types/monitoring'

const levelColors: Record<ErrorLevel, string> = {
  CRITICAL: 'bg-red-600 text-white hover:bg-red-700',
  ERROR: 'bg-orange-500 text-white hover:bg-orange-600',
  WARN: 'bg-yellow-500 text-black hover:bg-yellow-600',
  INFO: 'bg-blue-500 text-white hover:bg-blue-600',
}

export function MonitoringErrorsTab() {
  const [level, setLevel] = useState<string>('all')
  const [keyword, setKeyword] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const pageSize = 30

  const { logs, total, isLoading } = useErrorLogs({
    level: level === 'all' ? undefined : (level as ErrorLevel),
    keyword: keyword || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    pageSize,
  })

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Select value={level} onValueChange={(v) => { setLevel(v); setPage(1) }}>
            <SelectTrigger>
              <SelectValue placeholder="심각도" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="CRITICAL">심각</SelectItem>
              <SelectItem value="ERROR">오류</SelectItem>
              <SelectItem value="WARN">경고</SelectItem>
              <SelectItem value="INFO">정보</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="키워드 검색..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          className="w-60"
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="w-40"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="w-40"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        30초마다 자동 새로고침
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">시간</TableHead>
                  <TableHead className="w-24">레벨</TableHead>
                  <TableHead className="w-32">크롤러</TableHead>
                  <TableHead>메시지</TableHead>
                  <TableHead className="w-20">상세</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      오류 기록 없음
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: ErrorLog) => (
                    <>
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={levelColors[log.level]}>
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.crawler_name || '-'}
                        </TableCell>
                        <TableCell className="text-sm max-w-md truncate">
                          {log.message}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedId(
                                expandedId === log.id ? null : log.id
                              )
                            }
                          >
                            {expandedId === log.id ? '숨김' : '보기'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedId === log.id && (
                        <TableRow key={`${log.id}-trace`}>
                          <TableCell colSpan={5} className="bg-muted">
                            <div className="p-2 space-y-2">
                              {log.url && (
                                <p className="text-xs"><strong>URL:</strong> {log.url}</p>
                              )}
                              {log.status_code && (
                                <p className="text-xs"><strong>Status:</strong> {log.status_code}</p>
                              )}
                              {log.error_type && (
                                <p className="text-xs"><strong>Type:</strong> {log.error_type}</p>
                              )}
                              {log.stack_trace && (
                                <pre className="text-xs whitespace-pre-wrap font-mono mt-2 max-h-60 overflow-auto border p-2 rounded">
                                  {log.stack_trace}
                                </pre>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {page} / {totalPages} 페이지 (총 {total}개)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
