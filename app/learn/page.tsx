import Link from 'next/link'
import { Compass, Wrench, TrendingUp } from 'lucide-react'
import Footer from '@/app/components/Footer'
import { createPublicSupabaseClient } from '@/lib/supabase-public'

export const revalidate = 3600 // ISR: refresh every hour

async function getLearnStats() {
  const supabase = createPublicSupabaseClient()

  const now = new Date()
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  // Parallel queries
  const [totalRes, recentRes, prevRes, salaryRes] = await Promise.all([
    // Total active jobs
    supabase
      .from('Job')
      .select('id', { count: 'exact', head: true })
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString()),

    // Recent jobs with details (last 3 months)
    supabase
      .from('Job')
      .select('id, title, tags, description')
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString()),

    // Previous period jobs (3-6 months ago)
    supabase
      .from('Job')
      .select('id, title, tags, description')
      .eq('isActive', true)
      .gte('crawledAt', sixMonthsAgo.toISOString())
      .lt('crawledAt', threeMonthsAgo.toISOString()),

    // Jobs with salary data
    supabase
      .from('Job')
      .select('salaryMin, salaryMax, salaryCurrency')
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString())
      .not('salaryMax', 'is', null)
      .gt('salaryMax', 0),
  ])

  const totalJobs = totalRes.count || 0
  const recentJobs = recentRes.data || []
  const prevJobs = prevRes.data || []
  const salaryJobs = salaryRes.data || []

  // Count Solidity jobs
  const solidityCount = recentJobs.filter(j => {
    const text = [j.title || '', j.tags || '', j.description || ''].join(' ').toLowerCase()
    return text.includes('solidity')
  }).length

  // Calculate Rust growth
  const recentRust = recentJobs.filter(j => {
    const text = [j.title || '', j.tags || '', j.description || ''].join(' ').toLowerCase()
    return text.includes('rust')
  }).length

  const prevRust = prevJobs.filter(j => {
    const text = [j.title || '', j.tags || '', j.description || ''].join(' ').toLowerCase()
    return text.includes('rust')
  }).length

  const rustGrowth = prevRust > 0
    ? Math.round(((recentRust / recentJobs.length) - (prevRust / prevJobs.length)) / (prevRust / prevJobs.length) * 100)
    : recentRust > 0 ? 100 : 0

  // Average salary (convert to USD/K)
  const validSalaries = salaryJobs
    .map(j => j.salaryMax)
    .filter((s): s is number => typeof s === 'number' && s > 0 && s < 1000000)

  const avgSalary = validSalaries.length > 0
    ? Math.round(validSalaries.reduce((a, b) => a + b, 0) / validSalaries.length / 1000)
    : 0

  return { totalJobs, solidityCount, rustGrowth, avgSalary }
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`
  return n.toLocaleString()
}

const navButtons = [
  {
    href: '/learn/career',
    icon: Compass,
    label: 'Explore by Role',
  },
  {
    href: '/learn/skills',
    icon: Wrench,
    label: 'Explore by Skill',
  },
  {
    href: '/learn/trends',
    icon: TrendingUp,
    label: 'See Trends',
  },
]

export default async function LearnPage() {
  const stats = await getLearnStats()

  const statCards = [
    {
      value: formatNumber(stats.totalJobs),
      label: 'jobs',
      sublabel: 'analyzed',
      accent: 'emerald',
    },
    {
      value: formatNumber(stats.solidityCount),
      label: 'Solidity',
      sublabel: 'jobs',
      accent: 'blue',
    },
    {
      value: `${stats.rustGrowth > 0 ? '+' : ''}${stats.rustGrowth}%`,
      label: 'Rust',
      sublabel: 'growth',
      accent: 'amber',
    },
    {
      value: stats.avgSalary > 0 ? `$${stats.avgSalary}K` : 'N/A',
      label: 'avg',
      sublabel: 'salary',
      accent: 'purple',
    },
  ]

  const accentMap: Record<string, { border: string; text: string; glow: string; bg: string }> = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/60',
      text: 'text-emerald-600 dark:text-emerald-400',
      glow: 'hover:shadow-emerald-500/10',
      bg: 'bg-emerald-500/5',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/60',
      text: 'text-blue-600 dark:text-blue-400',
      glow: 'hover:shadow-blue-500/10',
      bg: 'bg-blue-500/5',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/60',
      text: 'text-amber-600 dark:text-amber-400',
      glow: 'hover:shadow-amber-500/10',
      bg: 'bg-amber-500/5',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/60',
      text: 'text-purple-600 dark:text-purple-400',
      glow: 'hover:shadow-purple-500/10',
      bg: 'bg-purple-500/5',
    },
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="container-responsive py-20 sm:py-28 md:py-36">

        {/* Minimal header */}
        <div className="mb-12 md:mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted mb-3 font-light">
            web3 labor market
          </p>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-a24-text dark:text-a24-dark-text">
            Market Intelligence
          </h1>
        </div>

        {/* Bloomberg-style stat cards */}
        <section className="mb-16 md:mb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
            {statCards.map((card, i) => {
              const colors = accentMap[card.accent]
              return (
                <div
                  key={i}
                  className={`
                    group relative p-5 md:p-6 border transition-all duration-300
                    ${colors.border} ${colors.glow} ${colors.bg}
                    hover:shadow-lg
                  `}
                >
                  {/* Top accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-px ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity`}
                    style={{ background: `linear-gradient(90deg, transparent, var(--tw-shadow-color, currentColor), transparent)` }}
                  />

                  <div className={`text-2xl md:text-3xl lg:text-4xl font-light tracking-tight ${colors.text} mb-2 tabular-nums`}>
                    {card.value}
                  </div>
                  <div className="text-xs text-a24-muted dark:text-a24-dark-muted uppercase tracking-widest font-light leading-relaxed">
                    {card.label}
                    <br />
                    {card.sublabel}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Navigation buttons */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row gap-3">
            {navButtons.map((btn) => {
              const Icon = btn.icon
              return (
                <Link key={btn.href} href={btn.href} className="flex-1">
                  <div className="group flex items-center justify-center gap-3 px-6 py-4 border border-a24-border dark:border-a24-dark-border hover:border-neun-success/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
                    <Icon className="w-4 h-4 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors" />
                    <span className="text-sm font-medium text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors tracking-wide">
                      {btn.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Powered by line */}
        <div className="text-center">
          <p className="text-[10px] text-a24-muted/50 dark:text-a24-dark-muted/50 uppercase tracking-[0.3em] font-light">
            live data &middot; updated hourly
          </p>
        </div>

      </main>
      <Footer />
    </div>
  )
}
