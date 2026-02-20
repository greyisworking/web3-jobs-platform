// Learn page data - domains, steps, and resources
// Can be migrated to database later

export type ResourceType = 'article' | 'video'

export interface Resource {
  type: ResourceType
  title: string
  source: string
  duration: string // e.g., "5 min read" or "12 min"
  url: string
}

export interface Step {
  number: string // "01", "02", etc.
  title: string
  description: string // Why learn this
  resources: Resource[]
}

export interface Domain {
  id: string
  name: string
  description: string
  icon: string // lucide-react icon name
  color: string // tailwind bg color for icon
  stepCount: number
  jobCount: number
  jobFilterTag: string // For linking to /jobs with filter
  steps: Step[]
}

// Order: 1) Basics, 2) DeFi, 3) Security, 4) L2, 5) NFT, 6) DAO
export const domains: Domain[] = [
  {
    id: 'basics',
    name: 'Blockchain Basics',
    description: "brand new? start here. we got you.",
    icon: 'Globe',
    color: 'bg-blue-500/20 text-blue-400',
    stepCount: 8,
    jobCount: 56,
    jobFilterTag: 'blockchain',
    steps: [
      {
        number: '01',
        title: 'What is Blockchain?',
        description: 'The fundamental concept of distributed ledgers.',
        resources: [],
      },
      {
        number: '02',
        title: 'Wallets & Keys',
        description: 'Public/private keys, seed phrases, and wallet types.',
        resources: [],
      },
      {
        number: '03',
        title: 'Transactions & Gas',
        description: 'How transactions work and what gas fees are.',
        resources: [],
      },
      {
        number: '04',
        title: 'Consensus Mechanisms',
        description: 'Proof of Work, Proof of Stake, and beyond.',
        resources: [],
      },
      {
        number: '05',
        title: 'Smart Contracts',
        description: 'Code that runs on the blockchain.',
        resources: [],
      },
      {
        number: '06',
        title: 'Ethereum vs Other Chains',
        description: 'Comparing different blockchain ecosystems.',
        resources: [],
      },
      {
        number: '07',
        title: 'Reading the Chain',
        description: 'Block explorers, Etherscan, and on-chain data.',
        resources: [],
      },
      {
        number: '08',
        title: 'Your First dApp Interaction',
        description: 'Connect wallet, sign transactions, use a protocol.',
        resources: [],
      },
    ],
  },
  {
    id: 'defi',
    name: 'DeFi',
    description: "money without banks. lending, swaps, yield. the good stuff.",
    icon: 'Landmark',
    color: 'bg-emerald-500/20 text-emerald-400',
    stepCount: 8,
    jobCount: 42,
    jobFilterTag: 'defi',
    steps: [
      {
        number: '01',
        title: 'What is DeFi?',
        description: 'Understand the basics of decentralized finance and why it matters.',
        resources: [
          {
            type: 'article',
            title: 'The Complete Guide to DeFi',
            source: 'Ethereum.org',
            duration: '15 min read',
            url: 'https://ethereum.org/en/defi/',
          },
          {
            type: 'video',
            title: 'DeFi Explained in 5 Minutes',
            source: 'Finematics',
            duration: '5 min',
            url: 'https://www.youtube.com/watch?v=k9HYC0EJU6E',
          },
          {
            type: 'article',
            title: 'DeFi vs Traditional Finance',
            source: 'Coinbase Learn',
            duration: '8 min read',
            url: 'https://www.coinbase.com/learn/crypto-basics/what-is-defi',
          },
        ],
      },
      {
        number: '02',
        title: 'Decentralized Exchanges (DEXs)',
        description: 'Learn how trading works without intermediaries.',
        resources: [
          {
            type: 'article',
            title: 'How Uniswap Works',
            source: 'Uniswap Docs',
            duration: '12 min read',
            url: 'https://docs.uniswap.org/concepts/introduction/what-is-uniswap',
          },
          {
            type: 'video',
            title: 'AMMs and Liquidity Pools Explained',
            source: 'Finematics',
            duration: '10 min',
            url: 'https://www.youtube.com/watch?v=cizLhxSKrAc',
          },
          {
            type: 'article',
            title: 'DEX Aggregators: 1inch, Paraswap',
            source: '1inch Blog',
            duration: '7 min read',
            url: 'https://blog.1inch.io/what-is-a-dex-aggregator/',
          },
        ],
      },
      {
        number: '03',
        title: 'Lending & Borrowing',
        description: 'Explore protocols like Aave and Compound that enable permissionless lending.',
        resources: [
          {
            type: 'article',
            title: 'How Aave Works',
            source: 'Aave Docs',
            duration: '10 min read',
            url: 'https://docs.aave.com/faq/',
          },
          {
            type: 'video',
            title: 'DeFi Lending Explained',
            source: 'Whiteboard Crypto',
            duration: '8 min',
            url: 'https://www.youtube.com/watch?v=aTp9er6S73M',
          },
          {
            type: 'article',
            title: 'Understanding Collateralization Ratios',
            source: 'DeFi Pulse',
            duration: '6 min read',
            url: 'https://www.defipulse.com/blog/what-is-collateralization-ratio',
          },
        ],
      },
      {
        number: '04',
        title: 'Stablecoins',
        description: 'Understand the backbone of DeFi — price-stable assets on-chain.',
        resources: [
          {
            type: 'article',
            title: 'Types of Stablecoins Explained',
            source: 'Ethereum.org',
            duration: '10 min read',
            url: 'https://ethereum.org/en/stablecoins/',
          },
          {
            type: 'video',
            title: 'How DAI Maintains Its Peg',
            source: 'Finematics',
            duration: '12 min',
            url: 'https://www.youtube.com/watch?v=pciVQVocTYc',
          },
          {
            type: 'article',
            title: 'USDC vs USDT vs DAI',
            source: 'CoinGecko',
            duration: '8 min read',
            url: 'https://www.coingecko.com/learn/usdc-vs-usdt-vs-dai',
          },
        ],
      },
      {
        number: '05',
        title: 'Yield Farming & Liquidity Mining',
        description: 'Learn how users earn rewards by providing liquidity.',
        resources: [
          {
            type: 'article',
            title: 'Yield Farming Guide',
            source: 'Bankless',
            duration: '15 min read',
            url: 'https://www.bankless.com/yield-farming-guide',
          },
          {
            type: 'video',
            title: 'Liquidity Mining Explained',
            source: 'Finematics',
            duration: '11 min',
            url: 'https://www.youtube.com/watch?v=ClnnLI1SClA',
          },
          {
            type: 'article',
            title: 'Impermanent Loss Calculator',
            source: 'DeFi Lab',
            duration: '5 min read',
            url: 'https://dailydefi.org/tools/impermanent-loss-calculator/',
          },
        ],
      },
      {
        number: '06',
        title: 'Derivatives & Perpetuals',
        description: 'Explore on-chain trading of futures, options, and synthetic assets.',
        resources: [
          {
            type: 'article',
            title: 'What are Perpetual Futures?',
            source: 'dYdX Academy',
            duration: '8 min read',
            url: 'https://dydx.exchange/crypto-learning/what-are-perpetual-futures',
          },
          {
            type: 'video',
            title: 'DeFi Options Explained',
            source: 'The Defiant',
            duration: '14 min',
            url: 'https://www.youtube.com/watch?v=example',
          },
          {
            type: 'article',
            title: 'GMX and Decentralized Perps',
            source: 'GMX Docs',
            duration: '10 min read',
            url: 'https://docs.gmx.io/',
          },
        ],
      },
      {
        number: '07',
        title: 'DeFi Security & Risks',
        description: 'Understand smart contract risks, oracle attacks, and how to stay safe.',
        resources: [
          {
            type: 'article',
            title: 'Common DeFi Attack Vectors',
            source: 'Rekt News',
            duration: '12 min read',
            url: 'https://rekt.news/leaderboard/',
          },
          {
            type: 'video',
            title: 'Rug Pull Red Flags',
            source: 'Coin Bureau',
            duration: '18 min',
            url: 'https://www.youtube.com/watch?v=example',
          },
          {
            type: 'article',
            title: 'How to DYOR in DeFi',
            source: 'DeFi Safety',
            duration: '10 min read',
            url: 'https://www.defisafety.com/',
          },
        ],
      },
      {
        number: '08',
        title: 'Building in DeFi',
        description: 'Resources for developers looking to build DeFi protocols.',
        resources: [
          {
            type: 'article',
            title: 'Solidity by Example: DeFi',
            source: 'Solidity by Example',
            duration: '20 min read',
            url: 'https://solidity-by-example.org/',
          },
          {
            type: 'video',
            title: 'Build a DEX from Scratch',
            source: 'Patrick Collins',
            duration: '2 hr',
            url: 'https://www.youtube.com/watch?v=example',
          },
          {
            type: 'article',
            title: 'DeFi Developer Roadmap',
            source: 'Alchemy',
            duration: '15 min read',
            url: 'https://www.alchemy.com/overviews/defi-developer',
          },
        ],
      },
    ],
  },
  {
    id: 'security',
    name: 'Security & Audit',
    description: "billions got hacked. learn why — and how to stop it.",
    icon: 'Shield',
    color: 'bg-red-500/20 text-red-400',
    stepCount: 7,
    jobCount: 24,
    jobFilterTag: 'security',
    steps: [
      {
        number: '01',
        title: 'Common Vulnerabilities',
        description: 'Reentrancy, overflow, access control — the classics.',
        resources: [],
      },
      {
        number: '02',
        title: 'Smart Contract Auditing',
        description: 'The audit process and what auditors look for.',
        resources: [],
      },
      {
        number: '03',
        title: 'Testing & Fuzzing',
        description: 'Foundry, Echidna, and automated testing tools.',
        resources: [],
      },
      {
        number: '04',
        title: 'Formal Verification',
        description: 'Mathematical proofs for contract correctness.',
        resources: [],
      },
      {
        number: '05',
        title: 'Bug Bounties',
        description: 'Immunefi, Code4rena, and earning as a security researcher.',
        resources: [],
      },
      {
        number: '06',
        title: 'Incident Response',
        description: 'What happens when exploits occur.',
        resources: [],
      },
      {
        number: '07',
        title: 'Security Career Path',
        description: 'Becoming an auditor or security researcher.',
        resources: [],
      },
    ],
  },
  {
    id: 'l2',
    name: 'Layer 2 & Scaling',
    description: "blockchains are slow. these solutions fix that.",
    icon: 'Layers',
    color: 'bg-cyan-500/20 text-cyan-400',
    stepCount: 6,
    jobCount: 35,
    jobFilterTag: 'layer2',
    steps: [
      {
        number: '01',
        title: 'Why Scaling Matters',
        description: 'Understand the blockchain trilemma and scalability challenges.',
        resources: [],
      },
      {
        number: '02',
        title: 'Optimistic Rollups',
        description: 'How Optimism and Arbitrum work.',
        resources: [],
      },
      {
        number: '03',
        title: 'ZK Rollups',
        description: 'Zero-knowledge proofs for scaling: zkSync, StarkNet, Polygon zkEVM.',
        resources: [],
      },
      {
        number: '04',
        title: 'Sidechains & Validiums',
        description: 'Alternative scaling approaches and their tradeoffs.',
        resources: [],
      },
      {
        number: '05',
        title: 'Bridging & Interoperability',
        description: 'Moving assets between L1 and L2s safely.',
        resources: [],
      },
      {
        number: '06',
        title: 'Developing on L2',
        description: 'Deploying contracts and building apps on Layer 2.',
        resources: [],
      },
    ],
  },
  {
    id: 'nft',
    name: 'NFT & Digital Assets',
    description: "digital ownership, creator economy, and yes — beyond the jpegs.",
    icon: 'Image',
    color: 'bg-purple-500/20 text-purple-400',
    stepCount: 6,
    jobCount: 28,
    jobFilterTag: 'nft',
    steps: [
      {
        number: '01',
        title: 'What are NFTs?',
        description: 'Understand non-fungible tokens and digital ownership.',
        resources: [],
      },
      {
        number: '02',
        title: 'NFT Standards (ERC-721, ERC-1155)',
        description: 'Learn the technical standards behind NFTs.',
        resources: [],
      },
      {
        number: '03',
        title: 'Marketplaces & Trading',
        description: 'Explore OpenSea, Blur, and how NFT trading works.',
        resources: [],
      },
      {
        number: '04',
        title: 'Creator Economy & Royalties',
        description: 'How artists and creators monetize through NFTs.',
        resources: [],
      },
      {
        number: '05',
        title: 'Gaming & Metaverse NFTs',
        description: 'In-game assets, virtual land, and interoperability.',
        resources: [],
      },
      {
        number: '06',
        title: 'Building NFT Projects',
        description: 'Smart contracts, metadata, and launching collections.',
        resources: [],
      },
    ],
  },
  {
    id: 'dao',
    name: 'DAO & Governance',
    description: "organizations with no CEO. just code and votes.",
    icon: 'Building2',
    color: 'bg-amber-500/20 text-amber-400',
    stepCount: 5,
    jobCount: 18,
    jobFilterTag: 'dao',
    steps: [
      {
        number: '01',
        title: 'What is a DAO?',
        description: 'Decentralized Autonomous Organizations explained.',
        resources: [],
      },
      {
        number: '02',
        title: 'Governance Tokens & Voting',
        description: 'How token holders participate in decisions.',
        resources: [],
      },
      {
        number: '03',
        title: 'Treasury Management',
        description: 'How DAOs manage and allocate funds.',
        resources: [],
      },
      {
        number: '04',
        title: 'DAO Tooling',
        description: 'Snapshot, Tally, Safe, and the DAO tech stack.',
        resources: [],
      },
      {
        number: '05',
        title: 'Working in DAOs',
        description: 'Contributor models, compensation, and DAO careers.',
        resources: [],
      },
    ],
  },
]
