'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Briefcase,
  Users,
  Bookmark,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
} from 'lucide-react'

interface MetricsData {
  wig: {
    target: number
    deadline: string
    current: number
    progress: number
    trend: number
    chartData: { date: string; clicks: number }[]
    weeklyData: { week: string; clicks: number }[]
  }
  leadMeasures: {
    crawler: {
      totalJobs: number
      activeJobs: number
      todayNewJobs: number
      targetJobs: number
      sources: { source: string; count: number }[]
    }
    users: {
      bookmarks: number
      reports: number
    }
    traffic: {
      dailyVisitors: number | null
      weeklyVisitors: number | null
    }
    marketing: {
      twitterFollowers: number | null
    }
  }
  lastUpdated: string
}

interface CrawlerQualitySource {
  source: string
  total: number
  // Basic info
  titleSuccessRate: number
  companySuccessRate: number
  locationRate: number
  // JD quality
  jdSuccessRate: number
  avgJdLength: number
  shortJdRate: number
  htmlErrorRate: number
  // Metadata
  salaryRate: number
  employmentTypeRate: number
  skillsRate: number
  // Links
  applyUrlRate: number
  // Staleness
  oldJobsRate: number
  oldJobs: number
  // Overall
  qualityScore: number
}

interface CrawlerQualityData {
  sources: CrawlerQualitySource[]
  summary: {
    totalJobs: number
    totalSources: number
    sourcesAt90Plus: number
    // Basic info
    titleSuccessRate: number
    companySuccessRate: number
    locationRate: number
    // JD quality
    jdSuccessRate: number
    htmlErrorRate: number
    // Metadata
    salaryRate: number
    employmentTypeRate: number
    skillsRate: number
    // Links
    applyUrlRate: number
    // Staleness
    oldJobsRate: number
    oldJobs: number
    // Overall
    qualityScore: number
  }
  lastUpdated: string
}

type ScoreStatus = 'green' | 'yellow' | 'red'
type TrendDirection = 'up' | 'down' | 'neutral'

function getScoreStatus(value: number, target: number, thresholds = { yellow: 0.7, green: 0.9 }): ScoreStatus {
  const ratio = value / target
  if (ratio >= thresholds.green) return 'green'
  if (ratio >= thresholds.yellow) return 'yellow'
  return 'red'
}

function getTrendDirection(trend: number): TrendDirection {
  if (trend > 5) return 'up'
  if (trend < -5) return 'down'
  return 'neutral'
}

function TrendIcon({ direction }: { direction: TrendDirection }) {
  switch (direction) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-500" />
    default:
      return <Minus className="w-4 h-4 text-gray-400" />
  }
}

function StatusBadge({ status }: { status: ScoreStatus }) {
  const colors = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  }
  const labels = {
    green: '목표 달성',
    yellow: '주의',
    red: '미달',
  }
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

function ScoreCard({
  title,
  value,
  target,
  unit = '',
  icon: Icon,
  description,
  trend,
  href,
}: {
  title: string
  value: number
  target?: number
  unit?: string
  icon: any
  description?: string
  trend?: number
  href?: string
}) {
  const status = target ? getScoreStatus(value, target) : 'green'
  const trendDirection = trend !== undefined ? getTrendDirection(trend) : 'neutral'

  const bgColors = {
    green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
  }

  const Wrapper = href ? 'a' : 'div'
  const wrapperProps = href ? { href, className: 'block cursor-pointer' } : {}

  return (
    <Wrapper {...wrapperProps}>
      <Card className={`${bgColors[status]} border-2 transition-all hover:shadow-md ${href ? 'hover:scale-[1.02] cursor-pointer' : ''}`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${status === 'green' ? 'bg-green-100 dark:bg-green-900' : status === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-red-100 dark:bg-red-900'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            {trend !== undefined && <TrendIcon direction={trendDirection} />}
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold">
              {value.toLocaleString()}{unit}
            </span>
            {target && (
              <span className="text-sm text-muted-foreground ml-2">
                / {target.toLocaleString()}{unit}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {target && (
            <div className="mt-2">
              <Progress value={(value / target) * 100} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </Wrapper>
  )
}

function MiniChart({ data }: { data: { date: string; clicks: number }[] }) {
  const maxClicks = Math.max(...data.map((d) => d.clicks), 1)
  const last7Days = data.slice(-7)

  return (
    <div className="flex items-end gap-1 h-16">
      {last7Days.map((d, i) => (
        <div
          key={d.date}
          className="flex-1 bg-neun-primary/20 hover:bg-neun-primary/40 transition-colors rounded-t cursor-pointer relative group"
          style={{ height: `${(d.clicks / maxClicks) * 100}%`, minHeight: '4px' }}
        >
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {d.date.slice(5)}: {d.clicks}
          </div>
        </div>
      ))}
    </div>
  )
}

function FullChart({ data }: { data: { date: string; clicks: number }[] }) {
  const maxClicks = Math.max(...data.map((d) => d.clicks), 1)
  const last14Days = data.slice(-14)

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-32">
        {last14Days.map((d) => (
          <div
            key={d.date}
            className="flex-1 bg-neun-primary/30 hover:bg-neun-primary/50 transition-colors rounded-t cursor-pointer relative group"
            style={{ height: `${(d.clicks / maxClicks) * 100}%`, minHeight: '4px' }}
          >
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {d.date.slice(5)}: {d.clicks}회
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{last14Days[0]?.date.slice(5)}</span>
        <span>{last14Days[last14Days.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  )
}

export function Dashboard4DX() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [crawlerQuality, setCrawlerQuality] = useState<CrawlerQualityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const [metricsRes, qualityRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/crawler-quality'),
      ])

      if (!metricsRes.ok) throw new Error('Failed to fetch metrics')
      const metricsData = await metricsRes.json()
      setMetrics(metricsData)

      if (qualityRes.ok) {
        const qualityData = await qualityRes.json()
        setCrawlerQuality(qualityData)
      }

      setError(null)
    } catch (err) {
      setError('메트릭을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchMetrics} variant="outline">
          다시 시도
        </Button>
      </div>
    )
  }

  if (!metrics) return null

  const wigStatus = getScoreStatus(metrics.wig.current, metrics.wig.target)
  const jobsStatus = getScoreStatus(metrics.leadMeasures.crawler.activeJobs, metrics.leadMeasures.crawler.targetJobs)
  const daysRemaining = Math.ceil(
    (new Date(metrics.wig.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const dailyRequired = Math.ceil(
    (metrics.wig.target - metrics.wig.current) / Math.max(daysRemaining, 1)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-neun-primary" />
            4DX 성과 대시보드
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            마지막 업데이트: {new Date(metrics.lastUpdated).toLocaleString('ko-KR')}
          </p>
        </div>
        <Button onClick={fetchMetrics} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* WIG Section - Crawler Quality 90+ by Feb 28 */}
      {crawlerQuality && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-2 border-neun-primary/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-neun-primary" />
                    WIG (최중요 목표)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    2월 28일까지 모든 크롤러 품질 점수 90점 이상
                  </CardDescription>
                </div>
                <StatusBadge status={crawlerQuality.summary.sourcesAt90Plus === crawlerQuality.summary.totalSources ? 'green' : crawlerQuality.summary.sourcesAt90Plus >= crawlerQuality.summary.totalSources * 0.7 ? 'yellow' : 'red'} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-bold text-neun-primary">
                    {crawlerQuality.summary.sourcesAt90Plus}
                  </span>
                  <span className="text-2xl text-muted-foreground">
                    / {crawlerQuality.summary.totalSources}개 크롤러
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className={`text-lg font-bold ${crawlerQuality.summary.qualityScore >= 90 ? 'text-green-600' : crawlerQuality.summary.qualityScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      평균 {crawlerQuality.summary.qualityScore}점
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>90점 이상 달성률</span>
                    <span className="font-medium">
                      {crawlerQuality.summary.totalSources > 0
                        ? Math.round((crawlerQuality.summary.sourcesAt90Plus / crawlerQuality.summary.totalSources) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={crawlerQuality.summary.totalSources > 0
                      ? (crawlerQuality.summary.sourcesAt90Plus / crawlerQuality.summary.totalSources) * 100
                      : 0}
                    className="h-3"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {Math.ceil((new Date('2026-02-28').getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                    </p>
                    <p className="text-xs text-muted-foreground">남은 일수</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {crawlerQuality.summary.totalSources - crawlerQuality.summary.sourcesAt90Plus}
                    </p>
                    <p className="text-xs text-muted-foreground">개선 필요</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.qualityScore >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {90 - crawlerQuality.summary.qualityScore > 0 ? `+${90 - crawlerQuality.summary.qualityScore}` : '달성!'}
                    </p>
                    <p className="text-xs text-muted-foreground">목표 점수까지</p>
                  </div>
                </div>

                {/* Sources needing improvement */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">개선 필요 크롤러</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {crawlerQuality.sources
                      .filter(s => s.qualityScore < 90)
                      .sort((a, b) => a.qualityScore - b.qualityScore)
                      .map(source => (
                        <div key={source.source} className="flex items-center justify-between text-sm">
                          <a href={`/admin/jobs?source=${encodeURIComponent(source.source)}`} className="hover:underline text-blue-600">
                            {source.source}
                          </a>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${source.qualityScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {source.qualityScore}점
                            </span>
                            <span className="text-muted-foreground text-xs">
                              (+{90 - source.qualityScore} 필요)
                            </span>
                          </div>
                        </div>
                      ))}
                    {crawlerQuality.sources.filter(s => s.qualityScore < 90).length === 0 && (
                      <p className="text-green-600 text-sm">🎉 모든 크롤러가 90점 이상입니다!</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Targets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                품질 목표
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* JD Success Rate */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>JD 성공률</span>
                    <span className={crawlerQuality.summary.jdSuccessRate >= 95 ? 'text-green-600' : 'text-yellow-600'}>
                      {crawlerQuality.summary.jdSuccessRate}% / 95%
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full ${crawlerQuality.summary.jdSuccessRate >= 95 ? 'bg-green-500' : 'bg-yellow-500'} transition-all`}
                      style={{ width: `${Math.min(100, (crawlerQuality.summary.jdSuccessRate / 95) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Company Success Rate */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>회사명 성공률</span>
                    <span className={crawlerQuality.summary.companySuccessRate >= 99 ? 'text-green-600' : 'text-yellow-600'}>
                      {crawlerQuality.summary.companySuccessRate}% / 99%
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full ${crawlerQuality.summary.companySuccessRate >= 99 ? 'bg-green-500' : 'bg-yellow-500'} transition-all`}
                      style={{ width: `${Math.min(100, (crawlerQuality.summary.companySuccessRate / 99) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* HTML Error Rate */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>HTML 오류율</span>
                    <span className={crawlerQuality.summary.htmlErrorRate <= 0 ? 'text-green-600' : crawlerQuality.summary.htmlErrorRate <= 5 ? 'text-yellow-600' : 'text-red-600'}>
                      {crawlerQuality.summary.htmlErrorRate}% → 0%
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full ${crawlerQuality.summary.htmlErrorRate <= 0 ? 'bg-green-500' : crawlerQuality.summary.htmlErrorRate <= 5 ? 'bg-yellow-500' : 'bg-red-500'} transition-all`}
                      style={{ width: `${100 - Math.min(100, crawlerQuality.summary.htmlErrorRate * 5)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Expired Jobs Warning */}
              {crawlerQuality.summary.oldJobs > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-medium flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="w-4 h-4" />
                    만료 공고 주의
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    <a href="/admin/jobs?filter=old" className="hover:underline">
                      {crawlerQuality.summary.oldJobs.toLocaleString()}개 공고가 60일 이상 지났습니다
                    </a>
                  </p>
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm font-medium">Lead Measures</p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li>• JD 목표: 95% 이상</li>
                  <li>• 회사명 목표: 99% 이상</li>
                  <li>• HTML 오류: 0%</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lead Measures - Scoreboard */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          선행지표 (Lead Measures)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScoreCard
            title="총 활성 공고"
            value={metrics.leadMeasures.crawler.activeJobs}
            target={metrics.leadMeasures.crawler.targetJobs}
            icon={Briefcase}
            description={`목표: ${metrics.leadMeasures.crawler.targetJobs.toLocaleString()}개 이상`}
            href="/admin/jobs"
          />
          <ScoreCard
            title="오늘 신규 공고"
            value={metrics.leadMeasures.crawler.todayNewJobs}
            icon={Zap}
            description="오늘 크롤링된 새 공고"
            href="/admin/jobs?filter=today"
          />
          <ScoreCard
            title="총 북마크"
            value={metrics.leadMeasures.users.bookmarks}
            icon={Bookmark}
            description="유저 참여 지표"
            href="/admin/bookmarks"
          />
          <ScoreCard
            title="신고 접수"
            value={metrics.leadMeasures.users.reports}
            icon={AlertTriangle}
            description="확인 필요"
            href="/admin/reports"
          />
        </div>
      </div>

      {/* Crawler Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            크롤러 품질 지표 (세분화)
          </CardTitle>
          <CardDescription>
            소스별 데이터 품질 분석 - 기본 정보, JD 품질, 메타데이터, 링크 품질
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          {crawlerQuality && (
            <div className="space-y-4 mb-6">
              {/* Row 1: Basic Info */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">기본 정보</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-2xl font-bold">{crawlerQuality.summary.totalJobs.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">총 공고</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.titleSuccessRate >= 95 ? 'text-green-600' : crawlerQuality.summary.titleSuccessRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {crawlerQuality.summary.titleSuccessRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">직무명 품질</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.companySuccessRate >= 99 ? 'text-green-600' : crawlerQuality.summary.companySuccessRate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {crawlerQuality.summary.companySuccessRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">회사명 성공률</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.locationRate >= 70 ? 'text-green-600' : crawlerQuality.summary.locationRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {crawlerQuality.summary.locationRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">위치 정보율</p>
                  </div>
                </div>
              </div>

              {/* Row 2: JD Quality */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">JD 품질</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.jdSuccessRate >= 95 ? 'text-green-600' : crawlerQuality.summary.jdSuccessRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {crawlerQuality.summary.jdSuccessRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">JD 존재율 (50자+)</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.htmlErrorRate <= 0 ? 'text-green-600' : crawlerQuality.summary.htmlErrorRate <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {crawlerQuality.summary.htmlErrorRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">HTML 오류율</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.qualityScore >= 90 ? 'text-green-600' : crawlerQuality.summary.qualityScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {crawlerQuality.summary.qualityScore}
                    </p>
                    <p className="text-xs text-muted-foreground">전체 품질 점수</p>
                  </div>
                </div>
              </div>

              {/* Row 3: Metadata */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">메타데이터</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.salaryRate >= 30 ? 'text-green-600' : crawlerQuality.summary.salaryRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {crawlerQuality.summary.salaryRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">급여 정보율</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.employmentTypeRate >= 50 ? 'text-green-600' : crawlerQuality.summary.employmentTypeRate >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {crawlerQuality.summary.employmentTypeRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">고용형태 정보율</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.skillsRate >= 50 ? 'text-green-600' : crawlerQuality.summary.skillsRate >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {crawlerQuality.summary.skillsRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">스킬 정보율</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.applyUrlRate >= 95 ? 'text-green-600' : crawlerQuality.summary.applyUrlRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {crawlerQuality.summary.applyUrlRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">지원링크 유효율</p>
                  </div>
                </div>
              </div>

              {/* Row 4: Staleness */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">만료 공고</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`text-center p-3 rounded-lg ${crawlerQuality.summary.oldJobsRate <= 5 ? 'bg-green-50 dark:bg-green-900/20' : crawlerQuality.summary.oldJobsRate <= 15 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.oldJobsRate <= 5 ? 'text-green-600' : crawlerQuality.summary.oldJobsRate <= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {crawlerQuality.summary.oldJobsRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">60일+ 오래된 공고율</p>
                  </div>
                  <a href="/admin/jobs?filter=old" className={`text-center p-3 rounded-lg hover:opacity-80 transition-opacity ${crawlerQuality.summary.oldJobs === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                    <p className={`text-2xl font-bold ${crawlerQuality.summary.oldJobs === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {crawlerQuality.summary.oldJobs.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">만료 처리 대상 공고</p>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Quality Table - Detailed */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>소스</TableHead>
                  <TableHead className="text-right">공고</TableHead>
                  <TableHead className="text-right" title="직무명 품질">직무명</TableHead>
                  <TableHead className="text-right" title="회사명 성공률">회사</TableHead>
                  <TableHead className="text-right" title="JD 존재율">JD</TableHead>
                  <TableHead className="text-right" title="평균 JD 길이">JD길이</TableHead>
                  <TableHead className="text-right" title="HTML 오류율">HTML</TableHead>
                  <TableHead className="text-right" title="급여 정보율">급여</TableHead>
                  <TableHead className="text-right" title="지원링크 유효율">링크</TableHead>
                  <TableHead className="text-right" title="60일 이상 오래된 공고">오래됨</TableHead>
                  <TableHead className="text-right">점수</TableHead>
                  <TableHead className="text-right">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crawlerQuality?.sources.map((source) => {
                  const status: ScoreStatus = source.qualityScore >= 90 ? 'green' : source.qualityScore >= 70 ? 'yellow' : 'red'
                  return (
                    <TableRow key={source.source} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <a href={`/admin/jobs?source=${encodeURIComponent(source.source)}`} className="hover:text-blue-600 hover:underline">
                          {source.source}
                        </a>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {source.total.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <span className={source.titleSuccessRate >= 95 ? 'text-green-600' : source.titleSuccessRate >= 80 ? 'text-yellow-600' : 'text-red-600'}>
                          {source.titleSuccessRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <a
                          href={`/admin/jobs?source=${encodeURIComponent(source.source)}&filter=unknown-company`}
                          className={`hover:underline ${source.companySuccessRate >= 99 ? 'text-green-600' : source.companySuccessRate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}
                        >
                          {source.companySuccessRate}%
                        </a>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <a
                          href={`/admin/jobs?source=${encodeURIComponent(source.source)}&filter=no-jd`}
                          className={`hover:underline ${source.jdSuccessRate >= 95 ? 'text-green-600' : source.jdSuccessRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}
                        >
                          {source.jdSuccessRate}%
                        </a>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {source.avgJdLength > 0 ? source.avgJdLength.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <a
                          href={`/admin/jobs?source=${encodeURIComponent(source.source)}&filter=html-errors`}
                          className={`hover:underline ${source.htmlErrorRate <= 0 ? 'text-green-600' : source.htmlErrorRate <= 5 ? 'text-yellow-600' : 'text-red-600'}`}
                        >
                          {source.htmlErrorRate}%
                        </a>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <span className={source.salaryRate >= 30 ? 'text-green-600' : source.salaryRate >= 10 ? 'text-yellow-600' : 'text-muted-foreground'}>
                          {source.salaryRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <span className={source.applyUrlRate >= 95 ? 'text-green-600' : source.applyUrlRate >= 80 ? 'text-yellow-600' : 'text-red-600'}>
                          {source.applyUrlRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {source.oldJobs > 0 ? (
                          <a
                            href={`/admin/jobs?source=${encodeURIComponent(source.source)}&filter=old`}
                            className="text-yellow-600 hover:underline"
                          >
                            {source.oldJobs}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <span className={status === 'green' ? 'text-green-600' : status === 'yellow' ? 'text-yellow-600' : 'text-red-600'}>
                          {source.qualityScore}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={status === 'green' ? 'default' : status === 'yellow' ? 'secondary' : 'destructive'}>
                          {status === 'green' ? '정상' : status === 'yellow' ? '주의' : '부족'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Legend */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm font-medium mb-2">품질 점수 기준</p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                90점 이상: 정상
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                70~89점: 주의
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                70점 미만: 부족
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              * 품질 점수 계산식:
            </p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 ml-2">
              <li>• 직무명 품질: 10%</li>
              <li>• 회사명 성공률: 15%</li>
              <li>• JD 성공률: 25%</li>
              <li>• HTML 오류 없음: 15%</li>
              <li>• 위치 정보: 10%</li>
              <li>• 메타데이터(급여/고용형태/스킬 평균): 15%</li>
              <li>• 지원링크 유효: 10%</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
