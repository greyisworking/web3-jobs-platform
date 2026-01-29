import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Briefcase, Eye, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import Pixelbara from '@/app/components/Pixelbara'

export const dynamic = 'force-dynamic'

async function getDashboardData(userId: string) {
  const supabase = await createSupabaseServerClient()

  // Get company
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!company) return null

  // Get job stats
  const { data: jobs } = await supabase
    .from('Job')
    .select('id, title, view_count, apply_count, isActive, created_at')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const totalJobs = jobs?.length || 0
  const activeJobs = jobs?.filter(j => j.isActive)?.length || 0
  const totalViews = jobs?.reduce((sum, j) => sum + (j.view_count || 0), 0) || 0
  const totalApplies = jobs?.reduce((sum, j) => sum + (j.apply_count || 0), 0) || 0

  return {
    company,
    stats: { totalJobs, activeJobs, totalViews, totalApplies },
    recentJobs: jobs?.slice(0, 5) || [],
  }
}

export default async function CompanyDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const data = await getDashboardData(user.id)

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Pixelbara pose="question" size={120} />
        <h2 className="text-xl font-bold text-white mt-6">Company profile not found</h2>
        <p className="text-gray-400 mt-2">Please contact support</p>
      </div>
    )
  }

  const { company, stats, recentJobs } = data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            gm, {company.name}
          </h1>
          <p className="text-gray-400 mt-1">
            Your job posting overview
          </p>
        </div>
        <Link
          href="/company/dashboard/jobs/new"
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Post New Job
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Briefcase}
          label="Total Jobs"
          value={stats.totalJobs}
          subtext={`${stats.activeJobs} active`}
        />
        <StatCard
          icon={Eye}
          label="Total Views"
          value={stats.totalViews}
          subtext="All time"
        />
        <StatCard
          icon={Users}
          label="Applications"
          value={stats.totalApplies}
          subtext="Total received"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion"
          value={stats.totalViews > 0 ? `${((stats.totalApplies / stats.totalViews) * 100).toFixed(1)}%` : '0%'}
          subtext="Views to applies"
        />
      </div>

      {/* Recent Jobs & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Job Posts</h2>
            <Link
              href="/company/dashboard/jobs"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentJobs.length > 0 ? (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700"
                >
                  <div>
                    <h3 className="font-medium text-white">{job.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {job.view_count || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {job.apply_count || 0} applies
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium ${
                      job.isActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Pixelbara pose="search" size={80} />
              <p className="text-gray-400 mt-4">No jobs posted yet</p>
              <Link
                href="/company/dashboard/jobs/new"
                className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
              >
                Post Your First Job
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900/50 border border-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/company/dashboard/jobs/new"
              className="block p-4 bg-purple-600/20 border border-purple-600/30 hover:bg-purple-600/30 transition-colors"
            >
              <h3 className="font-medium text-purple-400">Post New Job</h3>
              <p className="text-sm text-gray-400 mt-1">
                Create a new job listing
              </p>
            </Link>
            <Link
              href="/company/dashboard/analytics"
              className="block p-4 bg-gray-800/50 border border-gray-700 hover:bg-gray-800 transition-colors"
            >
              <h3 className="font-medium text-white">View Analytics</h3>
              <p className="text-sm text-gray-400 mt-1">
                See detailed performance stats
              </p>
            </Link>
            <Link
              href="/company/dashboard/settings"
              className="block p-4 bg-gray-800/50 border border-gray-700 hover:bg-gray-800 transition-colors"
            >
              <h3 className="font-medium text-white">Company Settings</h3>
              <p className="text-sm text-gray-400 mt-1">
                Update your company profile
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtext: string
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-purple-600/20 text-purple-400">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtext}</p>
    </div>
  )
}
