const CARD_TINTS = [
  'bg-card-sky dark:bg-card-sky-dark',
  'bg-card-pink dark:bg-card-pink-dark',
  'bg-card-cream dark:bg-card-cream-dark',
  'bg-card-mint dark:bg-card-mint-dark',
  'bg-card-coral dark:bg-card-coral-dark',
]

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`bg-a24-border/50 dark:bg-a24-dark-border animate-pulse ${className ?? ''}`}
    />
  )
}

export default function JobCardSkeleton({ index = 0 }: { index?: number }) {
  const bg = CARD_TINTS[index % CARD_TINTS.length]
  return (
    <div className={`p-6 ${bg} border border-a24-border dark:border-a24-dark-border -mt-px -ml-px`}>
      <ShimmerBlock className="h-5 w-2/5 mb-4" />
      <ShimmerBlock className="h-4 w-3/4 mb-2" />
      <ShimmerBlock className="h-3 w-1/4 mt-2" />
    </div>
  )
}

export function JobCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <JobCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}
