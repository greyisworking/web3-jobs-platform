import Link from 'next/link'
import {
  Compass,
  TrendingUp,
  Wrench,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import Footer from '@/app/components/Footer'

// Main sections
const sections = [
  {
    href: '/learn/career',
    icon: Compass,
    title: 'Career Paths',
    description: 'job-ready roadmaps based on real JDs. skills, resources, hiring trends.',
    color: 'border-blue-500/30 hover:border-blue-500',
    iconColor: 'text-blue-400',
    bgGlow: 'group-hover:shadow-blue-500/10',
  },
  {
    href: '/learn/trends',
    icon: TrendingUp,
    title: 'Market Trends',
    description: 'what skills are hot? which roles are growing? data from live job posts.',
    color: 'border-emerald-500/30 hover:border-emerald-500',
    iconColor: 'text-emerald-400',
    bgGlow: 'group-hover:shadow-emerald-500/10',
  },
  {
    href: '/learn/skills',
    icon: Wrench,
    title: 'Skills',
    description: 'deep dives into specific skills. solidity, rust, defi, zk, and more.',
    color: 'border-amber-500/30 hover:border-amber-500',
    iconColor: 'text-amber-400',
    bgGlow: 'group-hover:shadow-amber-500/10',
  },
  {
    href: '/learn/library',
    icon: BookOpen,
    title: 'Resource Library',
    description: 'curated articles, videos, courses. organized by topic.',
    color: 'border-purple-500/30 hover:border-purple-500',
    iconColor: 'text-purple-400',
    bgGlow: 'group-hover:shadow-purple-500/10',
  },
]

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="container-responsive py-16 sm:py-20 md:py-32">
        {/* Hero */}
        <section className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 text-neun-success text-xs uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" />
            <span>data-driven learning</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-light uppercase tracking-[0.2em] text-a24-text dark:text-a24-dark-text mb-6">
            Learn Web3
          </h1>
          <p className="text-sm md:text-base text-a24-muted dark:text-a24-dark-muted font-light max-w-md mx-auto leading-relaxed">
            career paths built from real job data.<br className="hidden sm:block" /> know exactly what to learn.
          </p>
        </section>

        {/* Main Sections Grid */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {sections.map((section) => {
              const Icon = section.icon

              return (
                <Link key={section.href} href={section.href}>
                  <div
                    className={`group relative p-6 md:p-8 border card-interactive border-glow ${section.color} ${section.bgGlow} hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full bg-a24-surface/50 dark:bg-a24-dark-surface/50 ${section.iconColor} card-icon transition-transform duration-300 group-hover:scale-110`}>
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
                      <ArrowRight className="w-4 h-4 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success arrow-slide mt-1" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Stats hint */}
        <section className="mt-16 text-center">
          <p className="text-xs text-a24-muted dark:text-a24-dark-muted uppercase tracking-widest">
            powered by live job market data
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
