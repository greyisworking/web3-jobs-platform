import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  MapPin,
  ExternalLink,
  BookOpen,
  Code,
  Layers,
  Box,
  Lightbulb,
  Wrench,
} from 'lucide-react'
import Footer from '@/app/components/Footer'
import { getSkillDetail, skillMeta } from '@/lib/skill-details'

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

const resourceTypeIcons: Record<string, string> = {
  docs: '📖',
  course: '🎓',
  tutorial: '💻',
  video: '🎬',
  tool: '🛠️',
}

export default async function SkillPage({
  params,
}: {
  params: Promise<{ skill: string }>
}) {
  const { skill: skillSlug } = await params

  if (!skillMeta[skillSlug]) {
    notFound()
  }

  const data = await getSkillDetail(skillSlug)

  if (!data) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center">
        <p className="text-a24-muted dark:text-a24-dark-muted">Failed to load skill data.</p>
      </div>
    )
  }

  const Icon = categoryIcons[data.skill.category] || Code
  const colorClass = categoryColors[data.skill.category] || categoryColors.language

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Breadcrumb */}
        <Link
          href="/learn/skills"
          className="inline-flex items-center gap-2 text-sm text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          all skills
        </Link>

        {/* Hero */}
        <section className="mb-12">
          <div className="flex items-start gap-6">
            <div className={`p-4 rounded-full ${colorClass} flex-shrink-0`}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-light text-a24-text dark:text-a24-dark-text">
                  {data.skill.name}
                </h1>
                <span className="text-xs uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted px-2 py-1 bg-a24-surface dark:bg-a24-dark-surface">
                  {data.skill.category}
                </span>
              </div>
              <p className="text-sm md:text-base text-a24-muted dark:text-a24-dark-muted max-w-2xl">
                {data.skill.description}
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-4 mb-12">
          <div className="p-5 border border-a24-border dark:border-a24-dark-border">
            <div className="flex items-center gap-2 text-a24-muted dark:text-a24-dark-muted mb-2">
              <Briefcase className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">jobs</span>
            </div>
            <p className="text-3xl font-light text-a24-text dark:text-a24-dark-text">
              {data.stats.jobCount}
            </p>
          </div>

          <div className="p-5 border border-a24-border dark:border-a24-dark-border">
            <div className="flex items-center gap-2 text-a24-muted dark:text-a24-dark-muted mb-2">
              <Building2 className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">companies</span>
            </div>
            <p className="text-3xl font-light text-a24-text dark:text-a24-dark-text">
              {data.stats.companiesCount}
            </p>
          </div>

          <div className="p-5 border border-a24-border dark:border-a24-dark-border">
            <div className="flex items-center gap-2 text-a24-muted dark:text-a24-dark-muted mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">remote</span>
            </div>
            <p className="text-3xl font-light text-a24-text dark:text-a24-dark-text">
              {data.stats.remotePercentage}%
            </p>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Learning Resources */}
          <section className="border border-a24-border dark:border-a24-dark-border p-6">
            <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-neun-success" />
              Learning Resources
            </h2>

            <div className="space-y-3">
              {data.resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-a24-surface/30 dark:bg-a24-dark-surface/30 hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{resourceTypeIcons[resource.type] || '📄'}</span>
                    <div>
                      <p className="text-sm text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors">
                        {resource.title}
                      </p>
                      <p className="text-xs text-a24-muted dark:text-a24-dark-muted capitalize">
                        {resource.type}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success" />
                </a>
              ))}
            </div>
          </section>

          {/* Sample Jobs */}
          <section className="border border-a24-border dark:border-a24-dark-border p-6">
            <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-neun-success" />
              Jobs Using {data.skill.name}
            </h2>

            <div className="space-y-3">
              {data.sampleJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block p-4 bg-a24-surface/30 dark:bg-a24-dark-surface/30 hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50 transition-colors group"
                >
                  <p className="text-sm text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors mb-1">
                    {job.title}
                  </p>
                  <p className="text-xs text-a24-muted dark:text-a24-dark-muted">
                    {job.company} · {job.location}
                  </p>
                </Link>
              ))}
            </div>

            <Link
              href={`/jobs?q=${data.skill.name.toLowerCase()}`}
              className="mt-4 inline-flex items-center gap-2 text-sm text-neun-success hover:underline"
            >
              view all {data.stats.jobCount} jobs
              <ArrowRight className="w-3 h-3" />
            </Link>
          </section>
        </div>

        {/* Related Skills */}
        {data.relatedSkills.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-6">
              Related Skills
            </h2>

            <div className="flex flex-wrap gap-3">
              {data.relatedSkills.map((relatedSlug) => {
                const related = skillMeta[relatedSlug]
                if (!related) return null

                return (
                  <Link
                    key={relatedSlug}
                    href={`/learn/skills/${relatedSlug}`}
                    className="px-4 py-2 border border-a24-border dark:border-a24-dark-border hover:border-neun-success/50 text-sm text-a24-text dark:text-a24-dark-text hover:text-neun-success transition-colors"
                  >
                    {related.name}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Top Companies */}
        {data.topCompanies.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-6">
              Top Companies Hiring
            </h2>

            <div className="flex flex-wrap gap-2">
              {data.topCompanies.map((company) => (
                <span
                  key={company}
                  className="px-3 py-1.5 bg-a24-surface/50 dark:bg-a24-dark-surface/50 text-sm text-a24-text dark:text-a24-dark-text"
                >
                  {company}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="p-6 border border-neun-success/30 bg-neun-success/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-a24-text dark:text-a24-dark-text">
                ready to learn {data.skill.name}?
              </p>
              <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-1">
                {data.stats.jobCount} jobs waiting for you.
              </p>
            </div>
            <Link
              href={`/jobs?q=${data.skill.name.toLowerCase()}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-neun-success text-white text-sm font-medium hover:bg-neun-success/90 transition-colors"
            >
              view {data.skill.name} jobs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
