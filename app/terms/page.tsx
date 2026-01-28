'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Pixelbara from '../components/Pixelbara'

export default function TermsPage() {
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
              Terms of Service
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
            &quot;legal stuff... but still read it bestie&quot; - pixelbara
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-a24-text dark:text-a24-dark-text">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              By accessing or using NEUN (neun.xyz), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              NEUN is a job board platform that aggregates Web3 and blockchain job postings from
              venture capital-backed companies. We collect job listings from various sources including
              company career pages, job boards, and direct submissions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. User Conduct</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-[15px] text-a24-muted dark:text-a24-dark-muted">
              <li>Use the service for any unlawful purpose</li>
              <li>Scrape or harvest data without permission</li>
              <li>Submit false or misleading job postings</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with the proper working of the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Job Listings</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              While we strive to ensure accuracy, we do not guarantee the accuracy, completeness,
              or reliability of any job listing. Job listings are provided for informational purposes
              only. We are not responsible for the hiring decisions of any company listed on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Intellectual Property</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              The NEUN name, logo, pixelbara mascot, and all related graphics are owned by NEUN.
              You may not use our intellectual property without prior written consent, except for
              sharing content via our built-in sharing features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Disclaimer of Warranties</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT
              GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              NEUN shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Changes to Terms</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              We reserve the right to modify these terms at any time. Continued use of the service
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Contact</h2>
            <p className="text-[15px] leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              For questions about these terms, please contact us at legal@neun.xyz
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-a24-border dark:border-a24-dark-border flex gap-6">
          <Link href="/privacy" className="text-sm text-a24-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors">
            Privacy Policy
          </Link>
          <Link href="/about" className="text-sm text-a24-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors">
            About
          </Link>
        </div>
      </main>
    </div>
  )
}
