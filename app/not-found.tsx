import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <p className="text-[100px] md:text-[140px] font-extralight leading-none tracking-[0.15em] text-a24-text dark:text-a24-dark-text select-none mb-8">
          404
        </p>

        <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted mb-8 tracking-wide">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>

        <Link
          href="/"
          className="text-[11px] font-light uppercase tracking-[0.4em] text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-8 py-3 hover:bg-a24-text hover:text-a24-surface dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-colors inline-block"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
