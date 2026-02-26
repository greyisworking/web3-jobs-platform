import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Code,
  Layers,
  Box,
  Lightbulb,
  Wrench,
} from 'lucide-react'
import Footer from '@/app/components/Footer'
import { getAvailableSkills } from '@/lib/skill-details'

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  language: Code,
  framework: Layers,
  blockchain: Box,
  concept: Lightbulb,
  tool: Wrench,
}

const categoryColors: Record<string, string> = {
  language: 'bg-blue-500/20 text-blue-400',
  framework: 'bg-purple-500/20 text-purple-400',
  blockchain: 'bg-cyan-500/20 text-cyan-400',
  concept: 'bg-amber-500/20 text-amber-400',
  tool: 'bg-emerald-500/20 text-emerald-400',
}

export default function SkillsPage() {
  const skills = getAvailableSkills()

  // Group by category
  const grouped = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, typeof skills>)

  const categoryOrder = ['language', 'framework', 'blockchain', 'concept', 'tool']
  const categoryLabels: Record<string, string> = {
    language: 'Languages',
    framework: 'Frameworks',
    blockchain: 'Blockchains',
    concept: 'Concepts',
    tool: 'Tools',
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Breadcrumb */}
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-sm text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          back to learn
        </Link>

        {/* Hero */}
        <section className="text-center mb-16 md:mb-20">
          <h1 className="text-3xl md:text-4xl font-light uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text mb-4">
            Skills
          </h1>
          <p className="text-sm md:text-base text-a24-muted dark:text-a24-dark-muted font-light max-w-xl mx-auto">
            deep dives into specific skills. learn what matters.
          </p>
          <div className="w-12 h-px bg-neun-success mx-auto mt-8" />
        </section>

        {/* Skills by Category */}
        {categoryOrder.map((category) => {
          const categorySkills = grouped[category]
          if (!categorySkills || categorySkills.length === 0) return null

          const Icon = categoryIcons[category] || Code
          const colorClass = categoryColors[category] || categoryColors.language

          return (
            <section key={category} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-full ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text">
                  {categoryLabels[category]}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorySkills.map((skill) => (
                  <Link
                    key={skill.slug}
                    href={`/learn/skills/${skill.slug}`}
                    className="group p-5 border border-a24-border dark:border-a24-dark-border hover:border-neun-success/50 transition-colors"
                  >
                    <h3 className="text-base font-medium text-a24-text dark:text-a24-dark-text mb-2 group-hover:text-neun-success transition-colors">
                      {skill.name}
                    </h3>
                    <p className="text-sm text-a24-muted dark:text-a24-dark-muted line-clamp-2">
                      {skill.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-xs text-neun-success">
                      learn more <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

        {/* Bottom CTA */}
        <section className="text-center py-12 border-t border-a24-border dark:border-a24-dark-border">
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-4">
            don&apos;t see the skill you&apos;re looking for?
          </p>
          <Link
            href="/learn/library"
            className="inline-flex items-center gap-2 text-sm text-neun-success hover:underline"
          >
            browse the full resource library
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
