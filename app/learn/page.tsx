import Link from 'next/link'
import {
  Compass,
  TrendingUp,
  Wrench,
  BookOpen,
  ArrowRight,
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
  },
  {
    href: '/learn/trends',
    icon: TrendingUp,
    title: 'Market Trends',
    description: 'what skills are hot? which roles are growing? data from live job posts.',
    color: 'border-emerald-500/30 hover:border-emerald-500',
    iconColor: 'text-emerald-400',
  },
  {
    href: '/learn/skills',
    icon: Wrench,
    title: 'Skills',
    description: 'deep dives into specific skills. solidity, rust, defi, zk, and more.',
    color: 'border-amber-500/30 hover:border-amber-500',
    iconColor: 'text-amber-400',
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

              return (
                <Link key={section.href} href={section.href}>
                  <div
                    className={`group relative p-6 border transition-all duration-300 ${section.color} hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50`}
                  >
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
                      <ArrowRight className="w-4 h-4 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors mt-1" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
