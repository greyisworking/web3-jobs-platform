'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bookmark, Menu, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import ThemeToggle from './ThemeToggle'

const BookmarksPanel = dynamic(() => import('./BookmarksPanel'), { ssr: false })

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/careers', label: 'Careers' },
  { href: '/about', label: 'About' },
  { href: '/articles', label: 'Articles' },
]

export default function Navigation() {
  const pathname = usePathname()
  const [bookmarksPanelOpen, setBookmarksPanelOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Don't render on admin pages
  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      <header className="sticky top-0 z-50 bg-a24-surface dark:bg-a24-dark-surface border-b border-a24-border dark:border-a24-dark-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-heading font-bold tracking-[0.05em] text-a24-text dark:text-a24-dark-text select-none">
            NEUN
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-xs uppercase tracking-[0.3em] transition-colors ${
                    isActive
                      ? 'text-a24-text dark:text-a24-dark-text'
                      : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
            <button
              onClick={() => setBookmarksPanelOpen(true)}
              className="flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved
            </button>
            <ThemeToggle />
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-a24-text dark:text-a24-dark-text"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-a24-border dark:border-a24-dark-border">
            <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-3">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-xs uppercase tracking-[0.3em] py-2 transition-colors ${
                      isActive
                        ? 'text-a24-text dark:text-a24-dark-text'
                        : 'text-a24-muted dark:text-a24-dark-muted'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setBookmarksPanelOpen(true)
                }}
                className="flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted py-2"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Saved
              </button>
            </nav>
          </div>
        )}
      </header>

      <BookmarksPanel
        open={bookmarksPanelOpen}
        onClose={() => setBookmarksPanelOpen(false)}
      />
    </>
  )
}
