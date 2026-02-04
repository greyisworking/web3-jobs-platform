import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { StatCard } from '@/components/admin/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardCrawlerSection } from './dashboard-crawler'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient()

  const [
    { count: totalJobs },
    { count: activeJobs },
    { count: inactiveJobs },
    { count: recentErrors },
  ] = await Promise.all([
    supabase.from('Job').select('*', { count: 'exact', head: true }),
    supabase
      .from('Job')
      .select('*', { count: 'exact', head: true })
      .eq('isActive', true),
    supabase
      .from('Job')
      .select('*', { count: 'exact', head: true })
      .eq('isActive', false),
    supabase
      .from('CrawlLog')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte(
        'createdAt',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      ),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="전체 공고"
          value={totalJobs ?? 0}
          description="데이터베이스에 있는 모든 공고"
        />
        <StatCard
          title="활성 공고"
          value={activeJobs ?? 0}
          description="현재 공개 중인 공고"
        />
        <StatCard
          title="비활성 공고"
          value={inactiveJobs ?? 0}
          description="숨김 처리된 공고"
        />
      </div>

      {/* Crawler Control & Schedule */}
      <DashboardCrawlerSection />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">최근 오류 (24시간)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{recentErrors ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              지난 24시간 동안 발생한 크롤링 오류 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">빠른 작업</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/jobs/pending">대기 중인 공고 검토</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/jobs/duplicates">중복 공고 확인</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/errors">오류 기록 보기</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/monitoring">시스템 모니터링</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/analytics">검색 통계</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
