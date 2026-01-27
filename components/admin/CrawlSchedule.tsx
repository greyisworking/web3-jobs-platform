'use client'

import { useMemo } from 'react'
import { Clock, CalendarClock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCrawlHistory } from '@/hooks/use-crawl-history'

function getNextRunTimes(count: number): Date[] {
  // Cron: 0 */3 * * * (every 3 hours at minute 0)
  const now = new Date()
  const times: Date[] = []
  const next = new Date(now)
  next.setMinutes(0, 0, 0)

  // Advance to next 3-hour boundary
  const currentHour = next.getHours()
  const nextHour = Math.ceil((currentHour + 1) / 3) * 3
  next.setHours(nextHour)

  if (next <= now) {
    next.setHours(next.getHours() + 3)
  }

  for (let i = 0; i < count; i++) {
    times.push(new Date(next))
    next.setHours(next.getHours() + 3)
  }

  return times
}

export function CrawlSchedule() {
  const { runs } = useCrawlHistory(1, 1)
  const lastRun = runs.length > 0 ? runs[0] : null

  const nextRuns = useMemo(() => getNextRunTimes(5), [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Crawl Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Every 3 hours</span>
          <span className="text-muted-foreground">(cron: 0 */3 * * *)</span>
        </div>

        {lastRun && (
          <div className="text-sm">
            <span className="text-muted-foreground">Last run: </span>
            <span className="font-medium">
              {new Date(lastRun.started_at).toLocaleString()}
            </span>
            <span
              className={
                lastRun.status === 'completed'
                  ? ' text-green-600'
                  : lastRun.status === 'failed'
                    ? ' text-destructive'
                    : ' text-yellow-500'
              }
            >
              {' '}
              ({lastRun.status})
            </span>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Next 5 Scheduled Runs (UTC)
          </p>
          <ul className="space-y-1">
            {nextRuns.map((time, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                {time.toLocaleString()} (UTC{' '}
                {time.toISOString().substring(11, 16)})
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
