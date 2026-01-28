'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight, Code2, Palette, FileText, Users, FlaskConical,
  Clock, DollarSign, Zap, ExternalLink, Filter, Search, Gift
} from 'lucide-react'
import Pixelbara from '../components/Pixelbara'

// ══════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════

interface Bounty {
  id: string
  title: string
  company: string
  category: 'development' | 'design' | 'content' | 'community' | 'research'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  reward: string
  rewardUsd?: number
  deadline?: string
  description: string
  tags: string[]
  url: string
  featured?: boolean
}

// ══════════════════════════════════════════════════════════
// SAMPLE DATA (In production, fetch from API)
// ══════════════════════════════════════════════════════════

const BOUNTIES: Bounty[] = [
  {
    id: '1',
    title: 'Smart Contract Audit - DeFi Protocol',
    company: 'Immunefi',
    category: 'development',
    difficulty: 'expert',
    reward: '5,000 - 50,000 USDC',
    rewardUsd: 50000,
    description: 'Find critical vulnerabilities in our lending protocol. Bug bounty program with tiered rewards.',
    tags: ['Solidity', 'Security', 'DeFi'],
    url: 'https://immunefi.com',
    featured: true,
  },
  {
    id: '2',
    title: 'Build React SDK for Wallet Integration',
    company: 'Gitcoin Grants',
    category: 'development',
    difficulty: 'medium',
    reward: '2,500 USDC',
    rewardUsd: 2500,
    deadline: '2024-02-28',
    description: 'Create a React SDK for easy wallet connection with support for multiple providers.',
    tags: ['React', 'TypeScript', 'Web3'],
    url: 'https://gitcoin.co',
  },
  {
    id: '3',
    title: 'Brand Identity Design for L2 Network',
    company: 'Questbook',
    category: 'design',
    difficulty: 'medium',
    reward: '3,000 USDC',
    rewardUsd: 3000,
    deadline: '2024-02-15',
    description: 'Design complete brand identity including logo, colors, typography, and brand guidelines.',
    tags: ['Branding', 'Figma', 'Identity'],
    url: 'https://questbook.app',
  },
  {
    id: '4',
    title: 'Write Technical Documentation',
    company: 'Optimism',
    category: 'content',
    difficulty: 'easy',
    reward: '500 - 1,500 OP',
    rewardUsd: 1500,
    description: 'Improve developer documentation for smart contract deployment and L2 bridging.',
    tags: ['Documentation', 'Technical Writing'],
    url: 'https://optimism.io',
  },
  {
    id: '5',
    title: 'Community Ambassador Program',
    company: 'Arbitrum Foundation',
    category: 'community',
    difficulty: 'easy',
    reward: '1,000 ARB/month',
    rewardUsd: 1000,
    description: 'Lead community initiatives, organize events, and help onboard new users.',
    tags: ['Community', 'Events', 'Social'],
    url: 'https://arbitrum.io',
  },
  {
    id: '6',
    title: 'Tokenomics Research Paper',
    company: 'Delphi Digital',
    category: 'research',
    difficulty: 'hard',
    reward: '5,000 USDC',
    rewardUsd: 5000,
    deadline: '2024-03-01',
    description: 'Comprehensive research on sustainable tokenomics models for protocol-owned liquidity.',
    tags: ['Research', 'DeFi', 'Economics'],
    url: 'https://delphidigital.io',
    featured: true,
  },
  {
    id: '7',
    title: 'Mobile App UI/UX Design',
    company: 'Base',
    category: 'design',
    difficulty: 'hard',
    reward: '8,000 USDC',
    rewardUsd: 8000,
    description: 'Design mobile-first experience for DeFi dashboard with focus on accessibility.',
    tags: ['Mobile', 'UI/UX', 'Figma'],
    url: 'https://base.org',
  },
  {
    id: '8',
    title: 'Rust Smart Contract Template',
    company: 'Solana Foundation',
    category: 'development',
    difficulty: 'hard',
    reward: '10,000 USDC',
    rewardUsd: 10000,
    description: 'Build production-ready Anchor program templates with best practices and tests.',
    tags: ['Rust', 'Solana', 'Anchor'],
    url: 'https://solana.com',
  },
  {
    id: '9',
    title: 'Educational Video Series',
    company: 'Ethereum Foundation',
    category: 'content',
    difficulty: 'medium',
    reward: '3,000 - 6,000 DAI',
    rewardUsd: 6000,
    description: 'Create beginner-friendly video tutorials explaining Ethereum concepts.',
    tags: ['Video', 'Education', 'Ethereum'],
    url: 'https://ethereum.org',
  },
  {
    id: '10',
    title: 'Discord Bot Development',
    company: 'Polygon Labs',
    category: 'development',
    difficulty: 'easy',
    reward: '1,500 MATIC',
    rewardUsd: 1500,
    description: 'Build moderation and utility bot for community Discord server.',
    tags: ['Discord', 'JavaScript', 'Bot'],
    url: 'https://polygon.technology',
  },
]

// ══════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Gift },
  { id: 'development', label: 'Development', icon: Code2 },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'research', label: 'Research', icon: FlaskConical },
]

const DIFFICULTIES = [
  { id: 'all', label: 'All Levels' },
  { id: 'easy', label: 'Easy', color: 'text-green-500' },
  { id: 'medium', label: 'Medium', color: 'text-yellow-500' },
  { id: 'hard', label: 'Hard', color: 'text-orange-500' },
  { id: 'expert', label: 'Expert', color: 'text-red-500' },
]

const difficultyColor: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-500 border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  hard: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  expert: 'bg-red-500/10 text-red-500 border-red-500/30',
}

const categoryIcon: Record<string, typeof Code2> = {
  development: Code2,
  design: Palette,
  content: FileText,
  community: Users,
  research: FlaskConical,
}

// ══════════════════════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════════════════════

function BountyCard({ bounty, index }: { bounty: Bounty; index: number }) {
  const CategoryIcon = categoryIcon[bounty.category]

  return (
    <motion.a
      href={bounty.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group block p-6 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300 ${
        bounty.featured ? 'ring-2 ring-amber-500/30' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <CategoryIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted">
              {bounty.company}
            </p>
            {bounty.featured && (
              <span className="inline-block px-1.5 py-0.5 text-[8px] uppercase tracking-wider bg-amber-500 text-black font-bold mt-1">
                Featured
              </span>
            )}
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-a24-muted dark:text-a24-dark-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-a24-text dark:text-a24-dark-text mb-2 group-hover:text-amber-500 transition-colors">
        {bounty.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-4 line-clamp-2">
        {bounty.description}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold border ${difficultyColor[bounty.difficulty]}`}>
          {bounty.difficulty}
        </span>
        {bounty.deadline && (
          <span className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted bg-a24-border/50 dark:bg-a24-dark-border/50">
            <Clock className="w-3 h-3" />
            {new Date(bounty.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {bounty.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 text-[10px] tracking-wider text-a24-muted dark:text-a24-dark-muted bg-a24-bg dark:bg-a24-dark-bg"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Reward */}
      <div className="flex items-center gap-2 pt-4 border-t border-a24-border dark:border-a24-dark-border">
        <DollarSign className="w-4 h-4 text-amber-500" />
        <span className="text-lg font-bold text-amber-500">{bounty.reward}</span>
      </div>
    </motion.a>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════

export default function BountiesPage() {
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [search, setSearch] = useState('')

  const filteredBounties = useMemo(() => {
    return BOUNTIES.filter((bounty) => {
      if (category !== 'all' && bounty.category !== category) return false
      if (difficulty !== 'all' && bounty.difficulty !== difficulty) return false
      if (search) {
        const searchLower = search.toLowerCase()
        return (
          bounty.title.toLowerCase().includes(searchLower) ||
          bounty.company.toLowerCase().includes(searchLower) ||
          bounty.tags.some((t) => t.toLowerCase().includes(searchLower))
        )
      }
      return true
    })
  }, [category, difficulty, search])

  const totalRewards = useMemo(() => {
    return BOUNTIES.reduce((sum, b) => sum + (b.rewardUsd || 0), 0)
  }, [])

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.3em] text-amber-500 mb-4 font-bold">
              side quests available
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-a24-text dark:text-a24-dark-text mb-4 leading-tight">
              Bounties & Grants
            </h1>
            <p className="text-lg text-a24-muted dark:text-a24-dark-muted font-medium max-w-xl">
              Short-term bounties, bug bounties, grant programs, and contributor opportunities.
              Get paid to build cool stuff.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Pixelbara pose="coin" size={160} clickable />
            <p className="text-sm text-a24-muted/70 dark:text-a24-dark-muted/70 mt-3 font-medium">
              ${totalRewards.toLocaleString()}+ in rewards
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
            <p className="text-3xl font-black text-amber-500">{BOUNTIES.length}</p>
            <p className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted">Active Bounties</p>
          </div>
          <div className="p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
            <p className="text-3xl font-black text-a24-text dark:text-a24-dark-text">${(totalRewards / 1000).toFixed(0)}k+</p>
            <p className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted">Total Rewards</p>
          </div>
          <div className="p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
            <p className="text-3xl font-black text-a24-text dark:text-a24-dark-text">5</p>
            <p className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted">Categories</p>
          </div>
          <div className="p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
            <p className="text-3xl font-black text-a24-text dark:text-a24-dark-text">10+</p>
            <p className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted">Top Projects</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-a24-muted dark:text-a24-dark-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bounties..."
              className="w-full pl-10 pr-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder-a24-muted dark:placeholder-a24-dark-muted focus:border-amber-500 outline-none transition-colors text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-wider font-medium border transition-colors ${
                    category === cat.id
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-a24-surface dark:bg-a24-dark-surface border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted hover:border-amber-500/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Filter className="w-4 h-4 text-a24-muted dark:text-a24-dark-muted self-center mr-2" />
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff.id}
              onClick={() => setDifficulty(diff.id)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium border transition-colors ${
                difficulty === diff.id
                  ? 'bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg border-a24-text dark:border-a24-dark-text'
                  : 'bg-transparent border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
              }`}
            >
              {diff.label}
            </button>
          ))}
        </div>

        {/* Bounties Grid */}
        {filteredBounties.length === 0 ? (
          <div className="py-20 text-center">
            <Pixelbara pose="question" size={120} className="mx-auto mb-4" clickable />
            <p className="text-a24-muted dark:text-a24-dark-muted font-medium">
              no bounties found... try different filters ser
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBounties.map((bounty, index) => (
              <BountyCard key={bounty.id} bounty={bounty} index={index} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 text-center py-12 border-t-2 border-a24-border dark:border-a24-dark-border">
          <h3 className="text-2xl font-black text-a24-text dark:text-a24-dark-text mb-4">
            Want to post a bounty?
          </h3>
          <p className="text-a24-muted dark:text-a24-dark-muted font-medium mb-6">
            Reach top web3 talent with your bounty or grant program
          </p>
          <Link
            href="/post-job"
            className="inline-flex items-center gap-3 px-8 py-4 text-sm font-bold uppercase tracking-wider bg-amber-500 text-black hover:bg-amber-400 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Post a Bounty
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
