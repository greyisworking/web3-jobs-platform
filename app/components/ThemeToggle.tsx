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

// Pixel art Moon (8-bit style)
function PixelMoon() {
  return (
    <svg width="24" height="24" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* Moon crescent shape */}
      <rect x="5" y="2" width="6" height="1" fill="#E0E0E0" />
      <rect x="4" y="3" width="2" height="1" fill="#E0E0E0" />
      <rect x="10" y="3" width="2" height="1" fill="#E0E0E0" />
      <rect x="3" y="4" width="2" height="1" fill="#E0E0E0" />
      <rect x="3" y="5" width="2" height="1" fill="#E0E0E0" />
      <rect x="2" y="6" width="2" height="1" fill="#E0E0E0" />
      <rect x="2" y="7" width="2" height="2" fill="#E0E0E0" />
      <rect x="2" y="9" width="2" height="1" fill="#E0E0E0" />
      <rect x="3" y="10" width="2" height="1" fill="#E0E0E0" />
      <rect x="3" y="11" width="2" height="1" fill="#E0E0E0" />
      <rect x="4" y="12" width="2" height="1" fill="#E0E0E0" />
      <rect x="5" y="13" width="6" height="1" fill="#E0E0E0" />
      <rect x="10" y="12" width="2" height="1" fill="#E0E0E0" />
      {/* Inner moon fill */}
      <rect x="5" y="3" width="5" height="1" fill="#F5F5F5" />
      <rect x="5" y="4" width="6" height="1" fill="#F5F5F5" />
      <rect x="5" y="5" width="6" height="1" fill="#F5F5F5" />
      <rect x="4" y="6" width="7" height="1" fill="#F5F5F5" />
      <rect x="4" y="7" width="7" height="2" fill="#F5F5F5" />
      <rect x="4" y="9" width="7" height="1" fill="#F5F5F5" />
      <rect x="5" y="10" width="6" height="1" fill="#F5F5F5" />
      <rect x="5" y="11" width="6" height="1" fill="#F5F5F5" />
      <rect x="6" y="12" width="4" height="1" fill="#F5F5F5" />
      {/* Crater details */}
      <rect x="6" y="5" width="2" height="2" fill="#BDBDBD" />
      <rect x="9" y="8" width="1" height="1" fill="#BDBDBD" />
      <rect x="5" y="10" width="1" height="1" fill="#BDBDBD" />
      {/* Stars around moon */}
      <rect x="12" y="3" width="1" height="1" fill="#FFFDE7" />
      <rect x="14" y="6" width="1" height="1" fill="#FFFDE7" />
      <rect x="13" y="11" width="1" height="1" fill="#FFFDE7" />
      <rect x="1" y="3" width="1" height="1" fill="#FFFDE7" />
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
    return <div className="w-8 h-8" />
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
    >
      {dark ? <PixelMoon /> : <PixelSun />}
    </button>
  )
}
