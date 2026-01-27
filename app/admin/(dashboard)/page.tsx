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
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={totalJobs ?? 0}
          description="All jobs in database"
        />
        <StatCard
          title="Active"
          value={activeJobs ?? 0}
          description="Published jobs"
        />
        <StatCard
          title="Inactive"
          value={inactiveJobs ?? 0}
          description="Hidden jobs"
        />
      </div>

      {/* Crawler Control & Schedule */}
      <DashboardCrawlerSection />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Errors (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{recentErrors ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Failed crawl attempts in the last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/jobs/pending">Review Pending Jobs</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/jobs/duplicates">Check Duplicates</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/errors">View Error Logs</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/monitoring">System Monitoring</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/analytics">Search Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
