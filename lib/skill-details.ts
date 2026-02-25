import { createSupabaseServerClient } from '@/lib/supabase-server'

// Skill metadata with learning resources
export const skillMeta: Record<string, {
  name: string
  category: 'language' | 'framework' | 'blockchain' | 'concept' | 'tool'
  description: string
  relatedSkills: string[]
  resources: {
    title: string
    url: string
    type: 'docs' | 'course' | 'tutorial' | 'video' | 'tool'
  }[]
}> = {
  'solidity': {
    name: 'Solidity',
    category: 'language',
    description: 'The primary language for Ethereum smart contracts. Essential for any smart contract developer.',
    relatedSkills: ['ethereum', 'hardhat', 'foundry', 'smart-contract-security'],
    resources: [
      { title: 'Solidity Documentation', url: 'https://docs.soliditylang.org/', type: 'docs' },
      { title: 'CryptoZombies', url: 'https://cryptozombies.io/', type: 'course' },
      { title: 'Solidity by Example', url: 'https://solidity-by-example.org/', type: 'tutorial' },
      { title: 'Cyfrin Updraft', url: 'https://updraft.cyfrin.io/', type: 'course' },
    ],
  },
  'rust': {
    name: 'Rust',
    category: 'language',
    description: 'High-performance systems language used for Solana, NEAR, and other chains. Memory-safe and fast.',
    relatedSkills: ['solana', 'move', 'cosmos'],
    resources: [
      { title: 'The Rust Book', url: 'https://doc.rust-lang.org/book/', type: 'docs' },
      { title: 'Rustlings', url: 'https://github.com/rust-lang/rustlings', type: 'tutorial' },
      { title: 'Solana Development Course', url: 'https://www.soldev.app/course', type: 'course' },
    ],
  },
  'typescript': {
    name: 'TypeScript',
    category: 'language',
    description: 'JavaScript with types. The standard for web3 frontend and tooling development.',
    relatedSkills: ['react', 'next-js', 'node-js', 'ethers-js'],
    resources: [
      { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/', type: 'docs' },
      { title: 'Total TypeScript', url: 'https://www.totaltypescript.com/', type: 'course' },
    ],
  },
  'react': {
    name: 'React',
    category: 'framework',
    description: 'The most popular frontend framework in web3. Used for building dApp interfaces.',
    relatedSkills: ['typescript', 'next-js', 'wagmi', 'ethers-js'],
    resources: [
      { title: 'React Documentation', url: 'https://react.dev/', type: 'docs' },
      { title: 'Scaffold-ETH 2', url: 'https://scaffoldeth.io/', type: 'tool' },
    ],
  },
  'ethereum': {
    name: 'Ethereum',
    category: 'blockchain',
    description: 'The leading smart contract platform. Understanding Ethereum is fundamental to web3 development.',
    relatedSkills: ['solidity', 'defi', 'evm'],
    resources: [
      { title: 'Ethereum.org Learn', url: 'https://ethereum.org/learn/', type: 'docs' },
      { title: 'Mastering Ethereum', url: 'https://github.com/ethereumbook/ethereumbook', type: 'docs' },
    ],
  },
  'defi': {
    name: 'DeFi',
    category: 'concept',
    description: 'Decentralized Finance protocols and primitives. AMMs, lending, derivatives, and more.',
    relatedSkills: ['ethereum', 'solidity', 'amm', 'lending'],
    resources: [
      { title: 'How to DeFi', url: 'https://landing.coingecko.com/how-to-defi/', type: 'docs' },
      { title: 'Finematics', url: 'https://www.youtube.com/@Finematics', type: 'video' },
      { title: 'DeFiLlama', url: 'https://defillama.com/', type: 'tool' },
    ],
  },
  'smart-contract-security': {
    name: 'Smart Contract Security',
    category: 'concept',
    description: 'Auditing and securing smart contracts. Critical skill for preventing exploits.',
    relatedSkills: ['solidity', 'ethereum', 'foundry'],
    resources: [
      { title: 'Damn Vulnerable DeFi', url: 'https://www.damnvulnerabledefi.xyz/', type: 'tutorial' },
      { title: 'Ethernaut', url: 'https://ethernaut.openzeppelin.com/', type: 'tutorial' },
      { title: 'SWC Registry', url: 'https://swcregistry.io/', type: 'docs' },
      { title: 'Cyfrin Security Course', url: 'https://updraft.cyfrin.io/courses/security', type: 'course' },
    ],
  },
  'foundry': {
    name: 'Foundry',
    category: 'tool',
    description: 'Modern Ethereum development toolkit. Fast, modular, and written in Rust.',
    relatedSkills: ['solidity', 'ethereum', 'smart-contract-security'],
    resources: [
      { title: 'Foundry Book', url: 'https://book.getfoundry.sh/', type: 'docs' },
      { title: 'Foundry by Example', url: 'https://foundry-by-example.vercel.app/', type: 'tutorial' },
    ],
  },
  'wagmi': {
    name: 'Wagmi',
    category: 'framework',
    description: 'React hooks for Ethereum. The modern way to build web3 frontends.',
    relatedSkills: ['react', 'typescript', 'viem', 'ethers-js'],
    resources: [
      { title: 'Wagmi Documentation', url: 'https://wagmi.sh/', type: 'docs' },
      { title: 'RainbowKit', url: 'https://www.rainbowkit.com/', type: 'docs' },
    ],
  },
  'solana': {
    name: 'Solana',
    category: 'blockchain',
    description: 'High-performance blockchain with sub-second finality. Uses Rust for development.',
    relatedSkills: ['rust', 'typescript'],
    resources: [
      { title: 'Solana Developer Docs', url: 'https://solana.com/docs', type: 'docs' },
      { title: 'Solana Dev Course', url: 'https://www.soldev.app/course', type: 'course' },
    ],
  },
}

// Skill keywords for matching in job descriptions
const skillKeywords: Record<string, string[]> = {
  'solidity': ['solidity'],
  'rust': ['rust'],
  'typescript': ['typescript', 'ts'],
  'javascript': ['javascript', 'js'],
  'python': ['python'],
  'go': ['golang', ' go ', 'go,'],
  'react': ['react', 'reactjs'],
  'next-js': ['next.js', 'nextjs'],
  'node-js': ['node.js', 'nodejs', 'node'],
  'hardhat': ['hardhat'],
  'foundry': ['foundry', 'forge'],
  'ethers-js': ['ethers.js', 'ethersjs', 'ethers'],
  'wagmi': ['wagmi'],
  'viem': ['viem'],
  'ethereum': ['ethereum', 'eth', 'evm'],
  'solana': ['solana'],
  'polygon': ['polygon', 'matic'],
  'arbitrum': ['arbitrum'],
  'optimism': ['optimism', 'op stack'],
  'base': [' base '],
  'defi': ['defi', 'decentralized finance'],
  'amm': ['amm', 'automated market maker', 'uniswap', 'dex'],
  'nft': ['nft', 'erc-721', 'erc-1155'],
  'smart-contract-security': ['audit', 'security', 'vulnerability'],
  'zk': ['zero knowledge', 'zk-', 'zkp', 'zk proof'],
}

export interface SkillDetailData {
  skill: {
    slug: string
    name: string
    category: string
    description: string
  }
  stats: {
    jobCount: number
    companiesCount: number
    remotePercentage: number
  }
  relatedSkills: string[]
  resources: {
    title: string
    url: string
    type: string
  }[]
  sampleJobs: {
    id: string
    title: string
    company: string
    location: string
  }[]
  topCompanies: string[]
}

export async function getSkillDetail(skillSlug: string): Promise<SkillDetailData | null> {
  const meta = skillMeta[skillSlug]
  const keywords = skillKeywords[skillSlug]

  if (!meta || !keywords) {
    return null
  }

  try {
    const supabase = await createSupabaseServerClient()

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    // Get all active jobs
    const { data: allJobs, error } = await supabase
      .from('Job')
      .select('id, title, tags, description, company, location')
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString())

    if (error || !allJobs) {
      return null
    }

    // Filter jobs mentioning this skill
    const matchingJobs = allJobs.filter(job => {
      const text = [job.title || '', job.tags || '', job.description || ''].join(' ').toLowerCase()
      return keywords.some(kw => text.includes(kw))
    })

    const companies = new Set(matchingJobs.map(j => j.company))
    const remoteCount = matchingJobs.filter(j =>
      j.location?.toLowerCase().includes('remote')
    ).length

    // Company counts
    const companyCounts: Record<string, number> = {}
    for (const job of matchingJobs) {
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1
    }
    const topCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([company]) => company)

    return {
      skill: {
        slug: skillSlug,
        name: meta.name,
        category: meta.category,
        description: meta.description,
      },
      stats: {
        jobCount: matchingJobs.length,
        companiesCount: companies.size,
        remotePercentage: matchingJobs.length > 0 ? Math.round((remoteCount / matchingJobs.length) * 100) : 0,
      },
      relatedSkills: meta.relatedSkills,
      resources: meta.resources,
      sampleJobs: matchingJobs.slice(0, 5).map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location || 'Remote',
      })),
      topCompanies,
    }
  } catch {
    return null
  }
}

// Get all available skills for the index page
export function getAvailableSkills() {
  return Object.entries(skillMeta).map(([slug, meta]) => ({
    slug,
    name: meta.name,
    category: meta.category,
    description: meta.description,
  }))
}
