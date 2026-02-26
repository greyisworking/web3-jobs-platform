'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Bookmark,
  User,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface BookmarkData {
  id: string
  user_id: string
  job_id: string
  created_at: string
  job?: {
    title: string
    company: string
    source: string
  }
  user_email?: string
}

export default function AdminBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, uniqueUsers: 0, uniqueJobs: 0 })

  const fetchBookmarks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/bookmarks')
      if (!res.ok) throw new Error('Failed to fetch bookmarks')
      const data = await res.json()
      setBookmarks(data.bookmarks)
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookmarks()
  }, [])

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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-blue-500" />
            북마크 현황
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            총 {stats.total.toLocaleString()}개 북마크 · {stats.uniqueUsers} 사용자 · {stats.uniqueJobs} 공고
          </p>
        </div>
        <Button onClick={fetchBookmarks} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-muted-foreground">총 북마크</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-green-600">{stats.uniqueUsers}</p>
            <p className="text-sm text-muted-foreground">활성 사용자</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-neun-success">{stats.uniqueJobs}</p>
            <p className="text-sm text-muted-foreground">북마크된 공고</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookmarks Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              북마크가 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>공고</TableHead>
                  <TableHead>회사</TableHead>
                  <TableHead>소스</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>북마크 일시</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookmarks.map((bookmark) => (
                  <TableRow key={bookmark.id}>
                    <TableCell>
                      <p className="font-medium line-clamp-1 max-w-[250px]">
                        {bookmark.job?.title || 'Unknown Job'}
                      </p>
                    </TableCell>
                    <TableCell>{bookmark.job?.company || 'N/A'}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/jobs?source=${encodeURIComponent(bookmark.job?.source || '')}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {bookmark.job?.source || 'N/A'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        {bookmark.user_email || bookmark.user_id?.slice(0, 8) + '...'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(bookmark.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/jobs/${bookmark.job_id}`}
                        target="_blank"
                        className="p-1.5 hover:bg-gray-100 rounded inline-flex"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
