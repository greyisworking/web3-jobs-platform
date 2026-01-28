'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <p className="text-6xl font-heading text-a24-text dark:text-a24-dark-text mb-8">
          ERROR
        </p>

        <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-8">
          Something went wrong. Please try again.
        </p>

        <button
          onClick={() => reset()}
          className="text-xs uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-6 py-3 hover:bg-a24-text hover:text-a24-surface dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
