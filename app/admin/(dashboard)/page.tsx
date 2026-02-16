import { Suspense } from 'react'
import { Dashboard4DX } from './Dashboard4DX'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard4DX />
    </Suspense>
  )
}
