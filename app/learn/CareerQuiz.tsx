'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Copy, Check, Briefcase, DollarSign, Wifi, Zap, Building2, ExternalLink } from 'lucide-react'
import { careerMapping, careerPathsMap, type ExperienceLevel } from '@/lib/career-paths'

// ── Types ──

type Background = 'developer' | 'marketing' | 'business' | 'design' | 'changer'
type Interest = 'protocols' | 'defi' | 'gaming' | 'security' | 'dao'
type Stage = 'intro' | 'q1' | 'q2' | 'q3' | 'loading' | 'result'

interface CareerMatchData {
  jobCount: number
  avgSalary: number
  remotePercent: number
  topSkills: string[]
  topCompanies: string[]
}

// ── Question Data ──

const Q1_OPTIONS: { key: Background; icon: string; label: string }[] = [
  { key: 'developer', icon: '\u{1F5A5}\uFE0F', label: 'Software Developer' },
  { key: 'marketing', icon: '\u{1F4CA}', label: 'Marketing / Growth' },
  { key: 'business', icon: '\u{1F4BC}', label: 'Business / Finance' },
  { key: 'design', icon: '\u{1F3A8}', label: 'Design / Creative' },
  { key: 'changer', icon: '\u{1F504}', label: 'Career Changer (non-tech)' },
]

const Q2_OPTIONS: { key: Interest; icon: string; label: string }[] = [
  { key: 'protocols', icon: '\u{1F3D7}\uFE0F', label: 'Building protocols & infrastructure' },
  { key: 'defi', icon: '\u{1F4B0}', label: 'DeFi & financial innovation' },
  { key: 'gaming', icon: '\u{1F3AE}', label: 'Gaming, NFTs & culture' },
  { key: 'security', icon: '\u{1F510}', label: 'Security & compliance' },
  { key: 'dao', icon: '\u{1F30D}', label: 'DAO & governance' },
]

const Q3_OPTIONS: { key: ExperienceLevel; icon: string; label: string; sub: string }[] = [
  { key: 'beginner', icon: '\u{1F331}', label: 'Beginner', sub: '0-1 years' },
  { key: 'mid', icon: '\u{1F4C8}', label: 'Mid', sub: '2-4 years' },
  { key: 'senior', icon: '\u{1F680}', label: 'Senior', sub: '5+ years' },
]

// ── Animation Variants ──

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
}

// ── Component ──

export default function CareerQuiz() {
  const [stage, setStage] = useState<Stage>('intro')
  const [direction, setDirection] = useState(1)
  const [q1, setQ1] = useState<Background | null>(null)
  const [q2, setQ2] = useState<Interest | null>(null)
  const [q3, setQ3] = useState<ExperienceLevel | null>(null)
  const [matchData, setMatchData] = useState<CareerMatchData | null>(null)
  const [copied, setCopied] = useState(false)

  const careerSlug = q1 && q2 ? careerMapping[q1][q2] : null
  const career = careerSlug ? careerPathsMap[careerSlug] : null

  const goTo = useCallback((next: Stage, dir = 1) => {
    setDirection(dir)
    setStage(next)
  }, [])

  const handleQ1 = (val: Background) => {
    setQ1(val)
    goTo('q2')
  }

  const handleQ2 = (val: Interest) => {
    setQ2(val)
    goTo('q3')
  }

  const handleQ3 = async (val: ExperienceLevel) => {
    setQ3(val)
    goTo('loading')

    const slug = careerMapping[q1!][q2!]
    // Use the slug we just computed (q2 is the value passed in this handler, but q2 state may not be updated yet)
    // Actually q1 and q2 are already set above. But let's compute directly:
    const computedSlug = q1 ? careerMapping[q1][q2!] : slug

    try {
      const res = await fetch(`/api/learn/career-match?slug=${computedSlug || slug}`)
      if (res.ok) {
        setMatchData(await res.json())
      } else {
        setMatchData({ jobCount: 0, avgSalary: 0, remotePercent: 0, topSkills: [], topCompanies: [] })
      }
    } catch {
      setMatchData({ jobCount: 0, avgSalary: 0, remotePercent: 0, topSkills: [], topCompanies: [] })
    }

    // Small delay for loading feel
    setTimeout(() => goTo('result'), 800)
  }

  const handleBack = () => {
    if (stage === 'q1') goTo('intro', -1)
    else if (stage === 'q2') { setQ2(null); goTo('q1', -1) }
    else if (stage === 'q3') { setQ3(null); goTo('q2', -1) }
  }

  const handleRestart = () => {
    setQ1(null); setQ2(null); setQ3(null)
    setMatchData(null); setCopied(false)
    goTo('intro', -1)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/learn?r=${careerSlug}&l=${q3}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareTwitter = () => {
    const text = career
      ? `I just found my Web3 career path: ${career.title}! Take the quiz:`
      : 'Find your Web3 career path:'
    const url = `${window.location.origin}/learn`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const stageIndex = stage === 'q1' ? 1 : stage === 'q2' ? 2 : stage === 'q3' ? 3 : 0

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      {/* Progress bar */}
      {(stage === 'q1' || stage === 'q2' || stage === 'q3') && (
        <div className="w-full max-w-md mb-8">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleBack}
              className="text-xs text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> back
            </button>
            <span className="text-xs text-a24-muted dark:text-a24-dark-muted tabular-nums" style={{ fontFamily: 'var(--font-space), monospace' }}>
              {stageIndex} / 3
            </span>
          </div>
          <div className="h-1 bg-a24-surface dark:bg-a24-dark-surface rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-neun-success rounded-full"
              initial={false}
              animate={{ width: `${(stageIndex / 3) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="w-full max-w-lg relative" style={{ minHeight: 400 }}>
        <AnimatePresence mode="wait" custom={direction}>

          {/* ── INTRO ── */}
          {stage === 'intro' && (
            <motion.div
              key="intro"
              custom={direction}
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-center"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-light uppercase tracking-[0.2em] text-a24-text dark:text-a24-dark-text mb-6 leading-tight">
                Find Your<br />Web3 Career Path
              </h1>
              <p className="text-sm sm:text-base text-a24-muted dark:text-a24-dark-muted font-light mb-10 max-w-sm mx-auto">
                Answer 3 questions. Get your personalized roadmap.
              </p>
              <button
                onClick={() => goTo('q1')}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-neun-success text-white text-sm sm:text-base font-medium uppercase tracking-[0.15em] hover:bg-neun-success/90 transition-all"
              >
                Let&apos;s go
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* ── Q1: Background ── */}
          {stage === 'q1' && (
            <motion.div
              key="q1"
              custom={direction}
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <h2 className="text-xl sm:text-2xl font-light uppercase tracking-[0.15em] text-a24-text dark:text-a24-dark-text text-center mb-8">
                What&apos;s your background?
              </h2>
              <div className="grid gap-3">
                {Q1_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleQ1(opt.key)}
                    className={`group flex items-center gap-4 p-4 sm:p-5 border transition-all duration-200 text-left
                      ${q1 === opt.key
                        ? 'border-neun-success bg-neun-success/5'
                        : 'border-a24-border dark:border-a24-dark-border hover:border-neun-success/50 hover:bg-a24-surface/30 dark:hover:bg-a24-dark-surface/30'
                      }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm sm:text-base text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Q2: Interest ── */}
          {stage === 'q2' && (
            <motion.div
              key="q2"
              custom={direction}
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <h2 className="text-xl sm:text-2xl font-light uppercase tracking-[0.15em] text-a24-text dark:text-a24-dark-text text-center mb-8">
                What excites you most?
              </h2>
              <div className="grid gap-3">
                {Q2_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleQ2(opt.key)}
                    className={`group flex items-center gap-4 p-4 sm:p-5 border transition-all duration-200 text-left
                      ${q2 === opt.key
                        ? 'border-neun-success bg-neun-success/5'
                        : 'border-a24-border dark:border-a24-dark-border hover:border-neun-success/50 hover:bg-a24-surface/30 dark:hover:bg-a24-dark-surface/30'
                      }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm sm:text-base text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Q3: Experience ── */}
          {stage === 'q3' && (
            <motion.div
              key="q3"
              custom={direction}
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <h2 className="text-xl sm:text-2xl font-light uppercase tracking-[0.15em] text-a24-text dark:text-a24-dark-text text-center mb-8">
                What&apos;s your experience level?
              </h2>
              <div className="grid gap-3">
                {Q3_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleQ3(opt.key)}
                    className="group flex items-center gap-4 p-5 sm:p-6 border border-a24-border dark:border-a24-dark-border hover:border-neun-success/50 hover:bg-a24-surface/30 dark:hover:bg-a24-dark-surface/30 transition-all duration-200 text-left"
                  >
                    <span className="text-3xl">{opt.icon}</span>
                    <div>
                      <span className="block text-sm sm:text-base text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors">
                        {opt.label}
                      </span>
                      <span className="text-xs text-a24-muted dark:text-a24-dark-muted">
                        {opt.sub}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── LOADING ── */}
          {stage === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-8 h-8 border-2 border-a24-border dark:border-a24-dark-border border-t-neun-success rounded-full animate-spin mb-6" />
              <p className="text-sm text-a24-muted dark:text-a24-dark-muted uppercase tracking-[0.15em]">
                Analyzing job market data...
              </p>
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {stage === 'result' && career && q3 && (
            <motion.div
              key="result"
              custom={direction}
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full"
            >
              {/* Title */}
              <div className="text-center mb-8">
                <p className="text-xs text-neun-success uppercase tracking-[0.2em] mb-2">Your Web3 Career Path</p>
                <h2 className="text-2xl sm:text-3xl font-light uppercase tracking-[0.15em] text-a24-text dark:text-a24-dark-text">
                  {career.title}
                </h2>
                <p className="text-sm text-a24-muted dark:text-a24-dark-muted mt-2 max-w-md mx-auto">
                  {career.description}
                </p>
              </div>

              {/* Live Stats */}
              {matchData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  <StatCard icon={<Briefcase className="w-4 h-4" />} label="Open Jobs" value={matchData.jobCount > 0 ? matchData.jobCount.toString() : '--'} accent />
                  <StatCard icon={<DollarSign className="w-4 h-4" />} label="Avg Salary" value={matchData.avgSalary > 0 ? `$${Math.round(matchData.avgSalary / 1000)}K` : '--'} />
                  <StatCard icon={<Wifi className="w-4 h-4" />} label="Remote" value={matchData.remotePercent > 0 ? `${matchData.remotePercent}%` : '--'} />
                  <StatCard icon={<Zap className="w-4 h-4" />} label="Top Skill" value={matchData.topSkills[0] || '--'} />
                </div>
              )}

              {/* Top Skills */}
              {matchData && matchData.topSkills.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-[0.15em] text-a24-muted dark:text-a24-dark-muted mb-3">
                    Most In-Demand Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {matchData.topSkills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-3 py-1.5 border border-neun-success/30 text-neun-success bg-neun-success/5"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Companies */}
              {matchData && matchData.topCompanies.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-[0.15em] text-a24-muted dark:text-a24-dark-muted mb-3 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Top Hiring Companies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {matchData.topCompanies.map((c) => (
                      <span key={c} className="text-xs px-2.5 py-1 bg-a24-surface dark:bg-a24-dark-surface text-a24-text dark:text-a24-dark-text border border-a24-border/50 dark:border-a24-dark-border/50">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Roadmap */}
              <div className="mb-8">
                <h3 className="text-xs uppercase tracking-[0.15em] text-a24-muted dark:text-a24-dark-muted mb-4">
                  Your Learning Roadmap
                </h3>
                <div className="space-y-4">
                  {career.roadmap[q3].map((phase, pi) => (
                    <div key={pi} className="border border-a24-border dark:border-a24-dark-border">
                      <div className="px-4 py-3 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border flex items-center gap-2">
                        <span className="text-[10px] font-mono text-neun-success">{String(pi + 1).padStart(2, '0')}</span>
                        <h4 className="text-sm font-medium text-a24-text dark:text-a24-dark-text uppercase tracking-wider">
                          {phase.label}
                        </h4>
                      </div>
                      <div className="divide-y divide-a24-border/30 dark:divide-a24-dark-border/30">
                        {phase.items.map((item, ii) => (
                          <div key={ii} className="px-4 py-3 flex items-start gap-3">
                            <span className="text-[10px] text-a24-muted/40 dark:text-a24-dark-muted/40 mt-0.5 tabular-nums" style={{ fontFamily: 'var(--font-space), monospace' }}>
                              {pi + 1}.{ii + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-a24-text dark:text-a24-dark-text">
                                  {item.title}
                                </p>
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neun-success hover:text-neun-success/80 transition-colors flex-shrink-0"
                                    title={item.source}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA: Browse Jobs */}
              <Link
                href={`/jobs?q=${encodeURIComponent(career.jobFilter)}`}
                className="group flex items-center justify-center gap-3 w-full py-4 bg-neun-success text-white text-sm font-medium uppercase tracking-[0.15em] hover:bg-neun-success/90 transition-all mb-4"
              >
                Browse {matchData?.jobCount || ''} matching jobs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Share + Restart */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 text-xs text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors px-3 py-2 border border-a24-border dark:border-a24-dark-border"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
                <button
                  onClick={handleShareTwitter}
                  className="flex items-center gap-1.5 text-xs text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors px-3 py-2 border border-a24-border dark:border-a24-dark-border"
                >
                  Share on X
                </button>
                <button
                  onClick={handleRestart}
                  className="text-xs text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors px-3 py-2"
                >
                  Retake quiz
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Stat Card ──

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-3 sm:p-4 border border-a24-border dark:border-a24-dark-border">
      <div className="flex items-center gap-1.5 text-a24-muted dark:text-a24-dark-muted mb-1.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg sm:text-xl font-light ${accent ? 'text-neun-success' : 'text-a24-text dark:text-a24-dark-text'}`} style={{ fontFamily: 'var(--font-space), monospace' }}>
        {value}
      </p>
    </div>
  )
}
