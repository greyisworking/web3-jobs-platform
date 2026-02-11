import { Skeleton } from '@/components/ui/skeleton'

function CompanyCardSkeleton() {
  return (
    <div className="relative p-6 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
      <Skeleton className="absolute top-3 right-3 w-8 h-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-3 w-1/3 mb-4" />
      <div className="flex gap-1.5 mb-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  )
}

export default function CompaniesLoading() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Skeleton className="h-10 w-48 mb-3" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="w-[100px] h-[100px]" />
        </div>

        {/* Filter skeleton */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <CompanyCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
