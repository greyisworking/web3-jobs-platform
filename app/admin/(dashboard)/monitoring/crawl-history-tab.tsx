'use client'

import { useState } from 'react'
import { useCrawlHistory } from '@/hooks/use-crawl-history'
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
import { Skeleton } from '@/components/ui/skeleton'
import type { CrawlRun, CrawlRunStatus } from '@/types/monitoring'

const statusVariant: Record<CrawlRunStatus, 'default' | 'secondary' | 'destructive'> = {
  completed: 'default',
  running: 'secondary',
  failed: 'destructive',
}

export function MonitoringCrawlHistoryTab() {
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { runs, total, isLoading } = useCrawlHistory(page, pageSize)
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4 mt-4">
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
                  <TableHead className="w-44">Started At</TableHead>
                  <TableHead className="w-44">Completed At</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-32">Crawler</TableHead>
                  <TableHead className="w-24">Found</TableHead>
                  <TableHead className="w-24">Saved</TableHead>
                  <TableHead className="w-24">Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No crawl runs recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((run: CrawlRun) => (
                    <TableRow key={run.id}>
                      <TableCell className="text-xs">
                        {new Date(run.started_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {run.completed_at
                          ? new Date(run.completed_at).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[run.status]}>
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {run.crawler_name || 'all'}
                      </TableCell>
                      <TableCell className="text-sm">{run.jobs_found}</TableCell>
                      <TableCell className="text-sm">{run.jobs_saved}</TableCell>
                      <TableCell className="text-sm">
                        {run.errors_count > 0 ? (
                          <span className="text-destructive font-medium">
                            {run.errors_count}
                          </span>
                        ) : (
                          '0'
                        )}
                      </TableCell>
                    </TableRow>
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
