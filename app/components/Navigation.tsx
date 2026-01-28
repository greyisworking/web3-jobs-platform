'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, Plus } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import ThemeToggle from './ThemeToggle'
import NeunLogo from './NeunLogo'

const ABOUT_SUBMENU = [
  { href: '/about/story', label: 'Our Story' },
  { href: '/about/notice', label: 'Notice' },
  { href: '/about/press', label: 'Press' },
]

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const aboutRef = useRef<HTMLDivElement>(null)
  const aboutTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
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

  const handleAboutEnter = () => {
    if (aboutTimeout.current) clearTimeout(aboutTimeout.current)
    setAboutOpen(true)
  }

  const handleAboutLeave = () => {
    aboutTimeout.current = setTimeout(() => setAboutOpen(false), 200)
  }

  return (
    <>
      <header className={`sticky top-0 z-50 bg-a24-bg/95 dark:bg-a24-dark-surface/95 backdrop-blur-sm transition-all duration-300 ${scrolled ? 'border-b border-a24-border dark:border-a24-dark-border' : 'border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="hidden md:flex items-center gap-6">
            {/* Interactive Logo with Pixelbara */}
            <NeunLogo className="mr-2" />

            <Link href="/" className={linkClass(isActive('/'))}>Home</Link>
            <Link href="/careers" className={linkClass(isActive('/careers'))}>Careers</Link>
            <Link href="/companies" className={linkClass(isActive('/companies'))}>Companies</Link>
            <Link href="/investors" className={linkClass(isActive('/investors'))}>Investors</Link>
            <Link href="/ecosystems" className={linkClass(isActive('/ecosystems'))}>Ecosystems</Link>

            {/* About with dropdown */}
            <div
              ref={aboutRef}
              className="relative"
              onMouseEnter={handleAboutEnter}
              onMouseLeave={handleAboutLeave}
            >
              <Link
                href="/about/story"
                className={`${linkClass(isActive('/about'))} inline-flex items-center gap-1`}
              >
                About
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${aboutOpen ? 'rotate-180' : ''}`} />
              </Link>

              {/* Dropdown */}
              {aboutOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3">
                  <div className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border py-2 min-w-[140px]">
                    {ABOUT_SUBMENU.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setAboutOpen(false)}
                        className={`block px-5 py-2 text-[11px] uppercase tracking-[0.25em] font-light transition-colors ${
                          pathname === href
                            ? 'text-a24-text dark:text-a24-dark-text'
                            : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Logo */}
          <NeunLogo className="md:hidden" />

          {/* Right: Post Job CTA + Auth + Theme */}
          <div className="hidden md:flex items-center gap-4">
            {/* Post a Job CTA */}
            <Link
              href="/post-job"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider font-medium bg-neun-success text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3 h-3" />
              Post Job
            </Link>

            {isLoggedIn ? (
              <Link href="/account" className={linkClass(isActive('/account'))}>Account</Link>
            ) : (
              <Link href="/login" className={linkClass(isActive('/login'))}>Log In</Link>
            )}
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
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`${linkClass(isActive('/'))} py-2`}>Home</Link>
              <Link href="/careers" onClick={() => setMobileMenuOpen(false)} className={`${linkClass(isActive('/careers'))} py-2`}>Careers</Link>
              <Link href="/companies" onClick={() => setMobileMenuOpen(false)} className={`${linkClass(isActive('/companies'))} py-2`}>Companies</Link>
              <Link href="/investors" onClick={() => setMobileMenuOpen(false)} className={`${linkClass(isActive('/investors'))} py-2`}>Investors</Link>
              <Link href="/ecosystems" onClick={() => setMobileMenuOpen(false)} className={`${linkClass(isActive('/ecosystems'))} py-2`}>Ecosystems</Link>
              <Link href="/articles" onClick={() => setMobileMenuOpen(false)} className={`${linkClass(isActive('/articles'))} py-2`}>Articles</Link>
              <div className="border-t border-a24-border dark:border-a24-dark-border pt-2 mt-1">
                <p className="text-[10px] uppercase tracking-[0.3em] font-light text-a24-muted/60 dark:text-a24-dark-muted/60 mb-2">About</p>
                {ABOUT_SUBMENU.map(({ href, label }) => (
                  <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className={`${linkClass(pathname === href)} py-2 pl-4 block`}>
                    {label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-a24-border dark:border-a24-dark-border pt-3 mt-1">
                <Link
                  href="/post-job"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider font-medium bg-neun-success text-white"
                >
                  <Plus className="w-3 h-3" />
                  Post a Job
                </Link>
              </div>
              <div className="border-t border-a24-border dark:border-a24-dark-border pt-2 mt-1">
                {isLoggedIn ? (
                  <Link href="/account" onClick={() => setMobileMenuOpen(false)} className={`${linkClass(isActive('/account'))} py-2 block`}>Account</Link>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={`${linkClass(isActive('/login'))} py-2 block`}>Log In</Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

    </>
  )
}
