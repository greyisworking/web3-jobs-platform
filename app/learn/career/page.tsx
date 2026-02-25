import Link from 'next/link'
import {
  ArrowRight,
  Code,
  Palette,
  LineChart,
  Handshake,
  Megaphone,
  ArrowLeft,
} from 'lucide-react'
import Footer from '@/app/components/Footer'

// Career paths data
const careerPaths = [
  {
    slug: 'smart-contract-engineer',
    title: 'Smart Contract Engineer',
    description: 'build the backend of web3. write and audit smart contracts that handle millions.',
    longDescription: 'Smart contract engineers are the backbone of web3. You\'ll write Solidity or Rust code that runs on blockchains, handling real money and real users. Security is everything—one bug can cost millions.',
    icon: Code,
    color: 'bg-blue-500/20 text-blue-400',
    borderColor: 'border-blue-500/30 hover:border-blue-500',
    hot: true,
    avgSalary: '$150k - $300k',
    demandLevel: 'Very High',
  },
  {
    slug: 'frontend-developer',
    title: 'Frontend Developer',
    description: 'craft web3 interfaces. connect wallets, display on-chain data, build dApps.',
    longDescription: 'Frontend developers in web3 bridge the gap between complex protocols and everyday users. You\'ll work with React, wallet libraries, and on-chain data to create intuitive experiences.',
    icon: Palette,
    color: 'bg-purple-500/20 text-purple-400',
    borderColor: 'border-purple-500/30 hover:border-purple-500',
    hot: true,
    avgSalary: '$120k - $220k',
    demandLevel: 'High',
  },
  {
    slug: 'defi-analyst',
    title: 'DeFi Analyst',
    description: 'analyze protocols, model risks, find alpha. blend finance and crypto.',
    longDescription: 'DeFi analysts combine traditional finance skills with deep crypto knowledge. You\'ll evaluate protocols, model tokenomics, assess risks, and identify opportunities in the DeFi landscape.',
    icon: LineChart,
    color: 'bg-emerald-500/20 text-emerald-400',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500',
    hot: false,
    avgSalary: '$100k - $200k',
    demandLevel: 'Medium',
  },
  {
    slug: 'bd-partnerships',
    title: 'BD & Partnerships',
    description: 'connect protocols, close deals, grow ecosystems. relationships matter.',
    longDescription: 'Business development in web3 is about building the connections that make ecosystems thrive. You\'ll negotiate partnerships, onboard projects, and expand protocol reach across the industry.',
    icon: Handshake,
    color: 'bg-amber-500/20 text-amber-400',
    borderColor: 'border-amber-500/30 hover:border-amber-500',
    hot: false,
    avgSalary: '$100k - $180k',
    demandLevel: 'Medium',
  },
  {
    slug: 'marketing-community',
    title: 'Marketing & Community',
    description: 'build communities, run campaigns, tell stories. shape narratives.',
    longDescription: 'Marketing and community roles in web3 are about building and nurturing communities that believe in the project. You\'ll manage social channels, create content, and drive engagement.',
    icon: Megaphone,
    color: 'bg-pink-500/20 text-pink-400',
    borderColor: 'border-pink-500/30 hover:border-pink-500',
    hot: false,
    avgSalary: '$80k - $150k',
    demandLevel: 'Medium',
  },
]

export default function CareerPathsPage() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-6xl mx-auto px-6 py-20 md:py-32">
        {/* Breadcrumb */}
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-sm text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          back to learn
        </Link>

        {/* Hero */}
        <section className="text-center mb-16 md:mb-24">
          <h1 className="text-3xl md:text-4xl font-light uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text mb-4">
            Career Paths
          </h1>
          <p className="text-sm md:text-base text-a24-muted dark:text-a24-dark-muted font-light max-w-xl mx-auto">
            roadmaps built from real job data. see exactly what skills employers want.
          </p>
          <div className="w-12 h-px bg-neun-success mx-auto mt-8" />
        </section>

        {/* Career Paths Grid */}
        <section className="mb-16">
          <div className="grid gap-4">
            {careerPaths.map((path) => {
              const Icon = path.icon
              return (
                <Link
                  key={path.slug}
                  href={`/learn/career/${path.slug}`}
                  className={`group p-6 border transition-all duration-300 ${path.borderColor} hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50`}
                >
                  <div className="flex items-start gap-6">
                    <div className={`p-4 rounded-full ${path.color} flex-shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors">
                          {path.title}
                        </h2>
                        {path.hot && (
                          <span className="text-[10px] uppercase tracking-wider text-neun-success bg-neun-success/10 px-2 py-0.5">
                            high demand
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-4 leading-relaxed">
                        {path.longDescription}
                      </p>

                      <div className="flex flex-wrap gap-4 text-xs text-a24-muted dark:text-a24-dark-muted">
                        <span>
                          <span className="text-a24-text dark:text-a24-dark-text">{path.avgSalary}</span> avg salary
                        </span>
                        <span>
                          <span className="text-a24-text dark:text-a24-dark-text">{path.demandLevel}</span> demand
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors flex-shrink-0 mt-2" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Bottom Note */}
        <section className="text-center py-8 border-t border-a24-border dark:border-a24-dark-border">
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted">
            skill data is based on{' '}
            <span className="text-a24-text dark:text-a24-dark-text">live job postings</span>
            {' '}from the past 3 months.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
