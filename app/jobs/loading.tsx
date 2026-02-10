'use client'

import { useState, useEffect } from 'react'
import Pixelbara from '../components/Pixelbara'
import { JobCardSkeletonGrid } from '../components/JobCardSkeleton'

export default function CareersLoading() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 2500)
    const t2 = setTimeout(() => setStage(2), 5000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const messages = [
    'searching for that bag...',
    'almost there ser...',
    'lfg! 🚀',
  ]

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <div className="flex flex-col items-center justify-center py-16">
          <Pixelbara pose="loading" size={160} />
          <p className="mt-4 text-sm font-light text-a24-muted dark:text-a24-dark-muted tracking-wide transition-opacity duration-300">
            {messages[stage]}
          </p>
        </div>
        <JobCardSkeletonGrid count={9} showLoader={false} />
      </main>
    </div>
  )
}
