'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const LOGO_QUOTES = [
  'bruh',
  'what',
  'hi i guess',
  '...ok',
  'sup',
  'hm?',
  'yo',
  '*stares*',
]

// Mini pixelbara for logo
function LogoPixelbara({
  isHovered,
  isJumping,
}: {
  isHovered: boolean
  isJumping: boolean
}) {
  // SVG pixel art for tiny pixelbara face (8x6)
  // Gen Z deadpan eyes (ㅡ_ㅡ)
  const pixels = [
    // Ears
    { x: 0, y: 0, c: '#A67B52' }, { x: 1, y: 0, c: '#A67B52' },
    { x: 6, y: 0, c: '#A67B52' }, { x: 7, y: 0, c: '#A67B52' },
    // Face row 1
    { x: 1, y: 1, c: '#C4956A' }, { x: 2, y: 1, c: '#C4956A' }, { x: 3, y: 1, c: '#C4956A' },
    { x: 4, y: 1, c: '#C4956A' }, { x: 5, y: 1, c: '#C4956A' }, { x: 6, y: 1, c: '#C4956A' },
    // Eyes row (deadpan horizontal lines)
    { x: 1, y: 2, c: '#C4956A' },
    { x: 2, y: 2, c: isHovered ? '#2D1B10' : '#4A3020' }, // Left eye - looks at you when hovered
    { x: 3, y: 2, c: isHovered ? '#2D1B10' : '#4A3020' },
    { x: 4, y: 2, c: '#C4956A' },
    { x: 5, y: 2, c: isHovered ? '#2D1B10' : '#4A3020' }, // Right eye
    { x: 6, y: 2, c: isHovered ? '#2D1B10' : '#4A3020' },
    { x: 7, y: 2, c: '#C4956A' },
    // Nose row
    { x: 1, y: 3, c: '#C4956A' }, { x: 2, y: 3, c: '#C4956A' },
    { x: 3, y: 3, c: '#6B4A3A' }, { x: 4, y: 3, c: '#6B4A3A' }, // Nostrils
    { x: 5, y: 3, c: '#C4956A' }, { x: 6, y: 3, c: '#C4956A' },
    // Bottom face
    { x: 2, y: 4, c: '#D4B090' }, { x: 3, y: 4, c: '#D4B090' },
    { x: 4, y: 4, c: '#D4B090' }, { x: 5, y: 4, c: '#D4B090' },
  ]

  return (
    <motion.div
      animate={{
        y: isJumping ? [0, -8, 0] : 0,
        rotate: isHovered ? 10 : 0,
      }}
      transition={{
        y: { duration: 0.3, ease: 'easeOut' },
        rotate: { duration: 0.2 },
      }}
      className="inline-block"
      style={{ width: 16, height: 12 }}
    >
      <svg
        viewBox="0 0 8 5"
        className="w-full h-full"
        shapeRendering="crispEdges"
        preserveAspectRatio="xMidYMid meet"
      >
        {pixels.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={p.c} />
        ))}
      </svg>
    </motion.div>
  )
}

interface NeunLogoProps {
  showAnimation?: boolean
  className?: string
}

export default function NeunLogo({ showAnimation = false, className = '' }: NeunLogoProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isJumping, setIsJumping] = useState(false)
  const [showPixelbara, setShowPixelbara] = useState(!showAnimation)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Initial walk-in animation
  useEffect(() => {
    if (showAnimation && !hasAnimated) {
      const timer = setTimeout(() => {
        setShowPixelbara(true)
        setHasAnimated(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [showAnimation, hasAnimated])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsJumping(true)
    setTimeout(() => setIsJumping(false), 300)

    const quote = LOGO_QUOTES[Math.floor(Math.random() * LOGO_QUOTES.length)]
    toast(quote, { duration: 1500 })
  }

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1.5 select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // Only trigger click if clicking on pixelbara area
        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        if (clickX > rect.width - 30) {
          handleClick(e)
        }
      }}
    >
      <span className="text-xs font-extralight uppercase tracking-[0.5em] text-a24-text dark:text-a24-dark-text">
        N E U N
      </span>

      <AnimatePresence>
        {showPixelbara && (
          <motion.div
            initial={showAnimation ? { x: 20, opacity: 0 } : { opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="cursor-pointer"
            onClick={handleClick}
          >
            <LogoPixelbara isHovered={isHovered} isJumping={isJumping} />
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  )
}
