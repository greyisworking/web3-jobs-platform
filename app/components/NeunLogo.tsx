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
      <span className="text-xs font-extralight uppercase tracking-[0.5em] text-a24-text dark:text-a24-dark-text">
        N E U N
      </span>
    </Link>
  )
}
