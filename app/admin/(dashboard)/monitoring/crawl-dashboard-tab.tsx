'use client'

import { useState } from 'react'
import { useCrawlStatus } from '@/hooks/use-crawl-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  FileWarning,
  Copy,
  Activity,
  ChevronDown,
  ChevronUp,
  Briefcase,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { CrawlSession, SourceHealth } from '@/types/crawl-status'

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '없음'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}분 ${s}초` : `${m}분`
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── 세션 카드 보더 색상 ──
function sessionBorderClass(session: CrawlSession): string {
  const total = session.successCount + session.failedCount
  if (session.failedCount === 0) return 'border-l-4 border-l-green-500'
  if (session.failedCount < total / 2) return 'border-l-4 border-l-orange-500'
  return 'border-l-4 border-l-red-500'
}

// ── 소스 헬스 상태 ──
function healthStatus(source: SourceHealth) {
  if (source.consecutiveFailures >= 3)
    return { icon: XCircle, color: 'text-red-500', label: '위험', badgeVariant: 'destructive' as const }
  if (source.consecutiveFailures >= 1)
    return { icon: AlertTriangle, color: 'text-yellow-500', label: '주의', badgeVariant: 'secondary' as const }
  return { icon: CheckCircle, color: 'text-green-500', label: '정상', badgeVariant: 'default' as const }
}

export function CrawlDashboardTab() {
  const { data, isLoading } = useCrawlStatus()

  if (isLoading) {
    return (
      <div className="space-y-6 mt-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 mt-4">
      <p className="text-xs text-muted-foreground">60초마다 자동 새로고침</p>

      {/* 섹션 1: 실행 히스토리 */}
      <RunHistorySection sessions={data.runHistory} />

      {/* 섹션 2: 소스별 헬스 */}
      <SourceHealthSection sources={data.sourceHealth} />

      {/* 섹션 3: 데이터 품질 */}
      <DataQualitySection quality={data.dataQuality} />
    </div>
  )
}

// ════════════════════════════════════════════
// 섹션 1: 실행 히스토리
// ════════════════════════════════════════════

function RunHistorySection({ sessions }: { sessions: CrawlSession[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 미니 바차트 데이터
  const chartData = [...sessions]
    .reverse()
    .map((s) => ({
      name: formatDateTime(s.startedAt),
      duration: s.duration,
      jobs: s.totalJobs,
    }))

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5" />
        실행 히스토리
      </h2>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            크롤링 기록이 없습니다
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 소요시간 트렌드 미니 차트 */}
          {chartData.length > 1 && (
            <Card className="mb-4">
              <CardContent className="pt-4 pb-2">
                <p className="text-xs text-muted-foreground mb-2">
                  실행 소요시간 트렌드 (초)
                </p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={40} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      formatter={(value, name) => [
                        name === 'duration' ? `${value}초` : `${value}건`,
                        name === 'duration' ? '소요시간' : '수집 건수',
                      ]}
                    />
                    <Bar dataKey="duration" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* 세션 카드 리스트 */}
          <div className="space-y-3">
            {sessions.map((session) => {
              const isExpanded = expandedId === session.sessionId
              const total = session.successCount + session.failedCount

              return (
                <Card
                  key={session.sessionId}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${sessionBorderClass(session)}`}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : session.sessionId)
                  }
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {formatDateTime(session.startedAt)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(session.duration)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">
                          {session.failedCount === 0 ? (
                            <span className="text-green-500 font-medium">
                              {session.successCount}/{total} 성공
                            </span>
                          ) : (
                            <span className="text-orange-500 font-medium">
                              {session.successCount}/{total} 성공
                            </span>
                          )}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {session.totalJobs}건
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                          {session.sources.map((src, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50"
                            >
                              {src.status === 'success' ? (
                                <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                              )}
                              <span className="truncate">{src.name}</span>
                              <span className="ml-auto text-muted-foreground">
                                {src.jobCount}건
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

// ════════════════════════════════════════════
// 섹션 2: 소스별 헬스
// ════════════════════════════════════════════

function SourceHealthSection({ sources }: { sources: SourceHealth[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Database className="h-5 w-5" />
        소스별 헬스
      </h2>

      {sources.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            소스 데이터가 없습니다
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sources.map((source) => {
            const status = healthStatus(source)
            const Icon = status.icon
            const diff = source.avgJobCount > 0
              ? Math.round(
                  ((source.lastJobCount - source.avgJobCount) / source.avgJobCount) * 100
                )
              : 0

            return (
              <Card key={source.name}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium truncate">
                      {source.name}
                    </CardTitle>
                    <Icon className={`h-4 w-4 shrink-0 ${status.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(source.lastCrawledAt)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">
                      {source.lastJobCount}
                    </span>
                    <Badge variant={status.badgeVariant} className="text-[10px]">
                      {status.label}
                    </Badge>
                  </div>
                  {source.avgJobCount > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      평균 {source.avgJobCount}건
                      {diff !== 0 && (
                        <span
                          className={
                            diff > 0 ? 'text-green-500 ml-1' : 'text-red-500 ml-1'
                          }
                        >
                          {diff > 0 ? '+' : ''}
                          {diff}%
                        </span>
                      )}
                    </p>
                  )}
                  {source.consecutiveFailures > 0 && (
                    <p className="text-[10px] text-red-400">
                      연속 {source.consecutiveFailures}회 실패
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ════════════════════════════════════════════
// 섹션 3: 데이터 품질
// ════════════════════════════════════════════

function DataQualitySection({
  quality,
}: {
  quality: { activeJobs: number; inactiveJobs: number; todayExpired: number; emptyDescription: number; duplicateCount: number }
}) {
  const cards = [
    {
      label: '활성 공고',
      value: quality.activeJobs,
      icon: Briefcase,
      color: 'text-green-500',
      desc: '현재 활성 상태',
    },
    {
      label: '비활성 공고',
      value: quality.inactiveJobs,
      icon: Database,
      color: 'text-muted-foreground',
      desc: '비활성 처리됨',
    },
    {
      label: '오늘 만료',
      value: quality.todayExpired,
      icon: Clock,
      color: 'text-orange-500',
      desc: '오늘 비활성 전환',
    },
    {
      label: '빈 Description',
      value: quality.emptyDescription,
      icon: FileWarning,
      color: quality.emptyDescription > 0 ? 'text-yellow-500' : 'text-muted-foreground',
      desc: '설명 누락',
    },
    {
      label: '중복 공고',
      value: quality.duplicateCount,
      icon: Copy,
      color: quality.duplicateCount > 0 ? 'text-red-400' : 'text-muted-foreground',
      desc: '동일 제목+회사',
    },
  ]

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        데이터 품질
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="pt-4 pb-4 px-4 flex flex-col items-center text-center gap-1">
                <Icon className={`h-6 w-6 ${card.color}`} />
                <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                <p className="text-sm font-medium">{card.label}</p>
                <p className="text-[10px] text-muted-foreground">{card.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
