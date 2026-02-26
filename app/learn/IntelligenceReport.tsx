'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { Zap, Briefcase, MapPin, DollarSign } from 'lucide-react'
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
const ROLES_MEMES = [
  'follow the hiring trends',
  'alpha in plain sight',
]

function pickMeme(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Heatmap Cell (count-up + micro-variations) ──
function HeatmapCell({ value, delay }: { value: number; delay: number }) {
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

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center py-2 px-0.5 rounded-sm transition-colors duration-300"
      style={value > 0 ? { backgroundColor: `rgba(34, 197, 94, ${0.04 + intensity * 0.22})` } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={value > 0 ? `${value}%` : undefined}
    >
      {isHot && (
        <motion.div
          className="absolute inset-0.5 rounded-sm"
          animate={{ boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 6px rgba(34,197,94,0.25)', '0 0 0px rgba(34,197,94,0)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span
        className={`text-[10px] sm:text-[11px] tabular-nums relative z-10 ${
          value === 0 ? 'text-a24-muted/15 dark:text-a24-dark-muted/15'
          : isHot ? 'text-neun-success font-semibold'
          : value >= 20 ? 'text-neun-success/80 font-medium'
          : 'text-a24-muted dark:text-a24-dark-muted'
        }`}
        style={{ fontFamily: 'var(--font-space), monospace' }}
      >
        {value === 0 ? '\u2014' : <>{final.toFixed(1)}<span className="hidden sm:inline">%</span></>}
      </span>
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
      className="group block px-3 py-2.5 hover:bg-a24-surface/30 dark:hover:bg-a24-dark-surface/30 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors">
          {item.flag} {item.label}
          <span className="ml-1.5 text-[10px] text-a24-muted/40 dark:text-a24-dark-muted/40 tabular-nums" style={{ fontFamily: 'var(--font-space), monospace' }}>
            ({item.jobCount})
          </span>
        </span>
        <span className="text-xs tabular-nums text-a24-text dark:text-a24-dark-text font-medium">
          <CountUp target={item.avgSalary > 0 ? Math.round(item.avgSalary / 1000) : 0} prefix="$" suffix="K" />
        </span>
      </div>
      <div ref={ref} className="h-2 rounded-full bg-a24-border/20 dark:bg-a24-dark-border/20 overflow-hidden">
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

// ── Roles by Region Row ──
function RegionRolesRow({ item, delay }: { item: RegionRolesData; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<HTMLElement>, { once: true, margin: '0px 0px 800px 0px' })
  const opacities = ['', '/60', '/30']

  return (
    <Link
      href={`/jobs?location=${encodeURIComponent(item.label)}`}
      className="group block px-3 py-2.5 hover:bg-a24-surface/30 dark:hover:bg-a24-dark-surface/30 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors shrink-0 w-20">
          {item.flag} {item.label}
        </span>
        <div ref={ref} className="flex-1 flex items-center gap-1 min-w-0">
          {item.roles.map((role, i) => (
            <motion.div
              key={role.name}
              className={`relative h-5 rounded-sm bg-neun-success${opacities[i] || '/30'} group/bar`}
              initial={{ width: 0 }}
              animate={inView ? { width: `${role.percentage}%` } : { width: 0 }}
              transition={{ duration: 0.6, delay: delay * 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{ minWidth: role.percentage > 5 ? '28px' : '0' }}
              title={`${role.name} ${role.percentage}%`}
            >
              {role.percentage >= 15 && (
                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-a24-dark-bg font-medium truncate px-1">
                  {role.name}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      {/* Legend on hover */}
      <div className="hidden group-hover:flex items-center gap-3 ml-[88px] text-[9px] text-a24-muted dark:text-a24-dark-muted">
        {item.roles.map((role) => (
          <span key={role.name}>{role.name} {role.percentage}%</span>
        ))}
      </div>
    </Link>
  )
}

// ── Main Component ──
export default function IntelligenceReport({ data }: { data: IntelligenceData }) {
  const [activeRole, setActiveRole] = useState<string>('all')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [rightTab, setRightTab] = useState<'salary' | 'roles'>('salary')

  const heatmapMeme = useMemo(() => pickMeme(HEATMAP_MEMES), [])
  const salaryMeme = useMemo(() => pickMeme(SALARY_MEMES), [])
  const rolesMeme = useMemo(() => pickMeme(ROLES_MEMES), [])

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

  const salaryStr = role.avgSalaryMin > 0 && role.avgSalaryMax > 0
    ? `$${Math.round(role.avgSalaryMin / 1000)}K - $${Math.round(role.avgSalaryMax / 1000)}K`
    : 'N/A'

  const maxSalary = Math.max(...role.regionSalaries.map(r => r.avgSalary), 1)

  return (
    <div className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Role Tabs */}
      <nav role="tablist" className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
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
                shrink-0 px-3.5 py-2 rounded text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer
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

      {/* Summary Stats */}
      <section className="mb-6 grid grid-cols-3 gap-3">
        <div className="px-3 py-2.5 border border-a24-border dark:border-a24-dark-border rounded">
          <div className="flex items-center gap-1.5 mb-1">
            <Briefcase className="w-3 h-3 text-a24-muted dark:text-a24-dark-muted" />
            <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light">Jobs</p>
          </div>
          <span className="text-lg font-light tabular-nums text-a24-text dark:text-a24-dark-text" style={{ fontFamily: 'var(--font-space), monospace' }}>
            {role.jobCount.toLocaleString()}
          </span>
        </div>
        <div className="px-3 py-2.5 border border-a24-border dark:border-a24-dark-border rounded">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-a24-muted dark:text-a24-dark-muted" />
            <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light">Avg Salary</p>
          </div>
          <span className="text-lg font-light tabular-nums text-a24-text dark:text-a24-dark-text" style={{ fontFamily: 'var(--font-space), monospace' }}>
            {salaryStr}
          </span>
        </div>
        <div className="px-3 py-2.5 border border-a24-border dark:border-a24-dark-border rounded">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3 h-3 text-a24-muted dark:text-a24-dark-muted" />
            <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light">Remote</p>
          </div>
          <span className="text-lg font-light tabular-nums text-a24-text dark:text-a24-dark-text" style={{ fontFamily: 'var(--font-space), monospace' }}>
            {role.remotePercent}%
          </span>
        </div>
      </section>

      {/* Main 60/40 Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* LEFT: Skill × Level Heatmap (60%) */}
        <div className="lg:col-span-3">
          <div className="border border-a24-border dark:border-a24-dark-border rounded overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-3.5 h-3.5 text-neun-success" />
                <h2 className="text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light">
                  A Secret Weapon for Career Advancement
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-a24-muted/40 dark:text-a24-dark-muted/40">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-neun-success animate-pulse" />
                <span style={{ fontFamily: 'var(--font-space), monospace' }}>
                  Live from {data.totalJobs.toLocaleString()} jobs
                </span>
                <span>&middot;</span>
                <LiveClock />
              </div>
            </div>

            {/* Heatmap grid — compact */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-[minmax(72px,1.2fr)_repeat(4,minmax(44px,1fr))] sm:grid-cols-[minmax(100px,1fr)_repeat(4,60px)] px-3 py-2 border-b border-a24-border/30 dark:border-a24-dark-border/30">
                <span />
                {LEVELS.map(level => (
                  <span
                    key={level}
                    className="text-[9px] uppercase tracking-[0.15em] text-a24-muted/50 dark:text-a24-dark-muted/50 text-center"
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
                      className="grid grid-cols-[minmax(72px,1.2fr)_repeat(4,minmax(44px,1fr))] sm:grid-cols-[minmax(100px,1fr)_repeat(4,60px)] px-3 group hover:bg-a24-surface/30 dark:hover:bg-a24-dark-surface/30 transition-colors"
                    >
                      {/* Skill name — right-aligned to be close to numbers */}
                      <div className="flex items-center justify-end py-1.5 pr-2 min-w-0">
                        <Link
                          href={`/learn/skills/${encodeURIComponent(entry.skill.toLowerCase())}`}
                          className="text-xs text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors truncate text-right"
                        >
                          {entry.skill}
                        </Link>
                      </div>
                      {LEVELS.map((level, j) => (
                        <HeatmapCell
                          key={level}
                          value={entry.levels[level]}
                          delay={i * 50 + j * 30}
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

        {/* RIGHT: Salary / Roles by Region (40%) */}
        <div className="lg:col-span-2">
          <div className="border border-a24-border dark:border-a24-dark-border rounded overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-a24-border dark:border-a24-dark-border">
              <button
                onClick={() => setRightTab('salary')}
                className={`flex-1 px-3 py-2.5 text-[10px] uppercase tracking-[0.2em] font-light transition-colors cursor-pointer ${
                  rightTab === 'salary'
                    ? 'text-neun-success bg-neun-success/5 border-b-2 border-neun-success'
                    : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
                }`}
              >
                Salary
              </button>
              <button
                onClick={() => setRightTab('roles')}
                className={`flex-1 px-3 py-2.5 text-[10px] uppercase tracking-[0.2em] font-light transition-colors cursor-pointer ${
                  rightTab === 'roles'
                    ? 'text-neun-success bg-neun-success/5 border-b-2 border-neun-success'
                    : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
                }`}
              >
                Roles by Region
              </button>
            </div>

            {/* Tab content */}
            {rightTab === 'salary' ? (
              <div>
                <div className="px-3 py-2 bg-a24-surface/30 dark:bg-a24-dark-surface/30">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted/50 dark:text-a24-dark-muted/50">
                    Salary by Region
                  </p>
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
                <div className="px-3 py-2.5 border-t border-a24-border/30 dark:border-a24-dark-border/30">
                  <p className="text-xs italic text-a24-muted/40 dark:text-a24-dark-muted/40">
                    {salaryMeme}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="px-3 py-2 bg-a24-surface/30 dark:bg-a24-dark-surface/30">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted/50 dark:text-a24-dark-muted/50">
                    Roles by Region
                  </p>
                </div>
                <div className="divide-y divide-a24-border/10 dark:divide-a24-dark-border/10">
                  {data.regionRoles.length > 0 ? (
                    data.regionRoles.map((item, i) => (
                      <RegionRolesRow key={item.key} item={item} delay={i} />
                    ))
                  ) : (
                    <div className="py-8 text-center text-sm text-a24-muted/40 dark:text-a24-dark-muted/40">
                      No region data available
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5 border-t border-a24-border/30 dark:border-a24-dark-border/30">
                  <p className="text-xs italic text-a24-muted/40 dark:text-a24-dark-muted/40">
                    {rolesMeme}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
