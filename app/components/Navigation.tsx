'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Plus } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import NeunLogo from './NeunLogo'
import { WalletConnect } from './WalletConnect'

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Don't render on admin pages
  if (pathname?.startsWith('/admin')) return null

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  const linkClass = (active: boolean) =>
    `text-[11px] uppercase tracking-[0.3em] font-light transition-colors ${
      active
        ? 'text-a24-text dark:text-a24-dark-text'
        : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
    }`

  return (
    <>
      <header className={`sticky top-0 z-50 bg-a24-bg/95 dark:bg-a24-dark-surface/95 backdrop-blur-sm transition-all duration-300 ${scrolled ? 'border-b border-a24-border dark:border-a24-dark-border' : 'border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="hidden md:flex items-center gap-8">
            {/* Logo - clicks to home */}
            <NeunLogo className="mr-2" />

            <Link href="/careers" className={linkClass(isActive('/careers') || isActive('/bounties') || isActive('/ecosystems'))}>Jobs</Link>
            <Link href="/companies" className={linkClass(isActive('/companies'))}>Companies</Link>
            <Link href="/investors" className={linkClass(isActive('/investors'))}>Investors</Link>
          </div>

          {/* Mobile: Logo */}
          <NeunLogo className="md:hidden" />

          {/* Right: Post Job + Connect + Theme */}
          <div className="hidden md:flex items-center gap-3">
            {/* Post a Job CTA - Green button */}
            <Link
              href="/post-job"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider font-medium bg-neun-success text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3 h-3" />
              Post Job
            </Link>

            {/* Connect - Border button with wallet */}
            <WalletConnect />

            <ThemeToggle />
          </div>

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
            <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
              <Link href="/careers" onClick={() => setMobileMenuOpen(false)} className={`${linkClass(isActive('/careers'))} py-2`}>Jobs</Link>
              <Link href="/companies" onClick={() => setMobileMenuOpen(false)} className={`${linkClass(isActive('/companies'))} py-2`}>Companies</Link>
              <Link href="/investors" onClick={() => setMobileMenuOpen(false)} className={`${linkClass(isActive('/investors'))} py-2`}>Investors</Link>

              <div className="border-t border-a24-border dark:border-a24-dark-border pt-3 mt-1 flex flex-col gap-3">
                <Link
                  href="/post-job"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider font-medium bg-neun-success text-white w-fit"
                >
                  <Plus className="w-3 h-3" />
                  Post Job
                </Link>
                <div className="py-2">
                  <WalletConnect />
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
