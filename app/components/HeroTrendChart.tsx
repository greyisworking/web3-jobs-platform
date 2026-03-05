'use client'

import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts'

interface HeroTrendChartProps {
  data: { week: string; count: number }[]
}

export default function HeroTrendChart({ data }: HeroTrendChartProps) {
  return (
    <div className="h-20 sm:h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
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
  )
}
