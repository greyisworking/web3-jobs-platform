import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EXCLUDE = new Set([
  'Blockchain', 'Web3', 'web3', 'Korea', 'Non-Tech', 'Crypto', 'crypto',
  'Layer 1', 'Layer 2', 'Solana', 'Ethereum', 'Arbitrum', 'Bitcoin', 'BNB',
  'Polygon', 'Avalanche', 'Sui', 'Aptos', 'Base',
  'Problem Solving', 'Collaboration', 'Communication', 'Leadership',
  'Teamwork', 'Analytical Thinking', 'Critical Thinking',
  'Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid', 'Onsite',
  'BTSE', 'full-time', 'remote', 'Engineering', 'Product', 'manager',
])

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      where: { isActive: true, tags: { not: null } },
      select: { tags: true },
    })

    const skillCount = new Map<string, number>()
    const coOccurrence = new Map<string, number>()
    const jobSkills: string[][] = []

    for (const job of jobs) {
      try {
        const tags: string[] = JSON.parse(job.tags!)
        const skills = tags.filter(t => !EXCLUDE.has(t) && t.length > 1)
        jobSkills.push(skills)
        for (const s of skills) skillCount.set(s, (skillCount.get(s) || 0) + 1)
      } catch { /* skip malformed tags */ }
    }

    // Top 10 skills by frequency
    const top10 = Array.from(skillCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(e => e[0])

    // Co-occurrence for top 10
    for (const skills of jobSkills) {
      const relevant = skills.filter(s => top10.includes(s))
      for (let i = 0; i < relevant.length; i++) {
        for (let j = i + 1; j < relevant.length; j++) {
          const key = [relevant[i], relevant[j]].sort().join('\x00')
          coOccurrence.set(key, (coOccurrence.get(key) || 0) + 1)
        }
      }
    }

    // Build matrix
    const matrix: { skill1: string; skill2: string; count: number }[] = []
    for (let i = 0; i < top10.length; i++) {
      for (let j = i + 1; j < top10.length; j++) {
        const key = [top10[i], top10[j]].sort().join('\x00')
        const count = coOccurrence.get(key) || 0
        if (count > 0) {
          matrix.push({ skill1: top10[i], skill2: top10[j], count })
        }
      }
    }

    return NextResponse.json({
      skills: top10.map(s => ({ name: s, count: skillCount.get(s) || 0 })),
      matrix: matrix.sort((a, b) => b.count - a.count),
      totalJobs: jobs.length,
    })
  } catch (error) {
    console.error('Skill adjacency error:', error)
    return NextResponse.json({ skills: [], matrix: [], totalJobs: 0 })
  }
}
