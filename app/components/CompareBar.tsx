'use client'

import Link from 'next/link'
import { useCompare } from '@/hooks/useCompare'
import { X, GitCompare } from 'lucide-react'

export default function CompareBar() {
  const { compareCount, maxCompare, getCompareUrl, clearCompare } = useCompare()

  if (compareCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-a24-surface dark:bg-a24-dark-surface border-t border-a24-border dark:border-a24-dark-border shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <GitCompare size={18} className="text-emerald-500" />
          <span className="text-sm text-a24-text dark:text-a24-dark-text">
            <strong>{compareCount}</strong> / {maxCompare} jobs selected
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={clearCompare}
            className="flex items-center gap-1 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
          >
            <X size={12} /> Clear
          </button>
          <Link
            href={getCompareUrl()}
            className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            Compare Now
          </Link>
        </div>
      </div>
    </div>
  )
}
