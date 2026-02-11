import { Skeleton } from '@/components/ui/skeleton'

export default function JobDetailLoading() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-12">
        {/* Back button */}
        <Skeleton className="h-4 w-20 mb-8" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-5 w-1/2 mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-12" />
        </div>

        {/* Content sections */}
        <div className="space-y-8">
          {/* Description */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>

          {/* Requirements */}
          <div>
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-20" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
