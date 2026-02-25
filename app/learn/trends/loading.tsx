export default function TrendsLoading() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-32">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-a24-surface dark:bg-a24-dark-surface rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-a24-surface dark:bg-a24-dark-surface rounded" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-a24-surface dark:bg-a24-dark-surface rounded" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
