import Link from 'next/link'
import { Compass, Wrench } from 'lucide-react'
import Footer from '@/app/components/Footer'
import { createPublicSupabaseClient } from '@/lib/supabase-public'
import LearnCountUp from './LearnCountUp'
import LearnTicker from './LearnTicker'

export const revalidate = 3600

// Skill keywords for extraction
const skillKeywords: Record<string, string[]> = {
  'TypeScript': ['typescript', 'ts'],
  'Solidity': ['solidity'],
  'Rust': ['rust'],
  'React': ['react', 'reactjs'],
  'Python': ['python'],
  'Go': ['golang', ' go ', 'go,'],
  'Node.js': ['node.js', 'nodejs', 'node'],
  'Ethereum': ['ethereum', 'eth', 'evm'],
  'Solana': ['solana'],
  'DeFi': ['defi', 'decentralized finance'],
  'ZK': ['zero knowledge', 'zk-', 'zkp', 'zk proof'],
  'AWS': ['aws', 'amazon web services'],
  'Docker': ['docker', 'container'],
  'GraphQL': ['graphql'],
  'Next.js': ['next.js', 'nextjs'],
}

async function getLearnData() {
  const supabase = createPublicSupabaseClient()

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [totalRes, recentRes, prevRes, salaryRes] = await Promise.all([
    supabase
      .from('Job')
      .select('id', { count: 'exact', head: true })
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString()),
    supabase
      .from('Job')
      .select('id, title, tags, description, company')
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString()),
    supabase
      .from('Job')
      .select('id, title, tags, description')
      .eq('isActive', true)
      .gte('crawledAt', sixMonthsAgo.toISOString())
      .lt('crawledAt', threeMonthsAgo.toISOString()),
    supabase
      .from('Job')
      .select('salaryMin, salaryMax')
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString())
      .not('salaryMax', 'is', null)
      .gt('salaryMax', 0),
  ])

  const totalJobs = totalRes.count || 0
  const recentJobs = recentRes.data || []
  const prevJobs = prevRes.data || []
  const salaryJobs = salaryRes.data || []
  const uniqueCompanies = new Set(recentJobs.map(j => j.company).filter(Boolean)).size

  // Extract skills from recent jobs
  const skillCounts: Record<string, number> = {}
  for (const job of recentJobs) {
    const text = [job.title || '', job.tags || '', job.description || ''].join(' ').toLowerCase()
    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1
      }
    }
  }

  // Extract skills from previous period
  const prevSkillCounts: Record<string, number> = {}
  for (const job of prevJobs) {
    const text = [job.title || '', job.tags || '', job.description || ''].join(' ').toLowerCase()
    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        prevSkillCounts[skill] = (prevSkillCounts[skill] || 0) + 1
      }
    }
  }

  // Build trending skills with change percentages
  const maxCount = Math.max(...Object.values(skillCounts), 1)
  const trendingSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([skill, count]) => {
      const prevCount = prevSkillCounts[skill] || 0
      const normalizedRecent = recentJobs.length > 0 ? count / recentJobs.length : 0
      const normalizedPrev = prevJobs.length > 0 ? prevCount / prevJobs.length : 0
      const isNew = prevCount === 0 && count > 0
      let change = 0
      if (!isNew && normalizedPrev > 0) {
        change = Math.round(((normalizedRecent - normalizedPrev) / normalizedPrev) * 100)
      }
      return {
        skill,
        count,
        percentage: Math.round((count / maxCount) * 100),
        change,
        isNew,
      }
    })

  // Top hiring companies
  const companyCounts: Record<string, number> = {}
  for (const job of recentJobs) {
    if (job.company) {
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1
    }
  }
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // Avg salary
  const validSalaries = salaryJobs
    .map(j => j.salaryMax)
    .filter((s): s is number => typeof s === 'number' && s > 0 && s < 1000000)
  const avgSalary = validSalaries.length > 0
    ? Math.round(validSalaries.reduce((a, b) => a + b, 0) / validSalaries.length / 1000)
    : 0

  return { totalJobs, uniqueCompanies, avgSalary, trendingSkills, topCompanies }
}

export default async function LearnPage() {
  const data = await getLearnData()

  const tickerItems = data.trendingSkills.map(s => ({
    skill: s.skill,
    count: s.count,
    change: s.change,
    isNew: s.isNew,
  }))

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      {/* Ticker Bar */}
      <LearnTicker items={tickerItems} />

      <main id="main-content" className="container-responsive py-10 sm:py-14 md:py-20">

        {/* Header */}
        <header className="mb-8 md:mb-12 flex items-end justify-between">
          <div>
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2"
              style={{
                fontFamily: 'var(--font-space), sans-serif',
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              TRENDS
            </h1>
            <p className="text-xs text-a24-muted dark:text-a24-dark-muted font-light tracking-wide">
              real-time web3 skill demand · 90-day rolling window
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-a24-muted dark:text-a24-dark-muted uppercase tracking-widest font-light">
              live
            </span>
          </div>
        </header>

        {/* Stats Summary */}
        <section className="mb-8 md:mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="px-4 py-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-1.5">Total Jobs</p>
              <div style={{ fontFamily: 'var(--font-space), monospace' }}>
                <LearnCountUp value={data.totalJobs} className="text-xl md:text-2xl font-bold tabular-nums text-a24-text dark:text-a24-dark-text" />
              </div>
            </div>
            <div className="px-4 py-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-1.5">Companies</p>
              <div style={{ fontFamily: 'var(--font-space), monospace' }}>
                <LearnCountUp value={data.uniqueCompanies} className="text-xl md:text-2xl font-bold tabular-nums text-a24-text dark:text-a24-dark-text" />
              </div>
            </div>
            <div className="px-4 py-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-1.5">Avg Salary</p>
              <div style={{ fontFamily: 'var(--font-space), monospace' }}>
                {data.avgSalary > 0 ? (
                  <span className="text-xl md:text-2xl font-bold tabular-nums text-a24-text dark:text-a24-dark-text">
                    $<LearnCountUp value={data.avgSalary} className="text-xl md:text-2xl font-bold tabular-nums" />K
                  </span>
                ) : (
                  <span className="text-xl md:text-2xl font-bold text-a24-muted/40">N/A</span>
                )}
              </div>
            </div>
            <div className="px-4 py-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-1.5">Skills Tracked</p>
              <div style={{ fontFamily: 'var(--font-space), monospace' }}>
                <span className="text-xl md:text-2xl font-bold tabular-nums text-a24-text dark:text-a24-dark-text">
                  {data.trendingSkills.length}+
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main content: Table + Side panel */}
        <section className="mb-8 md:mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

            {/* Skills Table */}
            <div className="lg:col-span-8">
              <div className="rounded-lg border border-white/[0.05] overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/[0.05]">
                  <div className="col-span-1 text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted font-light">#</div>
                  <div className="col-span-4 text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted font-light">Skill</div>
                  <div className="col-span-2 text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted font-light text-right">Jobs</div>
                  <div className="col-span-2 text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted font-light text-right">90d</div>
                  <div className="col-span-3 text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted font-light">Demand</div>
                </div>

                {/* Table rows */}
                {data.trendingSkills.map((skill, i) => (
                  <Link
                    key={skill.skill}
                    href={`/jobs?search=${encodeURIComponent(skill.skill)}`}
                    className="grid grid-cols-12 gap-2 items-center px-4 py-3.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.03] transition-colors duration-150 group"
                  >
                    {/* Rank */}
                    <div
                      className="col-span-1 text-xs tabular-nums text-a24-muted/40 font-light"
                      style={{ fontFamily: 'var(--font-space), monospace' }}
                    >
                      {i + 1}
                    </div>

                    {/* Skill name */}
                    <div className="col-span-4 sm:col-span-4">
                      <span className="text-sm font-medium text-a24-text dark:text-a24-dark-text group-hover:text-cyan-400 transition-colors">
                        {skill.skill}
                      </span>
                      {/* Mobile: inline change */}
                      <span className="sm:hidden ml-2">
                        {skill.isNew ? (
                          <span className="text-[10px] font-bold text-violet-400">NEW</span>
                        ) : skill.change > 0 ? (
                          <span className="text-[10px] font-medium text-emerald-400">▲{skill.change}%</span>
                        ) : skill.change < 0 ? (
                          <span className="text-[10px] font-medium text-red-400">▼{skill.change}%</span>
                        ) : null}
                      </span>
                    </div>

                    {/* Jobs count */}
                    <div className="col-span-3 sm:col-span-2 text-right">
                      <LearnCountUp
                        value={skill.count}
                        className="text-sm tabular-nums font-semibold text-a24-text dark:text-a24-dark-text"
                      />
                    </div>

                    {/* Change — desktop only */}
                    <div className="hidden sm:block col-span-2 text-right">
                      {skill.isNew ? (
                        <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">NEW</span>
                      ) : skill.change > 0 ? (
                        <span
                          className="text-xs tabular-nums font-medium text-emerald-400"
                          style={{ fontFamily: 'var(--font-space), monospace' }}
                        >
                          ▲ +{skill.change}%
                        </span>
                      ) : skill.change < 0 ? (
                        <span
                          className="text-xs tabular-nums font-medium text-red-400"
                          style={{ fontFamily: 'var(--font-space), monospace' }}
                        >
                          ▼ {skill.change}%
                        </span>
                      ) : (
                        <span className="text-xs tabular-nums text-a24-muted/30">—</span>
                      )}
                    </div>

                    {/* Demand bar */}
                    <div className="col-span-4 sm:col-span-3">
                      <div className="h-1.5 sm:h-2 rounded-full overflow-hidden bg-white/[0.04]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${skill.percentage}%`,
                            background: skill.change > 0
                              ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                              : skill.change < 0
                              ? 'linear-gradient(90deg, #ef4444, #f97316)'
                              : 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}

                {data.trendingSkills.length === 0 && (
                  <div className="px-4 py-12 text-center">
                    <p className="text-sm text-a24-muted/40">No skill data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Side Panel: Top Hiring */}
            <div className="lg:col-span-4">
              <div className="rounded-lg border border-white/[0.05] overflow-hidden">
                <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.05]">
                  <h2 className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light">
                    Top Hiring
                  </h2>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {data.topCompanies.map((company, i) => (
                    <Link
                      key={company.name}
                      href={`/jobs?search=${encodeURIComponent(company.name)}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors duration-150 group"
                    >
                      <span
                        className="text-[10px] tabular-nums text-a24-muted/30 w-4 text-right font-light"
                        style={{ fontFamily: 'var(--font-space), monospace' }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-a24-text dark:text-a24-dark-text group-hover:text-cyan-400 transition-colors truncate flex-1">
                        {company.name}
                      </span>
                      <span
                        className="text-xs tabular-nums text-a24-muted dark:text-a24-dark-muted font-light shrink-0"
                        style={{ fontFamily: 'var(--font-space), monospace' }}
                      >
                        {company.count} <span className="text-a24-muted/40">jobs</span>
                      </span>
                    </Link>
                  ))}
                </div>
                {data.topCompanies.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-a24-muted/40">No data available</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* CTA Buttons */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {[
              { href: '/learn/career', icon: Compass, label: 'Explore by Role' },
              { href: '/learn/skills', icon: Wrench, label: 'Explore by Skill' },
            ].map((btn) => {
              const Icon = btn.icon
              return (
                <Link key={btn.href} href={btn.href} className="flex-1">
                  <div className="group flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg border border-white/[0.06] hover:border-cyan-500/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300">
                    <Icon className="w-4 h-4 text-a24-muted dark:text-a24-dark-muted group-hover:text-cyan-400 transition-colors" />
                    <span className="text-sm font-medium text-a24-text dark:text-a24-dark-text group-hover:text-cyan-400 transition-colors tracking-wide">
                      {btn.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Footer line */}
        <div className="text-center">
          <p className="text-[10px] text-a24-muted/30 dark:text-a24-dark-muted/30 uppercase tracking-[0.3em] font-light">
            live data · updated hourly
          </p>
        </div>

      </main>
      <Footer />
    </div>
  )
}
