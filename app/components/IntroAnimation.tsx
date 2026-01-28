'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'neun-intro-seen'

interface LetterData {
  char: string
  x: number
  y: number
}

const NEUN_LETTERS: LetterData[] = [
  { char: 'N', x: -30, y: -40 },
  { char: 'E', x: 25, y: 35 },
  { char: 'U', x: -20, y: 30 },
  { char: 'N', x: 35, y: -25 },
]

export default function IntroAnimation() {
  const [phase, setPhase] = useState<'headline' | 'scatter' | 'assemble' | 'fadeout' | 'done'>('headline')
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem(STORAGE_KEY)
    if (seen) {
      setPhase('done')
      return
    }
    setShow(true)

    const t1 = setTimeout(() => setPhase('scatter'), 2000)
    const t2 = setTimeout(() => setPhase('assemble'), 3200)
    const t3 = setTimeout(() => {
      setPhase('fadeout')
      localStorage.setItem(STORAGE_KEY, '1')
    }, 5000)
    const t4 = setTimeout(() => setPhase('done'), 5600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  const handleSkip = useCallback(() => {
    setPhase('fadeout')
    localStorage.setItem(STORAGE_KEY, '1')
    setTimeout(() => setPhase('done'), 400)
  }, [])

  if (phase === 'done' || !show) return null

  return (
    <AnimatePresence>
      <motion.div
        key="intro-overlay"
        className="fixed inset-0 z-[9999] bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center overflow-hidden"
        animate={{ opacity: phase === 'fadeout' ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-8 right-8 text-[10px] uppercase tracking-[0.3em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors z-10"
        >
          Skip
        </button>

        {/* Phase 1: Headline */}
        {phase === 'headline' && (
          <motion.div
            className="text-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="whitespace-nowrap text-[clamp(1.2rem,4.2vw,4.5rem)] font-extralight uppercase tracking-[0.15em] md:tracking-[0.25em] leading-[1.1] text-a24-text dark:text-a24-dark-text">
              FIND YOUR{' '}
              <em className="font-script not-italic normal-case text-[1.4em] tracking-[0.02em] leading-none">
                Next
              </em>
              {' '}CHAPTER
            </h1>
          </motion.div>
        )}

        {/* Phase 2: Letters scatter */}
        {phase === 'scatter' && (
          <div className="relative">
            {NEUN_LETTERS.map((letter, i) => (
              <motion.span
                key={`scatter-${i}`}
                className="absolute text-5xl md:text-7xl font-extralight uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text"
                style={{ left: '50%', top: '50%' }}
                initial={{ x: '-50%', y: '-50%', opacity: 0.8, scale: 1 }}
                animate={{
                  x: `${letter.x}vw`,
                  y: `${letter.y}vh`,
                  opacity: 0.3,
                  scale: 0.6,
                  rotate: (i % 2 === 0 ? 1 : -1) * (15 + i * 10),
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.08,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {letter.char}
              </motion.span>
            ))}
          </div>
        )}

        {/* Phase 3: Letters assemble into "N E U N" */}
        {phase === 'assemble' && (
          <div className="flex items-center justify-center gap-[0.4em] md:gap-[0.6em]">
            {NEUN_LETTERS.map((letter, i) => (
              <motion.span
                key={`assemble-${i}`}
                className="text-5xl md:text-7xl font-extralight uppercase text-a24-text dark:text-a24-dark-text"
                initial={{
                  x: `${letter.x * 10}px`,
                  y: `${letter.y * 10}px`,
                  opacity: 0.3,
                  scale: 0.6,
                  rotate: (i % 2 === 0 ? 1 : -1) * (15 + i * 10),
                }}
                animate={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  duration: 0.9,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {letter.char}
              </motion.span>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
