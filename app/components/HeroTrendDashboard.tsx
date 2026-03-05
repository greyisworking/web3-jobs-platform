'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts'
import Pixelbara from './Pixelbara'

interface HeroData {
  hotSkills: { name: string; count: number; changePercent: number }[]
  trendingUp: { name: string; changePercent: number }
  coolingDown: { name: string; changePercent: number }
  marketPulse: {
    totalJobs: number
    newThisWeek: number
    remoteRate: number
    totalChange: number
    remoteChange: number
  }
  weeklyTrend: { week: string; count: number }[]
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (target === 0 || started.current) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          observer.unobserve(entry.target)
          const start = performance.now()
          const animate = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return { value, ref }
}

function ChangeBadge({ value }: { value: number }) {
  if (value === 0) return null
  const isPositive = value > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-sm sm:text-base font-bold ${isPositive ? 'text-neun-success' : 'text-red-400'}`}>
      {isPositive ? '↑' : '↓'}{Math.abs(value)}%
    </span>
  )
}

const FALLBACK_DATA: HeroData = {
  hotSkills: [
    { name: 'Solidity', count: 0, changePercent: 0 },
    { name: 'Rust', count: 0, changePercent: 0 },
    { name: 'TypeScript', count: 0, changePercent: 0 },
  ],
  trendingUp: { name: 'Solidity', changePercent: 0 },
  coolingDown: { name: '-', changePercent: 0 },
  marketPulse: { totalJobs: 2400, newThisWeek: 0, remoteRate: 0, totalChange: 0, remoteChange: 0 },
  weeklyTrend: [],
}

export default function HeroTrendDashboard() {
  const [data, setData] = useState<HeroData | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    fetch('/api/market/hero', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(d => {
        if (d.hotSkills && Array.isArray(d.hotSkills)) {
          setData(d)
        } else {
          setData(FALLBACK_DATA)
        }
      })
      .catch(() => {
        setData(FALLBACK_DATA)
      })
      .finally(() => clearTimeout(timeout))

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Section 1: Hero Headline */}
      <div className="pt-6 sm:pt-8 md:pt-10 pb-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-base uppercase tracking-wide text-a24-muted dark:text-a24-dark-muted mb-3"
        >
          Right now, Web3 is hiring for...
        </motion.p>

        {data ? (
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            {data.hotSkills.map((skill, i) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.15 }}
                className="flex items-baseline gap-2"
              >
                <span className="text-5xl sm:text-6xl md:text-7xl font-black text-a24-text dark:text-a24-dark-text">
                  {skill.name}
                </span>
                <ChangeBadge value={skill.changePercent} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 w-40 skeleton-shimmer rounded" />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Trend Cards + Pixelbara */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-6">
        {data ? (
          <>
            <TrendCard
              label="Trending Up"
              icon={<TrendingUp className="w-3 h-3" />}
              value={data.trendingUp.name}
              change={data.trendingUp.changePercent}
              positive
            />
            <TrendCard
              label="Cooling Down"
              icon={<TrendingDown className="w-3 h-3" />}
              value={data.coolingDown.name}
              change={data.coolingDown.changePercent}
              positive={false}
            />
            <MarketPulseCard pulse={data.marketPulse} />
            <div className="hidden lg:flex items-center justify-center border border-a24-border dark:border-a24-dark-border rounded p-4">
              <Pixelbara pose="heroLaptop" size={120} clickable suppressHover />
            </div>
          </>
        ) : (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <div className="hidden lg:block">
              <SkeletonCard />
            </div>
          </>
        )}
      </div>

      {/* Section 3: Mini Trend Chart + CTA */}
      <div className="pb-4 sm:pb-6">
        {data && data.weeklyTrend.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="h-24 sm:h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weeklyTrend}>
                  <defs>
                    <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--neun-success)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--neun-success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'var(--a24-muted)' }}
                    tickFormatter={(v: string) => v.split('-')[1] || v}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--neun-success)"
                    strokeWidth={2}
                    fill="url(#heroGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ) : !data ? (
          <div className="h-24 sm:h-32 w-full skeleton-shimmer rounded" />
        ) : null}

        <div className="flex justify-center mt-4">
          <Link
            href="/market"
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-medium border border-neun-success/50 text-neun-success hover:bg-neun-success/10 px-5 py-2.5 rounded transition-all duration-200"
          >
            Deep dive into Market Intelligence
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function TrendCard({
  label,
  icon,
  value,
  change,
  positive,
}: {
  label: string
  icon: React.ReactNode
  value: string
  change: number
  positive: boolean
}) {
  return (
    <div className="border border-a24-border dark:border-a24-dark-border rounded p-4 sm:p-5 hover:shadow-green-sm transition-shadow duration-300">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted mb-2">
        {icon}
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-black text-a24-text dark:text-a24-dark-text">
        {value}
      </p>
      <p className={`text-sm font-bold mt-1 ${positive ? 'text-neun-success' : 'text-red-400'}`}>
        {positive ? '↑' : '↓'}{Math.abs(change)}%
      </p>
    </div>
  )
}

function MarketPulseCard({
  pulse,
}: {
  pulse: HeroData['marketPulse']
}) {
  const { value: animatedTotal, ref } = useCountUp(pulse.totalJobs)

  return (
    <div
      ref={ref}
      className="border border-a24-border dark:border-a24-dark-border rounded p-4 sm:p-5 hover:shadow-green-sm transition-shadow duration-300"
    >
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted mb-2">
        <Activity className="w-3 h-3" />
        Market Pulse
      </p>
      <p className="text-2xl sm:text-3xl font-black text-a24-text dark:text-a24-dark-text">
        {animatedTotal.toLocaleString()}
      </p>
      <div className="flex items-center gap-3 mt-1 text-xs text-a24-muted dark:text-a24-dark-muted">
        <span>+{pulse.newThisWeek} this week
          {pulse.totalChange !== 0 && (
            <span className={pulse.totalChange > 0 ? 'text-neun-success' : 'text-red-400'}>
              {' '}{pulse.totalChange > 0 ? '↑' : '↓'}{Math.abs(pulse.totalChange)}%
            </span>
          )}
        </span>
        <span>{pulse.remoteRate}% remote
          {pulse.remoteChange !== 0 && (
            <span className={pulse.remoteChange > 0 ? 'text-neun-success' : 'text-red-400'}>
              {' '}{pulse.remoteChange > 0 ? '+' : ''}{pulse.remoteChange}pp
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="border border-a24-border dark:border-a24-dark-border rounded p-4 sm:p-5">
      <div className="h-3 w-20 skeleton-shimmer rounded mb-3" />
      <div className="h-8 w-24 skeleton-shimmer rounded" />
    </div>
  )
}
