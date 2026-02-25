'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface SkillBarData {
  skill: string
  count: number
  change: number
}

interface RoleData {
  role: string
  count: number
}

const BAR_COLOR = '#22c55e'
const BAR_COLOR_DOWN = '#ef4444'
const BAR_COLOR_NEUTRAL = '#64748b'

function getBarColor(change: number) {
  if (change > 0) return BAR_COLOR
  if (change < 0) return BAR_COLOR_DOWN
  return BAR_COLOR_NEUTRAL
}

// Custom tooltip
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded border border-a24-border dark:border-a24-dark-border bg-a24-bg dark:bg-a24-dark-bg shadow-lg">
      <p className="text-xs font-medium text-a24-text dark:text-a24-dark-text">{label}</p>
      <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted">
        {payload[0].value.toLocaleString()} jobs
      </p>
    </div>
  )
}

export function SkillBarChart({ data }: { data: SkillBarData[] }) {
  const top8 = data.slice(0, 8)
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={top8} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="skill"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={32}>
          {top8.map((entry, i) => (
            <Cell key={i} fill={getBarColor(entry.change)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function RoleDistributionChart({ data }: { data: RoleData[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="space-y-2.5">
      {data.map((role) => (
        <div key={role.role} className="group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-a24-text dark:text-a24-dark-text font-light">
              {role.role}
            </span>
            <span className="text-[10px] tabular-nums text-a24-muted dark:text-a24-dark-muted" style={{ fontFamily: 'var(--font-space), monospace' }}>
              {role.count}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
            <div
              className="h-full rounded-full bg-neun-success/70 transition-all duration-500"
              style={{ width: `${(role.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Mini sparkline as CSS-only bars (no heavy chart for inline use)
export function MiniSparkline({ values, color = '#22c55e' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-px h-4">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-1 rounded-sm transition-all duration-300"
          style={{
            height: `${Math.max((v / max) * 100, 8)}%`,
            backgroundColor: color,
            opacity: 0.4 + (i / values.length) * 0.6,
          }}
        />
      ))}
    </div>
  )
}
