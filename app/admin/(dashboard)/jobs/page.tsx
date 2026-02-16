'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  Filter,
  ExternalLink,
  AlertTriangle,
  FileText,
  Building,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Job {
  id: string
  title: string
  company: string
  source: string
  description: string | null
  applyUrl: string | null
  crawledAt: string
  isActive: boolean
}

type FilterType = 'all' | 'today' | 'no-jd' | 'unknown-company' | 'html-errors' | 'old'

export default function AdminJobsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialFilter = (searchParams.get('filter') as FilterType) || 'all'
  const initialSource = searchParams.get('source') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10)

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [sources, setSources] = useState<string[]>([])

  const [filter, setFilter] = useState<FilterType>(initialFilter)
  const [source, setSource] = useState(initialSource)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(initialPage)
  const pageSize = 50

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filter,
        ...(source && { source }),
        ...(search && { search }),
      })

      const res = await fetch(`/api/admin/jobs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')

      const data = await res.json()
      setJobs(data.jobs)
      setTotal(data.total)
      setSources(data.sources || [])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [filter, source, page])

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('filter', filter)
    if (source) params.set('source', source)
    if (page > 1) params.set('page', page.toString())

    const newUrl = params.toString() ? `?${params}` : '/admin/jobs'
    router.replace(newUrl, { scroll: false })
  }, [filter, source, page, router])

  const handleSearch = () => {
    setPage(1)
    fetchJobs()
  }

  const hasHtmlEntities = (text: string | null) => {
    if (!text) return false
    return /&lt;|&gt;|&amp;(?!amp;)|&nbsp;|&#\d+;/i.test(text)
  }

  const totalPages = Math.ceil(total / pageSize)

  const filterLabels: Record<FilterType, string> = {
    all: '전체',
    today: '오늘 추가',
    'no-jd': 'JD 없음',
    'unknown-company': 'UNKNOWN 회사',
    'html-errors': 'HTML 오류',
    'old': '60일+ 오래됨',
  }

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
          <h1 className="text-2xl font-bold">공고 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            총 {total.toLocaleString()}개 공고
            {filter !== 'all' && ` (${filterLabels[filter]})`}
            {source && ` · ${source}`}
          </p>
        </div>
        <Button onClick={fetchJobs} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Filter Type */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">필터</label>
              <Select value={filter} onValueChange={(v) => { setFilter(v as FilterType); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 공고</SelectItem>
                  <SelectItem value="today">오늘 추가된 공고</SelectItem>
                  <SelectItem value="no-jd">JD 없는 공고</SelectItem>
                  <SelectItem value="unknown-company">UNKNOWN 회사</SelectItem>
                  <SelectItem value="html-errors">HTML 오류 있는 공고</SelectItem>
                  <SelectItem value="old">60일 이상 오래된 공고</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">소스</label>
              <Select value={source || 'all'} onValueChange={(v) => { setSource(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="전체 소스" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 소스</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <label className="text-xs text-muted-foreground mb-1 block">검색</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="제목 또는 회사명 검색..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              조건에 맞는 공고가 없습니다
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">제목</TableHead>
                    <TableHead>회사</TableHead>
                    <TableHead>소스</TableHead>
                    <TableHead>JD</TableHead>
                    <TableHead>추가일</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const hasJd = job.description && job.description.trim().length > 50
                    const isUnknownCompany = !job.company || job.company.toUpperCase() === 'UNKNOWN'
                    const hasHtmlErrors = hasHtmlEntities(job.description)
                    const sixtyDaysAgo = new Date()
                    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
                    const isOld = new Date(job.crawledAt) < sixtyDaysAgo

                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium line-clamp-1">{job.title}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {!hasJd && (
                              <Badge variant="destructive" className="text-[10px]">
                                <FileText className="w-3 h-3 mr-1" />
                                JD 없음
                              </Badge>
                            )}
                            {isUnknownCompany && (
                              <Badge variant="secondary" className="text-[10px]">
                                <Building className="w-3 h-3 mr-1" />
                                UNKNOWN
                              </Badge>
                            )}
                            {hasHtmlErrors && (
                              <Badge variant="outline" className="text-[10px] text-yellow-600">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                HTML
                              </Badge>
                            )}
                            {isOld && (
                              <Badge variant="outline" className="text-[10px] text-orange-600">
                                <Clock className="w-3 h-3 mr-1" />
                                60일+
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={isUnknownCompany ? 'text-red-500' : ''}>
                            {job.company || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/jobs?source=${encodeURIComponent(job.source)}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {job.source}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {hasJd ? (
                            <Badge variant="default">있음</Badge>
                          ) : (
                            <Badge variant="destructive">없음</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(job.crawledAt).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Link
                              href={`/jobs/${job.id}`}
                              target="_blank"
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {((page - 1) * pageSize + 1).toLocaleString()} - {Math.min(page * pageSize, total).toLocaleString()} / {total.toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages}
                  >
                    다음
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
