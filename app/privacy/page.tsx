'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Pixelbara from '../components/Pixelbara'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text mb-8 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-a24-text dark:text-a24-dark-text mb-2">
              Privacy Policy
            </h1>
            <p className="text-a24-muted dark:text-a24-dark-muted text-sm">
              Last updated: January 2026
            </p>
          </div>
          <Pixelbara pose="reading" size={80} />
        </div>

        {/* Pixelbara comment */}
        <div className="mb-8 p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted italic">
            &quot;we respect ur privacy bestie. fr fr.&quot; - pixelbara
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-a24-text dark:text-a24-dark-text">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted mb-4">
              We collect information you provide directly to us:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px] text-a24-muted dark:text-a24-dark-muted">
              <li>Email address (for newsletter and job alerts)</li>
              <li>Account information (if you create an account)</li>
              <li>Job posting information (if you submit a job)</li>
              <li>Feedback and correspondence</li>
            </ul>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted mt-4">
              We automatically collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px] text-a24-muted dark:text-a24-dark-muted">
              <li>Usage data (pages visited, features used)</li>
              <li>Device information (browser type, operating system)</li>
              <li>IP address and approximate location</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-[15px] text-a24-muted dark:text-a24-dark-muted">
              <li>To provide and improve our services</li>
              <li>To send job alerts and newsletters (with your consent)</li>
              <li>To respond to your inquiries</li>
              <li>To analyze usage patterns and improve user experience</li>
              <li>To prevent fraud and abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Information Sharing</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              We do not sell your personal information. We may share information with:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-[15px] text-a24-muted dark:text-a24-dark-muted">
              <li>Service providers who assist in our operations</li>
              <li>Analytics providers (in aggregated, anonymized form)</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Cookies and Tracking</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-[15px] text-a24-muted dark:text-a24-dark-muted">
              <li>Remember your preferences (dark mode, bookmarks)</li>
              <li>Understand how you use our service</li>
              <li>Improve our service based on usage patterns</li>
            </ul>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted mt-4">
              You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              We implement appropriate security measures to protect your information.
              However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-[15px] text-a24-muted dark:text-a24-dark-muted">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              We retain your information for as long as your account is active or as needed
              to provide services. You can request deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. International Transfers</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              Your information may be transferred to and processed in countries other than
              your own. We ensure appropriate safeguards are in place.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              Our service is not intended for children under 16. We do not knowingly
              collect information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              We may update this policy from time to time. We will notify you of any
              material changes by posting the new policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              For privacy-related questions, please contact us at privacy@neun.xyz
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-a24-border dark:border-a24-dark-border flex gap-6">
          <Link href="/terms" className="text-sm text-a24-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors">
            Terms of Service
          </Link>
          <Link href="/about" className="text-sm text-a24-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors">
            About
          </Link>
        </div>
      </main>
    </div>
  )
}
