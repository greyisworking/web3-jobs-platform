'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from './ScrollReveal'

interface MarketSummary {
  liveJobs: number
  topSkill: string
  avgSalary: number
  remoteRate: number
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

function StatCard({
  label,
  value,
  suffix,
  prefix,
}: {
  label: string
  value: number
  suffix?: string
  prefix?: string
}) {
  const { value: animated, ref } = useCountUp(value)

  return (
    <div
      ref={ref}
      className="border border-a24-border dark:border-a24-dark-border rounded p-4 sm:p-5 hover:shadow-green-sm transition-shadow duration-300"
    >
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted mb-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-neun-success" />
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-black text-a24-text dark:text-a24-dark-text">
        {prefix}
        {animated.toLocaleString()}
        {suffix}
      </p>
    </div>
  )
}

function SkillCard({ label, value }: { label: string; value: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="border border-a24-border dark:border-a24-dark-border rounded p-4 sm:p-5 hover:shadow-green-sm transition-shadow duration-300"
    >
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted mb-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-neun-success" />
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-black text-a24-text dark:text-a24-dark-text transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        {value}
      </p>
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

export default function MarketHighlight() {
  const [data, setData] = useState<MarketSummary | null>(null)

  useEffect(() => {
    fetch('/api/market/summary')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
  }, [])

  return (
    <ScrollReveal>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {data ? (
            <>
              <StatCard label="Live Jobs" value={data.liveJobs} />
              <SkillCard label="Top Skill" value={data.topSkill} />
              <StatCard label="Avg Salary (US)" value={data.avgSalary} prefix="$" />
              <StatCard label="Remote Rate" value={data.remoteRate} suffix="%" />
            </>
          ) : (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}
        </div>

        <div className="flex justify-center mt-6 sm:mt-8">
          <Link
            href="/market"
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-medium border border-neun-success/50 text-neun-success hover:bg-neun-success/10 px-5 py-2.5 rounded transition-all duration-200"
          >
            Explore Market Intelligence
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </ScrollReveal>
  )
}
