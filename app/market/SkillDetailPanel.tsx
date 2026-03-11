'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Link from 'next/link'

interface SkillDetailPanelProps {
  skillName: string | null
  region: string
}

interface SkillData {
  jobCount: number
  avgSalary: { all: number; korea: number; us: number; remote: number }
  weeklyTrend: { week: string; count: number }[]
  topCompanies: { name: string; count: number }[]
}

function formatSalary(amount: number): string {
  if (!amount || amount === 0) return '-'
  if (amount >= 1000000) {
    return `₩${Math.round(amount / 10000).toLocaleString()}만`
  }
  return `$${Math.round(amount / 1000)}K`
}

function StatCard({ label, value, suffix, accent }: { label: string; value: string; suffix?: string; accent?: boolean }) {
  return (
    <div className="bg-a24-bg dark:bg-a24-dark-bg rounded px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-1">{label}</p>
      <p className={`text-lg font-semibold ${accent ? 'text-green-400' : 'text-a24-text dark:text-a24-dark-text'}`}>
        {value}{suffix && <span className="text-xs font-normal text-a24-muted dark:text-a24-dark-muted ml-0.5">{suffix}</span>}
      </p>
    </div>
  )
}

function SkillTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded border border-a24-border dark:border-a24-dark-border bg-a24-bg dark:bg-a24-dark-bg shadow-lg">
      <p className="text-xs font-medium text-a24-text dark:text-a24-dark-text">{label}</p>
      <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted">{payload[0].value}건</p>
    </div>
  )
}

export default function SkillDetailPanel({ skillName, region }: SkillDetailPanelProps) {
  const [data, setData] = useState<SkillData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!skillName) {
      setData(null)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`/api/market/skill/${encodeURIComponent(skillName)}?region=${encodeURIComponent(region)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [skillName, region])

  const lastWeek = data?.weeklyTrend[data.weeklyTrend.length - 1]?.count || 0
  const prevWeek = data?.weeklyTrend[data.weeklyTrend.length - 2]?.count || 0
  const change = prevWeek > 0 ? Math.round(((lastWeek - prevWeek) / prevWeek) * 100) : 0
  const trendDirection = change > 0 ? `+${change}%` : change < 0 ? `${change}%` : '0%'

  return (
    <AnimatePresence mode="wait">
      {skillName && (
        <motion.div
          key="skill-detail"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="border border-a24-border dark:border-a24-dark-border rounded mt-4">
            {/* Header */}
            <div className="px-4 py-3 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border flex items-center justify-between">
              <h3 className="text-sm font-medium text-a24-text dark:text-a24-dark-text flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {skillName}
              </h3>
            </div>

            {loading ? (
              <div className="p-4 space-y-3 animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 bg-a24-dark-surface/50 rounded" />
                  ))}
                </div>
                <div className="h-40 bg-a24-dark-surface/50 rounded" />
              </div>
            ) : data && (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
                  <StatCard label="공고 수" value={data.jobCount.toLocaleString()} suffix="개" />
                  <StatCard label="평균 연봉" value={formatSalary(data.avgSalary[region as keyof typeof data.avgSalary] || data.avgSalary.all)} />
                  <StatCard label="채용 1위" value={data.topCompanies[0]?.name || '-'} />
                  <StatCard label="주간 추이" value={trendDirection} accent />
                </div>

                {/* Trend Chart */}
                <div className="px-4 pb-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={data.weeklyTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="skillGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip content={<SkillTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                      <Area type="monotone" dataKey="count" stroke="#22C55E" fill="url(#skillGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* CTA */}
                <div className="px-4 pb-4">
                  <Link
                    href={`/jobs?q=${encodeURIComponent(skillName)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neun-primary hover:text-white hover:bg-neun-primary/20 rounded transition-colors"
                  >
                    이 스킬 공고 보기 →
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
