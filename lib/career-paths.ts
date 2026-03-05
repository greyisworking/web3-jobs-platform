// Career path quiz: 10 core roles, Q1xQ2 mapping, level-based roadmaps

export interface CareerPath {
  slug: string
  title: string
  description: string
  titlePatterns: string[]   // for DB job matching
  jobFilter: string         // /jobs?q= param
  roadmap: Record<'beginner' | 'mid' | 'senior', Phase[]>
}

export interface Phase {
  label: string
  items: RoadmapItem[]
}

export interface RoadmapItem {
  title: string
  description: string
  url?: string
  source?: string
}

// ── 10 Core Roles ──

export const careerPathsMap: Record<string, CareerPath> = {
  'smart-contract-dev': {
    slug: 'smart-contract-dev',
    title: 'Smart Contract Developer',
    description: 'Write and deploy smart contracts that handle real money on-chain.',
    titlePatterns: ['solidity', 'smart contract', 'protocol engineer', 'blockchain engineer', 'blockchain developer', 'web3 engineer'],
    jobFilter: 'solidity smart contract',
    roadmap: {
      beginner: [
        { label: 'Foundation', items: [
          { title: 'Learn Solidity basics', description: 'Variables, functions, mappings, modifiers', url: 'https://cryptozombies.io/', source: 'CryptoZombies' },
          { title: 'Understand Ethereum', description: 'EVM, gas, transactions, accounts', url: 'https://ethereum.org/developers/docs/', source: 'ethereum.org' },
          { title: 'Set up Hardhat/Foundry', description: 'Local dev environment, compile & test', url: 'https://book.getfoundry.sh/', source: 'Foundry Book' },
        ]},
        { label: 'Build', items: [
          { title: 'Build an ERC-20 token', description: 'Token standard, OpenZeppelin, deploy to testnet' },
          { title: 'Build an NFT contract', description: 'ERC-721, metadata, minting logic' },
          { title: 'Write unit tests', description: 'Forge tests, coverage, edge cases' },
        ]},
        { label: 'Specialize', items: [
          { title: 'Study DeFi protocols', description: 'Read Uniswap V2/V3 code', url: 'https://ethereum.org/developers/tutorials/uniswap-v2-annotated-code/', source: 'ethereum.org' },
          { title: 'Learn security basics', description: 'Reentrancy, overflow, access control', url: 'https://swcregistry.io/', source: 'SWC Registry' },
          { title: 'Contribute to open source', description: 'Pick a protocol, fix issues, get noticed' },
        ]},
      ],
      mid: [
        { label: 'Accelerate', items: [
          { title: 'Master Foundry toolchain', description: 'Fuzz testing, fork testing, scripting', url: 'https://book.getfoundry.sh/', source: 'Foundry Book' },
          { title: 'Deep dive into EVM', description: 'Opcodes, memory layout, gas optimization' },
          { title: 'Learn proxy patterns', description: 'UUPS, Transparent, Diamond proxy', url: 'https://docs.openzeppelin.com/contracts/', source: 'OpenZeppelin' },
        ]},
        { label: 'Depth', items: [
          { title: 'Study MEV & ordering', description: 'Flashbots, sandwich attacks, PBS' },
          { title: 'Cross-chain development', description: 'Bridges, messaging protocols, LayerZero' },
          { title: 'Formal verification basics', description: 'Certora, symbolic execution' },
        ]},
        { label: 'Differentiate', items: [
          { title: 'Build a DeFi protocol', description: 'AMM, lending, or vault from scratch' },
          { title: 'Win audit contests', description: 'Code4rena, Sherlock competitions', url: 'https://code4rena.com/', source: 'Code4rena' },
          { title: 'Publish technical writing', description: 'Blog posts, audit reports, research' },
        ]},
      ],
      senior: [
        { label: 'Transition', items: [
          { title: 'Map protocol architectures', description: 'Study top 10 DeFi protocols end-to-end' },
          { title: 'Learn governance systems', description: 'On-chain voting, delegation, timelock' },
          { title: 'Understand tokenomics', description: 'Emission schedules, incentive design' },
        ]},
        { label: 'Lead', items: [
          { title: 'Design protocol architecture', description: 'Module boundaries, upgrade strategy' },
          { title: 'Lead security reviews', description: 'Threat modeling, audit coordination' },
          { title: 'Mentor junior developers', description: 'Code reviews, pairing, knowledge sharing' },
        ]},
        { label: 'Innovate', items: [
          { title: 'Research novel mechanisms', description: 'New AMM curves, liquidation systems' },
          { title: 'Contribute to standards', description: 'EIP authoring, protocol design' },
          { title: 'Build developer tooling', description: 'Frameworks, testing tools, SDKs' },
        ]},
      ],
    },
  },

  'frontend-dev': {
    slug: 'frontend-dev',
    title: 'Web3 Frontend Developer',
    description: 'Build dApp interfaces, wallet integrations, and on-chain data displays.',
    titlePatterns: ['frontend', 'front-end', 'front end', 'react', 'ui engineer', 'web developer', 'full stack', 'fullstack', 'dapp'],
    jobFilter: 'frontend react web3',
    roadmap: {
      beginner: [
        { label: 'Foundation', items: [
          { title: 'Master React + TypeScript', description: 'Hooks, state, components', url: 'https://react.dev/', source: 'React Docs' },
          { title: 'Learn wallet connection', description: 'RainbowKit, WalletConnect', url: 'https://www.rainbowkit.com/', source: 'RainbowKit' },
          { title: 'Understand blockchain basics', description: 'Transactions, blocks, accounts', url: 'https://ethereum.org/what-is-ethereum/', source: 'ethereum.org' },
        ]},
        { label: 'Build', items: [
          { title: 'Build a token dashboard', description: 'Display balances, transfers, prices' },
          { title: 'Integrate smart contracts', description: 'Wagmi hooks, read/write contracts', url: 'https://wagmi.sh/', source: 'Wagmi' },
          { title: 'Handle transaction UX', description: 'Pending states, confirmations, errors' },
        ]},
        { label: 'Specialize', items: [
          { title: 'Learn The Graph', description: 'Query on-chain data with subgraphs', url: 'https://thegraph.com/docs/', source: 'The Graph' },
          { title: 'Build a DEX interface', description: 'Swap UI, price impact, slippage' },
          { title: 'Deploy to production', description: 'Vercel, IPFS, ENS domains' },
        ]},
      ],
      mid: [
        { label: 'Accelerate', items: [
          { title: 'Master Viem + Wagmi v2', description: 'Type-safe contract interactions', url: 'https://viem.sh/', source: 'Viem' },
          { title: 'Optimize bundle size', description: 'Tree shaking, lazy loading, code splitting' },
          { title: 'Real-time data patterns', description: 'WebSocket subscriptions, event polling' },
        ]},
        { label: 'Depth', items: [
          { title: 'Multi-chain support', description: 'Chain switching, cross-chain UX' },
          { title: 'Advanced state management', description: 'On-chain + off-chain state sync' },
          { title: 'Accessibility & i18n', description: 'WCAG compliance, multi-language' },
        ]},
        { label: 'Differentiate', items: [
          { title: 'Build a full dApp', description: 'End-to-end: contract to deployment' },
          { title: 'Contribute to UI libraries', description: 'RainbowKit, ConnectKit, shadcn/ui' },
          { title: 'Write technical content', description: 'Tutorials, blog posts, demos' },
        ]},
      ],
      senior: [
        { label: 'Transition', items: [
          { title: 'Understand protocol mechanics', description: 'How DeFi/NFT protocols work under the hood' },
          { title: 'Learn contract ABIs deeply', description: 'Event decoding, custom errors, multicall' },
          { title: 'Study dApp architectures', description: 'Uniswap, Aave, OpenSea frontends' },
        ]},
        { label: 'Lead', items: [
          { title: 'Design component systems', description: 'Design tokens, composable primitives' },
          { title: 'Architect data layers', description: 'Indexing strategy, caching, optimistic updates' },
          { title: 'Set frontend standards', description: 'Testing, CI/CD, performance budgets' },
        ]},
        { label: 'Innovate', items: [
          { title: 'Build SDK/libraries', description: 'Reusable web3 frontend tooling' },
          { title: 'Push UX boundaries', description: 'Account abstraction, gasless txs, session keys' },
          { title: 'Open-source leadership', description: 'Maintain projects, build community' },
        ]},
      ],
    },
  },

  'defi-engineer': {
    slug: 'defi-engineer',
    title: 'DeFi Protocol Engineer',
    description: 'Design and build financial protocols — AMMs, lending, derivatives.',
    titlePatterns: ['defi', 'protocol', 'amm', 'lending', 'yield', 'liquidity'],
    jobFilter: 'defi protocol engineer',
    roadmap: {
      beginner: [
        { label: 'Foundation', items: [
          { title: 'Understand DeFi primitives', description: 'AMMs, lending pools, oracles', url: 'https://ethereum.org/defi/', source: 'ethereum.org' },
          { title: 'Learn Solidity', description: 'Smart contract basics + testing', url: 'https://updraft.cyfrin.io/', source: 'Cyfrin Updraft' },
          { title: 'Study tokenomics', description: 'Supply mechanics, incentive design' },
        ]},
        { label: 'Build', items: [
          { title: 'Fork Uniswap V2', description: 'Deploy your own AMM on testnet' },
          { title: 'Build a simple vault', description: 'Deposit, withdraw, yield distribution' },
          { title: 'Integrate Chainlink oracles', description: 'Price feeds, VRF, automation' },
        ]},
        { label: 'Specialize', items: [
          { title: 'Read Aave V3 code', description: 'Lending protocol architecture', url: 'https://docs.aave.com/', source: 'Aave Docs' },
          { title: 'Learn flash loans', description: 'Arbitrage, liquidation bots' },
          { title: 'Understand risk frameworks', description: 'Gauntlet-style risk analysis' },
        ]},
      ],
      mid: [
        { label: 'Accelerate', items: [
          { title: 'Master concentrated liquidity', description: 'Uni V3 math, tick spacing, positions' },
          { title: 'Study liquidation mechanics', description: 'Health factors, incentives, cascades' },
          { title: 'Learn cross-chain DeFi', description: 'Bridge protocols, message passing' },
        ]},
        { label: 'Depth', items: [
          { title: 'Derivatives & synthetics', description: 'Perpetuals, options, structured products' },
          { title: 'MEV-aware design', description: 'Order flow, sandwich protection' },
          { title: 'Formal verification', description: 'Prove protocol invariants mathematically' },
        ]},
        { label: 'Differentiate', items: [
          { title: 'Design a novel mechanism', description: 'New curve, incentive, or product' },
          { title: 'Audit DeFi protocols', description: 'Bug bounties, competitions' },
          { title: 'Publish DeFi research', description: 'Papers, blog posts, talks' },
        ]},
      ],
      senior: [
        { label: 'Transition', items: [
          { title: 'Map the DeFi stack', description: 'Composability graph, dependency risks' },
          { title: 'Study governance attacks', description: 'Flash loan governance, vote buying' },
          { title: 'Understand regulatory landscape', description: 'MiCA, SEC guidance, compliance' },
        ]},
        { label: 'Lead', items: [
          { title: 'Architect protocol systems', description: 'Module design, upgrade paths, risk parameters' },
          { title: 'Lead security processes', description: 'Audit coordination, bug bounty programs' },
          { title: 'Design tokenomics', description: 'Emission schedules, fee distribution' },
        ]},
        { label: 'Innovate', items: [
          { title: 'Research new primitives', description: 'Novel AMM math, RWA integration' },
          { title: 'Cross-chain protocol design', description: 'Unified liquidity, chain abstraction' },
          { title: 'Standards & governance', description: 'EIP contributions, protocol politics' },
        ]},
      ],
    },
  },

  'security-auditor': {
    slug: 'security-auditor',
    title: 'Security Auditor',
    description: 'Find vulnerabilities, audit protocols, and prevent billion-dollar hacks.',
    titlePatterns: ['security', 'audit', 'vulnerability', 'pen test', 'security engineer', 'security researcher'],
    jobFilter: 'security audit',
    roadmap: {
      beginner: [
        { label: 'Foundation', items: [
          { title: 'Learn Solidity deeply', description: 'Storage layout, assembly, edge cases', url: 'https://solidity-by-example.org/', source: 'Solidity by Example' },
          { title: 'Study common vulns', description: 'Reentrancy, overflow, access control', url: 'https://swcregistry.io/', source: 'SWC Registry' },
          { title: 'Play Ethernaut', description: 'Learn-by-hacking CTF challenges', url: 'https://ethernaut.openzeppelin.com/', source: 'OpenZeppelin' },
        ]},
        { label: 'Build', items: [
          { title: 'Damn Vulnerable DeFi', description: 'Advanced CTF with DeFi scenarios', url: 'https://www.damnvulnerabledefi.xyz/', source: 'DVDeFi' },
          { title: 'Learn Slither & Mythril', description: 'Static analysis & symbolic execution' },
          { title: 'Write your first audit report', description: 'Findings format, severity, recommendations' },
        ]},
        { label: 'Specialize', items: [
          { title: 'Join Code4rena', description: 'Compete in real audit contests', url: 'https://code4rena.com/', source: 'Code4rena' },
          { title: 'Study past exploits', description: 'Rekt.news post-mortems', url: 'https://rekt.news/leaderboard/', source: 'rekt.news' },
          { title: 'Learn Foundry fuzzing', description: 'Property-based testing, invariants' },
        ]},
      ],
      mid: [
        { label: 'Accelerate', items: [
          { title: 'Master formal verification', description: 'Certora Prover, K framework' },
          { title: 'Learn EVM at opcode level', description: 'Decompile, trace, debug' },
          { title: 'Study DeFi protocol internals', description: 'AMMs, lending, bridges in depth' },
        ]},
        { label: 'Depth', items: [
          { title: 'Cross-chain security', description: 'Bridge vulnerabilities, message verification' },
          { title: 'MEV & frontrunning analysis', description: 'Mempool monitoring, sandwich detection' },
          { title: 'ZK circuit auditing', description: 'Soundness, completeness, trusted setup' },
        ]},
        { label: 'Differentiate', items: [
          { title: 'Build detection tools', description: 'Custom Slither detectors, monitoring' },
          { title: 'Win audit competitions', description: 'Top leaderboard positions' },
          { title: 'Publish vulnerability research', description: 'Responsible disclosure, blog posts' },
        ]},
      ],
      senior: [
        { label: 'Transition', items: [
          { title: 'Map attack surfaces', description: 'Protocol composability risks, dependencies' },
          { title: 'Study incident response', description: 'War rooms, pause mechanisms, recovery' },
          { title: 'Understand economic attacks', description: 'Oracle manipulation, governance exploits' },
        ]},
        { label: 'Lead', items: [
          { title: 'Lead audit engagements', description: 'Scope, team, methodology, delivery' },
          { title: 'Design security programs', description: 'Bug bounty, monitoring, incident response' },
          { title: 'Build audit firm reputation', description: 'Track record, referrals, brand' },
        ]},
        { label: 'Innovate', items: [
          { title: 'Develop new audit methodologies', description: 'AI-assisted, formal methods integration' },
          { title: 'Create security standards', description: 'Best practices, scoring frameworks' },
          { title: 'Train the next generation', description: 'Courses, mentorship, open-source tools' },
        ]},
      ],
    },
  },

  'community-manager': {
    slug: 'community-manager',
    title: 'Community Manager',
    description: 'Build and nurture web3 communities on Discord, Telegram, and Twitter.',
    titlePatterns: ['community', 'discord', 'telegram', 'social media', 'community manager', 'community lead'],
    jobFilter: 'community manager',
    roadmap: {
      beginner: [
        { label: 'Foundation', items: [
          { title: 'Learn crypto culture', description: 'Memes, language, norms of CT/Discord' },
          { title: 'Understand web3 basics', description: 'Wallets, tokens, DeFi, NFTs', url: 'https://ethereum.org/what-is-ethereum/', source: 'ethereum.org' },
          { title: 'Master Discord setup', description: 'Roles, bots, verification, moderation' },
        ]},
        { label: 'Build', items: [
          { title: 'Volunteer for a DAO', description: 'Start as contributor, learn governance' },
          { title: 'Create engagement programs', description: 'AMAs, contests, quests, onboarding' },
          { title: 'Build a content calendar', description: 'Twitter, Discord, newsletter cadence' },
        ]},
        { label: 'Specialize', items: [
          { title: 'Learn analytics', description: 'Track growth, retention, sentiment' },
          { title: 'Study successful communities', description: 'Pudgy Penguins, Bankless, Optimism' },
          { title: 'Crisis management basics', description: 'FUD response, exploit communication' },
        ]},
      ],
      mid: [
        { label: 'Accelerate', items: [
          { title: 'Design community strategy', description: 'Growth funnels, retention loops' },
          { title: 'Master community tools', description: 'Collab.Land, Guild, Coordinape' },
          { title: 'Build ambassador programs', description: 'Regional leads, reward systems' },
        ]},
        { label: 'Depth', items: [
          { title: 'Understand governance deeply', description: 'Snapshot, Tally, delegation' },
          { title: 'Cross-community partnerships', description: 'Co-marketing, joint events' },
          { title: 'Data-driven decisions', description: 'Metrics frameworks, reporting' },
        ]},
        { label: 'Differentiate', items: [
          { title: 'Lead community launches', description: 'Token launch, mainnet, campaigns' },
          { title: 'Build personal brand', description: 'Twitter presence, speaking, content' },
          { title: 'Develop playbooks', description: 'Scalable community processes' },
        ]},
      ],
      senior: [
        { label: 'Transition', items: [
          { title: 'Study web3 community models', description: 'DAO, protocol, L2, NFT communities' },
          { title: 'Learn token incentive design', description: 'Airdrops, points, quests' },
          { title: 'Understand protocol politics', description: 'Governance dynamics, whale management' },
        ]},
        { label: 'Lead', items: [
          { title: 'Build community teams', description: 'Hire, train, manage community staff' },
          { title: 'Design community architecture', description: 'Multi-platform, multi-region strategy' },
          { title: 'Align community with product', description: 'Feedback loops, beta programs' },
        ]},
        { label: 'Innovate', items: [
          { title: 'Pioneer new engagement models', description: 'On-chain reputation, soulbound badges' },
          { title: 'Community-led growth', description: 'Viral mechanisms, referral systems' },
          { title: 'Advise protocols', description: 'Community strategy consulting' },
        ]},
      ],
    },
  },

  'growth-marketer': {
    slug: 'growth-marketer',
    title: 'Growth Marketer',
    description: 'Drive user acquisition, run campaigns, and grow web3 products.',
    titlePatterns: ['marketing', 'growth', 'content', 'brand', 'kol', 'marketing manager', 'head of marketing'],
    jobFilter: 'marketing growth',
    roadmap: {
      beginner: [
        { label: 'Foundation', items: [
          { title: 'Learn crypto marketing', description: 'CT culture, narrative-driven marketing' },
          { title: 'Understand on-chain data', description: 'Dune, DefiLlama, token metrics', url: 'https://dune.com/', source: 'Dune' },
          { title: 'Study successful launches', description: 'Blur, friend.tech, Base campaigns' },
        ]},
        { label: 'Build', items: [
          { title: 'Create a content strategy', description: 'Twitter threads, blog posts, video' },
          { title: 'Run small campaigns', description: 'Gleam, Galxe quests, bounties' },
          { title: 'Build KOL relationships', description: 'Identify, outreach, manage influencers' },
        ]},
        { label: 'Specialize', items: [
          { title: 'Learn growth frameworks', description: 'AARRR for web3, on-chain funnels' },
          { title: 'Master analytics tools', description: 'Google Analytics, Mixpanel, Dune' },
          { title: 'Study tokenomics for marketing', description: 'Airdrops, points, incentive campaigns' },
        ]},
      ],
      mid: [
        { label: 'Accelerate', items: [
          { title: 'Design growth loops', description: 'Referral, viral, content loops' },
          { title: 'Master paid acquisition', description: 'Twitter ads, sponsorships, podcast ads' },
          { title: 'Build PR strategy', description: 'CoinDesk, The Block, Bankless pitching' },
        ]},
        { label: 'Depth', items: [
          { title: 'On-chain marketing', description: 'Airdrop criteria, Sybil resistance' },
          { title: 'Brand positioning', description: 'Narrative design, competitive positioning' },
          { title: 'Marketing automation', description: 'Email flows, retargeting, segmentation' },
        ]},
        { label: 'Differentiate', items: [
          { title: 'Launch a token campaign', description: 'Pre-launch hype, TGE, post-launch retention' },
          { title: 'Build marketing team', description: 'Hire content, social, growth roles' },
          { title: 'Develop case studies', description: 'Document wins, build portfolio' },
        ]},
      ],
      senior: [
        { label: 'Transition', items: [
          { title: 'Map web3 marketing landscape', description: 'Channels, tools, strategies by vertical' },
          { title: 'Understand protocol economics', description: 'How marketing affects TVL, volume' },
          { title: 'Study cross-chain strategies', description: 'Multi-chain expansion playbooks' },
        ]},
        { label: 'Lead', items: [
          { title: 'Set marketing strategy', description: 'Budget, channels, KPIs, team' },
          { title: 'Build marketing org', description: 'Content, growth, community, BD alignment' },
          { title: 'Board-level reporting', description: 'ROI frameworks, growth metrics' },
        ]},
        { label: 'Innovate', items: [
          { title: 'Pioneer new channels', description: 'Farcaster, Lens, on-chain social' },
          { title: 'Design incentive systems', description: 'Points, quests, reputation marketing' },
          { title: 'Advisory & consulting', description: 'Multi-protocol marketing advisory' },
        ]},
      ],
    },
  },

  'bd-partnerships': {
    slug: 'bd-partnerships',
    title: 'BD & Partnerships',
    description: 'Build strategic relationships, close integration deals, grow ecosystems.',
    titlePatterns: ['business development', 'bd ', 'partnership', 'sales', 'account executive', 'ecosystem'],
    jobFilter: 'business development partnership',
    roadmap: {
      beginner: [
        { label: 'Foundation', items: [
          { title: 'Map the web3 ecosystem', description: 'L1s, L2s, DeFi, infra, tools landscape' },
          { title: 'Learn partnership models', description: 'Integrations, grants, co-marketing' },
          { title: 'Understand technical basics', description: 'APIs, SDKs, smart contracts at high level' },
        ]},
        { label: 'Build', items: [
          { title: 'Start outreach', description: 'Cold emails, Twitter DMs, conference networking' },
          { title: 'Create partnership proposals', description: 'Value prop, integration scope, timeline' },
          { title: 'Build a CRM system', description: 'Pipeline tracking, follow-ups, metrics' },
        ]},
        { label: 'Specialize', items: [
          { title: 'Study successful partnerships', description: 'Chainlink integrations, L2 ecosystem deals' },
          { title: 'Learn grant programs', description: 'Apply and evaluate grants' },
          { title: 'Develop negotiation skills', description: 'Deal structure, terms, win-win framing' },
        ]},
      ],
      mid: [
        { label: 'Accelerate', items: [
          { title: 'Build ecosystem strategy', description: 'Target segments, GTM, pipeline' },
          { title: 'Master enterprise BD', description: 'Institutional partners, B2B sales' },
          { title: 'Develop grant programs', description: 'Design, fund, evaluate grants' },
        ]},
        { label: 'Depth', items: [
          { title: 'Cross-chain BD', description: 'Multi-chain expansion, bridge partnerships' },
          { title: 'Investment & fundraising', description: 'VC relationships, token sales' },
          { title: 'Strategic M&A', description: 'Acqui-hires, protocol mergers' },
        ]},
        { label: 'Differentiate', items: [
          { title: 'Build a deal track record', description: 'Close high-value integrations' },
          { title: 'Conference speaking', description: 'Panels, keynotes, thought leadership' },
          { title: 'Create BD playbooks', description: 'Scalable processes for partnerships' },
        ]},
      ],
      senior: [
        { label: 'Transition', items: [
          { title: 'Understand protocol strategy', description: 'How BD fits into protocol growth' },
          { title: 'Study ecosystem economics', description: 'Network effects, composability value' },
          { title: 'Build industry network', description: 'Founders, VCs, protocol teams' },
        ]},
        { label: 'Lead', items: [
          { title: 'Set BD strategy', description: 'Targets, channels, team structure' },
          { title: 'Build BD organization', description: 'Hire, train, manage BD team' },
          { title: 'Board & investor relations', description: 'Strategic reporting, alignment' },
        ]},
        { label: 'Innovate', items: [
          { title: 'Design ecosystem incentives', description: 'Grant programs, builder rewards' },
          { title: 'Pioneer new BD models', description: 'Protocol-to-protocol deals, DAOxDAO' },
          { title: 'Advisory roles', description: 'Protocol advisory, ecosystem consulting' },
        ]},
      ],
    },
  },

  'compliance-analyst': {
    slug: 'compliance-analyst',
    title: 'Compliance Analyst',
    description: 'Navigate crypto regulations, manage risk, ensure legal compliance.',
    titlePatterns: ['compliance', 'legal', 'regulatory', 'aml', 'kyc', 'risk', 'counsel'],
    jobFilter: 'compliance legal regulatory',
    roadmap: {
      beginner: [
        { label: 'Foundation', items: [
          { title: 'Learn crypto regulations', description: 'MiCA, SEC framework, global landscape' },
          { title: 'Understand AML/KYC', description: 'Identity verification, transaction monitoring' },
          { title: 'Study blockchain basics', description: 'How transactions work, traceability' },
        ]},
        { label: 'Build', items: [
          { title: 'Learn compliance tools', description: 'Chainalysis, Elliptic, TRM Labs' },
          { title: 'Study enforcement actions', description: 'SEC cases, OFAC sanctions, precedents' },
          { title: 'Create compliance frameworks', description: 'Policies, procedures, documentation' },
        ]},
        { label: 'Specialize', items: [
          { title: 'DeFi compliance challenges', description: 'Decentralization, pseudonymity, governance' },
          { title: 'Cross-border regulations', description: 'Multi-jurisdiction compliance' },
          { title: 'Get relevant certifications', description: 'CAMS, CFE, blockchain certificates' },
        ]},
      ],
      mid: [
        { label: 'Accelerate', items: [
          { title: 'Design compliance programs', description: 'Risk assessment, monitoring, reporting' },
          { title: 'Master on-chain analytics', description: 'Trace funds, identify patterns' },
          { title: 'Build regulator relationships', description: 'Proactive engagement, sandbox programs' },
        ]},
        { label: 'Depth', items: [
          { title: 'Token classification', description: 'Security vs utility vs commodity analysis' },
          { title: 'Smart contract legal issues', description: 'Code as law, liability, disputes' },
          { title: 'DAO legal structures', description: 'Wrapper entities, member liability' },
        ]},
        { label: 'Differentiate', items: [
          { title: 'Publish regulatory analysis', description: 'Blog posts, research papers, talks' },
          { title: 'Build compliance automation', description: 'Automated monitoring, reporting tools' },
          { title: 'Advisory services', description: 'Help projects navigate regulations' },
        ]},
      ],
      senior: [
        { label: 'Transition', items: [
          { title: 'Map global regulatory landscape', description: 'Jurisdiction comparison, trends' },
          { title: 'Study enforcement patterns', description: 'What triggers action, how to prepare' },
          { title: 'Understand institutional requirements', description: 'Bank, fund, exchange compliance' },
        ]},
        { label: 'Lead', items: [
          { title: 'Build compliance organization', description: 'Team, tools, processes, budget' },
          { title: 'Board-level risk reporting', description: 'Risk appetite, exposure, mitigation' },
          { title: 'Policy advocacy', description: 'Shape regulations, industry associations' },
        ]},
        { label: 'Innovate', items: [
          { title: 'Design privacy-compliant systems', description: 'ZK-KYC, selective disclosure' },
          { title: 'Pioneer compliance-as-code', description: 'On-chain compliance, automated enforcement' },
          { title: 'Cross-industry standards', description: 'TradFi-DeFi compliance bridges' },
        ]},
      ],
    },
  },

  'product-manager': {
    slug: 'product-manager',
    title: 'Web3 Product Manager',
    description: 'Define product vision, prioritize features, ship web3 products.',
    titlePatterns: ['product manager', 'product lead', 'project manager', 'program manager', 'product owner'],
    jobFilter: 'product manager web3',
    roadmap: {
      beginner: [
        { label: 'Foundation', items: [
          { title: 'Learn web3 product landscape', description: 'DeFi, NFT, infra, tooling products' },
          { title: 'Understand on-chain metrics', description: 'TVL, DAU, transaction volume, retention' },
          { title: 'Study successful products', description: 'Uniswap, MetaMask, Blur product decisions' },
        ]},
        { label: 'Build', items: [
          { title: 'Create a product spec', description: 'User stories, acceptance criteria, designs' },
          { title: 'Learn developer workflows', description: 'Understand smart contracts, deployments' },
          { title: 'Run user research', description: 'Interviews, surveys, on-chain behavior analysis' },
        ]},
        { label: 'Specialize', items: [
          { title: 'Web3 UX patterns', description: 'Wallet connection, transaction flow, gas' },
          { title: 'Tokenomics for PMs', description: 'How tokens affect product decisions' },
          { title: 'Analytics setup', description: 'Mixpanel + Dune + custom dashboards' },
        ]},
      ],
      mid: [
        { label: 'Accelerate', items: [
          { title: 'Design product strategy', description: 'Roadmap, OKRs, competitive analysis' },
          { title: 'Master stakeholder management', description: 'Community, investors, core team' },
          { title: 'Build data pipelines', description: 'On-chain + off-chain product analytics' },
        ]},
        { label: 'Depth', items: [
          { title: 'Governance product design', description: 'Proposal flow, voting UX, delegation' },
          { title: 'Multi-chain product strategy', description: 'Which chains, when, how' },
          { title: 'Security-aware product decisions', description: 'Audit timing, risk parameters' },
        ]},
        { label: 'Differentiate', items: [
          { title: 'Launch a major feature', description: 'End-to-end: research to launch to iteration' },
          { title: 'Build product team', description: 'Hire designers, analysts, researchers' },
          { title: 'Develop PM frameworks', description: 'Web3-specific product processes' },
        ]},
      ],
      senior: [
        { label: 'Transition', items: [
          { title: 'Map the protocol stack', description: 'Where product decisions affect protocol' },
          { title: 'Understand cryptoeconomics', description: 'Incentive design, mechanism design' },
          { title: 'Study protocol governance', description: 'How DAOs make product decisions' },
        ]},
        { label: 'Lead', items: [
          { title: 'Set product vision', description: 'Multi-year roadmap, North Star metrics' },
          { title: 'Build product organization', description: 'Team structure, processes, culture' },
          { title: 'Product-market fit iteration', description: 'Pivot strategy, metrics, validation' },
        ]},
        { label: 'Innovate', items: [
          { title: 'Design new product categories', description: 'Identify unmet needs, new primitives' },
          { title: 'Cross-protocol product thinking', description: 'Composability as product strategy' },
          { title: 'Thought leadership', description: 'Speaking, writing, advising' },
        ]},
      ],
    },
  },

  'data-analyst': {
    slug: 'data-analyst',
    title: 'Web3 Data Analyst',
    description: 'Analyze on-chain data, build dashboards, and uncover market insights.',
    titlePatterns: ['data analyst', 'data engineer', 'analytics', 'quantitative', 'data scientist', 'research analyst'],
    jobFilter: 'data analyst analytics',
    roadmap: {
      beginner: [
        { label: 'Foundation', items: [
          { title: 'Learn SQL for blockchain', description: 'Query on-chain data, joins, aggregations', url: 'https://dune.com/', source: 'Dune Analytics' },
          { title: 'Understand blockchain data', description: 'Blocks, transactions, events, logs' },
          { title: 'Study DeFi metrics', description: 'TVL, volume, yield, impermanent loss' },
        ]},
        { label: 'Build', items: [
          { title: 'Create Dune dashboards', description: 'Protocol metrics, market analysis' },
          { title: 'Learn Python for crypto', description: 'Pandas, API calls, data cleaning' },
          { title: 'Build a token tracker', description: 'Price, volume, holder analysis' },
        ]},
        { label: 'Specialize', items: [
          { title: 'Learn data visualization', description: 'Charts, dashboards, storytelling' },
          { title: 'Study on-chain forensics', description: 'Wallet clustering, fund tracing' },
          { title: 'Publish analysis', description: 'Twitter threads, Dune dashboards, reports' },
        ]},
      ],
      mid: [
        { label: 'Accelerate', items: [
          { title: 'Master blockchain indexing', description: 'The Graph, custom indexers, event decoding' },
          { title: 'Build ETL pipelines', description: 'Raw chain data to analytics-ready tables' },
          { title: 'Advanced SQL techniques', description: 'Window functions, CTEs, optimization' },
        ]},
        { label: 'Depth', items: [
          { title: 'Machine learning for crypto', description: 'Price prediction, anomaly detection' },
          { title: 'MEV data analysis', description: 'Mempool data, arbitrage detection' },
          { title: 'Cross-chain analytics', description: 'Bridge flows, multi-chain metrics' },
        ]},
        { label: 'Differentiate', items: [
          { title: 'Build analytics products', description: 'Dashboards used by protocols/community' },
          { title: 'Original research reports', description: 'State-of-X reports, trend analysis' },
          { title: 'Develop analytics frameworks', description: 'Standardized metrics, benchmarks' },
        ]},
      ],
      senior: [
        { label: 'Transition', items: [
          { title: 'Map the data landscape', description: 'Providers, tools, gaps, opportunities' },
          { title: 'Understand data monetization', description: 'Oracle networks, data markets' },
          { title: 'Study institutional data needs', description: 'What TradFi wants from on-chain data' },
        ]},
        { label: 'Lead', items: [
          { title: 'Build data teams', description: 'Hire analysts, engineers, scientists' },
          { title: 'Design data strategy', description: 'Infrastructure, governance, access' },
          { title: 'Stakeholder reporting', description: 'Executive dashboards, board updates' },
        ]},
        { label: 'Innovate', items: [
          { title: 'Build data infrastructure', description: 'Real-time indexing, cross-chain aggregation' },
          { title: 'AI/ML applications', description: 'LLM for on-chain analysis, auto-insights' },
          { title: 'Data standards & governance', description: 'Industry metrics, data quality frameworks' },
        ]},
      ],
    },
  },
}

// ── Q1 x Q2 → Career Mapping ──

type Background = 'developer' | 'marketing' | 'business' | 'design' | 'changer'
type Interest = 'protocols' | 'defi' | 'gaming' | 'security' | 'dao'

export const careerMapping: Record<Background, Record<Interest, string>> = {
  developer:  { protocols: 'smart-contract-dev', defi: 'defi-engineer',    gaming: 'frontend-dev',      security: 'security-auditor',  dao: 'smart-contract-dev' },
  marketing:  { protocols: 'growth-marketer',    defi: 'growth-marketer',  gaming: 'community-manager', security: 'growth-marketer',   dao: 'community-manager' },
  business:   { protocols: 'bd-partnerships',    defi: 'data-analyst',     gaming: 'bd-partnerships',   security: 'compliance-analyst', dao: 'bd-partnerships' },
  design:     { protocols: 'frontend-dev',       defi: 'frontend-dev',     gaming: 'frontend-dev',      security: 'product-manager',   dao: 'frontend-dev' },
  changer:    { protocols: 'community-manager',  defi: 'data-analyst',     gaming: 'community-manager', security: 'compliance-analyst', dao: 'community-manager' },
}

export type ExperienceLevel = 'beginner' | 'mid' | 'senior'
