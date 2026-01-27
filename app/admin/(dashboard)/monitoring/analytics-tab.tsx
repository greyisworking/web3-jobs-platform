'use client'

import { useState } from 'react'
import { useSearchAnalytics } from '@/hooks/use-search-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, TrendingUp, Code } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function MonitoringAnalyticsTab() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useSearchAnalytics(
    dateFrom || undefined,
    dateTo || undefined
  )

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-3 items-center">
        <span className="text-sm text-muted-foreground">Date range:</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
        />
        <span className="text-sm text-muted-foreground">
          {data.totalSearches} searches
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Top 10 Search Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topQueries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No search data yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={data.topQueries}
                    layout="vertical"
                    margin={{ left: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={11} />
                    <YAxis
                      type="category"
                      dataKey="query"
                      fontSize={11}
                      width={75}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Search Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.trends.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No trend data yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4" />
                Popular Tech Stacks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.techStacks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No tech stack data yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.techStacks.map((tech) => (
                    <Badge
                      key={tech.query}
                      variant="secondary"
                      className="text-sm py-1 px-3"
                    >
                      {tech.query}{' '}
                      <span className="ml-1 text-muted-foreground">
                        ({tech.count})
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
