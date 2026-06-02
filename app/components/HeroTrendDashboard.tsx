'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { HeroData } from '@/lib/hero-data'
import Pixelbara from './Pixelbara'

const HeroTrendChart = dynamic(() => import('./HeroTrendChart'), {
  ssr: false,
  loading: () => <div className="h-20 sm:h-24 w-full skeleton-shimmer rounded" />,
})

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(target)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (target === 0 || started.current) return
    const el = ref.current
    if (!el) return
    setValue(target)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          observer.unobserve(entry.target)
          setValue(0)
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

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null || value === 0) return null
  const isPositive = value > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-sm font-semibold ${isPositive ? 'text-neun-success' : 'text-red-400/80'}`}>
      {isPositive ? '↑' : '↓'}{Math.abs(value)}%
    </span>
  )
}

interface HeroTrendDashboardProps {
  data: HeroData
}

export default function HeroTrendDashboard({ data }: HeroTrendDashboardProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* Hero */}
      <div className="pt-10 sm:pt-14 md:pt-16 pb-8">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-sm text-a24-muted/60 dark:text-a24-dark-muted/60 mb-3 tracking-wide"
        >
          Right now, Web3 is hiring for
        </motion.p>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          {data.hotSkills.map((skill, i) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
              className="flex items-baseline gap-2"
            >
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-a24-text dark:text-a24-dark-text tracking-tight">
                {skill.name}
              </span>
              <ChangeBadge value={skill.changePercent} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-8">
        {data.trendingUp && (
          <TrendCard
            label="Trending Up"
            icon={<TrendingUp className="w-3 h-3" />}
            value={data.trendingUp.name}
            change={data.trendingUp.changePercent}
            positive
          />
        )}
        {data.coolingDown && (
          <TrendCard
            label="Cooling Down"
            icon={<TrendingDown className="w-3 h-3" />}
            value={data.coolingDown.name}
            change={data.coolingDown.changePercent}
            positive={false}
          />
        )}
        <MarketPulseCard pulse={data.marketPulse} />
        <div className="hidden lg:flex items-center justify-center border border-a24-border/50 dark:border-a24-dark-border/50 rounded-md p-4">
          <Pixelbara pose="heroLaptop" size={110} clickable suppressHover />
        </div>
      </div>

      {/* Mini Chart + CTAs */}
      <div className="pb-6">
        {data.weeklyTrend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <HeroTrendChart data={data.weeklyTrend} />
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-6">
          <Link
            href="/market"
            className="group inline-flex items-center gap-2 text-xs font-medium border border-neun-success/40 text-neun-success hover:bg-neun-success/5 px-5 py-2.5 rounded-md transition-all duration-200"
          >
            Market Intelligence
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="https://t.me/neunwtf_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-xs font-medium border border-a24-border/60 dark:border-a24-dark-border/60 text-a24-muted dark:text-a24-dark-muted hover:text-neun-success hover:border-neun-success/40 px-5 py-2.5 rounded-md transition-all duration-200"
          >
            Find jobs on Telegram
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
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
  change: number | null
  positive: boolean
}) {
  return (
    <div className="border border-a24-border/50 dark:border-a24-dark-border/50 rounded-md p-4 hover:border-a24-border dark:hover:border-a24-dark-border transition-colors duration-200">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-a24-muted/60 dark:text-a24-dark-muted/60 mb-2">
        {icon}
        {label}
      </p>
      <p className="text-xl sm:text-2xl font-bold text-a24-text dark:text-a24-dark-text tracking-tight">
        {value}
      </p>
      {change !== null && (
        <p className={`text-xs font-semibold mt-1 ${positive ? 'text-neun-success' : 'text-red-400/80'}`}>
          {positive ? '↑' : '↓'}{Math.abs(change)}%
        </p>
      )}
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
      className="border border-a24-border/50 dark:border-a24-dark-border/50 rounded-md p-4 hover:border-a24-border dark:hover:border-a24-dark-border transition-colors duration-200"
    >
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-a24-muted/60 dark:text-a24-dark-muted/60 mb-2">
        <Activity className="w-3 h-3" />
        Market Pulse
      </p>
      <p className="text-xl sm:text-2xl font-bold text-a24-text dark:text-a24-dark-text tracking-tight">
        {animatedTotal.toLocaleString()}
      </p>
      <div className="flex items-center gap-3 mt-1 text-[11px] text-a24-muted/70 dark:text-a24-dark-muted/70">
        <span>+{pulse.newThisWeek} this week
          {pulse.totalChange !== null && pulse.totalChange !== 0 && (
            <span className={pulse.totalChange > 0 ? 'text-neun-success' : 'text-red-400/80'}>
              {' '}{pulse.totalChange > 0 ? '↑' : '↓'}{Math.abs(pulse.totalChange)}%
            </span>
          )}
        </span>
        <span>{pulse.remoteRate}% remote
          {pulse.remoteChange !== 0 && (
            <span className={pulse.remoteChange > 0 ? 'text-neun-success' : 'text-red-400/80'}>
              {' '}{pulse.remoteChange > 0 ? '↑' : '↓'}{Math.abs(pulse.remoteChange)}%
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
