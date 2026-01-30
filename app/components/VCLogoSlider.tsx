'use client'

import { useEffect, useRef } from 'react'

const VC_LOGOS = [
  { name: 'a16z', color: '#000000' },
  { name: 'Paradigm', color: '#000000' },
  { name: 'Hashed', color: '#FF5722' },
  { name: 'Kakao', color: '#FEE500' },
  { name: 'Dunamu', color: '#1772F8' },
  { name: 'SoftBank', color: '#ED1C24' },
  { name: 'Animoca', color: '#FF6B00' },
  { name: 'Binance', color: '#F3BA2F' },
  { name: 'LINE', color: '#00B900' },
  { name: 'Mirae Asset', color: '#003366' },
  { name: 'KB Invest', color: '#FFCC00' },
  { name: 'Samsung Next', color: '#1428A0' },
]

export default function VCLogoSlider() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let animationId: number
    let scrollPos = 0

    const scroll = () => {
      scrollPos += 0.5
      if (scrollPos >= el.scrollWidth / 2) {
        scrollPos = 0
      }
      el.scrollLeft = scrollPos
      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className="w-full overflow-hidden py-6">
      <p className="text-center text-[10px] uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted mb-4">
        Backed by the best
      </p>
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-hidden whitespace-nowrap"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Duplicate for seamless loop */}
        {[...VC_LOGOS, ...VC_LOGOS].map((vc, i) => (
          <div
            key={`${vc.name}-${i}`}
            className="flex-shrink-0 px-4 py-2 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface"
          >
            <span
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: vc.color }}
            >
              {vc.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
