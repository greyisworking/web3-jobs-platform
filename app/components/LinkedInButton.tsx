'use client'

import { cn } from '@/lib/utils'
import { generateLinkedInJobURL } from '@/lib/linkedin'
import { PixelLinkedIn } from './PixelIcons'

interface LinkedInButtonProps {
  company: string
  title: string
  location?: string
  className?: string
  variant?: 'default' | 'outline' | 'minimal'
}

export default function LinkedInButton({
  company,
  title,
  location,
  className,
  variant = 'default',
}: LinkedInButtonProps) {
  const linkedInUrl = generateLinkedInJobURL(company, title, location)

  const baseStyles = 'inline-flex items-center gap-2 transition-all duration-200'

  const variantStyles = {
    default: 'px-4 py-2 text-[11px] uppercase tracking-wider bg-[#0A66C2] text-white hover:bg-[#004182]',
    outline: 'px-4 py-2 text-[11px] uppercase tracking-wider border border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white dark:border-[#70B5F9] dark:text-[#70B5F9] dark:hover:bg-[#70B5F9] dark:hover:text-a24-dark-bg',
    minimal: 'text-[11px] text-a24-muted dark:text-a24-dark-muted hover:text-[#0A66C2] dark:hover:text-[#70B5F9]',
  }

  return (
    <a
      href={linkedInUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(baseStyles, variantStyles[variant], className)}
    >
      <PixelLinkedIn size={14} />
      <span>View on LinkedIn</span>
    </a>
  )
}

// ══════════════════════════════════════════════════════════
// LinkedIn Search Button (for search page)
// ══════════════════════════════════════════════════════════

interface LinkedInSearchButtonProps {
  keywords?: string
  location?: string
  className?: string
}

export function LinkedInSearchButton({ keywords, location, className }: LinkedInSearchButtonProps) {
  const params = new URLSearchParams()

  if (keywords) {
    params.set('keywords', `${keywords} web3 crypto blockchain`)
  } else {
    params.set('keywords', 'web3 crypto blockchain')
  }

  if (location) {
    params.set('location', location)
  }

  const url = `https://www.linkedin.com/jobs/search/?${params.toString()}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5',
        'text-[10px] uppercase tracking-wider',
        'border border-a24-border dark:border-a24-dark-border',
        'text-a24-muted dark:text-a24-dark-muted',
        'hover:border-[#0A66C2] hover:text-[#0A66C2]',
        'dark:hover:border-[#70B5F9] dark:hover:text-[#70B5F9]',
        'transition-colors',
        className
      )}
    >
      <PixelLinkedIn size={12} />
      <span>Search on LinkedIn</span>
    </a>
  )
}
