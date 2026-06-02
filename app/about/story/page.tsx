'use client'

import Link from 'next/link'
import Pixelbara from '../../components/Pixelbara'

export default function OurStoryPage() {
  return (
    <div className="text-sm text-a24-text dark:text-a24-dark-text leading-relaxed">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-10">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          About
        </h1>
        <Pixelbara pose="bling" size={70} clickable />
      </div>

      {/* Story */}
      <div className="space-y-5 text-[15px] text-a24-muted/80 dark:text-a24-dark-muted/80 leading-relaxed mb-14">
        <p>I used to be a recruiter.</p>
        <p>
          Spent my days on hiring platforms, watching the same thing break over and over &mdash; great people falling for fake posts, companies that ghost after the interview, &quot;trust me bro&quot; everywhere. So I built NEUN. A job board you could actually trust.
        </p>
        <p>
          The first answer was simple: only list jobs from VC-backed companies. a16z, Paradigm, Hashed &mdash; let the top-tier investors do the due diligence, and trust their judgment.
        </p>
        <p>It worked. Kind of.</p>
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
          And if you read code and want to actually build this with someone: even more so. I&apos;ve taken NEUN as far as one person reasonably can. The next part isn&apos;t a solo job.
        </p>
        <p>
          <a href="mailto:dahye562@gmail.com" className="text-neun-success hover:text-neun-success/80 transition-colors">
            dahye562@gmail.com
          </a>
        </p>
        <p className="text-a24-muted/50 dark:text-a24-dark-muted/50 italic text-sm">
          &quot;down bad but still building&quot; &mdash; pixelbara
        </p>
      </div>

      {/* What NEUN Does */}
      <Section title="What NEUN Does">
        <ul className="space-y-2.5 text-a24-muted/70 dark:text-a24-dark-muted/70">
          {[
            '1,000+ active positions from VC-backed companies',
            '40+ data sources crawled every 3 hours',
            'Direct links to official career pages',
            'Market intelligence dashboard with skill trends & salary data',
            'Telegram bot for natural language job search',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="text-neun-success mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Why NEUN */}
      <Section title='Why "NEUN"'>
        <p className="text-a24-muted/70 dark:text-a24-dark-muted/70">
          &ldquo;는&rdquo; (neun) is a Korean particle that marks the topic of a sentence.
          It frames context, sets the stage. Your next job? That&apos;s the topic.
          NEUN sets the stage for your Web3 career.
        </p>
      </Section>

      {/* Pixelbara */}
      <Section title="Pixelbara">
        <div className="flex items-start gap-5">
          <Pixelbara pose="blank" size={64} clickable />
          <div className="space-y-3 text-a24-muted/70 dark:text-a24-dark-muted/70">
            <p>
              Our mascot is a capybara named Pixelbara. Chill, vibes with everyone,
              lowkey the most unbothered animal on earth.
            </p>
            <div className="space-y-1 text-a24-muted/50 dark:text-a24-dark-muted/50 italic text-[13px]">
              <p>&quot;portfolio might be red but my commits are green&quot;</p>
              <p>&quot;touched grass once. came back to ship more code&quot;</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Sources */}
      <Section title="Sources">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-a24-muted/50 dark:text-a24-dark-muted/50">
          {['Greenhouse', 'Lever', 'Ashby', 'web3.career', 'cryptojobslist.com', 'wanted.co.kr', 'remote3.co', 'and more'].map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact">
        <div className="space-y-1 text-a24-muted/60 dark:text-a24-dark-muted/60 text-[13px]">
          <p>dahye562@gmail.com</p>
          <p>Twitter: @neunwtf</p>
        </div>
        <p className="mt-3 text-xs text-a24-muted/40 dark:text-a24-dark-muted/40">
          Got feedback? Found a bug?{' '}
          <Link href="/post-job" className="text-neun-success hover:text-neun-success/80 transition-colors">
            Reach out
          </Link>
        </p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xs font-semibold text-a24-muted/50 dark:text-a24-dark-muted/50 tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </div>
  )
}
