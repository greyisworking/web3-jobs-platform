'use client'

import Link from 'next/link'
import { MiniPixelbara } from './Pixelbara'
import { PixelSend } from './PixelIcons'

export default function Footer() {
  return (
    <footer className="border-t border-a24-border dark:border-a24-dark-border">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Main Links Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          {/* Primary Nav */}
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/careers"
              className="text-[11px] uppercase tracking-[0.25em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              Jobs
            </Link>
            <Link
              href="/companies"
              className="text-[11px] uppercase tracking-[0.25em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              Companies
            </Link>
            <Link
              href="/investors"
              className="text-[11px] uppercase tracking-[0.25em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              Investors
            </Link>
          </div>

          {/* Secondary Nav */}
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/meme"
              className="text-[11px] uppercase tracking-[0.25em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              Meme Generator
            </Link>
            <Link
              href="/about/story"
              className="text-[11px] uppercase tracking-[0.25em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              About
            </Link>
            <Link
              href="/terms"
              className="text-[11px] uppercase tracking-[0.25em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-[11px] uppercase tracking-[0.25em] font-light text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>

        {/* Social + Copyright Row */}
        <div className="pt-6 border-t border-a24-border/50 dark:border-a24-dark-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo + Pixelbara */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extralight uppercase tracking-[0.5em] text-a24-text dark:text-a24-dark-text">
                N E U N
              </span>
              <MiniPixelbara />
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-6">
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
      </div>
    </footer>
  )
}
