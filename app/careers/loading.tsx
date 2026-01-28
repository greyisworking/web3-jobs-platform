import Pixelbara from '../components/Pixelbara'
import { JobCardSkeletonGrid } from '../components/JobCardSkeleton'

export default function CareersLoading() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <div className="flex flex-col items-center justify-center py-16">
          <Pixelbara pose="loading" size={160} />
          <p className="mt-4 text-sm font-light text-a24-muted dark:text-a24-dark-muted tracking-wide">
            brewing jobs...
          </p>
        </div>
        <JobCardSkeletonGrid count={9} />
      </main>
    </div>
  )
}
