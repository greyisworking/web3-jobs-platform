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
        title: 'What is a Blockchain?',
        why: 'everything starts here. understand the building block.',
        resources: [
          {
            type: 'article',
            title: 'What is Ethereum?',
            source: 'ethereum.org',
            readingTime: '8 min',
            url: 'https://ethereum.org/what-is-ethereum/',
          },
          {
            type: 'video',
            title: 'How does a blockchain work',
            source: '3Blue1Brown',
            readingTime: '26 min',
            url: 'https://www.youtube.com/watch?v=bBC-nXj3Ng4',
          },
          {
            type: 'tool',
            title: 'Blockchain Demo (interactive)',
            source: 'Anders Brownworth',
            readingTime: '15 min',
            url: 'https://andersbrownworth.com/blockchain/',
          },
        ],
      },
      {
        title: 'Bitcoin — Where It All Started',
        why: 'the OG. the one that kicked off this whole thing.',
        resources: [
          {
            type: 'article',
            title: 'Bitcoin Whitepaper',
            source: 'Satoshi Nakamoto',
            readingTime: '15 min',
            url: 'https://bitcoin.org/bitcoin.pdf',
          },
          {
            type: 'article',
            title: 'What Is Bitcoin?',
            source: 'Investopedia',
            readingTime: '10 min',
            url: 'https://www.investopedia.com/terms/b/bitcoin.asp',
          },
        ],
      },
      {
        title: 'Ethereum & Smart Contracts',
        why: 'bitcoin stores value. ethereum runs code. big difference.',
        resources: [
          {
            type: 'article',
            title: 'Introduction to Ethereum',
            source: 'ethereum.org',
            readingTime: '10 min',
            url: 'https://ethereum.org/learn/',
          },
          {
            type: 'video',
            title: 'Smart Contracts Simply Explained',
            source: 'Finematics',
            readingTime: '10 min',
            url: 'https://www.youtube.com/watch?v=ZE2HxTmxfrI',
          },
          {
            type: 'article',
            title: 'Introduction to Smart Contracts',
            source: 'ethereum.org',
            readingTime: '7 min',
            url: 'https://ethereum.org/developers/docs/smart-contracts/',
          },
        ],
      },
      {
        title: 'Wallets, Keys & Self-Custody',
        why: 'not your keys, not your crypto. learn why.',
        resources: [
          {
            type: 'article',
            title: 'Ethereum Wallets',
            source: 'ethereum.org',
            readingTime: '8 min',
            url: 'https://ethereum.org/wallets/',
          },
          {
            type: 'video',
            title: 'What is a Crypto Wallet?',
            source: 'Whiteboard Crypto',
            readingTime: '8 min',
            url: 'https://www.youtube.com/watch?v=SQyg9pyJ1Ac',
          },
          {
            type: 'article',
            title: 'MetaMask Learn',
            source: 'MetaMask',
            readingTime: '5 min',
            url: 'https://learn.metamask.io/',
          },
        ],
      },
      {
        title: 'Consensus: Proof of Work vs Proof of Stake',
        why: 'how thousands of computers agree on one truth.',
        resources: [
          {
            type: 'article',
            title: 'Consensus Mechanisms',
            source: 'ethereum.org',
            readingTime: '12 min',
            url: 'https://ethereum.org/developers/docs/consensus-mechanisms/',
          },
          {
            type: 'video',
            title: 'Proof of Work vs Proof of Stake',
            source: 'Finematics',
            readingTime: '11 min',
            url: 'https://www.youtube.com/watch?v=M3EFi_POhps',
          },
        ],
      },
      {
        title: 'Gas Fees & Transactions',
        why: 'why did that swap cost $47? let\'s find out.',
        resources: [
          {
            type: 'article',
            title: 'Gas and Fees',
            source: 'ethereum.org',
            readingTime: '8 min',
            url: 'https://ethereum.org/developers/docs/gas/',
          },
          {
            type: 'video',
            title: 'What Are Gas Fees?',
            source: 'Whiteboard Crypto',
            readingTime: '9 min',
            url: 'https://www.youtube.com/watch?v=3ehaSqwUZ0s',
          },
          {
            type: 'tool',
            title: 'Etherscan Gas Tracker',
            source: 'Etherscan',
            readingTime: 'live',
            url: 'https://etherscan.io/gastracker',
          },
        ],
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
        why: 'finance without middlemen. here\'s how.',
        resources: [
          {
            type: 'article',
            title: 'What is DeFi?',
            source: 'ethereum.org',
            readingTime: '10 min',
            url: 'https://ethereum.org/defi/',
          },
          {
            type: 'video',
            title: 'What is DeFi?',
            source: 'Finematics',
            readingTime: '9 min',
            url: 'https://www.youtube.com/watch?v=k9HYC0EJU6E',
          },
          {
            type: 'article',
            title: 'DeFi Beginner\'s Guide',
            source: 'Ledger Academy',
            readingTime: '12 min',
            url: 'https://www.ledger.com/academy/defi-beginners-guide',
          },
        ],
      },
      {
        title: 'Stablecoins',
        why: 'crypto that doesn\'t move. and why that\'s powerful.',
        resources: [
          {
            type: 'video',
            title: 'What are Stablecoins?',
            source: 'Finematics',
            readingTime: '10 min',
            url: 'https://www.youtube.com/watch?v=pGzfexGmuVw',
          },
          {
            type: 'article',
            title: 'Stablecoins',
            source: 'ethereum.org',
            readingTime: '7 min',
            url: 'https://ethereum.org/stablecoins/',
          },
        ],
      },
      {
        title: 'DEXs & AMMs',
        why: 'swap tokens with no signup. uniswap changed everything.',
        resources: [
          {
            type: 'video',
            title: 'What is Uniswap?',
            source: 'Finematics',
            readingTime: '10 min',
            url: 'https://www.youtube.com/watch?v=LpjMgS4OVzs',
          },
          {
            type: 'video',
            title: 'What are Liquidity Pools?',
            source: 'Finematics',
            readingTime: '8 min',
            url: 'https://www.youtube.com/watch?v=cizLhxSKrAc',
          },
          {
            type: 'article',
            title: 'What is a DEX?',
            source: 'Coinbase Learn',
            readingTime: '6 min',
            url: 'https://www.coinbase.com/learn/crypto-basics/what-is-a-dex',
          },
        ],
      },
      {
        title: 'Lending & Borrowing',
        why: 'deposit crypto, earn interest. or borrow against it.',
        resources: [
          {
            type: 'video',
            title: 'Aave & Flash Loans Explained',
            source: 'Finematics',
            readingTime: '12 min',
            url: 'https://www.youtube.com/watch?v=mCJUhnXQ76s',
          },
          {
            type: 'article',
            title: 'Lending and Borrowing in DeFi',
            source: 'Finematics',
            readingTime: '8 min',
            url: 'https://finematics.com/lending-and-borrowing-in-defi-explained/',
          },
          {
            type: 'article',
            title: 'Aave Documentation',
            source: 'Aave',
            readingTime: '10 min',
            url: 'https://docs.aave.com/',
          },
        ],
      },
      {
        title: 'Yield Farming & Liquidity Mining',
        why: 'put your crypto to work. earn rewards for providing liquidity.',
        resources: [
          {
            type: 'video',
            title: 'Yield Farming Explained',
            source: 'Finematics',
            readingTime: '8 min',
            url: 'https://www.youtube.com/watch?v=ClnnLI1SClA',
          },
          {
            type: 'article',
            title: 'What is Yield Farming?',
            source: 'CoinGecko',
            readingTime: '10 min',
            url: 'https://www.coingecko.com/learn/what-is-yield-farming',
          },
        ],
      },
      {
        title: 'DeFi Risks',
        why: 'impermanent loss, rug pulls, exploits. know before you ape.',
        resources: [
          {
            type: 'video',
            title: 'Impermanent Loss Explained',
            source: 'Finematics',
            readingTime: '6 min',
            url: 'https://www.youtube.com/watch?v=8XJ1MSTEuU0',
          },
          {
            type: 'article',
            title: 'Rekt Leaderboard',
            source: 'rekt.news',
            readingTime: '10 min',
            url: 'https://rekt.news/leaderboard/',
          },
          {
            type: 'tool',
            title: 'DeFi Safety — Protocol Reviews',
            source: 'DeFi Safety',
            readingTime: 'live',
            url: 'https://defisafety.com/',
          },
        ],
      },
      {
        title: 'The Full DeFi Roadmap',
        why: 'ready to go deeper? here\'s the complete path.',
        resources: [
          {
            type: 'article',
            title: 'Guide to Decentralized Finance',
            source: 'Finematics',
            readingTime: '30 min',
            url: 'https://finematics.com/guide-to-decentralized-finance/',
          },
          {
            type: 'book',
            title: 'How to DeFi (free ebook)',
            source: 'CoinGecko',
            readingTime: '2 hrs',
            url: 'https://landing.coingecko.com/how-to-defi/',
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
        title: 'Why Security Matters',
        why: '$3B+ lost to hacks. here\'s the scoreboard.',
        resources: [
          {
            type: 'article',
            title: 'Rekt Leaderboard',
            source: 'rekt.news',
            readingTime: '10 min',
            url: 'https://rekt.news/leaderboard/',
          },
          {
            type: 'article',
            title: 'Web3 Security Overview',
            source: 'Cyfrin',
            readingTime: '8 min',
            url: 'https://www.cyfrin.io/blog',
          },
        ],
      },
      {
        title: 'Common Vulnerabilities',
        why: 'reentrancy, overflow, front-running. the bugs that cost billions.',
        resources: [
          {
            type: 'article',
            title: 'SWC Registry — Weakness Classification',
            source: 'SmartContractSecurity',
            readingTime: '15 min',
            url: 'https://swcregistry.io/',
          },
          {
            type: 'article',
            title: 'Smart Contract Security Best Practices',
            source: 'Consensys',
            readingTime: '20 min',
            url: 'https://consensys.github.io/smart-contract-best-practices/',
          },
        ],
      },
      {
        title: 'How Audits Work',
        why: 'what auditors actually do and why it matters.',
        resources: [
          {
            type: 'article',
            title: 'Getting a Smart Contract Audit',
            source: 'RareSkills',
            readingTime: '15 min',
            url: 'https://rareskills.io/post/smart-contract-audit',
          },
          {
            type: 'article',
            title: 'Beginner\'s Guide to a Security Audit',
            source: 'Pyth Network',
            readingTime: '10 min',
            url: 'https://www.pyth.network/blog/beginners-guide-to-a-smart-contract-security-audit',
          },
          {
            type: 'article',
            title: 'What is a Smart Contract Audit?',
            source: 'CoinTelegraph',
            readingTime: '10 min',
            url: 'https://cointelegraph.com/learn/articles/what-is-a-smart-contract-security-audit-a-beginners-guide',
          },
        ],
      },
      {
        title: 'Security Tools',
        why: 'the tools auditors use. from OpenZeppelin to Slither.',
        resources: [
          {
            type: 'article',
            title: 'OpenZeppelin Contracts',
            source: 'OpenZeppelin',
            readingTime: '10 min',
            url: 'https://docs.openzeppelin.com/contracts/',
          },
          {
            type: 'tool',
            title: 'Slither — Static Analysis',
            source: 'Trail of Bits',
            readingTime: 'live',
            url: 'https://github.com/crytic/slither',
          },
          {
            type: 'article',
            title: 'Smart Contract Security',
            source: 'ethereum.org',
            readingTime: '10 min',
            url: 'https://ethereum.org/developers/docs/smart-contracts/security/',
          },
        ],
      },
      {
        title: 'Learn by Hacking — CTFs',
        why: 'break stuff (legally). the best way to learn security.',
        resources: [
          {
            type: 'tool',
            title: 'Ethernaut — Hack Smart Contracts',
            source: 'OpenZeppelin',
            readingTime: '2+ hrs',
            url: 'https://ethernaut.openzeppelin.com/',
          },
          {
            type: 'tool',
            title: 'Damn Vulnerable DeFi',
            source: 'tinchoabbate',
            readingTime: '3+ hrs',
            url: 'https://www.damnvulnerabledefi.xyz/',
          },
          {
            type: 'tool',
            title: 'Capture the Ether',
            source: 'CTF',
            readingTime: '2+ hrs',
            url: 'https://capturetheether.com/',
          },
        ],
      },
      {
        title: 'Auditor Roadmap',
        why: 'want to make this a career? here\'s the full path.',
        resources: [
          {
            type: 'course',
            title: 'Smart Contract Security Course',
            source: 'Cyfrin Updraft',
            readingTime: '25+ hrs',
            url: 'https://updraft.cyfrin.io/courses/security',
          },
          {
            type: 'article',
            title: 'Auditor Learning Roadmap',
            source: 'SlowMist',
            readingTime: '20 min',
            url: 'https://github.com/slowmist/SlowMist-Learning-Roadmap-for-Becoming-a-Smart-Contract-Auditor',
          },
          {
            type: 'article',
            title: 'How to Become a Smart Contract Auditor',
            source: 'BlockSec',
            readingTime: '12 min',
            url: 'https://blocksec.com/blog/how-to-become-a-smart-contract-auditor-your-guide-to-mastering-blockchain-security',
          },
        ],
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
        title: 'The Scalability Problem',
        why: '15 transactions per second won\'t cut it. here\'s why.',
        resources: [
          {
            type: 'article',
            title: 'Scaling Ethereum',
            source: 'ethereum.org',
            readingTime: '10 min',
            url: 'https://ethereum.org/developers/docs/scaling/',
          },
          {
            type: 'video',
            title: 'Blockchain Scalability Trilemma',
            source: 'Finematics',
            readingTime: '9 min',
            url: 'https://www.youtube.com/watch?v=jvV3X_xizro',
          },
        ],
      },
      {
        title: 'What are Layer 2s?',
        why: 'same security, 100x cheaper. the magic of rollups.',
        resources: [
          {
            type: 'article',
            title: 'Layer 2 Rollups',
            source: 'ethereum.org',
            readingTime: '12 min',
            url: 'https://ethereum.org/developers/docs/scaling/layer-2-rollups/',
          },
          {
            type: 'video',
            title: 'Layer 2 Scaling Explained',
            source: 'Finematics',
            readingTime: '14 min',
            url: 'https://www.youtube.com/watch?v=BgCgauWVTs0',
          },
          {
            type: 'article',
            title: 'Layer-2 Scaling: zk-Rollups and Optimistic Rollups',
            source: 'Gemini Cryptopedia',
            readingTime: '12 min',
            url: 'https://www.gemini.com/cryptopedia/layer-2-scaling-zk-rollup-optimistic-rollup-ethereum',
          },
        ],
      },
      {
        title: 'Optimistic Rollups',
        why: 'assume it\'s valid, challenge if not. arbitrum & optimism live here.',
        resources: [
          {
            type: 'article',
            title: 'Optimistic Rollups',
            source: 'ethereum.org',
            readingTime: '10 min',
            url: 'https://ethereum.org/developers/docs/scaling/optimistic-rollups/',
          },
          {
            type: 'article',
            title: 'Arbitrum Documentation',
            source: 'Arbitrum',
            readingTime: '8 min',
            url: 'https://docs.arbitrum.io/intro/',
          },
          {
            type: 'article',
            title: 'Optimism Documentation',
            source: 'Optimism',
            readingTime: '8 min',
            url: 'https://docs.optimism.io/',
          },
        ],
      },
      {
        title: 'ZK Rollups',
        why: 'prove it\'s valid with math. zero knowledge, full security.',
        resources: [
          {
            type: 'video',
            title: 'ZK Rollups Explained',
            source: 'Finematics',
            readingTime: '13 min',
            url: 'https://www.youtube.com/watch?v=7pWxCklcNsU',
          },
          {
            type: 'article',
            title: 'Zero-Knowledge Rollups',
            source: 'ethereum.org',
            readingTime: '12 min',
            url: 'https://ethereum.org/developers/docs/scaling/zk-rollups/',
          },
          {
            type: 'article',
            title: 'ZK-Rollups Explained',
            source: 'Hacken',
            readingTime: '15 min',
            url: 'https://hacken.io/discover/zk-rollups-explained/',
          },
        ],
      },
      {
        title: 'Compare L2s — Live Data',
        why: 'which L2 is winning? check the numbers.',
        resources: [
          {
            type: 'tool',
            title: 'L2Beat — L2 Comparison Dashboard',
            source: 'L2Beat',
            readingTime: 'live',
            url: 'https://l2beat.com/',
          },
          {
            type: 'tool',
            title: 'L2Fees — Transaction Cost Comparison',
            source: 'L2Fees',
            readingTime: 'live',
            url: 'https://l2fees.info/',
          },
          {
            type: 'article',
            title: 'Optimistic vs ZK Rollups Comparison',
            source: 'Changelly',
            readingTime: '12 min',
            url: 'https://changelly.com/blog/zk-rollup-vs-optimistic-rollup/',
          },
        ],
      },
      {
        title: 'Bridging Between Chains',
        why: 'moving assets from L1 to L2. bridges explained.',
        resources: [
          {
            type: 'article',
            title: 'Blockchain Bridges',
            source: 'ethereum.org',
            readingTime: '10 min',
            url: 'https://ethereum.org/developers/docs/bridges/',
          },
          {
            type: 'video',
            title: 'Cross-Chain Bridges Explained',
            source: 'Whiteboard Crypto',
            readingTime: '10 min',
            url: 'https://www.youtube.com/watch?v=nT26cIz8HjI',
          },
        ],
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
        title: 'What is an NFT?',
        why: 'unique tokens on a blockchain. not just jpegs.',
        resources: [
          {
            type: 'article',
            title: 'Non-fungible Tokens (NFTs)',
            source: 'ethereum.org',
            readingTime: '8 min',
            url: 'https://ethereum.org/nft/',
          },
          {
            type: 'video',
            title: 'NFTs Explained',
            source: 'Whiteboard Crypto',
            readingTime: '10 min',
            url: 'https://www.youtube.com/watch?v=4dkl5O9LOKg',
          },
          {
            type: 'article',
            title: 'NFT 101: Learn Center',
            source: 'OpenSea',
            readingTime: '10 min',
            url: 'https://opensea.io/learn',
          },
        ],
      },
      {
        title: 'Token Standards — ERC-721 & ERC-1155',
        why: 'the code behind digital ownership.',
        resources: [
          {
            type: 'article',
            title: 'ERC-721 Token Standard',
            source: 'ethereum.org',
            readingTime: '8 min',
            url: 'https://ethereum.org/developers/docs/standards/tokens/erc-721/',
          },
          {
            type: 'article',
            title: 'ERC-721 vs ERC-1155',
            source: 'Alchemy',
            readingTime: '8 min',
            url: 'https://docs.alchemy.com/docs/erc-721-vs-erc-1155',
          },
        ],
      },
      {
        title: 'NFT Marketplaces',
        why: 'where to buy, sell, and trade. opensea, blur, magic eden.',
        resources: [
          {
            type: 'article',
            title: 'How to Buy NFTs',
            source: 'OpenSea',
            readingTime: '10 min',
            url: 'https://opensea.io/learn/nft/how-to-buy-nft',
          },
          {
            type: 'article',
            title: 'Top NFT Marketplaces 2025',
            source: 'Coin Bureau',
            readingTime: '15 min',
            url: 'https://coinbureau.com/analysis/top-nft-marketplaces',
          },
        ],
      },
      {
        title: 'Beyond Art — Gaming, Identity, Utility',
        why: 'tickets, credentials, game items. NFTs do way more than art.',
        resources: [
          {
            type: 'article',
            title: 'Ethereum and NFTs — Use Cases',
            source: 'ethereum.org',
            readingTime: '8 min',
            url: 'https://ethereum.org/nft/#ethereum-and-nfts',
          },
          {
            type: 'article',
            title: 'Soulbound Tokens',
            source: 'Vitalik Buterin',
            readingTime: '20 min',
            url: 'https://vitalik.eth.limo/general/2022/01/26/soulbound.html',
          },
        ],
      },
      {
        title: 'Creator Economy & Royalties',
        why: 'artists getting paid forever. how on-chain royalties work.',
        resources: [
          {
            type: 'article',
            title: 'Understanding NFT Royalties',
            source: 'OpenSea',
            readingTime: '8 min',
            url: 'https://opensea.io/blog/articles/understanding-nft-royalties',
          },
        ],
      },
      {
        title: 'Real World Assets (RWA)',
        why: 'real estate, stocks, bonds — tokenized on chain.',
        resources: [
          {
            type: 'article',
            title: 'What are Real World Assets?',
            source: 'CoinGecko',
            readingTime: '10 min',
            url: 'https://www.coingecko.com/learn/what-are-real-world-assets-rwa-crypto',
          },
          {
            type: 'article',
            title: 'Tokenization of Real World Assets',
            source: 'Chainlink',
            readingTime: '12 min',
            url: 'https://chain.link/education/real-world-assets-rwas',
          },
        ],
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
        why: 'an org run by code and votes, not a CEO.',
        resources: [
          {
            type: 'article',
            title: 'Decentralized Autonomous Organizations',
            source: 'ethereum.org',
            readingTime: '8 min',
            url: 'https://ethereum.org/dao/',
          },
          {
            type: 'video',
            title: 'What is a DAO?',
            source: 'Whiteboard Crypto',
            readingTime: '9 min',
            url: 'https://www.youtube.com/watch?v=KHm0uUPqmVE',
          },
          {
            type: 'article',
            title: 'DAO Governance Models',
            source: 'CoinTelegraph',
            readingTime: '12 min',
            url: 'https://cointelegraph.com/learn/articles/dao-governance-models',
          },
        ],
      },
      {
        title: 'How DAOs Work',
        why: 'proposals, voting, execution. the governance loop.',
        resources: [
          {
            type: 'article',
            title: 'What is a DAO?',
            source: 'Coinbase Learn',
            readingTime: '8 min',
            url: 'https://www.coinbase.com/learn/crypto-basics/what-is-a-dao',
          },
          {
            type: 'video',
            title: 'How DAOs Actually Work',
            source: 'Finematics',
            readingTime: '11 min',
            url: 'https://www.youtube.com/watch?v=4ec-2wi5sFg',
          },
        ],
      },
      {
        title: 'Famous DAOs — Case Studies',
        why: 'the DAO hack, MakerDAO, Uniswap. learn from the real ones.',
        resources: [
          {
            type: 'article',
            title: 'The DAO Hack Explained',
            source: 'Gemini Cryptopedia',
            readingTime: '10 min',
            url: 'https://www.gemini.com/cryptopedia/the-dao-hack-makerdao',
          },
          {
            type: 'article',
            title: 'MakerDAO Governance',
            source: 'MakerDAO',
            readingTime: '10 min',
            url: 'https://makerdao.com/en/governance',
          },
          {
            type: 'article',
            title: 'Uniswap Governance',
            source: 'Uniswap',
            readingTime: '8 min',
            url: 'https://docs.uniswap.org/concepts/governance/overview',
          },
        ],
      },
      {
        title: 'Governance Models',
        why: 'token voting, quadratic voting, delegation. trade-offs everywhere.',
        resources: [
          {
            type: 'article',
            title: 'DAO Governance Attacks and Defenses',
            source: 'a16z Crypto',
            readingTime: '15 min',
            url: 'https://a16zcrypto.com/posts/article/dao-governance-attacks-and-defenses/',
          },
          {
            type: 'article',
            title: 'Quadratic Voting Explained',
            source: 'RadicalxChange',
            readingTime: '10 min',
            url: 'https://www.radicalxchange.org/concepts/plural-voting/',
          },
        ],
      },
      {
        title: 'DAO Tools',
        why: 'snapshot for voting, tally for on-chain, aragon to build.',
        resources: [
          {
            type: 'tool',
            title: 'Snapshot — Off-chain Voting',
            source: 'Snapshot',
            readingTime: 'live',
            url: 'https://snapshot.org/',
          },
          {
            type: 'tool',
            title: 'Tally — On-chain Governance',
            source: 'Tally',
            readingTime: 'live',
            url: 'https://www.tally.xyz/',
          },
          {
            type: 'tool',
            title: 'DeepDAO — DAO Analytics',
            source: 'DeepDAO',
            readingTime: 'live',
            url: 'https://deepdao.io/',
          },
          {
            type: 'article',
            title: 'How to Create a DAO (No-Code)',
            source: 'Bitbond',
            readingTime: '15 min',
            url: 'https://www.bitbond.com/resources/how-to-create-a-dao/',
          },
        ],
      },
      {
        title: 'DAO Challenges & Future',
        why: 'voter apathy, whale dominance, legal gray zones. the hard stuff.',
        resources: [
          {
            type: 'article',
            title: 'Moving Beyond Coin Voting Governance',
            source: 'Vitalik Buterin',
            readingTime: '20 min',
            url: 'https://vitalik.eth.limo/general/2021/08/16/voting3.html',
          },
          {
            type: 'article',
            title: 'DAO Legal Landscape',
            source: 'a16z Crypto',
            readingTime: '12 min',
            url: 'https://a16zcrypto.com/posts/article/dao-legal-landscape/',
          },
        ],
      },
    ],
  },
]
