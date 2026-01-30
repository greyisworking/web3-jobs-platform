'use client'

import { useState, useEffect } from 'react'
import { X, Wallet, User, Briefcase, BookmarkCheck, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Pixelbara from './Pixelbara'
import { Button } from './ui/Button'

const ONBOARDING_KEY = 'neun-onboarding-seen'
const ONBOARDING_VERSION = '1' // Increment to show again after major changes

interface OnboardingProps {
  forceShow?: boolean
  onClose?: () => void
}

export function Onboarding({ forceShow = false, onClose }: OnboardingProps) {
  const [show, setShow] = useState(forceShow)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (forceShow) {
      setShow(true)
      return
    }

    const seen = localStorage.getItem(ONBOARDING_KEY)
    if (seen !== ONBOARDING_VERSION) {
      // Small delay for better UX
      const timer = setTimeout(() => setShow(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [forceShow])

  const handleClose = () => {
    setShow(false)
    localStorage.setItem(ONBOARDING_KEY, ONBOARDING_VERSION)
    onClose?.()
  }

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      handleClose()
    }
  }

  const steps = [
    {
      title: 'gm ser',
      description: 'Web3 커리어를 위한 잡 보드에 오신 것을 환영합니다',
      icon: <Pixelbara pose="gm" size={100} />,
    },
    {
      title: 'Browse Jobs',
      description: 'Tier-1 VC가 투자한 회사들의 채용 공고를 확인하세요',
      icon: <Briefcase className="w-12 h-12 text-neun-primary" />,
    },
    {
      title: 'Save & Apply',
      description: '마음에 드는 공고를 북마크하고 바로 지원하세요',
      icon: <BookmarkCheck className="w-12 h-12 text-neun-primary" />,
    },
    {
      title: 'Connect',
      description: '지갑 연결로 온체인 배지를 받거나, 소셜 로그인으로 간편하게 시작하세요',
      icon: <Wallet className="w-12 h-12 text-neun-primary" />,
    },
  ]

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 text-a24-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-8 text-center">
            {/* Step indicator */}
            <div className="flex justify-center gap-1.5 mb-6">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === step
                      ? 'bg-neun-primary'
                      : i < step
                      ? 'bg-neun-primary/50'
                      : 'bg-a24-border dark:bg-a24-dark-border'
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="mb-6 flex justify-center">{steps[step].icon}</div>

            {/* Title */}
            <h2 className="text-xl font-bold text-a24-text dark:text-a24-dark-text mb-2">
              {steps[step].title}
            </h2>

            {/* Description */}
            <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-8">
              {steps[step].description}
            </p>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button variant="ghost" onClick={handleClose} size="sm">
                Skip
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {step === steps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ══════════════════════════════════════════════
// Tooltip Component
// ══════════════════════════════════════════════

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [show, setShow] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${positionClasses[position]} z-50 px-2 py-1 text-xs whitespace-nowrap bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg pointer-events-none`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ══════════════════════════════════════════════
// Login Method Explainer
// ══════════════════════════════════════════════

export function LoginMethodExplainer() {
  return (
    <div className="space-y-4 p-4 bg-a24-bg dark:bg-a24-dark-bg border border-a24-border dark:border-a24-dark-border">
      <h3 className="text-sm font-bold text-a24-text dark:text-a24-dark-text">
        로그인 방법 비교
      </h3>

      <div className="space-y-3">
        {/* Web3 Login */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-neun-primary/10 text-neun-primary">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-a24-text dark:text-a24-dark-text">
              Web3 지갑 연결
            </p>
            <p className="text-xs text-a24-muted dark:text-a24-dark-muted">
              온체인 배지 • POAP • 채용 공고 등록 • 토큰 게이팅
            </p>
          </div>
        </div>

        {/* Social Login */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-500/10 text-blue-500">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-a24-text dark:text-a24-dark-text">
              소셜 로그인 (Google/Kakao)
            </p>
            <p className="text-xs text-a24-muted dark:text-a24-dark-muted">
              간편 로그인 • 북마크 저장 • 지원하기
            </p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted border-t border-a24-border dark:border-a24-dark-border pt-3">
        💡 소셜 로그인 후에도 언제든 지갑을 연결할 수 있어요
      </p>
    </div>
  )
}

// ══════════════════════════════════════════════
// Feature Highlight Tooltip
// ══════════════════════════════════════════════

const FEATURE_TIPS_KEY = 'neun-feature-tips-seen'

interface FeatureTipProps {
  id: string
  title: string
  description: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function FeatureTip({
  id,
  title,
  description,
  children,
  position = 'bottom',
}: FeatureTipProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = JSON.parse(localStorage.getItem(FEATURE_TIPS_KEY) || '{}')
    if (!seen[id]) {
      const timer = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [id])

  const handleDismiss = () => {
    setShow(false)
    const seen = JSON.parse(localStorage.getItem(FEATURE_TIPS_KEY) || '{}')
    seen[id] = true
    localStorage.setItem(FEATURE_TIPS_KEY, JSON.stringify(seen))
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            className={`absolute ${positionClasses[position]} z-50 w-56 p-3 bg-neun-primary text-white shadow-lg`}
          >
            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 bg-neun-primary rotate-45 ${
                position === 'bottom'
                  ? '-top-1 left-1/2 -translate-x-1/2'
                  : position === 'top'
                  ? '-bottom-1 left-1/2 -translate-x-1/2'
                  : position === 'left'
                  ? '-right-1 top-1/2 -translate-y-1/2'
                  : '-left-1 top-1/2 -translate-y-1/2'
              }`}
            />

            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="text-sm font-bold mb-1">{title}</p>
                <p className="text-xs opacity-90">{description}</p>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-0.5 hover:bg-white/20 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Onboarding
