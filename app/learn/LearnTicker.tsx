'use client'

interface TickerItem {
  skill: string
  count: number
  change: number
  isNew: boolean
}

export default function LearnTicker({ items }: { items: TickerItem[] }) {
  const duplicated = [...items, ...items]

  return (
    <div className="overflow-hidden border-b border-a24-border dark:border-a24-dark-border bg-a24-surface/30 dark:bg-a24-dark-surface/30">
      <div className="learn-ticker flex whitespace-nowrap py-2.5" role="marquee" aria-label="Skill demand ticker">
        {duplicated.map((item, i) => (
          <div key={`${item.skill}-${i}`} className="flex items-center gap-2 px-5 shrink-0">
            <span
              className="text-[11px] font-medium text-a24-text dark:text-a24-dark-text"
              style={{ fontFamily: 'var(--font-space), monospace' }}
            >
              {item.skill}
            </span>
            <span
              className="text-[10px] tabular-nums text-a24-muted dark:text-a24-dark-muted"
              style={{ fontFamily: 'var(--font-space), monospace' }}
            >
              {item.count.toLocaleString()}
            </span>
            {item.change > 0 ? (
              <span
                className="text-[10px] tabular-nums font-medium text-neun-success"
                style={{ fontFamily: 'var(--font-space), monospace' }}
              >
                +{item.change}%
              </span>
            ) : item.change < 0 ? (
              <span
                className="text-[10px] tabular-nums font-medium text-red-400"
                style={{ fontFamily: 'var(--font-space), monospace' }}
              >
                {item.change}%
              </span>
            ) : (
              <span className="text-[10px] tabular-nums text-a24-muted/40" style={{ fontFamily: 'var(--font-space), monospace' }}>
                —
              </span>
            )}
            <span className="text-a24-border dark:text-a24-dark-border mx-1">|</span>
          </div>
        ))}
      </div>
    </div>
  )
}
