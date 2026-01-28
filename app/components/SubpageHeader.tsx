'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Tab {
  href: string
  label: string
}

interface SubpageHeaderProps {
  title: string
  tabs?: Tab[]
}

export default function SubpageHeader({ title, tabs }: SubpageHeaderProps) {
  const pathname = usePathname()

  return (
    <div className="pt-16 pb-10 md:pt-20 md:pb-12">
      {/* 1-depth: Large centered title */}
      <h1 className="text-center text-2xl md:text-3xl lg:text-4xl font-extralight uppercase tracking-[0.4em] text-a24-muted/70 dark:text-a24-dark-muted/70 mb-8">
        {title}
      </h1>

      {/* 2-depth: Tab menu */}
      {tabs && tabs.length > 0 && (
        <nav className="flex justify-center gap-8 md:gap-12">
          {tabs.map(({ href, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`relative text-[11px] uppercase tracking-[0.3em] font-light pb-2 transition-colors ${
                  isActive
                    ? 'text-a24-text dark:text-a24-dark-text'
                    : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-a24-text dark:bg-a24-dark-text" />
                )}
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
