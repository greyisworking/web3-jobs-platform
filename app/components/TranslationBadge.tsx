'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'
import { containsKorean, translateJobTitle } from '@/lib/translation'

interface TranslationBadgeProps {
  originalText: string
  className?: string
}

// Shows a badge for Korean text with hover translation
export function TranslationBadge({ originalText, className }: TranslationBadgeProps) {
  const [showTranslation, setShowTranslation] = useState(false)
  const isKorean = containsKorean(originalText)

  if (!isKorean) return null

  const translated = translateJobTitle(originalText)

  return (
    <span
      className={`relative inline-flex items-center gap-1 cursor-help ${className}`}
      onMouseEnter={() => setShowTranslation(true)}
      onMouseLeave={() => setShowTranslation(false)}
    >
      <Globe className="w-3 h-3 text-blue-500" />
      <span className="text-[9px] text-blue-500 font-medium">KO</span>

      {showTranslation && (
        <span className="absolute bottom-full left-0 mb-1.5 px-2 py-1 text-[10px] whitespace-nowrap bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg z-50 pointer-events-none max-w-[200px] truncate">
          {translated}
        </span>
      )}
    </span>
  )
}

interface TranslationToggleProps {
  originalTitle: string
  originalDescription?: string
  children: (props: {
    title: string
    description?: string
    isTranslated: boolean
    toggleTranslation: () => void
  }) => React.ReactNode
}

// Wrapper component that provides translation toggle
export function TranslationToggle({
  originalTitle,
  originalDescription,
  children,
}: TranslationToggleProps) {
  const [isTranslated, setIsTranslated] = useState(false)
  const hasKorean = containsKorean(originalTitle) || (originalDescription && containsKorean(originalDescription))

  const toggleTranslation = () => {
    if (hasKorean) setIsTranslated(!isTranslated)
  }

  const title = isTranslated ? translateJobTitle(originalTitle) : originalTitle
  const description = originalDescription && isTranslated
    ? translateJobTitle(originalDescription)
    : originalDescription

  return children({ title, description, isTranslated, toggleTranslation })
}

// Button to toggle translation
interface TranslationButtonProps {
  isKorean: boolean
  isTranslated: boolean
  onToggle: () => void
  className?: string
}

export function TranslationButton({
  isKorean,
  isTranslated,
  onToggle,
  className,
}: TranslationButtonProps) {
  if (!isKorean) return null

  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ${
        isTranslated
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
          : 'bg-a24-surface dark:bg-a24-dark-surface text-a24-muted dark:text-a24-dark-muted border border-a24-border dark:border-a24-dark-border hover:border-blue-500'
      } ${className}`}
    >
      <Globe className="w-3 h-3" />
      {isTranslated ? 'Original (KO)' : 'Translate (EN)'}
    </button>
  )
}

export default TranslationBadge
