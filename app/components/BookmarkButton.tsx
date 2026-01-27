'use client'

import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'
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
    <motion.button
      whileTap={{ scale: 0.8 }}
      whileHover={{ scale: 1.15 }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(job)
      }}
      className="relative flex items-center justify-center"
      aria-label={saved ? '북마크 해제' : '북마크 추가'}
    >
      <Heart
        className={`w-5 h-5 transition-colors duration-200 ${
          saved
            ? 'text-red-500 fill-red-500'
            : 'text-gray-400 dark:text-gray-500 hover:text-red-400'
        }`}
      />
      {saved && verified && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white dark:border-gray-800" />
      )}
    </motion.button>
  )
}
