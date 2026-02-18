'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
            <p className="text-gray-400 mb-8">{error.message}</p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-green-500 text-black font-bold hover:bg-green-400 transition"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
