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

export default function AnalyticsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useSearchAnalytics(
    dateFrom || undefined,
    dateTo || undefined
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">검색 통계</h1>

      {/* Date Range Filter */}
      <div className="flex gap-3 items-center">
        <span className="text-sm text-muted-foreground">기간:</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
        />
        <span className="text-sm text-muted-foreground">~</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
        />
        <span className="text-sm text-muted-foreground">
          총 {data.totalSearches}회 검색
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
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
          {/* Top 10 Search Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                인기 검색어 Top 10
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topQueries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  검색 데이터 없음
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
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

          {/* Search Trends Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                검색 트렌드
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.trends.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  트렌드 데이터 없음
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
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

          {/* Popular Tech Stacks */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4" />
                인기 기술 스택 (검색어 기반)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.techStacks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  기술 스택 데이터 없음
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
