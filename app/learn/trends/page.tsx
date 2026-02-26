import Link from 'next/link'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Briefcase,
  Building2,
  MapPin,
  Users,
  Zap,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import Footer from '@/app/components/Footer'
import { getMarketTrends } from '@/lib/market-trends'

function TrendBadge({ trend, change }: { trend: 'rising' | 'stable' | 'declining'; change: number }) {
  if (trend === 'rising') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-400">
        <TrendingUp className="w-3 h-3" />
        +{change}%
      </span>
    )
  }
  if (trend === 'declining') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-400">
        <TrendingDown className="w-3 h-3" />
        {change}%
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-a24-muted dark:text-a24-dark-muted">
      <Minus className="w-3 h-3" />
      stable
    </span>
  )
}

function ProgressBar({ percentage, color = 'bg-neun-success', label = 'progress' }: { percentage: number; color?: string; label?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 bg-a24-surface dark:bg-a24-dark-surface rounded-full overflow-hidden"
    >
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  )
}

export default async function TrendsPage() {
  const trends = await getMarketTrends()

  if (!trends) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center">
        <p className="text-a24-muted dark:text-a24-dark-muted">Failed to load market data.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Breadcrumb */}
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-sm text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          back to learn
        </Link>

        {/* Hero */}
        <section className="text-center mb-16 md:mb-20">
          <h1 className="text-3xl md:text-4xl font-light uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text mb-4">
            Market Trends
          </h1>
          <p className="text-sm md:text-base text-a24-muted dark:text-a24-dark-muted font-light max-w-xl mx-auto">
            real-time insights from {trends.overview.totalJobs} job postings. updated hourly.
          </p>
          <div className="w-12 h-px bg-neun-success mx-auto mt-8" />
        </section>

        {/* Overview Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="p-5 border border-a24-border dark:border-a24-dark-border">
            <div className="flex items-center gap-2 text-a24-muted dark:text-a24-dark-muted mb-2">
              <Briefcase className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">open jobs</span>
            </div>
            <p className="text-3xl font-light text-a24-text dark:text-a24-dark-text">
              {trends.overview.totalJobs}
            </p>
          </div>

          <div className="p-5 border border-a24-border dark:border-a24-dark-border">
            <div className="flex items-center gap-2 text-a24-muted dark:text-a24-dark-muted mb-2">
              <Building2 className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">companies</span>
            </div>
            <p className="text-3xl font-light text-a24-text dark:text-a24-dark-text">
              {trends.overview.totalCompanies}
            </p>
          </div>

          <div className="p-5 border border-a24-border dark:border-a24-dark-border">
            <div className="flex items-center gap-2 text-a24-muted dark:text-a24-dark-muted mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">remote</span>
            </div>
            <p className="text-3xl font-light text-a24-text dark:text-a24-dark-text">
              {trends.overview.remotePercentage}%
            </p>
          </div>

          <div className="p-5 border border-a24-border dark:border-a24-dark-border">
            <div className="flex items-center gap-2 text-a24-muted dark:text-a24-dark-muted mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">avg/company</span>
            </div>
            <p className="text-3xl font-light text-a24-text dark:text-a24-dark-text">
              {trends.overview.avgJobsPerCompany}
            </p>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Hot Skills (Trending) */}
          <section className="border border-a24-border dark:border-a24-dark-border p-6">
            <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Hot Skills
            </h2>
            <p className="text-xs text-a24-muted dark:text-a24-dark-muted mb-4">
              comparing last 3 months vs previous 3 months
            </p>

            <div className="space-y-3">
              {trends.hotSkills.map((skill, idx) => (
                <div
                  key={skill.skill}
                  className="flex items-center justify-between p-3 bg-a24-surface/30 dark:bg-a24-dark-surface/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-a24-muted dark:text-a24-dark-muted w-5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <Link
                      href={`/learn/skills/${skill.skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      className="text-sm text-a24-text dark:text-a24-dark-text hover:text-neun-success transition-colors"
                    >
                      {skill.skill}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-a24-muted dark:text-a24-dark-muted">
                      {skill.recentCount} jobs
                    </span>
                    <TrendBadge trend={skill.trend} change={skill.changePercent} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top Skills by Demand */}
          <section className="border border-a24-border dark:border-a24-dark-border p-6">
            <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Most In-Demand Skills
            </h2>

            <div className="space-y-4">
              {trends.topSkills.slice(0, 10).map((skill) => (
                <div key={skill.skill}>
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      href={`/learn/skills/${skill.skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      className="text-sm text-a24-text dark:text-a24-dark-text hover:text-neun-success transition-colors"
                    >
                      {skill.skill}
                    </Link>
                    <span className="text-xs text-a24-muted dark:text-a24-dark-muted">
                      {skill.percentage}%
                    </span>
                  </div>
                  <ProgressBar percentage={skill.percentage} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Role Distribution & Location */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Role Distribution */}
          <section className="border border-a24-border dark:border-a24-dark-border p-6">
            <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-6">
              Jobs by Role
            </h2>

            <div className="space-y-4">
              {trends.roleDistribution.map((role) => (
                <div key={role.role}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-a24-text dark:text-a24-dark-text">
                      {role.role}
                    </span>
                    <span className="text-xs text-a24-muted dark:text-a24-dark-muted">
                      {role.count} ({role.percentage}%)
                    </span>
                  </div>
                  <ProgressBar percentage={role.percentage} color="bg-neun-success" />
                </div>
              ))}
            </div>
          </section>

          {/* Location Distribution */}
          <section className="border border-a24-border dark:border-a24-dark-border p-6">
            <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-6">
              Jobs by Location
            </h2>

            <div className="space-y-4">
              {trends.locationDistribution.map((loc) => (
                <div key={loc.location}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-a24-text dark:text-a24-dark-text">
                      {loc.location}
                    </span>
                    <span className="text-xs text-a24-muted dark:text-a24-dark-muted">
                      {loc.count} ({loc.percentage}%)
                    </span>
                  </div>
                  <ProgressBar percentage={loc.percentage} color="bg-cyan-500" />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Experience Levels & Top Companies */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Experience Levels */}
          {trends.experienceLevels.length > 0 && (
            <section className="border border-a24-border dark:border-a24-dark-border p-6">
              <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-6">
                Experience Level
              </h2>

              <div className="space-y-4">
                {trends.experienceLevels.map((level) => (
                  <div key={level.level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-a24-text dark:text-a24-dark-text">
                        {level.level}
                      </span>
                      <span className="text-xs text-a24-muted dark:text-a24-dark-muted">
                        {level.count} ({level.percentage}%)
                      </span>
                    </div>
                    <ProgressBar percentage={level.percentage} color="bg-amber-500" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Top Hiring Companies */}
          <section className="border border-a24-border dark:border-a24-dark-border p-6">
            <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-6">
              Top Hiring Companies
            </h2>

            <div className="space-y-3">
              {trends.topCompanies.map((company, idx) => (
                <div
                  key={company.company}
                  className="flex items-center justify-between p-3 bg-a24-surface/30 dark:bg-a24-dark-surface/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-a24-muted dark:text-a24-dark-muted w-5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm text-a24-text dark:text-a24-dark-text">
                      {company.company}
                    </span>
                  </div>
                  <span className="text-xs text-neun-success">
                    {company.jobCount} jobs
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CTA */}
        <section className="text-center py-12 border-t border-a24-border dark:border-a24-dark-border">
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-4">
            ready to start learning?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/learn/career"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neun-success text-white text-sm font-medium hover:bg-neun-success/90 transition-colors"
            >
              explore career paths
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-sm text-neun-success hover:underline"
            >
              browse all jobs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
