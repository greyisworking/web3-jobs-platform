import { Skeleton } from '@/components/ui/skeleton'

function BountyCardSkeleton() {
  return (
    <div className="p-6 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

export default function BountiesLoading() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-12">
          <Skeleton className="h-10 w-48 mb-3" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <BountyCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
