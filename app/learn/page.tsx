import Link from 'next/link'
import { Compass, Wrench } from 'lucide-react'
import Footer from '@/app/components/Footer'
import { createPublicSupabaseClient } from '@/lib/supabase-public'
import LearnCountUp from './LearnCountUp'
import LearnTicker from './LearnTicker'
import { SkillBarChart, RoleDistributionChart } from './LearnCharts'
import Pixelbara from '@/app/components/Pixelbara'

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

// Role keywords for job distribution
const roleKeywords: Record<string, string[]> = {
  'Frontend': ['frontend', 'front-end', 'front end', 'react developer', 'ui engineer'],
  'Backend': ['backend', 'back-end', 'back end', 'server-side', 'api engineer'],
  'Full Stack': ['full stack', 'fullstack', 'full-stack'],
  'Smart Contract': ['smart contract', 'solidity developer', 'blockchain engineer'],
  'DevOps / Infra': ['devops', 'infrastructure', 'sre', 'site reliability', 'platform engineer'],
  'Data / ML': ['data engineer', 'machine learning', 'data scientist', 'analytics'],
  'Security': ['security engineer', 'auditor', 'pentester', 'security'],
  'Product / Design': ['product manager', 'product designer', 'ux designer', 'ui/ux'],
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
      let change = 0
      if (prevCount > 0 && normalizedPrev > 0) {
        change = Math.round(((normalizedRecent - normalizedPrev) / normalizedPrev) * 100)
      }
      return {
        skill,
        count,
        percentage: Math.round((count / maxCount) * 100),
        change,
      }
    })

  // Role distribution
  const roleCounts: Record<string, number> = {}
  for (const job of recentJobs) {
    const text = [job.title || '', job.description || ''].join(' ').toLowerCase()
    for (const [role, keywords] of Object.entries(roleKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        roleCounts[role] = (roleCounts[role] || 0) + 1
      }
    }
  }
  const roleDistribution = Object.entries(roleCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([role, count]) => ({ role, count }))

  // Top hiring companies
  const companyCounts: Record<string, number> = {}
  for (const job of recentJobs) {
    if (job.company) {
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1
    }
  }
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))

  // Avg salary
  const validSalaries = salaryJobs
    .map(j => j.salaryMax)
    .filter((s): s is number => typeof s === 'number' && s > 0 && s < 1000000)
  const avgSalary = validSalaries.length > 0
    ? Math.round(validSalaries.reduce((a, b) => a + b, 0) / validSalaries.length / 1000)
    : 0

  return { totalJobs, uniqueCompanies, avgSalary, trendingSkills, topCompanies, roleDistribution }
}

// Meme copy for skills
function getMemeCopy(change: number): string | null {
  if (change >= 30) return 'few understand'
  if (change >= 15) return 'wagmi'
  if (change <= -20) return 'ngmi'
  return null
}

export default async function LearnPage() {
  const data = await getLearnData()

  const tickerItems = data.trendingSkills.map(s => ({
    skill: s.skill,
    count: s.count,
    change: s.change,
    isNew: false,
  }))

  const chartData = data.trendingSkills.map(s => ({
    skill: s.skill,
    count: s.count,
    change: s.change,
  }))

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      {/* Ticker Bar */}
      <LearnTicker items={tickerItems} />

      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-10">

        {/* Header — compact */}
        <header className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-light uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text">
                Trends
              </h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-neun-success animate-pulse" />
                <span className="text-[9px] text-a24-muted dark:text-a24-dark-muted uppercase tracking-widest font-light">
                  live
                </span>
              </div>
            </div>
            <p className="text-[10px] text-a24-muted/60 dark:text-a24-dark-muted/60 font-light tracking-wide">
              Based on <span className="text-a24-text dark:text-a24-dark-text font-medium">{data.totalJobs.toLocaleString()}+</span> jobs from VC-backed companies · Weighted by a16z, Paradigm, Sequoia portfolio
            </p>
          </div>
          <div className="hidden md:block">
            <Pixelbara pose="coding" size={48} />
          </div>
        </header>

        {/* Stats row — 3 items inline */}
        <section className="mb-5 grid grid-cols-3 gap-3">
          <div className="px-3 py-2.5 border border-a24-border dark:border-a24-dark-border rounded">
            <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-1">Active Jobs</p>
            <LearnCountUp value={data.totalJobs} className="text-lg font-light tabular-nums text-a24-text dark:text-a24-dark-text" />
          </div>
          <div className="px-3 py-2.5 border border-a24-border dark:border-a24-dark-border rounded">
            <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-1">Companies</p>
            <LearnCountUp value={data.uniqueCompanies} className="text-lg font-light tabular-nums text-a24-text dark:text-a24-dark-text" />
          </div>
          <div className="px-3 py-2.5 border border-a24-border dark:border-a24-dark-border rounded">
            <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-1">Avg Salary</p>
            {data.avgSalary > 0 ? (
              <span className="text-lg font-light tabular-nums text-a24-text dark:text-a24-dark-text">
                $<LearnCountUp value={data.avgSalary} className="text-lg font-light tabular-nums" />K
              </span>
            ) : (
              <span className="text-lg font-light text-a24-muted/40">N/A</span>
            )}
          </div>
        </section>

        {/* Charts row — skill bar + role distribution */}
        <section className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Skill demand bar chart */}
          <div className="border border-a24-border dark:border-a24-dark-border rounded p-4">
            <h2 className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-3">
              Skill Demand (Top 8)
            </h2>
            <SkillBarChart data={chartData} />
          </div>

          {/* Role distribution */}
          <div className="border border-a24-border dark:border-a24-dark-border rounded p-4">
            <h2 className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-3">
              Job Distribution by Role
            </h2>
            {data.roleDistribution.length > 0 ? (
              <RoleDistributionChart data={data.roleDistribution} />
            ) : (
              <p className="text-xs text-a24-muted/40 py-8 text-center">No role data</p>
            )}
          </div>
        </section>

        {/* Main content: Skills table + Side panels */}
        <section className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Skills Table */}
            <div className="lg:col-span-8">
              <div className="border border-a24-border dark:border-a24-dark-border rounded overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border">
                  <div className="col-span-1 text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted font-light">#</div>
                  <div className="col-span-3 text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted font-light">Skill</div>
                  <div className="col-span-2 text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted font-light text-right">Jobs</div>
                  <div className="col-span-2 text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted font-light text-right">90d</div>
                  <div className="col-span-2 text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted font-light">Demand</div>
                  <div className="col-span-2 text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted font-light text-right">Learn</div>
                </div>

                {/* Table rows */}
                {data.trendingSkills.map((skill, i) => {
                  const meme = getMemeCopy(skill.change)
                  return (
                    <div
                      key={skill.skill}
                      className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-a24-border/30 dark:border-a24-dark-border/30 last:border-0 hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50 transition-colors duration-150 group"
                    >
                      {/* Rank */}
                      <div className="col-span-1 text-xs tabular-nums text-a24-muted/40 font-light" style={{ fontFamily: 'var(--font-space), monospace' }}>
                        {i + 1}
                      </div>

                      {/* Skill name + meme */}
                      <div className="col-span-5 sm:col-span-3 flex items-center gap-2">
                        <Link
                          href={`/jobs?search=${encodeURIComponent(skill.skill)}`}
                          className="text-sm font-medium text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors cursor-pointer"
                        >
                          {skill.skill}
                        </Link>
                        {meme && (
                          <span className="hidden sm:inline text-[9px] italic text-a24-muted/50 dark:text-a24-dark-muted/50">
                            {meme}
                          </span>
                        )}
                        {/* Mobile inline change */}
                        <span className="sm:hidden ml-auto">
                          {skill.change > 0 ? (
                            <span className="text-[10px] font-medium text-neun-success">+{skill.change}%</span>
                          ) : skill.change < 0 ? (
                            <span className="text-[10px] font-medium text-red-400">{skill.change}%</span>
                          ) : null}
                        </span>
                      </div>

                      {/* Jobs count */}
                      <div className="col-span-3 sm:col-span-2 text-right">
                        <span className="text-sm tabular-nums font-medium text-a24-text dark:text-a24-dark-text" style={{ fontFamily: 'var(--font-space), monospace' }}>
                          {skill.count.toLocaleString()}
                        </span>
                      </div>

                      {/* Change — desktop */}
                      <div className="hidden sm:block col-span-2 text-right">
                        {skill.change > 0 ? (
                          <span className="text-xs tabular-nums font-medium text-neun-success" style={{ fontFamily: 'var(--font-space), monospace' }}>
                            +{skill.change}%
                          </span>
                        ) : skill.change < 0 ? (
                          <span className="text-xs tabular-nums font-medium text-red-400" style={{ fontFamily: 'var(--font-space), monospace' }}>
                            {skill.change}%
                          </span>
                        ) : (
                          <span className="text-xs tabular-nums text-a24-muted/30">—</span>
                        )}
                      </div>

                      {/* Demand bar */}
                      <div className="col-span-3 sm:col-span-2">
                        <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${skill.percentage}%`,
                              backgroundColor: skill.change > 0 ? '#22c55e' : skill.change < 0 ? '#ef4444' : '#64748b',
                            }}
                          />
                        </div>
                      </div>

                      {/* Learn link */}
                      <div className="hidden sm:block col-span-2 text-right">
                        <Link
                          href={`/learn/skills/${encodeURIComponent(skill.skill.toLowerCase())}`}
                          className="text-[10px] uppercase tracking-[0.15em] text-neun-success hover:text-emerald-300 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          Learn &rarr;
                        </Link>
                      </div>
                    </div>
                  )
                })}

                {data.trendingSkills.length === 0 && (
                  <div className="px-4 py-12 text-center">
                    <p className="text-sm text-a24-muted/40">No skill data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Side panel */}
            <div className="lg:col-span-4 space-y-4">
              {/* Top Hiring */}
              <div className="border border-a24-border dark:border-a24-dark-border rounded overflow-hidden">
                <div className="px-4 py-2.5 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border">
                  <h2 className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light">
                    Top Hiring
                  </h2>
                </div>
                <div className="divide-y divide-a24-border/30 dark:divide-a24-dark-border/30">
                  {data.topCompanies.map((company, i) => (
                    <Link
                      key={company.name}
                      href={`/jobs?search=${encodeURIComponent(company.name)}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50 transition-colors duration-150 cursor-pointer group"
                    >
                      <span className="text-[10px] tabular-nums text-a24-muted/30 w-4 text-right font-light" style={{ fontFamily: 'var(--font-space), monospace' }}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors truncate flex-1 font-light">
                        {company.name}
                      </span>
                      <span className="text-[10px] tabular-nums text-a24-muted dark:text-a24-dark-muted font-light shrink-0" style={{ fontFamily: 'var(--font-space), monospace' }}>
                        {company.count}
                      </span>
                    </Link>
                  ))}
                </div>
                {data.topCompanies.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-a24-muted/40">No data</p>
                  </div>
                )}
              </div>

              {/* Pixelbara + explore CTA */}
              <div className="border border-a24-border dark:border-a24-dark-border rounded p-4 text-center">
                <div className="flex justify-center mb-3">
                  <Pixelbara pose="coding" size={64} clickable />
                </div>
                <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted italic mb-3">
                  &quot;learn the meta, ser&quot;
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/learn/career"
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-a24-border dark:border-a24-dark-border rounded hover:border-neun-success/30 hover:bg-neun-success/5 transition-all duration-200 cursor-pointer group"
                  >
                    <Compass className="w-3.5 h-3.5 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors font-light">
                      Explore by Role
                    </span>
                  </Link>
                  <Link
                    href="/learn/skills"
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-a24-border dark:border-a24-dark-border rounded hover:border-neun-success/30 hover:bg-neun-success/5 transition-all duration-200 cursor-pointer group"
                  >
                    <Wrench className="w-3.5 h-3.5 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors font-light">
                      Explore by Skill
                    </span>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Footer line */}
        <div className="text-center">
          <p className="text-[9px] text-a24-muted/30 dark:text-a24-dark-muted/30 uppercase tracking-[0.3em] font-light">
            90-day rolling window · updated hourly
          </p>
        </div>

      </main>
      <Footer />
    </div>
  )
}
