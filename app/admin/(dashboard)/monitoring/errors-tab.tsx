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
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="WARN">Warning</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Search keyword..."
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
        Auto-refreshes every 30 seconds
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
                  <TableHead className="w-44">Timestamp</TableHead>
                  <TableHead className="w-24">Level</TableHead>
                  <TableHead className="w-32">Crawler</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-20">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No error logs found
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
                          {log.stack_trace && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedId(
                                  expandedId === log.id ? null : log.id
                                )
                              }
                            >
                              {expandedId === log.id ? 'Hide' : 'Show'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedId === log.id && log.stack_trace && (
                        <TableRow key={`${log.id}-trace`}>
                          <TableCell colSpan={5} className="bg-muted">
                            <pre className="text-xs whitespace-pre-wrap font-mono p-2 max-h-60 overflow-auto">
                              {log.stack_trace}
                            </pre>
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
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
