'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Plus, ChevronDown, User, LogOut, Settings } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import NeunLogo from './NeunLogo'
import { WalletConnect } from './WalletConnect'
import { useAccount, useDisconnect } from 'wagmi'

interface DropdownItem {
  label: string
  href: string
  highlight?: boolean
}

interface NavDropdownProps {
  label: string
  items: DropdownItem[]
  isActive: boolean
}

function NavDropdown({ label, items, isActive }: NavDropdownProps) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`flex items-center gap-1 text-[11px] uppercase tracking-[0.3em] font-light transition-colors ${
          isActive
            ? 'text-neun-success'
            : 'text-a24-muted dark:text-a24-dark-muted hover:text-neun-success'
        }`}
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[160px] bg-a24-surface border border-a24-border shadow-lg shadow-neun-success/10 z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                item.highlight
                  ? 'text-[#FF69B4] hover:text-[#FF1493] hover:bg-[#FF1493]/10'
                  : 'text-a24-text hover:text-neun-success hover:bg-neun-success/10'
              }`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function MobileAccordion({ label, items, isActive, onClose }: NavDropdownProps & { onClose: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-a24-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between py-3 text-[11px] uppercase tracking-[0.3em] font-light transition-colors ${
          isActive
            ? 'text-neun-success'
            : 'text-a24-muted dark:text-a24-dark-muted'
        }`}
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="pb-2 pl-4 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`py-2 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                item.highlight
                  ? 'text-[#FF69B4] hover:text-[#FF1493]'
                  : 'text-a24-muted hover:text-neun-success'
              }`}
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfileDropdown() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  if (!address) return <WalletConnect />

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="flex items-center gap-2 px-3 py-2 border border-neun-success/50 text-neun-success text-[10px] uppercase tracking-wider hover:bg-neun-success/10 transition-colors">
        <div className="w-2 h-2 bg-neun-success rounded-full animate-pulse" />
        {shortAddress}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 min-w-[180px] bg-a24-surface border border-a24-border shadow-lg shadow-neun-success/10 z-50">
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-a24-text hover:text-neun-success hover:bg-neun-success/10 transition-colors"
            onClick={() => setOpen(false)}
          >
            <User className="w-3.5 h-3.5" />
            Profile
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-a24-text hover:text-neun-success hover:bg-neun-success/10 transition-colors"
            onClick={() => setOpen(false)}
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </Link>
          <div className="border-t border-a24-border" />
          <button
            onClick={() => {
              disconnect()
              setOpen(false)
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

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

  const isJobsActive = isActive('/careers') || isActive('/bounties') || isActive('/ecosystems')
  const isCommunityActive = isActive('/articles') || isActive('/meme') || isActive('/transparency')

  const linkClass = (active: boolean) =>
    `text-[11px] uppercase tracking-[0.3em] font-light transition-colors ${
      active
        ? 'text-neun-success'
        : 'text-a24-muted dark:text-a24-dark-muted hover:text-neun-success'
    }`

  const jobsDropdownItems: DropdownItem[] = [
    { label: 'All Jobs', href: '/careers' },
    { label: 'Bounties', href: '/bounties' },
  ]

  const communityDropdownItems: DropdownItem[] = [
    { label: 'Articles', href: '/articles' },
    { label: 'Meme', href: '/meme', highlight: true },
    { label: 'Transparency', href: '/transparency' },
  ]

  return (
    <>
      <header className={`sticky top-0 z-50 bg-a24-bg/95 dark:bg-a24-dark-surface/95 backdrop-blur-sm transition-all duration-300 ${scrolled ? 'border-b border-a24-border dark:border-a24-dark-border' : 'border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="hidden md:flex items-center gap-6">
            {/* Logo - clicks to home */}
            <NeunLogo className="mr-2" />

            <NavDropdown
              label="Jobs"
              items={jobsDropdownItems}
              isActive={isJobsActive}
            />
            <Link href="/companies" className={linkClass(isActive('/companies'))}>Companies</Link>
            <Link href="/investors" className={linkClass(isActive('/investors'))}>Investors</Link>
            <NavDropdown
              label="Community"
              items={communityDropdownItems}
              isActive={isCommunityActive}
            />
          </div>

          {/* Mobile: Logo */}
          <NeunLogo className="md:hidden" />

          {/* Right: Post Job + Connect + Theme */}
          <div className="hidden md:flex items-center gap-3">
            {/* Post a Job CTA - Green button */}
            <Link
              href="/post-job"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider font-medium bg-neun-success text-white hover:shadow-green-glow transition-all"
            >
              <Plus className="w-3 h-3" />
              Post Job
            </Link>

            {/* Connect / Profile dropdown */}
            <ProfileDropdown />

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
          <div className="md:hidden border-t border-a24-border dark:border-a24-dark-border bg-a24-surface/95">
            <nav className="max-w-7xl mx-auto px-6 py-2">
              <MobileAccordion
                label="Jobs"
                items={jobsDropdownItems}
                isActive={isJobsActive}
                onClose={() => setMobileMenuOpen(false)}
              />
              <Link
                href="/companies"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 border-b border-a24-border ${linkClass(isActive('/companies'))}`}
              >
                Companies
              </Link>
              <Link
                href="/investors"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 border-b border-a24-border ${linkClass(isActive('/investors'))}`}
              >
                Investors
              </Link>
              <MobileAccordion
                label="Community"
                items={communityDropdownItems}
                isActive={isCommunityActive}
                onClose={() => setMobileMenuOpen(false)}
              />

              <div className="pt-4 pb-2 flex flex-col gap-3">
                <Link
                  href="/post-job"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[10px] uppercase tracking-wider font-medium bg-neun-success text-white"
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
