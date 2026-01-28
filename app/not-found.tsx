import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <p className="text-[120px] md:text-[160px] font-heading leading-none text-a24-text dark:text-a24-dark-text select-none mb-8">
          404
        </p>

        <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>

        <Link
          href="/"
          className="text-xs uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-6 py-3 hover:bg-a24-text hover:text-a24-surface dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-colors inline-block"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
