'use client'

import Link from 'next/link'
import Pixelbara from '../../components/Pixelbara'

export default function OurStoryPage() {
  return (
    <div className="space-y-10 text-sm text-a24-text dark:text-a24-dark-text leading-relaxed">
      {/* Hero section with Pixelbara */}
      <div className="flex flex-col md:flex-row items-start gap-8 mb-8">
        <div className="flex-1">
          <h1 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-4">
            Our Story
          </h1>
        </div>
        <Pixelbara pose="bling" size={120} clickable />
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <div className="space-y-4 font-light leading-relaxed">
          <p>
            I used to be a recruiter.
          </p>
          <p>
            Spent my days on hiring platforms, watching the same thing break over and over &mdash; great people falling for fake posts, companies that ghost after the interview, &quot;trust me bro&quot; everywhere. So I built NEUN. A job board you could actually trust.
          </p>
          <p>
            The first answer was simple: only list jobs from VC-backed companies. a16z, Paradigm, Hashed &mdash; let the top-tier investors do the due diligence, and trust their judgment.
          </p>
          <p>
            It worked. Kind of.
          </p>
          <p>
            But here&apos;s the thing I couldn&apos;t unsee: trusting the VCs is still just outsourcing trust to someone else. It tells you a company raised money. It doesn&apos;t tell you the job post is real, that the role still exists, that they won&apos;t ghost you after three interviews. I&apos;d moved the trust around. I hadn&apos;t actually built it.
          </p>
          <p>
            That&apos;s the question I got stuck on. Not &quot;how do I aggregate more jobs&quot; &mdash; anyone can crawl 40 sources (I do, every 3 hours). The real question is: how do you verify trust in hiring without just handing it to another middleman? Turns out that&apos;s hard. Cryptographically hard. The kind of problem where signaling theory and zero-knowledge proofs start to feel relevant, and where most easy answers quietly fall apart.
          </p>
          <p>
            NEUN is where I think out loud about that. The job board works &mdash; real jobs, real companies, updated every 3 hours, a Telegram bot that actually finds you things. That part&apos;s table stakes. The interesting part is the question underneath it.
          </p>
          <p>
            Pixelbara survived the 2022 bear market. 90% down, still vibing, still shipping. Same energy here &mdash; quietly building, sitting with the hard problem instead of pretending it&apos;s solved.
          </p>
          <p>
            If any of this resonates &mdash; if you&apos;re building in Web3 hiring, trust infrastructure, or you just think the trust problem is as interesting as I do &mdash; let&apos;s talk.
          </p>
          <p>
            <a href="mailto:dahye562@gmail.com" className="underline hover:text-a24-text dark:hover:text-a24-dark-text">
              dahye562@gmail.com
            </a>
          </p>
          <p className="text-a24-muted dark:text-a24-dark-muted italic">
            &quot;down bad but still building&quot; &mdash; pixelbara
          </p>
        </div>
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          What NEUN Does
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <ul className="space-y-2 text-a24-muted dark:text-a24-dark-muted">
          <li className="flex items-center gap-2">
            <span className="text-neun-success">✓</span> 2,400+ active positions from VC-backed companies
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neun-success">✓</span> 40+ data sources crawled every 3 hours
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neun-success">✓</span> Direct links to official career pages
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neun-success">✓</span> Market intelligence dashboard with skill trends &amp; salary data
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neun-success">✓</span> Telegram bot for natural language job search
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
          Email: dahye562@gmail.com
        </p>
        <p className="font-light text-a24-muted dark:text-a24-dark-muted tracking-wide mb-4">
          Twitter: @neunwtf
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
