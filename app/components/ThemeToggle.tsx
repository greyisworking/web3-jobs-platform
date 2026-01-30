'use client'

import { useEffect, useState } from 'react'

// Pixel art Sun (8-bit style)
function PixelSun() {
  return (
    <svg width="24" height="24" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* Rays */}
      <rect x="7" y="0" width="2" height="2" fill="#FFD700" />
      <rect x="7" y="14" width="2" height="2" fill="#FFD700" />
      <rect x="0" y="7" width="2" height="2" fill="#FFD700" />
      <rect x="14" y="7" width="2" height="2" fill="#FFD700" />
      {/* Diagonal rays */}
      <rect x="2" y="2" width="2" height="2" fill="#FFA500" />
      <rect x="12" y="2" width="2" height="2" fill="#FFA500" />
      <rect x="2" y="12" width="2" height="2" fill="#FFA500" />
      <rect x="12" y="12" width="2" height="2" fill="#FFA500" />
      {/* Core - outer ring */}
      <rect x="5" y="4" width="6" height="1" fill="#FFD700" />
      <rect x="5" y="11" width="6" height="1" fill="#FFD700" />
      <rect x="4" y="5" width="1" height="6" fill="#FFD700" />
      <rect x="11" y="5" width="1" height="6" fill="#FFD700" />
      {/* Core - inner fill */}
      <rect x="5" y="5" width="6" height="6" fill="#FFEB3B" />
      {/* Highlight */}
      <rect x="6" y="6" width="2" height="2" fill="#FFFDE7" />
    </svg>
  )
}

// Pixel art Moon (8-bit style) - Dark purple for light mode
function PixelMoon() {
  return (
    <svg width="24" height="24" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* Moon crescent shape - dark purple outline */}
      <rect x="5" y="2" width="6" height="1" fill="#4C1D95" />
      <rect x="4" y="3" width="2" height="1" fill="#4C1D95" />
      <rect x="10" y="3" width="2" height="1" fill="#4C1D95" />
      <rect x="3" y="4" width="2" height="1" fill="#4C1D95" />
      <rect x="3" y="5" width="2" height="1" fill="#4C1D95" />
      <rect x="2" y="6" width="2" height="1" fill="#4C1D95" />
      <rect x="2" y="7" width="2" height="2" fill="#4C1D95" />
      <rect x="2" y="9" width="2" height="1" fill="#4C1D95" />
      <rect x="3" y="10" width="2" height="1" fill="#4C1D95" />
      <rect x="3" y="11" width="2" height="1" fill="#4C1D95" />
      <rect x="4" y="12" width="2" height="1" fill="#4C1D95" />
      <rect x="5" y="13" width="6" height="1" fill="#4C1D95" />
      <rect x="10" y="12" width="2" height="1" fill="#4C1D95" />
      {/* Inner moon fill - purple */}
      <rect x="5" y="3" width="5" height="1" fill="#6D28D9" />
      <rect x="5" y="4" width="6" height="1" fill="#6D28D9" />
      <rect x="5" y="5" width="6" height="1" fill="#6D28D9" />
      <rect x="4" y="6" width="7" height="1" fill="#6D28D9" />
      <rect x="4" y="7" width="7" height="2" fill="#6D28D9" />
      <rect x="4" y="9" width="7" height="1" fill="#6D28D9" />
      <rect x="5" y="10" width="6" height="1" fill="#6D28D9" />
      <rect x="5" y="11" width="6" height="1" fill="#6D28D9" />
      <rect x="6" y="12" width="4" height="1" fill="#6D28D9" />
      {/* Crater details - darker purple */}
      <rect x="6" y="5" width="2" height="2" fill="#3B0764" />
      <rect x="9" y="8" width="1" height="1" fill="#3B0764" />
      <rect x="5" y="10" width="1" height="1" fill="#3B0764" />
      {/* Stars around moon - light purple */}
      <rect x="12" y="3" width="1" height="1" fill="#A78BFA" />
      <rect x="14" y="6" width="1" height="1" fill="#A78BFA" />
      <rect x="13" y="11" width="1" height="1" fill="#A78BFA" />
      <rect x="1" y="3" width="1" height="1" fill="#A78BFA" />
    </svg>
  )
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const isDark = stored !== 'light'

    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  if (!mounted) {
    return <div className="w-11 h-11" /> // 44px placeholder for Fitts's Law
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-a24-surface dark:hover:bg-a24-dark-surface hover:scale-110 active:scale-95 transition-all touch-target-44"
    >
      {/* Show current mode: Moon for dark, Sun for light */}
      <div className="w-7 h-7 flex items-center justify-center">
        {dark ? <PixelMoon /> : <PixelSun />}
      </div>
    </button>
  )
}
