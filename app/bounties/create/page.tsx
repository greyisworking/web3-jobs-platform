'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Calendar, Tag, FileText, Link as LinkIcon, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import SubpageHeader from '../../components/SubpageHeader'
import Footer from '../../components/Footer'
import Pixelbara from '../../components/Pixelbara'
import { WalletConnect } from '../../components/WalletConnect'
import { toast } from 'sonner'

const CATEGORIES = [
  { id: 'development', label: 'Development', emoji: '💻' },
  { id: 'design', label: 'Design', emoji: '🎨' },
  { id: 'content', label: 'Content', emoji: '✍️' },
  { id: 'research', label: 'Research', emoji: '🔬' },
  { id: 'marketing', label: 'Marketing', emoji: '📢' },
  { id: 'other', label: 'Other', emoji: '🔧' },
]

const SKILL_SUGGESTIONS = [
  'Solidity', 'React', 'TypeScript', 'Rust', 'Move', 'Cairo',
  'Smart Contracts', 'Frontend', 'Backend', 'UI/UX', 'Figma',
  'Technical Writing', 'Research', 'Data Analysis', 'Community',
]

export default function CreateBountyPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    reward_amount: '',
    reward_token: 'ETH',
    deadline: '',
    requirements: '',
    submission_requirements: '',
    skills: [] as string[],
    external_url: '',
  })

  const [skillInput, setSkillInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      toast.error('Connect wallet first')
      return
    }

    if (!form.title || !form.description || !form.reward_amount) {
      toast.error('Fill in required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          poster_address: address,
          reward_amount: parseFloat(form.reward_amount),
        }),
      })

      const data = await res.json()

      if (data.bounty) {
        toast.success('Bounty posted! LFG 🚀')
        router.push(`/bounties/${data.bounty.id}`)
      } else {
        throw new Error(data.error || 'Failed to create bounty')
      }
    } catch (error) {
      console.error('Failed to create bounty:', error)
      toast.error('Failed to post bounty')
    } finally {
      setSubmitting(false)
    }
  }

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm(f => ({ ...f, skills: [...f.skills, trimmed] }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }))
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <SubpageHeader title="P O S T  B O U N T Y" />
        </div>

        <main className="max-w-2xl mx-auto px-6 py-20">
          <div className="text-center">
            <Pixelbara pose="question" size={150} className="mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-a24-text mb-4">Connect Wallet to Post</h2>
            <p className="text-a24-muted mb-8">
              You need to connect your wallet to create a bounty.
            </p>
            <WalletConnect />
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg">
      <div className="max-w-6xl mx-auto px-6">
        <SubpageHeader title="P O S T  B O U N T Y" />
      </div>

      <main className="max-w-2xl mx-auto px-6 pb-20">
        {/* Back Link */}
        <Link
          href="/bounties"
          className="inline-flex items-center gap-2 text-a24-muted hover:text-a24-text mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bounties
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-a24-text mb-2">Create a Bounty</h2>
            <p className="text-a24-muted">
              Post a task and reward contributors in crypto.
            </p>
          </div>
          <Pixelbara pose="diamondHands" size={80} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g., Build a token swap widget"
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-green-500 focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
              <FileText className="w-3 h-3 inline mr-1" />
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the task in detail. What needs to be built? What are the acceptance criteria?"
              rows={5}
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-green-500 focus:outline-none resize-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
              <Tag className="w-3 h-3 inline mr-1" />
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                  className={`px-4 py-2 text-sm transition-colors ${
                    form.category === cat.id
                      ? 'bg-purple-600 text-a24-text'
                      : 'bg-gray-800 text-a24-muted hover:text-a24-text'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
                <Zap className="w-3 h-3 inline mr-1" />
                Reward Amount *
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={form.reward_amount}
                onChange={e => setForm(f => ({ ...f, reward_amount: e.target.value }))}
                placeholder="0.5"
                className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-green-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
                Token
              </label>
              <select
                value={form.reward_token}
                onChange={e => setForm(f => ({ ...f, reward_token: e.target.value }))}
                className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text focus:border-green-500 focus:outline-none"
              >
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="DAI">DAI</option>
                <option value="ARB">ARB</option>
                <option value="OP">OP</option>
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
              <Calendar className="w-3 h-3 inline mr-1" />
              Deadline
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
              Required Skills
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill(skillInput)
                  }
                }}
                placeholder="Add a skill"
                className="flex-1 px-4 py-2 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-green-500 focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="px-4 py-2 bg-gray-800 text-a24-text text-sm hover:bg-gray-700"
              >
                Add
              </button>
            </div>

            {/* Skill Suggestions */}
            <div className="flex flex-wrap gap-1 mb-2">
              {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).slice(0, 8).map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addSkill(skill)}
                  className="px-2 py-1 bg-gray-800/50 text-gray-500 text-xs hover:text-a24-text hover:bg-gray-800"
                >
                  + {skill}
                </button>
              ))}
            </div>

            {/* Selected Skills */}
            {form.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.skills.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/20 text-purple-400 text-xs"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-a24-text"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
              Requirements
            </label>
            <textarea
              value={form.requirements}
              onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
              placeholder="Any specific requirements or constraints?"
              rows={3}
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-green-500 focus:outline-none resize-none"
            />
          </div>

          {/* Submission Requirements */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
              Submission Requirements
            </label>
            <textarea
              value={form.submission_requirements}
              onChange={e => setForm(f => ({ ...f, submission_requirements: e.target.value }))}
              placeholder="What should hunters submit? (e.g., GitHub repo, deployed link, documentation)"
              rows={2}
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-green-500 focus:outline-none resize-none"
            />
          </div>

          {/* External URL */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
              <LinkIcon className="w-3 h-3 inline mr-1" />
              External URL (optional)
            </label>
            <input
              type="url"
              value={form.external_url}
              onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))}
              placeholder="https://github.com/..."
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200/80">
              <p className="font-medium mb-1">Escrow Coming Soon</p>
              <p className="text-xs text-yellow-200/60">
                On-chain escrow for bounty rewards is in development. For now, rewards are handled off-chain.
              </p>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-black font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Bounty'}
          </motion.button>

          <p className="text-center text-xs text-gray-500">
            By posting, you agree to pay the reward upon successful completion.
          </p>
        </form>
      </main>

      <Footer />
    </div>
  )
}
