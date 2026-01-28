'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Pixelbara from './components/Pixelbara'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Pixelbara sweating/panicked expression */}
        <div className="mb-8">
          <Pixelbara pose="sweating" size={180} className="mx-auto" />
        </div>

        {/* Error text */}
        <h1 className="font-pixel text-4xl md:text-5xl text-a24-text dark:text-a24-dark-text mb-4 tracking-wider">
          oops
        </h1>

        {/* Meme text */}
        <p className="text-lg md:text-xl text-a24-muted dark:text-a24-dark-muted mb-2">
          something broke...
        </p>
        <p className="text-sm text-a24-muted/60 dark:text-a24-dark-muted/60 mb-10">
          probably nothing. definitely not your fault ser.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="group inline-flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.4em] font-light text-a24-surface dark:text-a24-dark-bg bg-a24-text dark:bg-a24-dark-text px-8 py-4 hover:opacity-80 transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
            try again
          </button>

          <Link
            href="/"
            className="group inline-flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.4em] font-light text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-8 py-4 hover:bg-a24-text hover:text-white dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
            go home
          </Link>
        </div>
      </div>
    </div>
  )
}
