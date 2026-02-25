import { createSupabaseServerClient } from '@/lib/supabase-server'

// Skill keywords for extraction (reuse from career-skills)
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
  'Ethereum': ['ethereum', 'eth', 'evm'],
  'Solana': ['solana'],
  'Polygon': ['polygon', 'matic'],
  'Arbitrum': ['arbitrum'],
  'Optimism': ['optimism', 'op stack'],
  'Base': [' base '],
  'Avalanche': ['avalanche', 'avax'],
  'Cosmos': ['cosmos', 'cosmwasm'],
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

// Role patterns for categorization
const rolePatterns: Record<string, string[]> = {
  'Engineering': ['engineer', 'developer', 'solidity', 'rust', 'backend', 'frontend', 'full stack', 'fullstack', 'protocol'],
  'Product': ['product manager', 'product lead', 'pm'],
  'Design': ['designer', 'ui', 'ux', 'design'],
  'Marketing': ['marketing', 'growth', 'content', 'social media', 'brand'],
  'Community': ['community', 'discord', 'telegram'],
  'Business Dev': ['business development', 'bd', 'partnership', 'sales'],
  'Research': ['researcher', 'analyst', 'research'],
  'Operations': ['operations', 'ops', 'hr', 'people'],
}

function extractSkills(text: string): string[] {
  const lowerText = text.toLowerCase()
  const foundSkills: string[] = []

  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        foundSkills.push(skill)
        break
      }
    }
  }

  return foundSkills
}

function categorizeRole(title: string): string {
  const lowerTitle = title.toLowerCase()

  for (const [role, patterns] of Object.entries(rolePatterns)) {
    if (patterns.some(pattern => lowerTitle.includes(pattern))) {
      return role
    }
  }

  return 'Other'
}

export interface MarketTrendsData {
  overview: {
    totalJobs: number
    totalCompanies: number
    remotePercentage: number
    avgJobsPerCompany: number
  }
  topSkills: {
    skill: string
    count: number
    percentage: number
  }[]
  roleDistribution: {
    role: string
    count: number
    percentage: number
  }[]
  experienceLevels: {
    level: string
    count: number
    percentage: number
  }[]
  locationDistribution: {
    location: string
    count: number
    percentage: number
  }[]
  topCompanies: {
    company: string
    jobCount: number
  }[]
  hotSkills: {
    skill: string
    trend: 'rising' | 'stable' | 'declining'
    recentCount: number
    previousCount: number
    changePercent: number
  }[]
}

export async function getMarketTrends(): Promise<MarketTrendsData | null> {
  try {
    const supabase = await createSupabaseServerClient()

    // Time periods
    const now = new Date()
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Get recent jobs (last 3 months)
    const { data: recentJobs, error: recentError } = await supabase
      .from('Job')
      .select('id, title, tags, description, company, experienceLevel, location, type, crawledAt')
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString())

    if (recentError || !recentJobs) {
      return null
    }

    // Get previous period jobs (3-6 months ago) for trend comparison
    const { data: previousJobs } = await supabase
      .from('Job')
      .select('id, title, tags, description')
      .eq('isActive', true)
      .gte('crawledAt', sixMonthsAgo.toISOString())
      .lt('crawledAt', threeMonthsAgo.toISOString())

    const prevJobs = previousJobs || []

    // Calculate overview stats
    const companies = new Set(recentJobs.map(j => j.company))
    const remoteCount = recentJobs.filter(j =>
      j.location?.toLowerCase().includes('remote')
    ).length

    // Extract and count skills from recent jobs
    const skillCounts: Record<string, number> = {}
    const roleCounts: Record<string, number> = {}
    const expLevelCounts: Record<string, number> = {}
    const locationCounts: Record<string, number> = {}
    const companyCounts: Record<string, number> = {}

    for (const job of recentJobs) {
      // Skills
      const text = [job.title || '', job.tags || '', job.description || ''].join(' ')
      const skills = extractSkills(text)
      for (const skill of skills) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1
      }

      // Roles
      const role = categorizeRole(job.title)
      roleCounts[role] = (roleCounts[role] || 0) + 1

      // Experience levels
      if (job.experienceLevel) {
        expLevelCounts[job.experienceLevel] = (expLevelCounts[job.experienceLevel] || 0) + 1
      }

      // Locations
      const loc = job.location?.toLowerCase().includes('remote') ? 'Remote' :
                  job.location?.toLowerCase().includes('us') ? 'US' :
                  job.location?.toLowerCase().includes('europe') ? 'Europe' :
                  job.location?.toLowerCase().includes('asia') ? 'Asia' : 'Other'
      locationCounts[loc] = (locationCounts[loc] || 0) + 1

      // Companies
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1
    }

    // Calculate skill trends (compare recent vs previous)
    const prevSkillCounts: Record<string, number> = {}
    for (const job of prevJobs) {
      const text = [job.title || '', job.tags || '', job.description || ''].join(' ')
      const skills = extractSkills(text)
      for (const skill of skills) {
        prevSkillCounts[skill] = (prevSkillCounts[skill] || 0) + 1
      }
    }

    // Sort and format results
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill, count]) => ({
        skill,
        count,
        percentage: Math.round((count / recentJobs.length) * 100),
      }))

    const roleDistribution = Object.entries(roleCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([role, count]) => ({
        role,
        count,
        percentage: Math.round((count / recentJobs.length) * 100),
      }))

    const experienceLevels = Object.entries(expLevelCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([level, count]) => ({
        level,
        count,
        percentage: Math.round((count / recentJobs.length) * 100),
      }))

    const locationDistribution = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([location, count]) => ({
        location,
        count,
        percentage: Math.round((count / recentJobs.length) * 100),
      }))

    const topCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([company, jobCount]) => ({ company, jobCount }))

    // Hot skills (trending up/down)
    const hotSkills = Object.entries(skillCounts)
      .map(([skill, recentCount]) => {
        const previousCount = prevSkillCounts[skill] || 0
        const normalizedRecent = recentJobs.length > 0 ? recentCount / recentJobs.length : 0
        const normalizedPrev = prevJobs.length > 0 ? previousCount / prevJobs.length : 0

        let changePercent = 0
        if (normalizedPrev > 0) {
          changePercent = Math.round(((normalizedRecent - normalizedPrev) / normalizedPrev) * 100)
        } else if (normalizedRecent > 0) {
          changePercent = 100 // New skill
        }

        const trend: 'rising' | 'stable' | 'declining' =
          changePercent > 20 ? 'rising' :
          changePercent < -20 ? 'declining' : 'stable'

        return {
          skill,
          trend,
          recentCount,
          previousCount,
          changePercent,
        }
      })
      .filter(s => s.recentCount >= 3) // Only show skills with meaningful data
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 10)

    return {
      overview: {
        totalJobs: recentJobs.length,
        totalCompanies: companies.size,
        remotePercentage: Math.round((remoteCount / recentJobs.length) * 100),
        avgJobsPerCompany: Math.round((recentJobs.length / companies.size) * 10) / 10,
      },
      topSkills,
      roleDistribution,
      experienceLevels,
      locationDistribution,
      topCompanies,
      hotSkills,
    }
  } catch {
    return null
  }
}
