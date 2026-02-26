'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { TrendingUp, Zap, Shuffle, ArrowUpRight, ChevronRight, Briefcase, MapPin, DollarSign } from 'lucide-react'
import type { IntelligenceData, RoleInsight, SkillLevelEntry } from '@/lib/intelligence-data'
import Pixelbara from '@/app/components/Pixelbara'

const ROLE_TABS = [
  { key: 'all', label: 'All', emoji: '' },
  { key: 'engineering', label: 'Engineering', emoji: '' },
  { key: 'marketing', label: 'Marketing', emoji: '' },
  { key: 'bd', label: 'BD', emoji: '' },
  { key: 'ops', label: 'Ops', emoji: '' },
] as const

const LEVELS = ['entry', 'mid', 'senior', 'lead'] as const
const LEVEL_LABELS: Record<string, string> = { entry: 'Entry', mid: 'Mid', senior: 'Senior', lead: 'Lead' }

function HeatmapCell({ value, delay }: { value: number; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const [displayed, setDisplayed] = useState(0)
  const [micro, setMicro] = useState(0)

  // Count-up animation: 0 → target in ~1.5s
  useEffect(() => {
    if (!inView || value === 0) return
    const duration = 1500
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const elapsed = now - start - delay
      if (elapsed < 0) { raf = requestAnimationFrame(tick); return }
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setDisplayed(Math.round(value * eased * 10) / 10)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, delay])

  // Micro-variations: ±0.3% every 2-3s (coin-chart style)
  useEffect(() => {
    if (!inView || value === 0) return
    const id = setInterval(() => {
      setMicro((Math.random() - 0.5) * 0.6)
    }, 2000 + Math.random() * 1000)
    return () => clearInterval(id)
  }, [inView, value])

  const final = value === 0 ? 0 : Math.max(0, displayed + micro)
  const intensity = value === 0 ? 0 : Math.min(value / 55, 1)
  const isHot = value >= 40

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center py-2.5 px-1 rounded-sm transition-colors duration-300"
      style={value > 0 ? {
        backgroundColor: `rgba(34, 197, 94, ${0.04 + intensity * 0.22})`,
      } : undefined}
    >
      {isHot && (
        <motion.div
          className="absolute inset-0.5 rounded-sm"
          animate={{
            boxShadow: [
              '0 0 0px rgba(34,197,94,0)',
              '0 0 6px rgba(34,197,94,0.25)',
              '0 0 0px rgba(34,197,94,0)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span
        className={`text-[11px] tabular-nums relative z-10 ${
          value === 0 ? 'text-a24-muted/15 dark:text-a24-dark-muted/15'
          : isHot ? 'text-neun-success font-semibold'
          : value >= 20 ? 'text-neun-success/80 font-medium'
          : 'text-a24-muted dark:text-a24-dark-muted'
        }`}
        style={{ fontFamily: 'var(--font-space), monospace' }}
      >
        {value === 0 ? '—' : `${final.toFixed(1)}%`}
      </span>
    </div>
  )
}

function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: 'var(--font-space), monospace' }}>{time}</span>
  )
}

export default function IntelligenceReport({ data }: { data: IntelligenceData }) {
  const [activeRole, setActiveRole] = useState<string>('all')
  const [isTransitioning, setIsTransitioning] = useState(false)

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

      {/* Role Summary Stats */}
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

      {/* Main grid: Hot Skills + Side */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Skill × Level Heatmap */}
        <div className="lg:col-span-8">
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
                <span>·</span>
                <LiveClock />
              </div>
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto">
              {/* Column headers */}
              <div className="grid grid-cols-[minmax(80px,1fr)_repeat(4,56px)] sm:grid-cols-[minmax(140px,1fr)_repeat(4,80px)] px-3 py-2 border-b border-a24-border/30 dark:border-a24-dark-border/30">
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

              {/* Skill rows */}
              <div className="divide-y divide-a24-border/10 dark:divide-a24-dark-border/10">
                {role.skillLevelMatrix.length > 0 ? (
                  role.skillLevelMatrix.map((entry, i) => (
                    <motion.div
                      key={entry.skill}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className="grid grid-cols-[minmax(80px,1fr)_repeat(4,56px)] sm:grid-cols-[minmax(140px,1fr)_repeat(4,80px)] px-3 group hover:bg-a24-surface/30 dark:hover:bg-a24-dark-surface/30 transition-colors"
                    >
                      {/* Skill name */}
                      <div className="flex items-center gap-2 py-2 min-w-0">
                        <span
                          className="text-[10px] tabular-nums text-a24-muted/30 dark:text-a24-dark-muted/30 w-4 text-right shrink-0"
                          style={{ fontFamily: 'var(--font-space), monospace' }}
                        >
                          {i + 1}
                        </span>
                        <Link
                          href={`/learn/skills/${encodeURIComponent(entry.skill.toLowerCase())}`}
                          className="text-sm text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors truncate"
                        >
                          {entry.skill}
                        </Link>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Link
                            href={`/jobs?search=${encodeURIComponent(entry.skill)}`}
                            className="text-[8px] uppercase tracking-[0.1em] text-a24-muted/40 dark:text-a24-dark-muted/40 hover:text-neun-success transition-colors"
                          >
                            Jobs
                          </Link>
                        </div>
                      </div>
                      {/* Level cells */}
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

            {/* Insight + CTA footer */}
            {(role.levelInsight || role.hotSkills.length > 0) && (
              <div className="px-4 py-3 border-t border-a24-border/30 dark:border-a24-dark-border/30 flex items-center justify-between gap-3">
                {role.levelInsight && (
                  <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted truncate">
                    <span className="text-neun-success mr-1">↗</span>
                    {role.levelInsight}
                  </p>
                )}
                <Link
                  href={`/jobs?role=${activeRole === 'all' ? '' : activeRole}`}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-neun-success hover:text-neun-success/80 transition-colors cursor-pointer shrink-0 ml-auto"
                >
                  {activeRole === 'all' ? 'See all jobs' : `See ${role.label} jobs`}
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-4 space-y-4">

          {/* Rising Skills */}
          {role.risingSkills.length > 0 && (
            <div className="border border-a24-border dark:border-a24-dark-border rounded overflow-hidden">
              <div className="px-4 py-3 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-neun-success" />
                <h2 className="text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light">
                  Rising (90d)
                </h2>
              </div>
              <div className="divide-y divide-a24-border/20 dark:divide-a24-dark-border/20">
                {role.risingSkills.map(rs => (
                  <Link
                    key={rs.skill}
                    href={`/learn/skills/${encodeURIComponent(rs.skill.toLowerCase())}`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50 transition-colors cursor-pointer group"
                  >
                    <span className="text-sm text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors truncate">
                      {rs.skill}
                    </span>
                    <span
                      className="text-xs tabular-nums font-medium text-neun-success shrink-0 ml-2"
                      style={{ fontFamily: 'var(--font-space), monospace' }}
                    >
                      +{rs.change}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Cross-Skill Insights */}
          {role.crossSkills.length > 0 && (
            <div className="border border-a24-border dark:border-a24-dark-border rounded overflow-hidden">
              <div className="px-4 py-3 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border flex items-center gap-2">
                <Shuffle className="w-3.5 h-3.5 text-yellow-400" />
                <h2 className="text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light">
                  Cross-Skill
                </h2>
              </div>
              <div className="divide-y divide-a24-border/20 dark:divide-a24-dark-border/20">
                {role.crossSkills.map(cs => (
                  <div key={cs.skill} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-a24-text dark:text-a24-dark-text">{cs.skill}</span>
                      <span
                        className="text-[10px] tabular-nums text-yellow-400"
                        style={{ fontFamily: 'var(--font-space), monospace' }}
                      >
                        {cs.percentage}%
                      </span>
                    </div>
                    <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted leading-relaxed">
                      {cs.insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Companies for role */}
          {role.topCompanies.length > 0 && (
            <div className="border border-a24-border dark:border-a24-dark-border rounded overflow-hidden">
              <div className="px-4 py-3 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border">
                <h2 className="text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light">
                  Top Hiring
                </h2>
              </div>
              <div className="divide-y divide-a24-border/20 dark:divide-a24-dark-border/20">
                {role.topCompanies.map((c, i) => (
                  <Link
                    key={c.name}
                    href={`/jobs?search=${encodeURIComponent(c.name)}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50 transition-colors cursor-pointer group"
                  >
                    <span className="text-[10px] tabular-nums text-a24-muted/30 w-4 text-right shrink-0" style={{ fontFamily: 'var(--font-space), monospace' }}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors truncate flex-1">
                      {c.name}
                    </span>
                    <span className="text-[10px] tabular-nums text-a24-muted dark:text-a24-dark-muted shrink-0" style={{ fontFamily: 'var(--font-space), monospace' }}>
                      {c.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Pixelbara Comment */}
          <div className="border border-a24-border dark:border-a24-dark-border rounded p-4 text-center">
            <div className="flex justify-center mb-3">
              <Pixelbara pose="coding" size={56} clickable />
            </div>
            <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted italic mb-3">
              {role.pixelbaraComment}
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/learn/career"
                className="flex items-center justify-center gap-1.5 px-4 py-2 border border-a24-border dark:border-a24-dark-border rounded hover:border-neun-success/30 hover:bg-neun-success/5 transition-all duration-200 cursor-pointer group"
              >
                <ChevronRight className="w-3 h-3 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors font-light">
                  Explore by Role
                </span>
              </Link>
              <Link
                href="/learn/skills"
                className="flex items-center justify-center gap-1.5 px-4 py-2 border border-a24-border dark:border-a24-dark-border rounded hover:border-neun-success/30 hover:bg-neun-success/5 transition-all duration-200 cursor-pointer group"
              >
                <ChevronRight className="w-3 h-3 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors font-light">
                  Explore by Skill
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
