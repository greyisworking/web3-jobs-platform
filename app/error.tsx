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
        <p className="text-4xl font-extralight uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text mb-8">
          ERROR
        </p>

        <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted mb-8 tracking-wide">
          Something went wrong. Please try again.
        </p>

        <button
          onClick={() => reset()}
          className="group inline-flex items-center gap-2 text-[11px] font-light uppercase tracking-[0.4em] text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-8 py-3 hover:bg-a24-text hover:text-a24-surface dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
