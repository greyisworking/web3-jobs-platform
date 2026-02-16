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
  jdSuccessRate: number
  companySuccessRate: number
  htmlErrorRate: number
  qualityScore: number
}

interface CrawlerQualityData {
  sources: CrawlerQualitySource[]
  summary: {
    totalJobs: number
    totalSources: number
    jdSuccessRate: number
    companySuccessRate: number
    htmlErrorRate: number
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

      {/* WIG Section */}
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
                  월간 Apply 클릭 1,000회 달성
                </CardDescription>
              </div>
              <StatusBadge status={wigStatus} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-bold text-neun-primary">
                  {metrics.wig.current.toLocaleString()}
                </span>
                <span className="text-2xl text-muted-foreground">
                  / {metrics.wig.target.toLocaleString()}회
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  <TrendIcon direction={getTrendDirection(metrics.wig.trend)} />
                  <span className={`text-sm ${metrics.wig.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.wig.trend >= 0 ? '+' : ''}{metrics.wig.trend.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>진행률</span>
                  <span className="font-medium">{metrics.wig.progress.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.wig.progress} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">{daysRemaining}</p>
                  <p className="text-xs text-muted-foreground">남은 일수</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{dailyRequired}</p>
                  <p className="text-xs text-muted-foreground">일 평균 필요</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {metrics.wig.target - metrics.wig.current}
                  </p>
                  <p className="text-xs text-muted-foreground">남은 클릭 수</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">일별 Apply 클릭 추이 (최근 14일)</p>
                <FullChart data={metrics.wig.chartData} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              주간 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.wig.weeklyData.map((week, i) => (
                <div key={week.week} className="flex items-center gap-3">
                  <span className="text-sm w-16">{week.week}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${i === metrics.wig.weeklyData.length - 1 ? 'bg-neun-primary' : 'bg-neun-primary/50'} transition-all`}
                      style={{ width: `${Math.min(100, (week.clicks / 250) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{week.clicks}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm font-medium">목표 달성을 위해</p>
              <p className="text-xs text-muted-foreground mt-1">
                앞으로 주당 평균 <span className="font-bold text-neun-primary">{Math.ceil((metrics.wig.target - metrics.wig.current) / Math.ceil(daysRemaining / 7))}회</span>가 필요합니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
            크롤러 품질 지표
          </CardTitle>
          <CardDescription>
            소스별 데이터 품질 분석 - 어떤 크롤러를 개선해야 하는지 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          {crawlerQuality && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-2xl font-bold">{crawlerQuality.summary.totalJobs.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">총 공고</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className={`text-2xl font-bold ${crawlerQuality.summary.jdSuccessRate >= 90 ? 'text-green-600' : crawlerQuality.summary.jdSuccessRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {crawlerQuality.summary.jdSuccessRate}%
                </p>
                <p className="text-xs text-muted-foreground">JD 성공률</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className={`text-2xl font-bold ${crawlerQuality.summary.companySuccessRate >= 90 ? 'text-green-600' : crawlerQuality.summary.companySuccessRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {crawlerQuality.summary.companySuccessRate}%
                </p>
                <p className="text-xs text-muted-foreground">회사명 성공률</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className={`text-2xl font-bold ${crawlerQuality.summary.htmlErrorRate <= 5 ? 'text-green-600' : crawlerQuality.summary.htmlErrorRate <= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
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
          )}

          {/* Quality Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>소스</TableHead>
                <TableHead className="text-right">공고 수</TableHead>
                <TableHead className="text-right">JD 성공률</TableHead>
                <TableHead className="text-right">회사명 성공률</TableHead>
                <TableHead className="text-right">HTML 오류</TableHead>
                <TableHead className="text-right">품질 점수</TableHead>
                <TableHead className="text-right">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crawlerQuality?.sources.map((source) => {
                const status: ScoreStatus = source.qualityScore >= 90 ? 'green' : source.qualityScore >= 70 ? 'yellow' : 'red'
                return (
                  <TableRow key={source.source} className="hover:bg-muted/50 cursor-pointer">
                    <TableCell className="font-medium">
                      <a href={`/admin/jobs?source=${encodeURIComponent(source.source)}`} className="hover:text-blue-600 hover:underline">
                        {source.source}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <a href={`/admin/jobs?source=${encodeURIComponent(source.source)}`} className="hover:underline">
                        {source.total.toLocaleString()}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`/admin/jobs?source=${encodeURIComponent(source.source)}&filter=no-jd`}
                        className={`hover:underline ${source.jdSuccessRate >= 90 ? 'text-green-600' : source.jdSuccessRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}
                        title="JD 없는 공고 보기"
                      >
                        {source.jdSuccessRate}%
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`/admin/jobs?source=${encodeURIComponent(source.source)}&filter=unknown-company`}
                        className={`hover:underline ${source.companySuccessRate >= 90 ? 'text-green-600' : source.companySuccessRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}
                        title="UNKNOWN 회사 공고 보기"
                      >
                        {source.companySuccessRate}%
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`/admin/jobs?source=${encodeURIComponent(source.source)}&filter=html-errors`}
                        className={`hover:underline ${source.htmlErrorRate <= 5 ? 'text-green-600' : source.htmlErrorRate <= 15 ? 'text-yellow-600' : 'text-red-600'}`}
                        title="HTML 오류 공고 보기"
                      >
                        {source.htmlErrorRate}%
                      </a>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      <span className={status === 'green' ? 'text-green-600' : status === 'yellow' ? 'text-yellow-600' : 'text-red-600'}>
                        {source.qualityScore}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={status !== 'green' ? `/admin/jobs?source=${encodeURIComponent(source.source)}&filter=${source.jdSuccessRate < source.companySuccessRate ? 'no-jd' : 'unknown-company'}` : '#'}
                        className={status !== 'green' ? 'cursor-pointer' : 'cursor-default'}
                      >
                        <Badge variant={status === 'green' ? 'default' : status === 'yellow' ? 'secondary' : 'destructive'}>
                          {status === 'green' ? '정상' : status === 'yellow' ? '주의' : '부족'}
                        </Badge>
                      </a>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Legend */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm font-medium mb-2">품질 점수 기준</p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
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
            <p className="text-xs text-muted-foreground mt-2">
              * 품질 점수 = (JD 성공률 × 40%) + (회사명 성공률 × 30%) + ((100 - HTML 오류율) × 30%)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
