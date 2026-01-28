'use client'

import { useState } from 'react'
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

      await toggle(job)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="relative flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
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
