'use client'

import { Heart } from 'lucide-react'
import { useBookmarks } from '@/hooks/useBookmarks'

interface BookmarkButtonProps {
  job: { id: string; title: string; company: string }
}

export default function BookmarkButton({ job }: BookmarkButtonProps) {
  const { toggle, isBookmarked } = useBookmarks()
  const saved = isBookmarked(job.id)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(job)
      }}
      className="relative flex items-center justify-center hover:scale-110 transition-transform"
      aria-label={saved ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Heart
        className={`w-4 h-4 transition-colors duration-200 ${
          saved
            ? 'text-a24-accent fill-a24-accent'
            : 'text-a24-muted/40 dark:text-a24-dark-muted hover:text-a24-accent'
        }`}
      />
    </button>
  )
}
