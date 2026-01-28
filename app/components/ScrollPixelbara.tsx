'use client'

import { useEffect, useState } from 'react'
import { WalkingPixelbara } from './Pixelbara'

export default function ScrollPixelbara() {
  const [visible, setVisible] = useState(false)
  const [y, setY] = useState(0)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY
          setVisible(scrollY > 300)
          setY(scrollY)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  // Bob up and down slightly with scroll
  const bobY = Math.sin(y / 40) * 4

  return (
    <div
      className="fixed bottom-6 right-6 z-40 transition-opacity duration-300 pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(${bobY}px)`,
      }}
    >
      <WalkingPixelbara size={48} />
    </div>
  )
}
