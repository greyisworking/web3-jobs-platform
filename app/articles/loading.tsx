import { Skeleton } from '@/components/ui/skeleton'

function ArticleCardSkeleton() {
  return (
    <div className="p-6 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
      <Skeleton className="h-40 w-full mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

export default function ArticlesLoading() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <Skeleton className="h-10 w-32 mb-3" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
