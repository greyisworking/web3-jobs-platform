'use client'

import Link from 'next/link'

interface NeunLogoProps {
  className?: string
}

export default function NeunLogo({ className = '' }: NeunLogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center select-none ${className}`}
    >
      <span className="font-pixel text-[11px] sm:text-xs text-a24-text dark:text-a24-dark-text tracking-wider">
        NEUN
      </span>
    </Link>
  )
}
