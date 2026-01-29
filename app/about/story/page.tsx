'use client'

import Link from 'next/link'
import Pixelbara from '../../components/Pixelbara'

export default function OurStoryPage() {
  return (
    <div className="space-y-10 text-sm text-a24-text dark:text-a24-dark-text leading-relaxed">
      {/* Hero section with Pixelbara */}
      <div className="flex flex-col md:flex-row items-start gap-8 mb-8">
        <div className="flex-1">
          <p className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-4">
            NEUN is Web3&apos;s most trusted job board.
          </p>
          <p className="text-base font-light text-a24-muted dark:text-a24-dark-muted">
            Only VC-backed companies. Only legit jobs. No scams, no rugs, no bs.
          </p>
        </div>
        <Pixelbara pose="bling" size={120} clickable />
      </div>

      {/* Pixelbara quote */}
      <div className="p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
        <p className="text-sm text-a24-muted dark:text-a24-dark-muted italic">
          &quot;we&apos;re just tryna help u get a job fr&quot; - pixelbara
        </p>
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          The Problem
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <p className="font-light leading-relaxed mb-4">
          Web3 job hunting is a mess. Scam projects everywhere. Fake job posts.
          Companies that rug after you join. LinkedIn is scary. Twitter is chaotic.
        </p>
        <p className="font-light leading-relaxed">
          We got tired of seeing talented people fall for fake opportunities.
          So we built NEUN &mdash; a job board you can actually trust.
        </p>
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          Our Solution
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <p className="font-light leading-relaxed mb-4">
          We only list jobs from VC-backed companies. a16z, Paradigm, Hashed, and 40+ other
          top-tier investors have done the due diligence. We trust their judgment.
        </p>
        <ul className="space-y-2 text-a24-muted dark:text-a24-dark-muted">
          <li className="flex items-center gap-2">
            <span className="text-neun-success">✓</span> Verified funding from Tier 1 VCs
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neun-success">✓</span> Real companies with real products
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neun-success">✓</span> Direct links to official career pages
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neun-success">✓</span> Updated every 3 hours
          </li>
        </ul>
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          Why &quot;NEUN&quot;
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <p className="font-light leading-relaxed">
          &ldquo;는&rdquo; (neun) is a Korean particle that marks the topic of a sentence.
          It frames context, sets the stage. Your next job? That&apos;s the topic.
          NEUN sets the stage for your Web3 career.
        </p>
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          Meet Pixelbara
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <div className="flex items-start gap-6">
          <Pixelbara pose="blank" size={80} clickable />
          <div>
            <p className="font-light leading-relaxed mb-4">
              Our mascot is a capybara named Pixelbara. Why a capybara? They&apos;re chill,
              they vibe with everyone, and they&apos;re lowkey the most unbothered animals on earth.
            </p>
            <p className="font-light leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              Pixelbara has a Gen Z attitude (ㅡ_ㅡ) &mdash; deadpan stare, minimal effort,
              maximum vibe. Click on them throughout the site for random quotes.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          Pixelbara&apos;s Philosophy
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <div className="flex items-start gap-6">
          <Pixelbara pose="hodl" size={100} clickable />
          <div className="space-y-4">
            <p className="font-light leading-relaxed">
              Pixelbara survived the 2022 bear market. 90% down, still vibing. Still shipping.
              That&apos;s the energy we bring to job hunting in Web3.
            </p>
            <div className="space-y-2 text-a24-muted dark:text-a24-dark-muted text-sm">
              <p className="italic">&quot;portfolio might be red but my commits are green&quot;</p>
              <p className="italic">&quot;down bad but still building&quot;</p>
              <p className="italic">&quot;touched grass once. came back to ship more code&quot;</p>
            </div>
            <p className="font-light leading-relaxed text-a24-muted dark:text-a24-dark-muted">
              Pixelbara doesn&apos;t panic sell. Doesn&apos;t chase pumps. Just builds quietly,
              survives every cycle, and helps anons find legit jobs. That&apos;s the way.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          Sources
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <p className="font-light leading-relaxed mb-4 text-a24-muted dark:text-a24-dark-muted">
          We aggregate from 40+ sources including:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            'Greenhouse', 'Lever', 'Ashby', 'Company websites',
            'web3.career', 'cryptojobslist.com', 'wanted.co.kr',
            'jobkorea.co.kr', 'remote3.co', 'and more...',
          ].map((source) => (
            <span key={source} className="text-[11px] font-light text-a24-muted dark:text-a24-dark-muted py-1 tracking-wide">
              {source}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          Contact / Feedback
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <p className="font-light text-a24-muted dark:text-a24-dark-muted tracking-wide mb-2">
          Email: hello@neun.wtf
        </p>
        <p className="font-light text-a24-muted dark:text-a24-dark-muted tracking-wide mb-4">
          Twitter: @neunjobs
        </p>
        <p className="text-sm text-a24-muted/70 dark:text-a24-dark-muted/70">
          Got feedback? Found a bug? Want to list your company?{' '}
          <Link href="/post-job" className="underline hover:text-a24-text dark:hover:text-a24-dark-text">
            Reach out
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
