// Learn page data - domains, steps, and resources
// jobCount is fetched dynamically from DB

export type ResourceType = 'article' | 'video' | 'tool' | 'course' | 'book'

export interface Resource {
  type: ResourceType
  title: string
  source: string
  readingTime: string // "8 min", "2+ hrs"
  url: string
}

export interface Step {
  title: string
  why: string // NEUN tone explanation
  resources: Resource[]
}

export interface Domain {
  slug: string
  name: string
  description: string
  icon: string // lucide-react icon name
  color: string // tailwind color
  jobFilterTag: string // For linking to /jobs with filter
  steps: Step[]
}

// Domain with dynamic job count (used by page component)
export interface DomainWithJobCount extends Domain {
  jobCount: number
}

// Order: 1) Basics, 2) DeFi, 3) Security, 4) L2, 5) NFT, 6) DAO
export const domains: Domain[] = [
  {
    slug: 'basics',
    name: 'Blockchain Basics',
    description: "brand new? start here. we got you.",
    icon: 'Globe',
    color: 'bg-blue-500/20 text-blue-400',
    jobFilterTag: 'blockchain',
    steps: [
      {
        title: 'What is Blockchain?',
        why: 'the fundamental concept of distributed ledgers.',
        resources: [],
      },
      {
        title: 'Wallets & Keys',
        why: 'public/private keys, seed phrases, and wallet types.',
        resources: [],
      },
      {
        title: 'Transactions & Gas',
        why: 'how transactions work and what gas fees are.',
        resources: [],
      },
      {
        title: 'Consensus Mechanisms',
        why: 'proof of work, proof of stake, and beyond.',
        resources: [],
      },
      {
        title: 'Smart Contracts',
        why: 'code that runs on the blockchain.',
        resources: [],
      },
      {
        title: 'Ethereum vs Other Chains',
        why: 'comparing different blockchain ecosystems.',
        resources: [],
      },
      {
        title: 'Reading the Chain',
        why: 'block explorers, etherscan, and on-chain data.',
        resources: [],
      },
      {
        title: 'Your First dApp Interaction',
        why: 'connect wallet, sign transactions, use a protocol.',
        resources: [],
      },
    ],
  },
  {
    slug: 'defi',
    name: 'DeFi',
    description: "money without banks. lending, swaps, yield. the good stuff.",
    icon: 'Landmark',
    color: 'bg-emerald-500/20 text-emerald-400',
    jobFilterTag: 'defi',
    steps: [
      {
        title: 'What is DeFi?',
        why: 'understand the basics of decentralized finance and why it matters.',
        resources: [
          {
            type: 'article',
            title: 'The Complete Guide to DeFi',
            source: 'Ethereum.org',
            readingTime: '15 min',
            url: 'https://ethereum.org/en/defi/',
          },
          {
            type: 'video',
            title: 'DeFi Explained in 5 Minutes',
            source: 'Finematics',
            readingTime: '5 min',
            url: 'https://www.youtube.com/watch?v=k9HYC0EJU6E',
          },
          {
            type: 'article',
            title: 'DeFi vs Traditional Finance',
            source: 'Coinbase Learn',
            readingTime: '8 min',
            url: 'https://www.coinbase.com/learn/crypto-basics/what-is-defi',
          },
        ],
      },
      {
        title: 'Decentralized Exchanges (DEXs)',
        why: 'learn how trading works without intermediaries.',
        resources: [
          {
            type: 'article',
            title: 'How Uniswap Works',
            source: 'Uniswap Docs',
            readingTime: '12 min',
            url: 'https://docs.uniswap.org/concepts/introduction/what-is-uniswap',
          },
          {
            type: 'video',
            title: 'AMMs and Liquidity Pools Explained',
            source: 'Finematics',
            readingTime: '10 min',
            url: 'https://www.youtube.com/watch?v=cizLhxSKrAc',
          },
          {
            type: 'article',
            title: 'DEX Aggregators: 1inch, Paraswap',
            source: '1inch Blog',
            readingTime: '7 min',
            url: 'https://blog.1inch.io/what-is-a-dex-aggregator/',
          },
        ],
      },
      {
        title: 'Lending & Borrowing',
        why: 'explore protocols like aave and compound that enable permissionless lending.',
        resources: [
          {
            type: 'article',
            title: 'How Aave Works',
            source: 'Aave Docs',
            readingTime: '10 min',
            url: 'https://docs.aave.com/faq/',
          },
          {
            type: 'video',
            title: 'DeFi Lending Explained',
            source: 'Whiteboard Crypto',
            readingTime: '8 min',
            url: 'https://www.youtube.com/watch?v=aTp9er6S73M',
          },
          {
            type: 'article',
            title: 'Understanding Collateralization Ratios',
            source: 'DeFi Pulse',
            readingTime: '6 min',
            url: 'https://www.defipulse.com/blog/what-is-collateralization-ratio',
          },
        ],
      },
      {
        title: 'Stablecoins',
        why: 'understand the backbone of defi — price-stable assets on-chain.',
        resources: [
          {
            type: 'article',
            title: 'Types of Stablecoins Explained',
            source: 'Ethereum.org',
            readingTime: '10 min',
            url: 'https://ethereum.org/en/stablecoins/',
          },
          {
            type: 'video',
            title: 'How DAI Maintains Its Peg',
            source: 'Finematics',
            readingTime: '12 min',
            url: 'https://www.youtube.com/watch?v=pciVQVocTYc',
          },
          {
            type: 'article',
            title: 'USDC vs USDT vs DAI',
            source: 'CoinGecko',
            readingTime: '8 min',
            url: 'https://www.coingecko.com/learn/usdc-vs-usdt-vs-dai',
          },
        ],
      },
      {
        title: 'Yield Farming & Liquidity Mining',
        why: 'learn how users earn rewards by providing liquidity.',
        resources: [
          {
            type: 'article',
            title: 'Yield Farming Guide',
            source: 'Bankless',
            readingTime: '15 min',
            url: 'https://www.bankless.com/yield-farming-guide',
          },
          {
            type: 'video',
            title: 'Liquidity Mining Explained',
            source: 'Finematics',
            readingTime: '11 min',
            url: 'https://www.youtube.com/watch?v=ClnnLI1SClA',
          },
          {
            type: 'tool',
            title: 'Impermanent Loss Calculator',
            source: 'DeFi Lab',
            readingTime: '5 min',
            url: 'https://dailydefi.org/tools/impermanent-loss-calculator/',
          },
        ],
      },
      {
        title: 'Derivatives & Perpetuals',
        why: 'explore on-chain trading of futures, options, and synthetic assets.',
        resources: [
          {
            type: 'article',
            title: 'What are Perpetual Futures?',
            source: 'dYdX Academy',
            readingTime: '8 min',
            url: 'https://dydx.exchange/crypto-learning/what-are-perpetual-futures',
          },
          {
            type: 'video',
            title: 'DeFi Options Explained',
            source: 'The Defiant',
            readingTime: '14 min',
            url: 'https://www.youtube.com/watch?v=example',
          },
          {
            type: 'article',
            title: 'GMX and Decentralized Perps',
            source: 'GMX Docs',
            readingTime: '10 min',
            url: 'https://docs.gmx.io/',
          },
        ],
      },
      {
        title: 'DeFi Security & Risks',
        why: 'understand smart contract risks, oracle attacks, and how to stay safe.',
        resources: [
          {
            type: 'article',
            title: 'Common DeFi Attack Vectors',
            source: 'Rekt News',
            readingTime: '12 min',
            url: 'https://rekt.news/leaderboard/',
          },
          {
            type: 'video',
            title: 'Rug Pull Red Flags',
            source: 'Coin Bureau',
            readingTime: '18 min',
            url: 'https://www.youtube.com/watch?v=example',
          },
          {
            type: 'article',
            title: 'How to DYOR in DeFi',
            source: 'DeFi Safety',
            readingTime: '10 min',
            url: 'https://www.defisafety.com/',
          },
        ],
      },
      {
        title: 'Building in DeFi',
        why: 'resources for developers looking to build defi protocols.',
        resources: [
          {
            type: 'article',
            title: 'Solidity by Example: DeFi',
            source: 'Solidity by Example',
            readingTime: '20 min',
            url: 'https://solidity-by-example.org/',
          },
          {
            type: 'course',
            title: 'Build a DEX from Scratch',
            source: 'Patrick Collins',
            readingTime: '2+ hrs',
            url: 'https://www.youtube.com/watch?v=example',
          },
          {
            type: 'article',
            title: 'DeFi Developer Roadmap',
            source: 'Alchemy',
            readingTime: '15 min',
            url: 'https://www.alchemy.com/overviews/defi-developer',
          },
        ],
      },
    ],
  },
  {
    slug: 'security',
    name: 'Security & Audit',
    description: "billions got hacked. learn why — and how to stop it.",
    icon: 'Shield',
    color: 'bg-red-500/20 text-red-400',
    jobFilterTag: 'security',
    steps: [
      {
        title: 'Common Vulnerabilities',
        why: 'reentrancy, overflow, access control — the classics.',
        resources: [],
      },
      {
        title: 'Smart Contract Auditing',
        why: 'the audit process and what auditors look for.',
        resources: [],
      },
      {
        title: 'Testing & Fuzzing',
        why: 'foundry, echidna, and automated testing tools.',
        resources: [],
      },
      {
        title: 'Formal Verification',
        why: 'mathematical proofs for contract correctness.',
        resources: [],
      },
      {
        title: 'Bug Bounties',
        why: 'immunefi, code4rena, and earning as a security researcher.',
        resources: [],
      },
      {
        title: 'Incident Response',
        why: 'what happens when exploits occur.',
        resources: [],
      },
      {
        title: 'Security Career Path',
        why: 'becoming an auditor or security researcher.',
        resources: [],
      },
    ],
  },
  {
    slug: 'l2',
    name: 'Layer 2 & Scaling',
    description: "blockchains are slow. these solutions fix that.",
    icon: 'Layers',
    color: 'bg-cyan-500/20 text-cyan-400',
    jobFilterTag: 'layer2',
    steps: [
      {
        title: 'Why Scaling Matters',
        why: 'understand the blockchain trilemma and scalability challenges.',
        resources: [],
      },
      {
        title: 'Optimistic Rollups',
        why: 'how optimism and arbitrum work.',
        resources: [],
      },
      {
        title: 'ZK Rollups',
        why: 'zero-knowledge proofs for scaling: zksync, starknet, polygon zkevm.',
        resources: [],
      },
      {
        title: 'Sidechains & Validiums',
        why: 'alternative scaling approaches and their tradeoffs.',
        resources: [],
      },
      {
        title: 'Bridging & Interoperability',
        why: 'moving assets between l1 and l2s safely.',
        resources: [],
      },
      {
        title: 'Developing on L2',
        why: 'deploying contracts and building apps on layer 2.',
        resources: [],
      },
    ],
  },
  {
    slug: 'nft',
    name: 'NFT & Digital Assets',
    description: "digital ownership, creator economy, and yes — beyond the jpegs.",
    icon: 'Image',
    color: 'bg-purple-500/20 text-purple-400',
    jobFilterTag: 'nft',
    steps: [
      {
        title: 'What are NFTs?',
        why: 'understand non-fungible tokens and digital ownership.',
        resources: [],
      },
      {
        title: 'NFT Standards (ERC-721, ERC-1155)',
        why: 'learn the technical standards behind nfts.',
        resources: [],
      },
      {
        title: 'Marketplaces & Trading',
        why: 'explore opensea, blur, and how nft trading works.',
        resources: [],
      },
      {
        title: 'Creator Economy & Royalties',
        why: 'how artists and creators monetize through nfts.',
        resources: [],
      },
      {
        title: 'Gaming & Metaverse NFTs',
        why: 'in-game assets, virtual land, and interoperability.',
        resources: [],
      },
      {
        title: 'Building NFT Projects',
        why: 'smart contracts, metadata, and launching collections.',
        resources: [],
      },
    ],
  },
  {
    slug: 'dao',
    name: 'DAO & Governance',
    description: "organizations with no CEO. just code and votes.",
    icon: 'Building2',
    color: 'bg-amber-500/20 text-amber-400',
    jobFilterTag: 'dao',
    steps: [
      {
        title: 'What is a DAO?',
        why: 'decentralized autonomous organizations explained.',
        resources: [],
      },
      {
        title: 'Governance Tokens & Voting',
        why: 'how token holders participate in decisions.',
        resources: [],
      },
      {
        title: 'Treasury Management',
        why: 'how daos manage and allocate funds.',
        resources: [],
      },
      {
        title: 'DAO Tooling',
        why: 'snapshot, tally, safe, and the dao tech stack.',
        resources: [],
      },
      {
        title: 'Working in DAOs',
        why: 'contributor models, compensation, and dao careers.',
        resources: [],
      },
    ],
  },
]
