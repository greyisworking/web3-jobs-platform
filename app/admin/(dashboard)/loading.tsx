import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
