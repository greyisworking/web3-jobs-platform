'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ══════════════════════════════════════════════════════════
// Doherty Threshold: Response within 400ms feels instant
// These components provide visual feedback for loading states
// ══════════════════════════════════════════════════════════

interface ProgressBarProps {
  value?: number // 0-100, undefined for indeterminate
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const colorStyles = {
  primary: 'bg-neun-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

export function ProgressBar({
  value,
  className,
  showLabel = false,
  size = 'md',
  color = 'primary',
}: ProgressBarProps) {
  const isIndeterminate = value === undefined

  return (
    <div className={cn('w-full', className)}>
      {showLabel && !isIndeterminate && (
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-a24-muted dark:text-a24-dark-muted">Progress</span>
          <span className="font-medium text-a24-text dark:text-a24-dark-text">{value}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-a24-border dark:bg-a24-dark-border rounded-full overflow-hidden',
          sizeStyles[size]
        )}
      >
        {isIndeterminate ? (
          <motion.div
            className={cn('h-full w-1/3 rounded-full', colorStyles[color])}
            animate={{ x: ['-100%', '400%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : (
          <motion.div
            className={cn('h-full rounded-full', colorStyles[color])}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        )}
      </div>
    </div>
  )
}

// Optimistic update wrapper - shows immediate feedback
interface OptimisticWrapperProps {
  children: React.ReactNode
  isPending: boolean
  fallback?: React.ReactNode
}

export function OptimisticWrapper({
  children,
  isPending,
  fallback,
}: OptimisticWrapperProps) {
  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isPending && fallback ? (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {fallback}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      {isPending && !fallback && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 animate-pulse" />
      )}
    </div>
  )
}

// Loading spinner with progress text
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({ size = 'md', text, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        className={cn('animate-spin text-neun-primary', sizeClasses[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <span className="text-a24-muted dark:text-a24-dark-muted text-sm">{text}</span>}
    </div>
  )
}

// Step progress indicator
interface StepProgressProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          {index > 0 && (
            <div
              className={cn(
                'h-0.5 w-8 sm:w-16 mx-2',
                index <= currentStep ? 'bg-neun-primary' : 'bg-a24-border dark:bg-a24-dark-border'
              )}
            />
          )}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                index < currentStep
                  ? 'bg-neun-primary text-white'
                  : index === currentStep
                    ? 'bg-neun-primary/20 text-neun-primary border-2 border-neun-primary'
                    : 'bg-a24-border dark:bg-a24-dark-border text-a24-muted'
              )}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className="text-xs mt-1 text-a24-muted dark:text-a24-dark-muted hidden sm:block">
              {step}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Timed progress for auto-close modals etc
interface TimedProgressProps {
  duration: number // in ms
  onComplete?: () => void
  className?: string
}

export function TimedProgress({ duration, onComplete, className }: TimedProgressProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const interval = 50 // Update every 50ms
    const step = (100 * interval) / duration

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step
        if (next <= 0) {
          clearInterval(timer)
          onComplete?.()
          return 0
        }
        return next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [duration, onComplete])

  return <ProgressBar value={progress} size="sm" className={className} />
}

export default ProgressBar
