'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Landmark,
  Image,
  Layers,
  Building2,
  Shield,
  Globe,
  ChevronDown,
  X,
  FileText,
  Video,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'
import Footer from '../components/Footer'
import { domains, type Domain, type Step } from './data'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Landmark,
  Image,
  Layers,
  Building2,
  Shield,
  Globe,
}

function DomainCard({
  domain,
  isSelected,
  isDimmed,
  onClick,
}: {
  domain: Domain
  isSelected: boolean
  isDimmed: boolean
  onClick: () => void
}) {
  const Icon = iconMap[domain.icon] || Globe

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left p-6 border transition-all duration-300 ${
        isSelected
          ? 'border-neun-success bg-neun-success/5'
          : isDimmed
          ? 'border-a24-border/50 dark:border-a24-dark-border/50 opacity-40'
          : 'border-a24-border dark:border-a24-dark-border hover:border-neun-success/50 hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Rounded icon with domain color */}
        <div
          className={`p-3 rounded-full transition-colors ${
            isSelected
              ? 'bg-neun-success/20 text-neun-success'
              : domain.color
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Normal case title, slightly larger */}
          <h3
            className={`text-base font-medium mb-2 transition-colors ${
              isSelected
                ? 'text-neun-success'
                : 'text-a24-text dark:text-a24-dark-text group-hover:text-neun-success'
            }`}
          >
            {domain.name}
          </h3>
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted leading-relaxed mb-4">
            {domain.description}
          </p>
          <div className="flex items-center justify-between">
            {/* Lowercase steps */}
            <span className="text-xs text-a24-muted dark:text-a24-dark-muted">
              {domain.stepCount} steps
            </span>
            {/* Natural job link */}
            <Link
              href={`/jobs?tags=${domain.jobFilterTag}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-neun-success hover:underline"
            >
              {domain.jobCount} jobs hiring &rarr;
            </Link>
          </div>
        </div>
      </div>
    </button>
  )
}

function StepAccordion({
  step,
  isOpen,
  onToggle,
}: {
  step: Step
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-a24-border dark:border-a24-dark-border">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 py-5 text-left group"
      >
        <span className="text-xs font-mono text-neun-success mt-0.5">
          {step.number}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors">
            {step.title}
          </h4>
          <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-1">
            {step.description}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-a24-muted dark:text-a24-dark-muted transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && step.resources.length > 0 && (
        <div className="pl-10 pb-5 space-y-3">
          {step.resources.map((resource, idx) => (
            <a
              key={idx}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 bg-a24-surface/50 dark:bg-a24-dark-surface/50 border border-a24-border dark:border-a24-dark-border hover:border-neun-success/50 transition-colors group"
            >
              <div className="mt-0.5">
                {resource.type === 'video' ? (
                  <Video className="w-4 h-4 text-red-400" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors truncate">
                  {resource.title}
                </p>
                <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-1">
                  {resource.source} &middot; {resource.duration}
                </p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors flex-shrink-0 mt-1" />
            </a>
          ))}
        </div>
      )}

      {isOpen && step.resources.length === 0 && (
        <div className="pl-10 pb-5">
          <p className="text-xs text-a24-muted dark:text-a24-dark-muted italic">
            resources coming soon...
          </p>
        </div>
      )}
    </div>
  )
}

export default function LearnPage() {
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [openStepIndex, setOpenStepIndex] = useState<number>(0)
  const detailRef = useRef<HTMLElement>(null)

  const handleDomainClick = (domain: Domain) => {
    if (selectedDomain?.id === domain.id) {
      setSelectedDomain(null)
      setOpenStepIndex(0)
    } else {
      setSelectedDomain(domain)
      setOpenStepIndex(0)
      // Scroll to detail section after a short delay
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    }
  }

  const handleClose = () => {
    setSelectedDomain(null)
    setOpenStepIndex(0)
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-6xl mx-auto px-6 py-20 md:py-32">
        {/* Hero */}
        <section className="text-center mb-16 md:mb-24">
          <h1 className="text-3xl md:text-4xl font-light uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text mb-4">
            Learn Web3
          </h1>
          <p className="text-sm md:text-base text-a24-muted dark:text-a24-dark-muted font-light">
            no jargon. no overwhelm. just pick a topic and start.
          </p>
          <div className="w-12 h-px bg-neun-success mx-auto mt-8" />
        </section>

        {/* Domain Grid */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                isSelected={selectedDomain?.id === domain.id}
                isDimmed={selectedDomain !== null && selectedDomain.id !== domain.id}
                onClick={() => handleDomainClick(domain)}
              />
            ))}
          </div>
        </section>

        {/* Selected Domain Detail */}
        {selectedDomain && (
          <section
            ref={detailRef}
            className="mb-16 border border-a24-border dark:border-a24-dark-border bg-a24-surface/30 dark:bg-a24-dark-surface/30 scroll-mt-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-a24-border dark:border-a24-dark-border">
              <div className="flex items-center gap-4">
                {(() => {
                  const Icon = iconMap[selectedDomain.icon] || Globe
                  return (
                    <div className={`p-3 rounded-full ${selectedDomain.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  )
                })()}
                <div>
                  <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text">
                    {selectedDomain.name}
                  </h2>
                  <p className="text-sm text-a24-muted dark:text-a24-dark-muted mt-1">
                    {selectedDomain.description}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps */}
            <div className="px-6">
              {selectedDomain.steps.map((step, idx) => (
                <StepAccordion
                  key={step.number}
                  step={step}
                  isOpen={openStepIndex === idx}
                  onToggle={() => setOpenStepIndex(openStepIndex === idx ? -1 : idx)}
                />
              ))}
            </div>

            {/* Jobs CTA - NEUN tone */}
            <div className="p-6 border-t border-a24-border dark:border-a24-dark-border bg-neun-success/5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-a24-text dark:text-a24-dark-text">
                    ready to apply?
                  </p>
                  <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-1">
                    {selectedDomain.jobCount} {selectedDomain.jobFilterTag} jobs on neun rn.
                  </p>
                </div>
                <Link
                  href={`/jobs?tags=${selectedDomain.jobFilterTag}`}
                  className="flex items-center gap-2 px-5 py-2.5 bg-neun-success text-white text-sm font-medium hover:bg-neun-success/90 transition-colors"
                >
                  view {selectedDomain.jobFilterTag} jobs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA when no domain selected */}
        {!selectedDomain && (
          <section className="text-center py-12 border-t border-a24-border dark:border-a24-dark-border">
            <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-4">
              not sure where to start?
            </p>
            <button
              onClick={() => {
                const basics = domains.find((d) => d.id === 'basics')
                if (basics) handleDomainClick(basics)
              }}
              className="inline-flex items-center gap-2 text-sm text-neun-success hover:underline"
            >
              start with blockchain basics
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
