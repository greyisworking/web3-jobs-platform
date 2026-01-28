'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Pixelbara from './components/Pixelbara'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Pixelbara with confused/lost expression */}
        <div className="mb-8">
          <Pixelbara pose="dejected" size={180} className="mx-auto" />
        </div>

        {/* 404 text */}
        <h1 className="font-heading text-6xl md:text-8xl font-bold text-a24-text dark:text-a24-dark-text mb-4">
          404
        </h1>

        {/* Meme text */}
        <p className="text-lg md:text-xl text-a24-muted dark:text-a24-dark-muted mb-2">
          you&apos;re lost anon...
        </p>
        <p className="text-sm text-a24-muted/60 dark:text-a24-dark-muted/60 mb-10">
          this page doesn&apos;t exist. probably rugged.
        </p>

        {/* Go home button */}
        <Link
          href="/"
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] font-light text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-8 py-4 hover:bg-a24-text hover:text-white dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
          go back home
        </Link>
      </div>
    </div>
  )
}
