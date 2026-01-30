'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { type TrustLevel, type TrustScore, TRUST_COMMENTS, quickTrustCheck, SIMPLE_TRUST_CHECKS, simpleCompanyTrustCheck, type SimpleTrustResult, TIER1_VCS } from '@/lib/trust-check'
import { PixelThumbsUp, PixelThinking, PixelSweating, PixelRunning, PixelCheck, PixelX } from './PixelIcons'

// ══════════════════════════════════════════════════════════
// Trust Level Config
// ══════════════════════════════════════════════════════════

const TRUST_CONFIG: Record<TrustLevel, {
  icon: React.ComponentType<{ className?: string; size?: number }>
  dotColor: string
  bgColor: string
  textColor: string
  label: string
}> = {
  verified: {
    icon: PixelThumbsUp,
    dotColor: 'bg-emerald-500 dark:bg-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    label: 'VERIFIED',
  },
  caution: {
    icon: PixelThinking,
    dotColor: 'bg-amber-500 dark:bg-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    label: 'CAUTION',
  },
  warning: {
    icon: PixelSweating,
    dotColor: 'bg-red-500 dark:bg-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
    label: 'WARNING',
  },
  blacklisted: {
    icon: PixelRunning,
    dotColor: 'bg-gray-800 dark:bg-gray-200',
    bgColor: 'bg-gray-100 dark:bg-gray-900',
    textColor: 'text-gray-800 dark:text-gray-200',
    label: 'BLACKLISTED',
  },
}

// ══════════════════════════════════════════════════════════
// Mini Trust Badge (for cards - hover only)
// ══════════════════════════════════════════════════════════

interface MiniTrustBadgeProps {
  backers?: string[] | null
  companyName?: string
  className?: string
}

export function MiniTrustBadge({ backers, companyName, className }: MiniTrustBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const level = quickTrustCheck(backers, companyName)
  const config = TRUST_CONFIG[level]
  const Icon = config.icon

  return (
    <span
      className={cn('relative inline-flex items-center gap-1', className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      <Icon size={12} className={config.textColor} />

      {showTooltip && (
        <span className={cn(
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5',
          'px-2 py-1 text-[10px] whitespace-nowrap z-50 pointer-events-none',
          'bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg'
        )}>
          {TRUST_COMMENTS[level]}
        </span>
      )}
    </span>
  )
}

// ══════════════════════════════════════════════════════════
// Full Trust Badge (for detail pages)
// ══════════════════════════════════════════════════════════

interface TrustBadgeProps {
  level: TrustLevel
  className?: string
  showLabel?: boolean
}

export function TrustBadge({ level, className, showLabel = true }: TrustBadgeProps) {
  const config = TRUST_CONFIG[level]
  const Icon = config.icon

  return (
    <span className={cn(
      'inline-flex items-center gap-2 px-2.5 py-1',
      config.bgColor,
      className
    )}>
      <span className={cn('w-2 h-2 rounded-full', config.dotColor)} />
      <Icon size={14} className={config.textColor} />
      {showLabel && (
        <span className={cn('text-[10px] font-medium tracking-wider', config.textColor)}>
          {config.label}
        </span>
      )}
    </span>
  )
}

// ══════════════════════════════════════════════════════════
// Trust Check List (for detail pages)
// ══════════════════════════════════════════════════════════

interface TrustCheckListProps {
  score: TrustScore
  className?: string
}

export function TrustCheckList({ score, className }: TrustCheckListProps) {
  const config = TRUST_CONFIG[score.level]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with badge and comment */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrustBadge level={score.level} />
          {score.parentCompany && (
            <span className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
              ({score.parentCompany} subsidiary)
            </span>
          )}
        </div>
        <p className={cn(
          'text-[11px] italic',
          config.textColor
        )}>
          &quot;{score.comment}&quot;
        </p>
      </div>

      {/* Score bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-a24-muted dark:text-a24-dark-muted">
          <span>Trust Score</span>
          <span className={config.textColor}>{score.score}/100</span>
        </div>
        <div className="h-1.5 bg-a24-border dark:bg-a24-dark-border">
          <div
            className={cn('h-full transition-all duration-500', config.dotColor)}
            style={{ width: `${score.score}%` }}
          />
        </div>
      </div>

      {/* Check items */}
      <div className="space-y-2">
        {/* White checks (positive) */}
        <div className="space-y-1">
          <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider mb-1">
            Positive Signals
          </p>
          {score.checks
            .filter((c) => c.type === 'white')
            .map((check) => (
              <div
                key={check.id}
                className="flex items-center gap-2 text-[11px]"
              >
                {check.passed ? (
                  <PixelCheck size={10} className="text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <span className="w-2.5 h-2.5 text-a24-muted/30 dark:text-a24-dark-muted/30">—</span>
                )}
                <span className={check.passed
                  ? 'text-a24-text dark:text-a24-dark-text'
                  : 'text-a24-muted/50 dark:text-a24-dark-muted/50'
                }>
                  {check.label}
                </span>
                {check.detail && (
                  <span className="text-a24-muted dark:text-a24-dark-muted text-[10px]">
                    ({check.detail})
                  </span>
                )}
              </div>
            ))}
        </div>

        {/* Black checks (negative) */}
        <div className="space-y-1 pt-2 border-t border-a24-border dark:border-a24-dark-border">
          <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider mb-1">
            Risk Signals
          </p>
          {score.checks
            .filter((c) => c.type === 'black')
            .map((check) => (
              <div
                key={check.id}
                className="flex items-center gap-2 text-[11px]"
              >
                {!check.passed ? (
                  <PixelX size={10} className="text-red-500 dark:text-red-400" />
                ) : (
                  <PixelCheck size={10} className="text-a24-muted/30 dark:text-a24-dark-muted/30" />
                )}
                <span className={!check.passed
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-a24-muted/50 dark:text-a24-dark-muted/50'
                }>
                  {check.label}
                </span>
                {check.detail && !check.passed && (
                  <span className="text-red-500/70 dark:text-red-400/70 text-[10px]">
                    ({check.detail})
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// Simple Trust Check List (for non-VC companies)
// ══════════════════════════════════════════════════════════

const SIMPLE_TRUST_CONFIG: Record<'verified' | 'partial' | 'unknown', {
  emoji: string
  dotColor: string
  textColor: string
}> = {
  verified: {
    emoji: '🟢',
    dotColor: 'bg-emerald-500 dark:bg-emerald-400',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  partial: {
    emoji: '🟡',
    dotColor: 'bg-amber-500 dark:bg-amber-400',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  unknown: {
    emoji: '🔴',
    dotColor: 'bg-red-500 dark:bg-red-400',
    textColor: 'text-red-600 dark:text-red-400',
  },
}

interface SimpleTrustCheckListProps {
  result: SimpleTrustResult
  className?: string
}

export function SimpleTrustCheckList({ result, className }: SimpleTrustCheckListProps) {
  const config = SIMPLE_TRUST_CONFIG[result.level]

  return (
    <div className={cn('space-y-3', className)}>
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{config.emoji}</span>
          <span className={cn('text-xs font-medium uppercase tracking-wider', config.textColor)}>
            {result.level === 'verified' ? 'Verified' : result.level === 'partial' ? 'Partial' : 'Unknown'}
          </span>
          <span className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
            ({result.passedCount}/{result.totalCount})
          </span>
        </div>
      </div>

      {/* Comment */}
      <p className={cn('text-[11px] italic', config.textColor)}>
        &quot;{result.comment}&quot;
      </p>

      {/* Check items */}
      <div className="space-y-1.5">
        {result.checks.map((check) => {
          const checkConfig = SIMPLE_TRUST_CHECKS.find(c => c.id === check.id)
          return (
            <div key={check.id} className="flex items-center gap-2 text-[11px]">
              {check.passed ? (
                <PixelCheck size={10} className="text-emerald-500 dark:text-emerald-400" />
              ) : (
                <PixelX size={10} className="text-a24-muted/40 dark:text-a24-dark-muted/40" />
              )}
              <span className={check.passed
                ? 'text-a24-text dark:text-a24-dark-text'
                : 'text-a24-muted/50 dark:text-a24-dark-muted/50'
              }>
                {checkConfig?.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-[9px] text-a24-muted/60 dark:text-a24-dark-muted/60 pt-2 border-t border-a24-border/50 dark:border-a24-dark-border/50">
        this is for reference only. always DYOR!
      </p>
    </div>
  )
}

/**
 * Check if company has VC backing from tier 1 investors
 */
export function hasVCBacking(backers?: string[] | null): boolean {
  if (!backers || backers.length === 0) return false
  return backers.some((b) =>
    TIER1_VCS.some((vc) => b.toLowerCase().includes(vc.toLowerCase()))
  )
}

export default TrustBadge
