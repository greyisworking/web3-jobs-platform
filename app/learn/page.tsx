import Link from 'next/link'
import {
  Compass,
  TrendingUp,
  Wrench,
  BookOpen,
  ArrowRight,
  Code,
  Palette,
  LineChart,
  Handshake,
  Megaphone,
} from 'lucide-react'
import Footer from '@/app/components/Footer'

// Career paths with icons
const careerPaths = [
  {
    slug: 'smart-contract-engineer',
    title: 'Smart Contract Engineer',
    description: 'build the backend of web3. solidity, security, protocols.',
    icon: Code,
    color: 'bg-blue-500/20 text-blue-400',
    hot: true,
  },
  {
    slug: 'frontend-developer',
    title: 'Frontend Developer',
    description: 'craft web3 interfaces. react, wallets, dapps.',
    icon: Palette,
    color: 'bg-purple-500/20 text-purple-400',
    hot: true,
  },
  {
    slug: 'defi-analyst',
    title: 'DeFi Analyst',
    description: 'analyze protocols, model risks, find alpha.',
    icon: LineChart,
    color: 'bg-emerald-500/20 text-emerald-400',
    hot: false,
  },
  {
    slug: 'bd-partnerships',
    title: 'BD & Partnerships',
    description: 'connect protocols, close deals, grow ecosystems.',
    icon: Handshake,
    color: 'bg-amber-500/20 text-amber-400',
    hot: false,
  },
  {
    slug: 'marketing-community',
    title: 'Marketing & Community',
    description: 'build communities, run campaigns, tell stories.',
    icon: Megaphone,
    color: 'bg-pink-500/20 text-pink-400',
    hot: false,
  },
]

// Main sections
const sections = [
  {
    href: '/learn/career',
    icon: Compass,
    title: 'Career Paths',
    description: 'job-ready roadmaps based on real JDs. skills, resources, hiring trends.',
    color: 'border-blue-500/30 hover:border-blue-500',
    iconColor: 'text-blue-400',
  },
  {
    href: '/learn/trends',
    icon: TrendingUp,
    title: 'Market Trends',
    description: 'what skills are hot? which roles are growing? data from live job posts.',
    color: 'border-emerald-500/30 hover:border-emerald-500',
    iconColor: 'text-emerald-400',
    comingSoon: true,
  },
  {
    href: '/learn/skills',
    icon: Wrench,
    title: 'Skills',
    description: 'deep dives into specific skills. solidity, rust, defi, zk, and more.',
    color: 'border-amber-500/30 hover:border-amber-500',
    iconColor: 'text-amber-400',
    comingSoon: true,
  },
  {
    href: '/learn/library',
    icon: BookOpen,
    title: 'Resource Library',
    description: 'curated articles, videos, courses. organized by topic.',
    color: 'border-purple-500/30 hover:border-purple-500',
    iconColor: 'text-purple-400',
  },
]

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-6xl mx-auto px-6 py-20 md:py-32">
        {/* Hero */}
        <section className="text-center mb-16 md:mb-24">
          <h1 className="text-3xl md:text-4xl font-light uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text mb-4">
            Learn Web3
          </h1>
          <p className="text-sm md:text-base text-a24-muted dark:text-a24-dark-muted font-light max-w-xl mx-auto">
            career paths built from real job data. know exactly what to learn.
          </p>
          <div className="w-12 h-px bg-neun-success mx-auto mt-8" />
        </section>

        {/* Main Sections Grid */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section) => {
              const Icon = section.icon
              const isDisabled = section.comingSoon

              const content = (
                <div
                  className={`group relative p-6 border transition-all duration-300 ${section.color} ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed bg-a24-surface/20 dark:bg-a24-dark-surface/20'
                      : 'hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50'
                  }`}
                >
                  {section.comingSoon && (
                    <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted">
                      coming soon
                    </span>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full bg-a24-surface/50 dark:bg-a24-dark-surface/50 ${section.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-2 group-hover:text-neun-success transition-colors">
                        {section.title}
                      </h2>
                      <p className="text-sm text-a24-muted dark:text-a24-dark-muted leading-relaxed">
                        {section.description}
                      </p>
                    </div>
                    {!isDisabled && (
                      <ArrowRight className="w-4 h-4 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors mt-1" />
                    )}
                  </div>
                </div>
              )

              if (isDisabled) {
                return <div key={section.href}>{content}</div>
              }

              return (
                <Link key={section.href} href={section.href}>
                  {content}
                </Link>
              )
            })}
          </div>
        </section>

        {/* Quick Start: Career Paths */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-1">
                Popular Career Paths
              </h2>
              <p className="text-sm text-a24-muted dark:text-a24-dark-muted">
                pick a role. see the skills employers want.
              </p>
            </div>
            <Link
              href="/learn/career"
              className="text-sm text-neun-success hover:underline flex items-center gap-1"
            >
              view all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {careerPaths.map((path) => {
              const Icon = path.icon
              return (
                <Link
                  key={path.slug}
                  href={`/learn/career/${path.slug}`}
                  className="group flex items-center gap-4 p-4 border border-a24-border dark:border-a24-dark-border hover:border-neun-success/50 transition-colors"
                >
                  <div className={`p-2.5 rounded-full ${path.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors truncate">
                        {path.title}
                      </h3>
                      {path.hot && (
                        <span className="text-[10px] uppercase tracking-wider text-neun-success bg-neun-success/10 px-1.5 py-0.5">
                          hot
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-0.5 truncate">
                      {path.description}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center py-12 border-t border-a24-border dark:border-a24-dark-border">
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-4">
            just browsing?
          </p>
          <Link
            href="/learn/library"
            className="inline-flex items-center gap-2 text-sm text-neun-success hover:underline"
          >
            explore the resource library
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
