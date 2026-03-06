'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export default function TouchGrassReminder() {
  const shown = useRef(false)

  useEffect(() => {
    if (shown.current) return
    const timer = setTimeout(() => {
      if (!shown.current) {
        shown.current = true
        toast('Take a break', {
          description: "You've been browsing for 5 minutes.",
          duration: 5000,
        })
      }
    }, 5 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [])

  return null
}
