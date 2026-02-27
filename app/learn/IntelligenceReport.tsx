'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Zap, BarChart3, Globe } from 'lucide-react'
import type { IntelligenceData, RoleInsight, SkillLevelEntry, RegionSalaryData, RegionRolesData } from '@/lib/intelligence-data'

const ROLE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'engineering', label: 'Engineering' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'bd', label: 'BD' },
  { key: 'ops', label: 'Ops' },
] as const

const LEVELS = ['entry', 'mid', 'senior', 'lead'] as const
const LEVEL_LABELS: Record<string, string> = { entry: 'Entry', mid: 'Mid', senior: 'Senior', lead: 'Lead' }

// ── Meme text pools ──
const HEATMAP_MEMES = [
  'ser, the numbers don\'t lie',
  'few understand this data',
  'wagmi if you learn these',
]
const SALARY_MEMES = [
  'location matters ser',
  'remote = freedom + money',
]
const MATURITY_MEMES = [
  'follow the hiring trends',
  'alpha in plain sight',
]

function pickMeme(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Heatmap Cell with tooltip ──
interface HeatmapCellProps {
  value: number
  delay: number
  skill: string
  level: string
  topCompanies: { name: string; count: number }[]
  avgSalaryRange: string
  jobCount: number
  activeRole: string
}

function HeatmapCell({ value, delay, skill, level, topCompanies, avgSalaryRange, jobCount, activeRole }: HeatmapCellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px 800px 0px' })
  const [displayed, setDisplayed] = useState(0)
  const [micro, setMicro] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (!inView || value === 0) return
    const duration = 1500
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const elapsed = now - start - delay
      if (elapsed < 0) { raf = requestAnimationFrame(tick); return }
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(value * eased * 10) / 10)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, delay])

  useEffect(() => {
    if (!inView || value === 0 || hovered) return
    const id = setInterval(() => {
      setMicro((Math.random() - 0.5) * 0.6)
    }, 2000 + Math.random() * 1000)
    return () => clearInterval(id)
  }, [inView, value, hovered])

  const final = value === 0 ? 0 : Math.max(0, hovered ? value : displayed + micro)
  const intensity = value === 0 ? 0 : Math.min(value / 55, 1)
  const isHot = value >= 40
  const approxJobs = Math.round(jobCount * value / 100)

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center py-3 px-1 sm:py-4 sm:px-2 rounded-sm transition-colors duration-300 cursor-pointer"
      style={value > 0 ? { backgroundColor: `rgba(34, 197, 94, ${0.04 + intensity * 0.22})` } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isHot && (
        <motion.div
          className="absolute inset-0.5 rounded-sm"
          animate={{ boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 6px rgba(34,197,94,0.25)', '0 0 0px rgba(34,197,94,0)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span
        className={`text-[10px] sm:text-xs tabular-nums relative z-10 ${
          value === 0 ? 'text-a24-muted/15 dark:text-a24-dark-muted/15'
          : isHot ? 'text-neun-success font-semibold'
          : value >= 20 ? 'text-neun-success/80 font-medium'
          : 'text-a24-muted dark:text-a24-dark-muted'
        }`}
        style={{ fontFamily: 'var(--font-space), monospace' }}
      >
        {value === 0 ? '\u2014' : <>{final.toFixed(1)}<span className="hidden sm:inline">%</span></>}
      </span>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && value > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 hidden sm:block"
          >
            <div className="bg-a24-dark-bg border border-a24-dark-border rounded-lg shadow-xl p-3.5">
              <p className="text-sm font-semibold text-a24-dark-text mb-2">
                {skill} × {LEVEL_LABELS[level]}
              </p>
              <div className="space-y-1.5 text-xs text-a24-dark-muted">
                <p>
                  <span className="text-neun-success font-medium">{value}%</span> of jobs require this
                </p>
                {topCompanies.length > 0 && (
                  <p>
                    Top hiring: {topCompanies.slice(0, 3).map(c => c.name).join(', ')}
                  </p>
                )}
                <p>{avgSalaryRange}</p>
              </div>
              <Link
                href={`/jobs?skill=${encodeURIComponent(skill.toLowerCase())}${activeRole !== 'all' ? `&role=${activeRole}` : ''}`}
                className="mt-2.5 block text-[10px] uppercase tracking-wider text-neun-success hover:text-neun-success/80 transition-colors"
              >
                See {approxJobs > 0 ? `~${approxJobs}` : ''} jobs &nearr;
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Animated count-up for salary bars ──
function CountUp({ target, prefix = '', suffix = '', duration = 1200 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref as React.RefObject<HTMLElement>, { once: true, margin: '0px 0px 800px 0px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView || target === 0) return
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, duration])

  return <span ref={ref} style={{ fontFamily: 'var(--font-space), monospace' }}>{prefix}{target === 0 ? 'N/A' : `${val.toLocaleString()}${suffix}`}</span>
}

// ── Live Clock ──
function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span style={{ fontFamily: 'var(--font-space), monospace' }}>{time}</span>
}

// ── Salary Bar ──
function SalaryBar({ item, maxSalary, delay }: { item: RegionSalaryData; maxSalary: number; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<HTMLElement>, { once: true, margin: '0px 0px 800px 0px' })
  const barWidth = maxSalary > 0 && item.avgSalary > 0 ? (item.avgSalary / maxSalary) * 100 : 0

  return (
    <Link
      href={`/jobs?location=${encodeURIComponent(item.label)}`}
      className="group block px-5 py-4 hover:bg-a24-surface/30 dark:hover:bg-a24-dark-surface/30 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm sm:text-base font-medium text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors">
          {item.flag} {item.label}
          <span className="ml-2 text-xs text-a24-muted/40 dark:text-a24-dark-muted/40 tabular-nums" style={{ fontFamily: 'var(--font-space), monospace' }}>
            ({item.jobCount})
          </span>
        </span>
        <span className="text-sm tabular-nums text-a24-text dark:text-a24-dark-text font-semibold">
          <CountUp target={item.avgSalary > 0 ? Math.round(item.avgSalary / 1000) : 0} prefix="$" suffix="K" />
        </span>
      </div>
      <div ref={ref} className="h-2.5 rounded-full bg-a24-border/20 dark:bg-a24-dark-border/20 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-neun-success"
          initial={{ width: 0 }}
          animate={inView ? { width: `${barWidth}%` } : { width: 0 }}
          transition={{ duration: 0.8, delay: delay * 0.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </Link>
  )
}

// ── Market Maturity Row (expandable on hover) ──
function MarketMaturityRow({ item, delay }: { item: RegionRolesData; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<HTMLElement>, { once: true, margin: '0px 0px 800px 0px' })
  const [expanded, setExpanded] = useState(false)
  const barOpacities = [1, 0.7, 0.45, 0.3, 0.2]

  return (
    <div
      className="group px-5 py-3.5 hover:bg-a24-surface/30 dark:hover:bg-a24-dark-surface/30 transition-colors cursor-pointer"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Compact row: flag + stacked bars */}
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-medium text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors shrink-0 w-24 sm:w-28">
          {item.flag} {item.label}
        </span>
        <div ref={ref} className="flex-1 flex items-center gap-1 min-w-0">
          {item.roles.map((role, i) => (
            <motion.div
              key={role.name}
              className="relative h-7 rounded-sm"
              initial={{ width: 0 }}
              animate={inView ? { width: `${role.percentage}%` } : { width: 0 }}
              transition={{ duration: 0.6, delay: delay * 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{
                minWidth: role.percentage > 5 ? '28px' : '0',
                backgroundColor: `rgba(34, 197, 94, ${barOpacities[i] ?? 0.2})`,
              }}
              title={`${role.name} ${role.percentage}%`}
            >
              {role.percentage >= 15 && (
                <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] text-a24-dark-bg font-semibold truncate px-1">
                  {role.name}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expanded detail on hover */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-a24-border/20 dark:border-a24-dark-border/20 space-y-2">
              {item.roles.map((role, i) => (
                <div key={role.name} className="flex items-center gap-2">
                  <span className="text-xs text-a24-muted dark:text-a24-dark-muted w-28 sm:w-32 shrink-0 truncate">{role.name}</span>
                  <div className="flex-1 h-4 bg-a24-border/10 dark:bg-a24-dark-border/10 rounded-sm overflow-hidden">
                    <motion.div
                      className="h-full rounded-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${role.percentage}%` }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      style={{ backgroundColor: `rgba(34, 197, 94, ${barOpacities[i] ?? 0.2})` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-a24-muted dark:text-a24-dark-muted w-10 text-right" style={{ fontFamily: 'var(--font-space), monospace' }}>
                    {role.percentage}%
                  </span>
                </div>
              ))}
              <Link
                href={`/jobs?location=${encodeURIComponent(item.label)}`}
                className="block text-[10px] uppercase tracking-wider text-neun-success hover:text-neun-success/80 transition-colors pt-1"
              >
                See {item.label} jobs &nearr;
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Component ──
export default function IntelligenceReport({ data }: { data: IntelligenceData }) {
  const [activeRole, setActiveRole] = useState<string>('all')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const heatmapMeme = useMemo(() => pickMeme(HEATMAP_MEMES), [])
  const salaryMeme = useMemo(() => pickMeme(SALARY_MEMES), [])
  const maturityMeme = useMemo(() => pickMeme(MATURITY_MEMES), [])

  const role: RoleInsight | undefined = data.roles[activeRole]

  function switchRole(key: string) {
    if (key === activeRole) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveRole(key)
      setIsTransitioning(false)
    }, 150)
  }

  if (!role) return null

  const maxSalary = Math.max(...role.regionSalaries.map(r => r.avgSalary), 1)
  const avgSalaryRange = role.avgSalaryMin > 0 && role.avgSalaryMax > 0
    ? `$${Math.round(role.avgSalaryMin / 1000)}K - $${Math.round(role.avgSalaryMax / 1000)}K avg`
    : 'Salary data limited'

  return (
    <div className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Role Tabs */}
      <nav role="tablist" className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {ROLE_TABS.map(tab => {
          const isActive = activeRole === tab.key
          const tabRole = data.roles[tab.key]
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => switchRole(tab.key)}
              className={`
                shrink-0 px-5 py-2.5 rounded text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer
                ${isActive
                  ? 'bg-neun-success/10 text-neun-success border border-neun-success/30'
                  : 'text-a24-muted dark:text-a24-dark-muted border border-a24-border dark:border-a24-dark-border hover:border-neun-success/20 hover:text-a24-text dark:hover:text-a24-dark-text'
                }
              `}
            >
              {tab.label}
              {tabRole && (
                <span className={`ml-1.5 text-[10px] tabular-nums ${isActive ? 'text-neun-success/70' : 'text-a24-muted/40 dark:text-a24-dark-muted/40'}`} style={{ fontFamily: 'var(--font-space), monospace' }}>
                  {tabRole.jobCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Main 50/50 Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT: Skill × Level Heatmap */}
        <div>
          <div className="border border-a24-border dark:border-a24-dark-border rounded overflow-hidden">
            {/* Header */}
            <div className="px-5 py-5 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border">
              <div className="flex items-center gap-2.5 mb-2">
                <Zap className="w-5 h-5 text-neun-success" />
                <h2 className="text-sm sm:text-base uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-bold">
                  A Secret Weapon for Career Advancement
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-a24-muted/40 dark:text-a24-dark-muted/40">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-neun-success animate-pulse" />
                <span style={{ fontFamily: 'var(--font-space), monospace' }}>
                  Live from {data.totalJobs.toLocaleString()} jobs
                </span>
                <span>&middot;</span>
                <LiveClock />
              </div>
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-[minmax(90px,1.5fr)_repeat(4,minmax(40px,1fr))] sm:grid-cols-[minmax(140px,1.5fr)_repeat(4,1fr)] px-3 py-2 border-b border-a24-border/30 dark:border-a24-dark-border/30">
                <span />
                {LEVELS.map(level => (
                  <span
                    key={level}
                    className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-a24-muted/50 dark:text-a24-dark-muted/50 text-center"
                    style={{ fontFamily: 'var(--font-space), monospace' }}
                  >
                    {LEVEL_LABELS[level]}
                  </span>
                ))}
              </div>

              <div className="divide-y divide-a24-border/10 dark:divide-a24-dark-border/10">
                {role.skillLevelMatrix.length > 0 ? (
                  role.skillLevelMatrix.map((entry, i) => (
                    <motion.div
                      key={entry.skill}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className="grid grid-cols-[minmax(90px,1.5fr)_repeat(4,minmax(40px,1fr))] sm:grid-cols-[minmax(140px,1.5fr)_repeat(4,1fr)] px-3 group hover:bg-a24-surface/30 dark:hover:bg-a24-dark-surface/30 transition-colors"
                    >
                      {/* Skill name — left-aligned */}
                      <div className="flex items-center justify-start py-2.5 sm:py-3.5 pl-1 min-w-0">
                        <Link
                          href={`/learn/skills/${encodeURIComponent(entry.skill.toLowerCase())}`}
                          className="text-xs sm:text-sm font-medium text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors truncate text-left"
                        >
                          {entry.skill}
                        </Link>
                      </div>
                      {LEVELS.map((level, j) => (
                        <HeatmapCell
                          key={level}
                          value={entry.levels[level]}
                          delay={i * 50 + j * 30}
                          skill={entry.skill}
                          level={level}
                          topCompanies={role.topCompanies}
                          avgSalaryRange={avgSalaryRange}
                          jobCount={role.jobCount}
                          activeRole={activeRole}
                        />
                      ))}
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center text-sm text-a24-muted/40 dark:text-a24-dark-muted/40">
                    No skill data for this role yet
                  </div>
                )}
              </div>
            </div>

            {/* Meme text footer */}
            <div className="px-4 py-2.5 border-t border-a24-border/30 dark:border-a24-dark-border/30 flex items-center justify-between">
              <p className="text-xs italic text-a24-muted/40 dark:text-a24-dark-muted/40">
                {heatmapMeme}
              </p>
              <Link
                href={`/jobs?role=${activeRole === 'all' ? '' : activeRole}`}
                className="text-[10px] uppercase tracking-[0.15em] text-neun-success hover:text-neun-success/80 transition-colors cursor-pointer shrink-0"
              >
                {activeRole === 'all' ? 'See all jobs' : `See ${role.label} jobs`} &nearr;
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT: Salary (top) + Market Maturity (bottom) — stacked, no tabs */}
        <div className="flex flex-col gap-5">

          {/* SALARY — linked to active role tab */}
          <div className="border border-a24-border dark:border-a24-dark-border rounded overflow-hidden">
            <div className="px-5 py-4 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-neun-success" />
              <h2 className="text-xs sm:text-sm uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-bold">
                Salary
              </h2>
            </div>
            <div className="divide-y divide-a24-border/10 dark:divide-a24-dark-border/10">
              {role.regionSalaries.filter(r => r.avgSalary > 0).length > 0 ? (
                role.regionSalaries
                  .filter(r => r.avgSalary > 0)
                  .map((item, i) => (
                    <SalaryBar key={item.key} item={item} maxSalary={maxSalary} delay={i} />
                  ))
              ) : (
                <div className="py-8 text-center text-sm text-a24-muted/40 dark:text-a24-dark-muted/40">
                  Not enough salary data
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-a24-border/30 dark:border-a24-dark-border/30">
              <p className="text-xs italic text-a24-muted/40 dark:text-a24-dark-muted/40">
                {salaryMeme}
              </p>
            </div>
          </div>

          {/* MARKET MATURITY — always "all" data, not linked to role tab */}
          <div className="border border-a24-border dark:border-a24-dark-border rounded overflow-hidden">
            <div className="px-5 py-4 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-neun-success" />
              <h2 className="text-xs sm:text-sm uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-bold">
                Market Maturity
              </h2>
            </div>
            <div className="divide-y divide-a24-border/10 dark:divide-a24-dark-border/10">
              {data.regionRoles.length > 0 ? (
                data.regionRoles.map((item, i) => (
                  <MarketMaturityRow key={item.key} item={item} delay={i} />
                ))
              ) : (
                <div className="py-8 text-center text-sm text-a24-muted/40 dark:text-a24-dark-muted/40">
                  No region data available
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-a24-border/30 dark:border-a24-dark-border/30">
              <p className="text-xs italic text-a24-muted/40 dark:text-a24-dark-muted/40">
                {maturityMeme}
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
