const TILE_BG = [
  'bg-tile-1 dark:bg-tile-1-dark',
  'bg-tile-2 dark:bg-tile-2-dark',
  'bg-tile-3 dark:bg-tile-3-dark',
  'bg-tile-4 dark:bg-tile-4-dark',
  'bg-tile-5 dark:bg-tile-5-dark',
]

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`bg-white/40 dark:bg-white/10 animate-pulse ${className ?? ''}`}
    />
  )
}

export default function JobCardSkeleton({ index = 0 }: { index?: number }) {
  const bg = TILE_BG[index % TILE_BG.length]
  return (
    <div className={`p-5 ${bg}`}>
      <div className="flex items-start justify-between mb-3">
        <ShimmerBlock className="w-9 h-9" />
        <ShimmerBlock className="w-5 h-5" />
      </div>
      <ShimmerBlock className="h-4 w-3/4 mb-1" />
      <ShimmerBlock className="h-3 w-1/3 mb-3" />
      <div className="flex gap-1">
        <ShimmerBlock className="h-5 w-16" />
        <ShimmerBlock className="h-5 w-20" />
        <ShimmerBlock className="h-5 w-14" />
      </div>
    </div>
  )
}

export function JobCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-sub-border dark:bg-sub-border-dark border border-sub-border dark:border-sub-border-dark">
      {Array.from({ length: count }, (_, i) => (
        <JobCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}
