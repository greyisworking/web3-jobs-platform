'use client'

import { useEffect, useState } from 'react'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

export default function KonamiEasterEgg() {
  const [, setProgress] = useState(0)
  const [rainbow, setRainbow] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      setProgress(prev => {
        if (e.key === KONAMI[prev]) {
          const next = prev + 1
          if (next === KONAMI.length) {
            setRainbow(true)
            setTimeout(() => setRainbow(false), 8000)
            return 0
          }
          return next
        }
        return e.key === KONAMI[0] ? 1 : 0
      })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (rainbow) {
      document.body.classList.add('pixelbara-rainbow')
    } else {
      document.body.classList.remove('pixelbara-rainbow')
    }
  }, [rainbow])

  return null
}
