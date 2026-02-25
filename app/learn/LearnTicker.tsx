'use client'

interface TickerItem {
  skill: string
  count: number
  change: number
  isNew: boolean
}

export default function LearnTicker({ items }: { items: TickerItem[] }) {
  // Duplicate for seamless infinite scroll
  const duplicated = [...items, ...items]

  return (
    <div className="overflow-hidden border-b border-white/[0.06] bg-white/[0.015] dark:bg-white/[0.015]">
      <div className="learn-ticker flex whitespace-nowrap py-3" role="marquee" aria-label="Skill demand ticker">
        {duplicated.map((item, i) => (
          <div key={`${item.skill}-${i}`} className="flex items-center gap-2 px-5 shrink-0">
            <span
              className="text-[11px] font-medium text-a24-text dark:text-a24-dark-text"
              style={{ fontFamily: 'var(--font-space), monospace' }}
            >
              {item.skill}
            </span>
            <span
              className="text-[11px] tabular-nums text-a24-muted dark:text-a24-dark-muted"
              style={{ fontFamily: 'var(--font-space), monospace' }}
            >
              {item.count.toLocaleString()}
            </span>
            {item.isNew ? (
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">NEW</span>
            ) : item.change > 0 ? (
              <span
                className="text-[10px] tabular-nums font-medium text-emerald-400"
                style={{ fontFamily: 'var(--font-space), monospace' }}
              >
                ▲+{item.change}%
              </span>
            ) : item.change < 0 ? (
              <span
                className="text-[10px] tabular-nums font-medium text-red-400"
                style={{ fontFamily: 'var(--font-space), monospace' }}
              >
                ▼{item.change}%
              </span>
            ) : (
              <span className="text-[10px] tabular-nums text-a24-muted/40" style={{ fontFamily: 'var(--font-space), monospace' }}>
                —
              </span>
            )}
            <span className="text-white/[0.08] mx-1">|</span>
          </div>
        ))}
      </div>
    </div>
  )
}
