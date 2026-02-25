import { createSupabaseServerClient } from '@/lib/supabase-server'

// Career path definitions with title patterns
export const careerPaths: Record<string, {
  titlePatterns: string[]
  name: string
  description: string
}> = {
  'smart-contract-engineer': {
    name: 'Smart Contract Engineer',
    description: 'Build and audit smart contracts, protocols, and blockchain infrastructure.',
    titlePatterns: [
      'smart contract',
      'solidity',
      'blockchain engineer',
      'protocol engineer',
      'defi engineer',
      'rust engineer',
      'web3 engineer',
      'backend engineer',
      'blockchain developer',
    ],
  },
  'frontend-developer': {
    name: 'Frontend Developer',
    description: 'Build web3 interfaces, dApps, and wallet integrations.',
    titlePatterns: [
      'frontend',
      'front-end',
      'front end',
      'react',
      'ui engineer',
      'web developer',
      'full stack',
      'fullstack',
    ],
  },
  'defi-analyst': {
    name: 'DeFi Analyst',
    description: 'Analyze protocols, model risks, and research market opportunities.',
    titlePatterns: [
      'defi analyst',
      'research analyst',
      'quantitative',
      'risk analyst',
      'token economist',
      'tokenomics',
      'economic',
    ],
  },
  'bd-partnerships': {
    name: 'BD & Partnerships',
    description: 'Build relationships, close deals, and grow ecosystems.',
    titlePatterns: [
      'business development',
      'bd ',
      'partnership',
      'sales',
      'account executive',
      'growth manager',
      'ecosystem',
    ],
  },
  'marketing-community': {
    name: 'Marketing & Community',
    description: 'Build communities, run campaigns, and tell stories.',
    titlePatterns: [
      'marketing',
      'community',
      'social media',
      'content',
      'growth',
      'brand',
      'communications',
      'pr ',
      'public relations',
    ],
  },
}

// Common web3 skills to extract
const skillKeywords: Record<string, string[]> = {
  // Programming Languages
  'Solidity': ['solidity'],
  'Rust': ['rust'],
  'TypeScript': ['typescript', 'ts'],
  'JavaScript': ['javascript', 'js'],
  'Python': ['python'],
  'Go': ['golang', ' go ', 'go,'],
  'Move': [' move '],
  'Cairo': ['cairo'],
  'Vyper': ['vyper'],

  // Frameworks & Tools
  'React': ['react', 'reactjs'],
  'Next.js': ['next.js', 'nextjs'],
  'Node.js': ['node.js', 'nodejs', 'node'],
  'Hardhat': ['hardhat'],
  'Foundry': ['foundry', 'forge'],
  'Ethers.js': ['ethers.js', 'ethersjs', 'ethers'],
  'Web3.js': ['web3.js', 'web3js'],
  'Wagmi': ['wagmi'],
  'Viem': ['viem'],
  'TheGraph': ['the graph', 'thegraph', 'subgraph'],

  // Blockchain Platforms
  'Ethereum': ['ethereum', 'eth', 'evm'],
  'Solana': ['solana'],
  'Polygon': ['polygon', 'matic'],
  'Arbitrum': ['arbitrum'],
  'Optimism': ['optimism', 'op stack'],
  'Base': [' base '],
  'Avalanche': ['avalanche', 'avax'],
  'Cosmos': ['cosmos', 'cosmwasm'],
  'Polkadot': ['polkadot', 'substrate'],

  // DeFi Concepts
  'DeFi': ['defi', 'decentralized finance'],
  'AMM': ['amm', 'automated market maker', 'uniswap', 'dex'],
  'Lending': ['lending', 'borrowing', 'aave', 'compound'],
  'Yield': ['yield', 'staking', 'farming'],
  'MEV': ['mev', 'maximal extractable'],
  'Oracles': ['oracle', 'chainlink'],

  // Security
  'Smart Contract Security': ['audit', 'security', 'vulnerability'],
  'Slither': ['slither'],
  'Mythril': ['mythril'],
  'Formal Verification': ['formal verification'],

  // Infrastructure
  'AWS': ['aws', 'amazon web services'],
  'Docker': ['docker', 'container'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'CI/CD': ['ci/cd', 'github actions', 'jenkins'],
  'PostgreSQL': ['postgresql', 'postgres'],
  'MongoDB': ['mongodb', 'mongo'],
  'Redis': ['redis'],
  'GraphQL': ['graphql'],

  // Soft Skills / Business
  'Communication': ['communication', 'collaborate', 'cross-functional'],
  'Leadership': ['leadership', 'lead', 'manage team'],
  'Strategy': ['strategy', 'strategic'],
  'Analytics': ['analytics', 'data analysis', 'metrics'],
}

// Extract skills from text
function extractSkills(text: string): string[] {
  const lowerText = text.toLowerCase()
  const foundSkills: string[] = []

  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        foundSkills.push(skill)
        break // Only count each skill once
      }
    }
  }

  return foundSkills
}

export interface CareerSkillsData {
  career: {
    slug: string
    name: string
    description: string
  }
  stats: {
    totalJobs: number
    companiesHiring: number
    experienceLevels: Record<string, number>
    locations: Record<string, number>
    jobTypes: Record<string, number>
  }
  skills: {
    core: { skill: string; count: number; percentage: number }[]
    common: { skill: string; count: number; percentage: number }[]
    niceToHave: { skill: string; count: number; percentage: number }[]
    all: { skill: string; count: number; percentage: number }[]
  }
  sampleCompanies: string[]
}

export async function getCareerSkills(careerSlug: string): Promise<CareerSkillsData | null> {
  const career = careerPaths[careerSlug]
  if (!career) {
    return null
  }

  try {
    const supabase = await createSupabaseServerClient()

    // 3 months ago for freshness
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    // Get all active jobs
    const { data: allJobs, error } = await supabase
      .from('Job')
      .select('id, title, tags, description, company, experienceLevel, location, type')
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString())

    if (error || !allJobs) {
      return null
    }

    // Filter jobs matching this career's title patterns
    const matchingJobs = allJobs.filter(job => {
      const titleLower = job.title.toLowerCase()
      return career.titlePatterns.some(pattern => titleLower.includes(pattern))
    })

    // Extract and count skills
    const skillCounts: Record<string, number> = {}
    const experienceLevelCounts: Record<string, number> = {}
    const locationCounts: Record<string, number> = {}
    const typeCounts: Record<string, number> = {}
    const companiesHiring: Set<string> = new Set()

    for (const job of matchingJobs) {
      // Combine text sources for skill extraction
      const textToAnalyze = [
        job.title || '',
        job.tags || '',
        job.description || '',
      ].join(' ')

      const skills = extractSkills(textToAnalyze)
      for (const skill of skills) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1
      }

      // Count experience levels
      if (job.experienceLevel) {
        experienceLevelCounts[job.experienceLevel] = (experienceLevelCounts[job.experienceLevel] || 0) + 1
      }

      // Count locations (simplify to region)
      if (job.location) {
        const loc = job.location.toLowerCase().includes('remote') ? 'Remote' :
                    job.location.toLowerCase().includes('us') ? 'US' :
                    job.location.toLowerCase().includes('europe') ? 'Europe' :
                    job.location.toLowerCase().includes('asia') ? 'Asia' : 'Other'
        locationCounts[loc] = (locationCounts[loc] || 0) + 1
      }

      // Count job types
      if (job.type) {
        typeCounts[job.type] = (typeCounts[job.type] || 0) + 1
      }

      // Track companies
      companiesHiring.add(job.company)
    }

    // Sort skills by frequency
    const sortedSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([skill, count]) => ({
        skill,
        count,
        percentage: matchingJobs.length > 0 ? Math.round((count / matchingJobs.length) * 100) : 0,
      }))

    // Categorize skills
    const coreSkills = sortedSkills.filter(s => s.percentage >= 30)
    const commonSkills = sortedSkills.filter(s => s.percentage >= 15 && s.percentage < 30)
    const niceToHave = sortedSkills.filter(s => s.percentage >= 5 && s.percentage < 15)

    return {
      career: {
        slug: careerSlug,
        name: career.name,
        description: career.description,
      },
      stats: {
        totalJobs: matchingJobs.length,
        companiesHiring: companiesHiring.size,
        experienceLevels: experienceLevelCounts,
        locations: locationCounts,
        jobTypes: typeCounts,
      },
      skills: {
        core: coreSkills,
        common: commonSkills,
        niceToHave: niceToHave,
        all: sortedSkills,
      },
      sampleCompanies: Array.from(companiesHiring).slice(0, 10),
    }
  } catch {
    return null
  }
}
