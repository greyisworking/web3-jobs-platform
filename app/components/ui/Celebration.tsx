'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, PartyPopper, Trophy, Rocket, Heart, Star } from 'lucide-react'

// ══════════════════════════════════════════════════════════
// Peak-End Rule: Celebration Moments
// Creates memorable positive endings for key user actions
// ══════════════════════════════════════════════════════════

type CelebrationType = 'download' | 'apply' | 'firstArticle' | 'milestone' | 'welcome' | 'success'

interface CelebrationConfig {
  icon: ReactNode
  title: string
  message: string
  confettiColors: string[]
}

const CELEBRATIONS: Record<CelebrationType, CelebrationConfig> = {
  download: {
    icon: <Sparkles className="w-8 h-8" />,
    title: 'Download Complete!',
    message: 'Your meme is ready to share with the world!',
    confettiColors: ['#22C55E', '#10B981', '#34D399', '#6EE7B7'],
  },
  apply: {
    icon: <Rocket className="w-8 h-8" />,
    title: "You've Applied!",
    message: 'Good luck! We hope you land this one!',
    confettiColors: ['#3B82F6', '#60A5FA', '#93C5FD', '#22C55E'],
  },
  firstArticle: {
    icon: <PartyPopper className="w-8 h-8" />,
    title: 'Welcome, Writer!',
    message: 'Your first article is live. Keep creating!',
    confettiColors: ['#F59E0B', '#FBBF24', '#FCD34D', '#22C55E'],
  },
  milestone: {
    icon: <Trophy className="w-8 h-8" />,
    title: 'Milestone Reached!',
    message: "You're doing amazing! Keep it up!",
    confettiColors: ['#FFD700', '#FFA500', '#FF6347', '#22C55E'],
  },
  welcome: {
    icon: <Heart className="w-8 h-8" />,
    title: 'Welcome to NEUN!',
    message: "Let's find your dream Web3 job!",
    confettiColors: ['#EC4899', '#F472B6', '#F9A8D4', '#22C55E'],
  },
  success: {
    icon: <Star className="w-8 h-8" />,
    title: 'Success!',
    message: 'Action completed successfully.',
    confettiColors: ['#22C55E', '#10B981', '#34D399', '#6EE7B7'],
  },
}

// Confetti particle component
function Confetti({ colors }: { colors: string[] }) {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: -20,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: '110vh',
            rotate: p.rotation + 720,
            opacity: 0,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'linear',
          }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  )
}

interface CelebrationProps {
  type: CelebrationType
  show: boolean
  onClose: () => void
  customTitle?: string
  customMessage?: string
  duration?: number
}

export function Celebration({
  type,
  show,
  onClose,
  customTitle,
  customMessage,
  duration = 4000,
}: CelebrationProps) {
  const config = CELEBRATIONS[type]
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (show) {
      setShowConfetti(true)
      const timer = setTimeout(() => {
        onClose()
        setShowConfetti(false)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  return (
    <AnimatePresence>
      {show && (
        <>
          {showConfetti && <Confetti colors={config.confettiColors} />}

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed inset-0 flex items-center justify-center z-[99] pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.1, 1] }}
              transition={{ duration: 0.5, times: [0, 0.5, 1] }}
              className="bg-white dark:bg-a24-dark-surface rounded-lg shadow-2xl p-8 text-center max-w-sm mx-4 pointer-events-auto border border-neun-primary/20"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-4 bg-neun-primary/10 rounded-full flex items-center justify-center text-neun-primary"
              >
                {config.icon}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-a24-text dark:text-a24-dark-text mb-2 celebration-text"
              >
                {customTitle || config.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-a24-muted dark:text-a24-dark-muted"
              >
                {customMessage || config.message}
              </motion.p>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-neun-primary text-white font-medium rounded hover:bg-neun-primary-hover transition-colors min-h-[44px]"
              >
                Continue
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Hook for easy celebration triggering
export function useCelebration() {
  const [celebrationState, setCelebrationState] = useState<{
    show: boolean
    type: CelebrationType
    customTitle?: string
    customMessage?: string
  }>({
    show: false,
    type: 'success',
  })

  const celebrate = (
    type: CelebrationType,
    options?: { title?: string; message?: string }
  ) => {
    setCelebrationState({
      show: true,
      type,
      customTitle: options?.title,
      customMessage: options?.message,
    })
  }

  const closeCelebration = () => {
    setCelebrationState((prev) => ({ ...prev, show: false }))
  }

  return {
    celebrate,
    celebrationProps: {
      ...celebrationState,
      onClose: closeCelebration,
    },
  }
}

export default Celebration
