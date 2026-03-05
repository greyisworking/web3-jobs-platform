import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

// Reuse skill keywords from market-trends pattern
const skillKeywords: Record<string, string[]> = {
  'Solidity': ['solidity'],
  'Rust': ['rust'],
  'TypeScript': ['typescript', 'ts'],
  'JavaScript': ['javascript', 'js'],
  'Python': ['python'],
  'Go': ['golang', ' go ', 'go,'],
  'Move': [' move '],
  'Cairo': ['cairo'],
  'React': ['react', 'reactjs'],
  'Next.js': ['next.js', 'nextjs'],
  'Node.js': ['node.js', 'nodejs', 'node'],
  'Hardhat': ['hardhat'],
  'Foundry': ['foundry', 'forge'],
  'Ethers.js': ['ethers.js', 'ethersjs', 'ethers'],
  'Wagmi': ['wagmi'],
  'Viem': ['viem'],
  'TheGraph': ['the graph', 'thegraph', 'subgraph'],
  'DeFi': ['defi', 'decentralized finance'],
  'AMM': ['amm', 'automated market maker', 'uniswap', 'dex'],
  'Lending': ['lending', 'borrowing', 'aave', 'compound'],
  'NFT': ['nft', 'erc-721', 'erc-1155'],
  'DAO': ['dao', 'governance'],
  'ZK': ['zero knowledge', 'zk-', 'zkp', 'zk proof'],
  'Smart Contract Security': ['audit', 'security', 'vulnerability'],
  'AWS': ['aws', 'amazon web services'],
  'Docker': ['docker', 'container'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'GraphQL': ['graphql'],
}

const chainKeywords: Record<string, string[]> = {
  'Ethereum': ['ethereum', 'eth', 'evm'],
  'Solana': ['solana'],
  'Polygon': ['polygon', 'matic'],
  'Arbitrum': ['arbitrum'],
  'Optimism': ['optimism', 'op stack'],
  'Base': [' base '],
  'Avalanche': ['avalanche', 'avax'],
  'Cosmos': ['cosmos', 'cosmwasm'],
}

interface JobRow {
  id: string
  title: string
  description: string | null
  company: string
  location: string | null
  remoteType: string | null
  crawledAt: string
  tags: string | null
}

function extractFromText(text: string, keywords: Record<string, string[]>): Record<string, number> {
  const lower = text.toLowerCase()
  const counts: Record<string, number> = {}
  for (const [name, kws] of Object.entries(keywords)) {
    for (const kw of kws) {
      if (lower.includes(kw)) {
        counts[name] = (counts[name] || 0) + 1
        break
      }
    }
  }
  return counts
}

function isRemote(job: JobRow): boolean {
  if (job.remoteType?.toLowerCase().includes('remote')) return true
  if (job.location?.toLowerCase().includes('remote')) return true
  return false
}

function aggregateJobs(jobs: JobRow[]) {
  const skillCounts: Record<string, number> = {}
  const companyCounts: Record<string, number> = {}
  const chainCounts: Record<string, number> = {}
  let remoteCount = 0

  for (const job of jobs) {
    const text = [job.title || '', job.tags || '', job.description || ''].join(' ')

    // Skills
    const skills = extractFromText(text, skillKeywords)
    for (const [skill, count] of Object.entries(skills)) {
      skillCounts[skill] = (skillCounts[skill] || 0) + count
    }

    // Chains
    const chains = extractFromText(text, chainKeywords)
    for (const [chain, count] of Object.entries(chains)) {
      chainCounts[chain] = (chainCounts[chain] || 0) + count
    }

    // Companies
    companyCounts[job.company] = (companyCounts[job.company] || 0) + 1

    // Remote
    if (isRemote(job)) remoteCount++
  }

  return { skillCounts, companyCounts, chainCounts, remoteCount, totalJobs: jobs.length }
}

function calcChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 100 * 10) / 10
}

function changeSymbol(change: number): string {
  if (change > 0) return `▲ +${change}%`
  if (change < 0) return `▼ ${change}%`
  return '→ 0%'
}

function buildMarkdown(data: {
  periodStart: string
  periodEnd: string
  curr: ReturnType<typeof aggregateJobs>
  prev: ReturnType<typeof aggregateJobs>
  hotSkills: { name: string; count: number; prevCount: number; change: number }[]
  newCompanies: string[]
  chainTrends: { name: string; count: number; prevCount: number; change: number }[]
  remoteTrend: { current: number; previous: number }
  aiSummary?: string
}): string {
  const start = new Date(data.periodStart)
  const year = start.getFullYear()
  const month = start.getMonth() + 1
  const totalChange = calcChange(data.curr.totalJobs, data.prev.totalJobs)
  let md = `# NEUN Web3 Market Report — ${year}년 ${month}월\n\n`

  // Summary
  md += `## 📊 요약\n`
  md += `- 전체 활성 공고: **${data.curr.totalJobs}건** (전월 대비 ${changeSymbol(totalChange)})\n`
  md += `- 전월 공고: **${data.prev.totalJobs}건**\n\n`

  // Hot Skills TOP 10
  md += `## 🔥 Hot Skills TOP 10\n`
  md += `| 순위 | 스킬 | 건수 | 전월 대비 |\n`
  md += `|------|------|------|----------|\n`
  data.hotSkills.forEach((s, i) => {
    md += `| ${i + 1} | ${s.name} | ${s.count} | ${changeSymbol(s.change)} |\n`
  })
  md += `\n`

  // New Companies
  if (data.newCompanies.length > 0) {
    md += `## 🏢 신규 진입 회사\n`
    md += data.newCompanies.join(', ') + `\n\n`
  }

  // Chain Trends
  if (data.chainTrends.length > 0) {
    md += `## ⛓️ 체인별 채용 동향\n`
    md += `| 체인 | 건수 | 전월 대비 |\n`
    md += `|------|------|----------|\n`
    data.chainTrends.forEach(c => {
      md += `| ${c.name} | ${c.count} | ${changeSymbol(c.change)} |\n`
    })
    md += `\n`
  }

  // Remote Trend
  md += `## 🌐 리모트 비율\n`
  md += `- 이번 달: **${data.remoteTrend.current}%** (전월: ${data.remoteTrend.previous}%)\n\n`

  // AI Summary
  if (data.aiSummary) {
    md += `## 💡 주목할 트렌드\n`
    md += data.aiSummary + `\n`
  }

  return md
}

let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

async function generateAISummary(data: {
  totalJobs: number
  prevTotalJobs: number
  hotSkills: { name: string; count: number; change: number }[]
  chainTrends: { name: string; count: number; change: number }[]
  remoteTrend: { current: number; previous: number }
  newCompanies: string[]
}): Promise<string> {
  const client = getAnthropicClient()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: 'You are a Web3 job market analyst for NEUN. Write in Korean. Be concise and insightful.',
    messages: [{
      role: 'user',
      content: `다음 Web3 채용 시장 데이터를 바탕으로 3문장 이내로 주목할 트렌드를 요약해주세요.

데이터:
${JSON.stringify(data, null, 2)}

형식: 마크다운 없이 순수 텍스트로 3문장 이내. 핵심 인사이트 위주.`,
    }],
  })

  return response.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('\n')
}

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { startDate, endDate, includeAI } = body as {
      startDate: string
      endDate: string
      includeAI?: boolean
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    // Calculate previous period (same duration, immediately before startDate)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const durationMs = end.getTime() - start.getTime()
    const prevStart = new Date(start.getTime() - durationMs)
    const prevEnd = new Date(start.getTime())

    const supabase = await createSupabaseServerClient()

    // Query current period jobs
    const { data: currJobs, error: currError } = await supabase
      .from('Job')
      .select('id, title, description, company, location, remoteType, crawledAt, tags')
      .eq('isActive', true)
      .gte('crawledAt', start.toISOString())
      .lte('crawledAt', end.toISOString())

    if (currError) {
      return NextResponse.json({ error: 'Failed to query current period jobs' }, { status: 500 })
    }

    // Query previous period jobs
    const { data: prevJobs, error: prevError } = await supabase
      .from('Job')
      .select('id, title, description, company, location, remoteType, crawledAt, tags')
      .eq('isActive', true)
      .gte('crawledAt', prevStart.toISOString())
      .lt('crawledAt', prevEnd.toISOString())

    if (prevError) {
      return NextResponse.json({ error: 'Failed to query previous period jobs' }, { status: 500 })
    }

    const currentJobs = (currJobs || []) as JobRow[]
    const previousJobs = (prevJobs || []) as JobRow[]

    // Aggregate both periods
    const curr = aggregateJobs(currentJobs)
    const prev = aggregateJobs(previousJobs)

    // Hot Skills TOP 10: merge all skills, sort by count descending
    const allSkills = new Set([...Object.keys(curr.skillCounts), ...Object.keys(prev.skillCounts)])
    const hotSkills = Array.from(allSkills)
      .map(name => ({
        name,
        count: curr.skillCounts[name] || 0,
        prevCount: prev.skillCounts[name] || 0,
        change: calcChange(curr.skillCounts[name] || 0, prev.skillCounts[name] || 0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // New companies
    const prevCompanySet = new Set(Object.keys(prev.companyCounts))
    const newCompanies = Object.keys(curr.companyCounts).filter(c => !prevCompanySet.has(c))

    // Chain trends
    const allChains = new Set([...Object.keys(curr.chainCounts), ...Object.keys(prev.chainCounts)])
    const chainTrends = Array.from(allChains)
      .map(name => ({
        name,
        count: curr.chainCounts[name] || 0,
        prevCount: prev.chainCounts[name] || 0,
        change: calcChange(curr.chainCounts[name] || 0, prev.chainCounts[name] || 0),
      }))
      .sort((a, b) => b.count - a.count)

    // Remote trend
    const remoteTrend = {
      current: curr.totalJobs > 0 ? Math.round((curr.remoteCount / curr.totalJobs) * 100) : 0,
      previous: prev.totalJobs > 0 ? Math.round((prev.remoteCount / prev.totalJobs) * 100) : 0,
    }

    // AI Summary (optional)
    let aiSummary: string | undefined
    if (includeAI) {
      try {
        aiSummary = await generateAISummary({
          totalJobs: curr.totalJobs,
          prevTotalJobs: prev.totalJobs,
          hotSkills,
          chainTrends,
          remoteTrend,
          newCompanies: newCompanies.slice(0, 20),
        })
      } catch (err) {
        console.error('AI summary generation failed:', err)
        // Graceful fallback — continue without AI summary
      }
    }

    // Build markdown
    const markdown = buildMarkdown({
      periodStart: startDate,
      periodEnd: endDate,
      curr,
      prev,
      hotSkills,
      newCompanies: newCompanies.slice(0, 30),
      chainTrends,
      remoteTrend,
      aiSummary,
    })

    const changeRate = calcChange(curr.totalJobs, prev.totalJobs)

    return NextResponse.json({
      report: {
        period: { start: startDate, end: endDate },
        summary: {
          totalJobs: curr.totalJobs,
          newJobs: curr.totalJobs,
          prevTotalJobs: prev.totalJobs,
          changeRate,
        },
        hotSkills,
        newCompanies: newCompanies.slice(0, 30),
        chainTrends,
        remoteTrend,
        aiSummary,
      },
      markdown,
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
})
