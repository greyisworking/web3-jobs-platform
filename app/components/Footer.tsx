'use client'

import Link from 'next/link'
import { MiniPixelbara } from './Pixelbara'
import { PixelSend } from './PixelIcons'

export default function Footer() {
  return (
    <footer className="border-t border-a24-border dark:border-a24-dark-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Navigation */}
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-a24-text dark:text-a24-dark-text mb-4">
              Explore
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/careers', label: 'Careers' },
                { href: '/companies', label: 'Companies' },
                { href: '/investors', label: 'Investors' },
                { href: '/ecosystems', label: 'Ecosystems' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-a24-text dark:text-a24-dark-text mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/about', label: 'About' },
                { href: '/post-job', label: 'Post a Job' },
                { href: '/terms', label: 'Terms' },
                { href: '/privacy', label: 'Privacy' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-a24-text dark:text-a24-dark-text mb-4">
              Connect
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://twitter.com/neunjobs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/neunjobs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors inline-flex items-center gap-2"
                >
                  <PixelSend size={14} />
                  Telegram
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-a24-text dark:text-a24-dark-text mb-4">
              Stay Updated
            </h3>
            <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-3">
              Get notified for new jobs
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                // TODO: Implement newsletter subscription
                const form = e.target as HTMLFormElement
                const email = new FormData(form).get('email')
                if (email) {
                  alert('welcome to the club bestie')
                  form.reset()
                }
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 text-sm bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
                required
              />
              <button
                type="submit"
                className="px-3 py-2 bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg hover:opacity-80 transition-opacity"
              >
                <PixelSend size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-a24-border/50 dark:border-a24-dark-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo + Pixelbara */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extralight uppercase tracking-[0.5em] text-a24-text dark:text-a24-dark-text">
                N E U N
              </span>
              <MiniPixelbara />
            </div>

            {/* Copyright */}
            <p className="text-[10px] font-light text-a24-muted/60 dark:text-a24-dark-muted/60 tracking-[0.15em]">
              &copy; 2026 NEUN (neun.xyz). All rights reserved.
            </p>

            {/* Meme text */}
            <p className="text-[10px] italic text-a24-muted/40 dark:text-a24-dark-muted/40">
              wagmi
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
