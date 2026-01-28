'use client'

import { Heart } from 'lucide-react'
import { useBookmarks } from '@/hooks/useBookmarks'

interface BookmarkButtonProps {
  job: { id: string; title: string; company: string }
}

export default function BookmarkButton({ job }: BookmarkButtonProps) {
  const { toggle, isBookmarked, bookmarks } = useBookmarks()
  const saved = isBookmarked(job.id)
  const bookmark = bookmarks.find((b) => b.jobId === job.id)
  const verified = bookmark?.verified

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(job)
      }}
      className="relative flex items-center justify-center hover:scale-110 transition-transform"
      aria-label={saved ? '북마크 해제' : '북마크 추가'}
    >
      <Heart
        className={`w-5 h-5 transition-colors duration-200 ${
          saved
            ? 'text-sub-hotpink fill-sub-hotpink'
            : 'text-sub-charcoal/40 dark:text-gray-500 hover:text-sub-hotpink'
        }`}
      />
      {saved && verified && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sub-sky border border-white dark:border-sub-dark-surface" />
      )}
    </button>
  )
}
