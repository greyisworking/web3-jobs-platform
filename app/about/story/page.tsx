export default function OurStoryPage() {
  return (
    <div className="space-y-10 text-sm text-a24-text dark:text-a24-dark-text leading-relaxed">
      <p className="text-base font-light text-a24-muted dark:text-a24-dark-muted">
        Neun은 Web3 업계의 채용 정보를 한곳에 모아 제공하는 플랫폼입니다.
      </p>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          What We Do
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <p className="font-light leading-relaxed">
          We aggregate Web3 job listings from 40+ global and Korean sources, updated every 3 hours.
          From DeFi protocols to NFT marketplaces, from Layer 1 blockchains to gaming studios &mdash;
          we bring every opportunity to one place.
        </p>
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          Why Neun
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <p className="font-light leading-relaxed">
          &ldquo;는&rdquo; (neun) is a Korean particle that marks the topic of a sentence.
          It frames context, sets the stage.
          Like the particle itself, we set the stage for your next chapter in Web3.
        </p>
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          Sources
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            'web3.career', 'web3jobs.cc', 'web3kr.jobs', 'cryptojobslist.com',
            'wanted.co.kr', 'remote3.co', 'remoteok.com', 'rocketpunch.com',
            'jobkorea.co.kr', 'jobs.sui.io', 'jobs.solana.com', 'ethereum.foundation',
          ].map((source) => (
            <span key={source} className="text-[11px] font-light text-a24-muted dark:text-a24-dark-muted py-1 tracking-wide">
              {source}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-a24-border dark:border-a24-dark-border pt-10">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
          Contact
        </h2>
        <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-5" />
        <p className="font-light text-a24-muted dark:text-a24-dark-muted tracking-wide">
          neun@neun.io
        </p>
      </div>
    </div>
  )
}
