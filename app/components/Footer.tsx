'use client'

import Link from 'next/link'
import { PixelSend } from './PixelIcons'

export default function Footer() {
  return (
    <footer className="border-t border-a24-border dark:border-a24-dark-border">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[10px] text-a24-text dark:text-a24-dark-text tracking-wider">
              NEUN
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/about/story"
              className="text-[11px] uppercase tracking-[0.2em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              About
            </Link>
            <Link
              href="/terms"
              className="text-[11px] uppercase tracking-[0.2em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-[11px] uppercase tracking-[0.2em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              Privacy
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-5">
            <a
              href="https://twitter.com/neunjobs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors inline-flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter
            </a>
            <a
              href="https://t.me/neunjobs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors inline-flex items-center gap-1.5"
            >
              <PixelSend size={12} />
              Telegram
            </a>
          </div>

          {/* Copyright */}
          <p className="text-[10px] font-light text-a24-muted/60 dark:text-a24-dark-muted/60 tracking-[0.15em]">
            &copy; 2026 NEUN
          </p>
        </div>
      </div>
    </footer>
  )
}
