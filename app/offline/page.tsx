'use client'

import Link from 'next/link'
import Pixelbara from '../components/Pixelbara'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-a24-bg dark:bg-a24-dark-bg">
      <div className="text-center max-w-md">
        {/* Sad Pixelbara */}
        <div className="flex justify-center mb-8">
          <Pixelbara pose="ngmi" size={120} />
        </div>

        {/* Message */}
        <h1 className="font-pixel text-xl text-neun-success mb-4">
          YOU&apos;RE OFFLINE
        </h1>

        <p className="text-a24-muted dark:text-a24-dark-muted mb-8 leading-relaxed">
          Looks like you lost connection to the blockchain... I mean, internet.
          <br />
          <span className="text-xs opacity-60">ngmi without wifi tbh</span>
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-neun-success text-white text-sm uppercase tracking-wider hover:shadow-green-glow transition-all"
          >
            Try Again
          </button>

          <Link
            href="/careers"
            className="px-6 py-3 border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text text-sm uppercase tracking-wider hover:border-neun-success hover:text-neun-success transition-colors"
          >
            Cached Jobs
          </Link>
        </div>

        {/* Tip */}
        <p className="mt-8 text-xs text-a24-muted dark:text-a24-dark-muted">
          Tip: Previously visited pages might still be available offline
        </p>
      </div>
    </main>
  )
}
