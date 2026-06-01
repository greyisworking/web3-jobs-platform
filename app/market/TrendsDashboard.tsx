'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = [
  '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
]

const PERIODS = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
  { label: 'ALL', value: 'all' },
] as const

interface TrendsData {
  weeklyJobs: { week: string; count: number }[]
  sourceBreakdown: { name: string; value: number }[]
  topCompanies: { name: string; value: number }[]
  workType: { name: string; value: number }[]
  locationBreakdown: { name: string; value: number }[]
  totalJobs: number
}

type SkillCategory = 'languages' | 'chains' | 'tools' | 'domains'

interface SkillsData {
  languages: { name: string; value: number }[]
  chains: { name: string; value: number }[]
  tools: { name: string; value: number }[]
  domains: { name: string; value: number }[]
  byLevel: Record<string, Record<string, number>>
  totalJobs: number
}

const SKILL_TABS: { label: string; value: SkillCategory }[] = [
  { label: 'Languages', value: 'languages' },
  { label: 'Chains', value: 'chains' },
  { label: 'Tools', value: 'tools' },
  { label: 'Domains', value: 'domains' },
]

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded border border-a24-border dark:border-a24-dark-border bg-a24-bg dark:bg-a24-dark-bg shadow-lg">
      <p className="text-xs font-medium text-a24-text dark:text-a24-dark-text">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[11px] text-a24-muted dark:text-a24-dark-muted">
          {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="px-3 py-2 rounded border border-a24-border dark:border-a24-dark-border bg-a24-bg dark:bg-a24-dark-bg shadow-lg">
      <p className="text-xs font-medium text-a24-text dark:text-a24-dark-text">{d.name}</p>
      <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted">
        {d.value.toLocaleString()}
      </p>
    </div>
  )
}

interface TrendsDashboardProps {
  region?: string
  level?: string | null
}

export default function TrendsDashboard({ region = 'all', level = null }: TrendsDashboardProps) {
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState<TrendsData | null>(null)
  const [skillsData, setSkillsData] = useState<SkillsData | null>(null)
  const [skillCategory, setSkillCategory] = useState<SkillCategory>('languages')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (p: string) => {
    setLoading(true)
    try {
      const levelQuery = level ? `&level=${encodeURIComponent(level)}` : ''
      const [trendsRes, skillsRes] = await Promise.all([
        fetch(`/api/market/trends?period=${p}&region=${region}${levelQuery}`),
        fetch(`/api/market/trends/skills?period=${p}&region=${region}${levelQuery}`),
      ])
      if (trendsRes.ok) setData(await trendsRes.json())
      if (skillsRes.ok) setSkillsData(await skillsRes.json())
    } finally {
      setLoading(false)
    }
  }, [region, level])

  useEffect(() => {
    fetchData(period)
  }, [period, region, level, fetchData])

  const handlePeriod = (p: string) => {
    if (p !== period) setPeriod(p)
  }

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-a24-text dark:text-a24-dark-text">
            Market Trends
          </h2>
          {data && (
            <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted mt-0.5">
              {data.totalJobs.toLocaleString()} active listings
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {SKILL_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSkillCategory(tab.value)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${
                skillCategory === tab.value
                  ? 'bg-neun-primary/20 text-neun-primary'
                  : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Core charts — ordered by insight value */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-5 transition-opacity duration-300 ${
          loading ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {/* 1. Skills by Experience Level (+ Move insight) — full width */}
        <Insight text="Move's pyramid is upside down — 4 entry vs 93 mid roles. The language is too young to have juniors. If you can already code, Move is the rare market where switching in lands you at mid-level immediately." />
        <ChartCard title="Skills by Experience Level" className="lg:col-span-2">
          {skillsData && (
            <SkillLevelTable
              skills={skillsData[skillCategory]}
              byLevel={skillsData.byLevel}
            />
          )}
        </ChartCard>

        {/* 2. Source Breakdown (+ Solana insight) */}
        <Insight text="Solana looks like 29% of the market — but that's partly an artifact. Solana runs one official job board; Ethereum's hiring is scattered across hundreds of sites. This measures how aggregated an ecosystem's hiring is, not just how much it hires." />
        <ChartCard title="Distribution by Source">
          {data?.sourceBreakdown && (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.sourceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.sourceBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {data?.sourceBreakdown && <Legend items={data.sourceBreakdown} />}
        </ChartCard>

        {/* 3. Work Type (+ polarization insight) */}
        <Insight text="Web3 isn't remote-first — it's polarized. 55% onsite, 44% remote, only 1% hybrid. Companies pick a side: a hub city or fully distributed. The '3 days in office' middle ground barely exists." />
        <ChartCard title="Remote / Onsite / Hybrid">
          {data?.workType && (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.workType}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.workType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {data?.workType && <Legend items={data.workType} />}
        </ChartCard>
      </div>

      {/* Secondary charts */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <ChartCard title="Top Hiring Companies">
          {data?.topCompanies && (
            <ResponsiveContainer width="100%" height={Math.max(300, data.topCompanies.length * 24)}>
              <BarChart data={data.topCompanies} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={16}>
                  {data.topCompanies.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Distribution by Region">
          {data?.locationBreakdown && (
            <ResponsiveContainer width="100%" height={Math.max(300, data.locationBreakdown.length * 24)}>
              <BarChart data={data.locationBreakdown} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={16}>
                  {data.locationBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </section>
  )
}

// --- Sub-components ---

function Insight({ text }: { text: string }) {
  return (
    <p className="lg:col-span-2 text-[12px] leading-relaxed text-a24-muted/70 dark:text-a24-dark-muted/70 italic px-1 -mb-3">
      {text}
    </p>
  )
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-a24-border dark:border-a24-dark-border rounded overflow-hidden ${className}`}>
      <div className="px-4 py-2.5 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted">
          {title}
        </h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

const LEVELS = ['entry', 'mid', 'senior', 'lead'] as const
const LEVEL_LABELS: Record<string, string> = { entry: 'Entry', mid: 'Mid', senior: 'Senior', lead: 'Lead' }

function SkillLevelTable({
  skills,
  byLevel,
}: {
  skills: { name: string; value: number }[]
  byLevel: Record<string, Record<string, number>>
}) {
  if (!skills.length) return <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted">No data</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-a24-border dark:border-a24-dark-border">
            <th className="text-left py-2 pr-3 font-medium text-a24-muted dark:text-a24-dark-muted">Skill</th>
            {LEVELS.map((lv) => (
              <th key={lv} className="text-center py-2 px-2 font-medium text-a24-muted dark:text-a24-dark-muted">
                {LEVEL_LABELS[lv]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => {
            const counts = LEVELS.map((lv) => byLevel[lv]?.[skill.name] || 0)
            const maxCount = Math.max(...counts)
            return (
              <tr key={skill.name} className="border-b border-a24-border/50 dark:border-a24-dark-border/50">
                <td className="py-1.5 pr-3 text-a24-text dark:text-a24-dark-text">{skill.name}</td>
                {LEVELS.map((lv, i) => (
                  <td
                    key={lv}
                    className={`text-center py-1.5 px-2 ${
                      counts[i] > 0 && counts[i] === maxCount
                        ? 'bg-neun-primary/15 text-neun-primary font-medium'
                        : 'text-a24-muted dark:text-a24-dark-muted'
                    }`}
                  >
                    {counts[i] || '-'}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Legend({ items }: { items: { name: string; value: number }[] }) {
  const total = items.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 mt-2">
      {items.map((d, i) => (
        <div key={d.name} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS[i % COLORS.length] }}
          />
          <span className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
            {d.name} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
          </span>
        </div>
      ))}
    </div>
  )
}
