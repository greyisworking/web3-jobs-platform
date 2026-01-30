'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { useBookmarks } from '@/hooks/useBookmarks'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface BookmarkButtonProps {
  job: { id: string; title: string; company: string }
}

export default function BookmarkButton({ job }: BookmarkButtonProps) {
  const { toggle, isBookmarked } = useBookmarks()
  const saved = isBookmarked(job.id)
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [animating, setAnimating] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (busy) return
    setBusy(true)

    try {
      // Check if user is logged in
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Trigger animation
      setAnimating(true)
      setTimeout(() => setAnimating(false), 400)

      await toggle(job)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={busy}
      className="relative flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
      aria-label={saved ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-200 ${
          saved
            ? 'text-red-500 fill-red-500'
            : 'text-a24-muted/40 dark:text-a24-dark-muted hover:text-red-400'
        } ${animating ? 'heart-animate' : ''}`}
      />
      {/* Burst effect on bookmark */}
      {animating && saved && (
        <span className="absolute inset-0 rounded-full heart-burst" />
      )}
    </button>
  )
}
