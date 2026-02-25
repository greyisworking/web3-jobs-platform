import Link from 'next/link'
import { Compass, Wrench, TrendingUp, Zap, Star } from 'lucide-react'
import Footer from '@/app/components/Footer'
import { createPublicSupabaseClient } from '@/lib/supabase-public'
import LearnCountUp from './LearnCountUp'

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

  const now = new Date()
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [totalRes, recentRes, prevRes, salaryRes, companiesRes] = await Promise.all([
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
    supabase
      .from('Job')
      .select('company')
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString()),
  ])

  const totalJobs = totalRes.count || 0
  const recentJobs = recentRes.data || []
  const prevJobs = prevRes.data || []
  const salaryJobs = salaryRes.data || []
  const uniqueCompanies = new Set((companiesRes.data || []).map(j => j.company)).size

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

  // Extract skills from previous period for trend comparison
  const prevSkillCounts: Record<string, number> = {}
  for (const job of prevJobs) {
    const text = [job.title || '', job.tags || '', job.description || ''].join(' ').toLowerCase()
    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        prevSkillCounts[skill] = (prevSkillCounts[skill] || 0) + 1
      }
    }
  }

  // Build trending skills with badges
  const maxCount = Math.max(...Object.values(skillCounts), 1)
  const trendingSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => {
      const prevCount = prevSkillCounts[skill] || 0
      const normalizedRecent = recentJobs.length > 0 ? count / recentJobs.length : 0
      const normalizedPrev = prevJobs.length > 0 ? prevCount / prevJobs.length : 0
      let badge: 'rising' | 'new' | null = null
      if (prevCount === 0 && count > 0) badge = 'new'
      else if (normalizedPrev > 0 && ((normalizedRecent - normalizedPrev) / normalizedPrev) > 0.2) badge = 'rising'

      return { skill, count, percentage: Math.round((count / maxCount) * 100), badge }
    })

  // Avg salary
  const validSalaries = salaryJobs
    .map(j => j.salaryMax)
    .filter((s): s is number => typeof s === 'number' && s > 0 && s < 1000000)
  const avgSalary = validSalaries.length > 0
    ? Math.round(validSalaries.reduce((a, b) => a + b, 0) / validSalaries.length / 1000)
    : 0

  return { totalJobs, uniqueCompanies, avgSalary, trendingSkills }
}

const navButtons = [
  { href: '/learn/career', icon: Compass, label: 'Explore by Role' },
  { href: '/learn/skills', icon: Wrench, label: 'Explore by Skill' },
  { href: '/learn/trends', icon: TrendingUp, label: 'See Trends' },
]

export default async function LearnPage() {
  const data = await getLearnData()

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-[0.03] dark:opacity-[0.06] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, #06b6d4, transparent 70%)' }} />

      <main id="main-content" className="container-responsive relative py-20 sm:py-28 md:py-36">

        {/* Header */}
        <header className="mb-16 md:mb-20">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-space), sans-serif', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            TALENT MARKET
          </h1>
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted font-light tracking-wide">
            skills in demand · powered by VC-backed job data
          </p>
        </header>

        {/* Asymmetric grid: hero stats */}
        <section className="mb-16 md:mb-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
            {/* Large card — total jobs */}
            <div className="md:col-span-5 relative p-6 md:p-8 rounded-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(139,92,246,0.06))' }}>
              <div className="absolute inset-0 rounded-lg" style={{ padding: '1px', background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.3))', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
              <p className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted mb-3 font-light">positions analyzed</p>
              <div className="mb-1" style={{ fontFamily: 'var(--font-space), monospace' }}>
                <LearnCountUp value={data.totalJobs} className="text-5xl md:text-6xl lg:text-7xl font-bold tabular-nums" gradient />
              </div>
              <p className="text-xs text-a24-muted/60 dark:text-a24-dark-muted/60 font-light">last 90 days</p>
            </div>

            {/* Right column — 2 smaller cards stacked */}
            <div className="md:col-span-7 grid grid-cols-2 gap-3 md:gap-4">
              {/* Companies */}
              <div className="relative p-5 md:p-6 rounded-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.04), rgba(139,92,246,0.04))' }}>
                <div className="absolute inset-0 rounded-lg" style={{ padding: '1px', background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
                <p className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted mb-3 font-light">companies hiring</p>
                <div style={{ fontFamily: 'var(--font-space), monospace' }}>
                  <LearnCountUp value={data.uniqueCompanies} className="text-3xl md:text-4xl font-bold tabular-nums" gradient />
                </div>
              </div>

              {/* Avg salary */}
              <div className="relative p-5 md:p-6 rounded-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(6,182,212,0.04))' }}>
                <div className="absolute inset-0 rounded-lg" style={{ padding: '1px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
                <p className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted mb-3 font-light">avg salary</p>
                <div style={{ fontFamily: 'var(--font-space), monospace' }}>
                  <span className="text-3xl md:text-4xl font-bold tabular-nums" style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {data.avgSalary > 0 ? `$${data.avgSalary}K` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Skills tracked */}
              <div className="col-span-2 relative p-5 md:p-6 rounded-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.03), rgba(139,92,246,0.03))' }}>
                <div className="absolute inset-0 rounded-lg" style={{ padding: '1px', background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-a24-muted dark:text-a24-dark-muted mb-1 font-light">skills tracked</p>
                    <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-space), monospace', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {data.trendingSkills.length}+
                    </span>
                  </div>
                  <p className="text-xs text-a24-muted/50 dark:text-a24-dark-muted/50 font-light text-right max-w-[200px]">
                    extracted from job descriptions using keyword analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Skills */}
        <section className="mb-16 md:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-lg font-semibold text-a24-text dark:text-a24-dark-text tracking-tight" style={{ fontFamily: 'var(--font-space), sans-serif' }}>
              TRENDING SKILLS
            </h2>
            <div className="flex-1 h-px bg-a24-border dark:bg-a24-dark-border" />
          </div>

          <div className="space-y-3">
            {data.trendingSkills.map((skill, i) => (
              <div key={skill.skill} className="group flex items-center gap-4">
                {/* Rank */}
                <span className="text-[10px] tabular-nums text-a24-muted/40 dark:text-a24-dark-muted/40 w-4 text-right font-light" style={{ fontFamily: 'var(--font-space), monospace' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Skill name */}
                <span className="text-sm font-medium text-a24-text dark:text-a24-dark-text w-24 sm:w-32 truncate">
                  {skill.skill}
                </span>

                {/* Progress bar */}
                <div className="flex-1 h-6 rounded-sm overflow-hidden bg-a24-surface dark:bg-a24-dark-surface relative" role="progressbar" aria-valuenow={skill.percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${skill.skill}: ${skill.count} jobs`}>
                  <div
                    className="h-full rounded-sm transition-all duration-700 ease-out"
                    style={{ width: `${skill.percentage}%`, background: `linear-gradient(90deg, rgba(6,182,212,${0.3 + (skill.percentage / 200)}), rgba(139,92,246,${0.3 + (skill.percentage / 200)}))` }}
                  />
                </div>

                {/* Count */}
                <LearnCountUp value={skill.count} className="text-sm tabular-nums font-semibold text-a24-text dark:text-a24-dark-text w-12 text-right" />

                {/* Badge */}
                <div className="w-14">
                  {skill.badge === 'rising' && (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-medium text-cyan-600 dark:text-cyan-400">
                      <Zap className="w-2.5 h-2.5" />
                      rising
                    </span>
                  )}
                  {skill.badge === 'new' && (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-medium text-purple-600 dark:text-purple-400">
                      <Star className="w-2.5 h-2.5" />
                      new
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Buttons */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row gap-3">
            {navButtons.map((btn) => {
              const Icon = btn.icon
              return (
                <Link key={btn.href} href={btn.href} className="flex-1">
                  <div className="group relative flex items-center justify-center gap-3 px-6 py-4 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5">
                    {/* Gradient border */}
                    <div className="absolute inset-0 rounded-lg" style={{ padding: '1px', background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', transition: 'background 0.3s' }} />
                    <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ padding: '1px', background: 'linear-gradient(135deg, rgba(6,182,212,0.5), rgba(139,92,246,0.5))', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
                    <Icon className="w-4 h-4 text-a24-muted dark:text-a24-dark-muted group-hover:text-cyan-500 transition-colors" />
                    <span className="text-sm font-medium text-a24-text dark:text-a24-dark-text group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors tracking-wide">
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
          <p className="text-[10px] text-a24-muted/40 dark:text-a24-dark-muted/40 uppercase tracking-[0.3em] font-light">
            live data · updated hourly
          </p>
        </div>

      </main>
      <Footer />
    </div>
  )
}
