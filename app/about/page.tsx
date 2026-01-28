import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Neun',
  description: 'About Neun — Web3 careers aggregated from 40+ global and Korean sources.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-5xl md:text-6xl font-heading uppercase tracking-[0.1em] text-a24-text dark:text-a24-dark-text mb-8">
          About
        </h1>

        <div className="space-y-8 text-sm text-a24-text dark:text-a24-dark-text leading-relaxed">
          <p className="text-base text-a24-muted dark:text-a24-dark-muted">
            Neun은 Web3 업계의 채용 정보를 한곳에 모아 제공하는 플랫폼입니다.
          </p>

          <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
            <h2 className="text-xs font-heading uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted mb-4">
              What We Do
            </h2>
            <p>
              We aggregate Web3 job listings from 40+ global and Korean sources, updated every 3 hours.
              From DeFi protocols to NFT marketplaces, from Layer 1 blockchains to gaming studios &mdash;
              we bring every opportunity to one place.
            </p>
          </div>

          <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
            <h2 className="text-xs font-heading uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted mb-4">
              Why Neun
            </h2>
            <p>
              &ldquo;는&rdquo; (neun) is a Korean particle that marks the topic of a sentence.
              It frames context, sets the stage.
              Like the particle itself, we set the stage for your next chapter in Web3.
            </p>
          </div>

          <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
            <h2 className="text-xs font-heading uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted mb-4">
              Sources
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                'web3.career', 'web3jobs.cc', 'web3kr.jobs', 'cryptojobslist.com',
                'wanted.co.kr', 'remote3.co', 'remoteok.com', 'rocketpunch.com',
                'jobkorea.co.kr', 'jobs.sui.io', 'jobs.solana.com', 'ethereum.foundation',
              ].map((source) => (
                <span key={source} className="text-xs text-a24-muted dark:text-a24-dark-muted py-1">
                  {source}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-a24-border dark:border-a24-dark-border pt-8">
            <h2 className="text-xs font-heading uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted mb-4">
              Contact
            </h2>
            <p className="text-a24-muted dark:text-a24-dark-muted">
              hello@neun.io
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
