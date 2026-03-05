import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Code,
  Palette,
  LineChart,
  Handshake,
  Megaphone,
  Briefcase,
  MapPin,
  Building2,
  TrendingUp,
  BookOpen,
  ExternalLink,
} from 'lucide-react'
import Footer from '@/app/components/Footer'
import { getCareerSkills } from '@/lib/career-skills'

// Career metadata
const careerMeta: Record<string, {
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  titlePatterns: string[]
  learningPath: {
    title: string
    description: string
    resources: { title: string; url: string; type: string }[]
  }[]
}> = {
  'smart-contract-engineer': {
    name: 'Smart Contract Engineer',
    description: 'Build and audit smart contracts, protocols, and blockchain infrastructure.',
    icon: Code,
    color: 'bg-blue-500/20 text-blue-400',
    titlePatterns: ['smart contract', 'solidity', 'blockchain engineer', 'protocol engineer'],
    learningPath: [
      {
        title: 'Learn Solidity Fundamentals',
        description: 'master the language of ethereum',
        resources: [
          { title: 'CryptoZombies', url: 'https://cryptozombies.io/', type: 'course' },
          { title: 'Solidity by Example', url: 'https://solidity-by-example.org/', type: 'tutorial' },
          { title: 'Cyfrin Updraft', url: 'https://updraft.cyfrin.io/', type: 'course' },
        ],
      },
      {
        title: 'Understand DeFi Protocols',
        description: 'learn how the big protocols work',
        resources: [
          { title: 'Uniswap V2 Walkthrough', url: 'https://ethereum.org/developers/tutorials/uniswap-v2-annotated-code/', type: 'article' },
          { title: 'Aave Documentation', url: 'https://docs.aave.com/', type: 'docs' },
        ],
      },
      {
        title: 'Master Security',
        description: 'find bugs before they find you',
        resources: [
          { title: 'Damn Vulnerable DeFi', url: 'https://www.damnvulnerabledefi.xyz/', type: 'ctf' },
          { title: 'Ethernaut', url: 'https://ethernaut.openzeppelin.com/', type: 'ctf' },
          { title: 'SWC Registry', url: 'https://swcregistry.io/', type: 'reference' },
        ],
      },
      {
        title: 'Build with Foundry',
        description: 'modern tooling for pros',
        resources: [
          { title: 'Foundry Book', url: 'https://book.getfoundry.sh/', type: 'docs' },
          { title: 'Foundry by Example', url: 'https://foundry-by-example.vercel.app/', type: 'tutorial' },
        ],
      },
    ],
  },
  'frontend-developer': {
    name: 'Frontend Developer',
    description: 'Build web3 interfaces, dApps, and wallet integrations.',
    icon: Palette,
    color: 'bg-neun-success/20 text-neun-success',
    titlePatterns: ['frontend', 'react', 'ui engineer', 'web developer'],
    learningPath: [
      {
        title: 'Master React & TypeScript',
        description: 'the foundation of web3 frontends',
        resources: [
          { title: 'React Docs', url: 'https://react.dev/', type: 'docs' },
          { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/', type: 'docs' },
        ],
      },
      {
        title: 'Learn Wallet Integration',
        description: 'connect users to the chain',
        resources: [
          { title: 'Wagmi Documentation', url: 'https://wagmi.sh/', type: 'docs' },
          { title: 'RainbowKit', url: 'https://www.rainbowkit.com/docs/introduction', type: 'docs' },
          { title: 'Viem', url: 'https://viem.sh/', type: 'docs' },
        ],
      },
      {
        title: 'Understand On-chain Data',
        description: 'read and display blockchain state',
        resources: [
          { title: 'The Graph Docs', url: 'https://thegraph.com/docs/', type: 'docs' },
          { title: 'Ethers.js Docs', url: 'https://docs.ethers.org/', type: 'docs' },
        ],
      },
      {
        title: 'Build Production dApps',
        description: 'put it all together',
        resources: [
          { title: 'Scaffold-ETH 2', url: 'https://scaffoldeth.io/', type: 'template' },
          { title: 'Create Web3 DApp', url: 'https://docs.alchemy.com/docs/create-web3-dapp', type: 'tutorial' },
        ],
      },
    ],
  },
  'defi-analyst': {
    name: 'DeFi Analyst',
    description: 'Analyze protocols, model risks, and research market opportunities.',
    icon: LineChart,
    color: 'bg-emerald-500/20 text-emerald-400',
    titlePatterns: ['defi analyst', 'research analyst', 'quantitative'],
    learningPath: [
      {
        title: 'Understand DeFi Fundamentals',
        description: 'amms, lending, derivatives',
        resources: [
          { title: 'How to DeFi', url: 'https://landing.coingecko.com/how-to-defi/', type: 'book' },
          { title: 'Finematics', url: 'https://www.youtube.com/@Finematics', type: 'videos' },
        ],
      },
      {
        title: 'Learn Risk Assessment',
        description: 'evaluate protocol safety',
        resources: [
          { title: 'DeFi Safety', url: 'https://defisafety.com/', type: 'tool' },
          { title: 'Rekt News', url: 'https://rekt.news/', type: 'news' },
        ],
      },
      {
        title: 'Master On-chain Analysis',
        description: 'read the data others miss',
        resources: [
          { title: 'Dune Analytics', url: 'https://dune.com/browse/dashboards', type: 'tool' },
          { title: 'DefiLlama', url: 'https://defillama.com/', type: 'tool' },
        ],
      },
    ],
  },
  'bd-partnerships': {
    name: 'BD & Partnerships',
    description: 'Build relationships, close deals, and grow ecosystems.',
    icon: Handshake,
    color: 'bg-amber-500/20 text-amber-400',
    titlePatterns: ['business development', 'partnership', 'sales'],
    learningPath: [
      {
        title: 'Understand Web3 Landscape',
        description: 'know the players and protocols',
        resources: [
          { title: 'Messari Research', url: 'https://messari.io/research', type: 'research' },
          { title: 'The Block Research', url: 'https://www.theblock.co/research', type: 'research' },
        ],
      },
      {
        title: 'Learn Partnership Models',
        description: 'integrations, grants, co-marketing',
        resources: [
          { title: 'Web3 BD Playbook', url: 'https://mirror.xyz/', type: 'article' },
        ],
      },
    ],
  },
  'marketing-community': {
    name: 'Marketing & Community',
    description: 'Build communities, run campaigns, and tell stories.',
    icon: Megaphone,
    color: 'bg-pink-500/20 text-pink-400',
    titlePatterns: ['marketing', 'community', 'social media', 'content'],
    learningPath: [
      {
        title: 'Understand Crypto Culture',
        description: 'memes, narratives, communities',
        resources: [
          { title: 'Crypto Twitter', url: 'https://twitter.com/', type: 'social' },
          { title: 'Bankless', url: 'https://www.bankless.com/', type: 'media' },
        ],
      },
      {
        title: 'Master Community Tools',
        description: 'discord, telegram, governance',
        resources: [
          { title: 'Discord Best Practices', url: 'https://discord.com/community', type: 'guide' },
          { title: 'Snapshot', url: 'https://snapshot.org/', type: 'tool' },
        ],
      },
    ],
  },
}

export default async function CareerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const meta = careerMeta[slug]

  if (!meta) {
    notFound()
  }

  const skillsData = await getCareerSkills(slug)
  const Icon = meta.icon

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Breadcrumb */}
        <Link
          href="/learn/career"
          className="inline-flex items-center gap-2 text-sm text-a24-muted dark:text-a24-dark-muted hover:text-neun-success transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          all career paths
        </Link>

        {/* Hero */}
        <section className="mb-12 md:mb-16">
          <div className="flex items-start gap-6">
            <div className={`p-4 rounded-full ${meta.color} flex-shrink-0`}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-light text-a24-text dark:text-a24-dark-text mb-3">
                {meta.name}
              </h1>
              <p className="text-sm md:text-base text-a24-muted dark:text-a24-dark-muted max-w-2xl">
                {meta.description}
              </p>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        {skillsData && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="p-4 border border-a24-border dark:border-a24-dark-border">
              <div className="flex items-center gap-2 text-a24-muted dark:text-a24-dark-muted mb-2">
                <Briefcase className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">open jobs</span>
              </div>
              <p className="text-2xl font-light text-a24-text dark:text-a24-dark-text">
                {skillsData.stats?.totalJobs || 0}
              </p>
            </div>

            <div className="p-4 border border-a24-border dark:border-a24-dark-border">
              <div className="flex items-center gap-2 text-a24-muted dark:text-a24-dark-muted mb-2">
                <Building2 className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">vc-backed</span>
              </div>
              <p className="text-2xl font-light text-neun-success">
                {skillsData.stats?.vcBackedJobs || 0}
              </p>
              <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-1">
                from {skillsData.stats?.vcBackedCompanies || 0} top companies
              </p>
            </div>

            <div className="p-4 border border-a24-border dark:border-a24-dark-border">
              <div className="flex items-center gap-2 text-a24-muted dark:text-a24-dark-muted mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">remote %</span>
              </div>
              <p className="text-2xl font-light text-a24-text dark:text-a24-dark-text">
                {skillsData.stats?.locations?.Remote
                  ? Math.round((skillsData.stats.locations.Remote / skillsData.stats.totalJobs) * 100)
                  : 0}%
              </p>
            </div>

            <div className="p-4 border border-a24-border dark:border-a24-dark-border">
              <div className="flex items-center gap-2 text-a24-muted dark:text-a24-dark-muted mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">top skill</span>
              </div>
              <p className="text-lg font-light text-a24-text dark:text-a24-dark-text truncate">
                {skillsData.skills?.core?.[0]?.skill || 'N/A'}
              </p>
            </div>
          </section>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Skills from JD Analysis */}
          <section>
            <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neun-success" />
              Skills Employers Want
            </h2>
            {skillsData?.stats?.vcBackedJobs && skillsData.stats.vcBackedJobs > 0 && (
              <p className="text-xs text-a24-muted dark:text-a24-dark-muted mb-6">
                weighted by {skillsData.stats.vcBackedJobs} jobs from VC-backed companies
              </p>
            )}

            {skillsData?.skills ? (
              <div className="space-y-6">
                {/* Core Skills */}
                {skillsData.skills.core?.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-neun-success mb-3">
                      must have (30%+ of jobs)
                    </h3>
                    <div className="space-y-2">
                      {skillsData.skills.core.slice(0, 6).map((s: { skill: string; percentage: number }) => (
                        <div
                          key={s.skill}
                          className="flex items-center justify-between p-3 border border-a24-border dark:border-a24-dark-border"
                        >
                          <span className="text-sm text-a24-text dark:text-a24-dark-text">
                            {s.skill}
                          </span>
                          <span className="text-xs text-neun-success">
                            {s.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Skills */}
                {skillsData.skills.common?.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-3">
                      often required (15-30%)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skillsData.skills.common.slice(0, 8).map((s: { skill: string; percentage: number }) => (
                        <span
                          key={s.skill}
                          className="text-xs px-3 py-1.5 bg-a24-surface dark:bg-a24-dark-surface text-a24-text dark:text-a24-dark-text border border-a24-border dark:border-a24-dark-border"
                        >
                          {s.skill} ({s.percentage}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nice to Have */}
                {skillsData.skills.niceToHave?.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-3">
                      nice to have (5-15%)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skillsData.skills.niceToHave.slice(0, 8).map((s: { skill: string }) => (
                        <span
                          key={s.skill}
                          className="text-xs px-2 py-1 text-a24-muted dark:text-a24-dark-muted"
                        >
                          {s.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-a24-muted dark:text-a24-dark-muted">
                loading skill data...
              </p>
            )}

            {/* Sample Companies */}
            {skillsData && skillsData.sampleCompanies && skillsData.sampleCompanies.length > 0 && (
              <div className="mt-8 pt-6 border-t border-a24-border dark:border-a24-dark-border">
                <h3 className="text-xs uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-3">
                  companies hiring
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillsData.sampleCompanies.slice(0, 8).map((company: string) => (
                    <span
                      key={company}
                      className="text-xs px-2 py-1 bg-a24-surface/50 dark:bg-a24-dark-surface/50 text-a24-text dark:text-a24-dark-text"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Learning Path */}
          <section>
            <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-neun-success" />
              Learning Path
            </h2>

            <div className="space-y-4">
              {meta.learningPath.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-a24-border dark:border-a24-dark-border"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-mono text-neun-success mt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-a24-text dark:text-a24-dark-text mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs text-a24-muted dark:text-a24-dark-muted mb-3">
                        {step.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {step.resources.map((resource, rIdx) => (
                          <a
                            key={rIdx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-neun-success hover:underline"
                          >
                            {resource.title}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CTA */}
        <section className="p-6 border border-neun-success/30 bg-neun-success/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-a24-text dark:text-a24-dark-text">
                ready to apply?
              </p>
              <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-1">
                {skillsData?.stats?.totalJobs || 0} {meta.name.toLowerCase()} jobs on neun rn.
              </p>
            </div>
            <Link
              href={`/jobs?q=${meta.titlePatterns[0]}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-neun-success text-white text-sm font-medium hover:bg-neun-success/90 transition-colors"
            >
              view {meta.name.toLowerCase()} jobs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
