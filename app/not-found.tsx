import Link from 'next/link'
import Pixelbara from './components/Pixelbara'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <Pixelbara pose="smoking" size={220} className="mx-auto mb-8" />

        <p className="text-[100px] md:text-[140px] font-extralight leading-none tracking-[0.15em] text-a24-text dark:text-a24-dark-text select-none mb-4">
          404
        </p>

        <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted mb-8 tracking-wide">
          gm... this page doesn&apos;t exist ser.
        </p>

        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-[11px] font-light uppercase tracking-[0.4em] text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-8 py-3 hover:bg-a24-text hover:text-a24-surface dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
