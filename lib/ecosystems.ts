/**
 * Blockchain Ecosystem Data
 * Ecosystem classification for job filtering
 */

export interface Ecosystem {
  id: string
  name: string
  shortName?: string
  color: string
  bgColor: string
  keywords: string[] // Keywords to match in job titles/descriptions
}

export const ECOSYSTEMS: Ecosystem[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    color: '#627EEA',
    bgColor: 'bg-[#627EEA]/10',
    keywords: ['ethereum', 'eth', 'evm', 'solidity', 'erc-20', 'erc-721', 'erc20', 'erc721', 'hardhat', 'foundry', 'vyper'],
  },
  {
    id: 'solana',
    name: 'Solana',
    color: '#14F195',
    bgColor: 'bg-[#14F195]/10',
    keywords: ['solana', 'sol', 'anchor', 'rust', 'spl', 'metaplex'],
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin / Ordinals',
    shortName: 'Bitcoin',
    color: '#F7931A',
    bgColor: 'bg-[#F7931A]/10',
    keywords: ['bitcoin', 'btc', 'ordinals', 'brc-20', 'brc20', 'lightning', 'taproot', 'stacks'],
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    color: '#2E3148',
    bgColor: 'bg-[#6F7390]/10',
    keywords: ['cosmos', 'atom', 'tendermint', 'ibc', 'cosmwasm', 'cosmos-sdk'],
  },
  {
    id: 'polkadot',
    name: 'Polkadot',
    color: '#E6007A',
    bgColor: 'bg-[#E6007A]/10',
    keywords: ['polkadot', 'dot', 'substrate', 'parachain', 'kusama'],
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    color: '#E84142',
    bgColor: 'bg-[#E84142]/10',
    keywords: ['avalanche', 'avax', 'subnet'],
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    color: '#28A0F0',
    bgColor: 'bg-[#28A0F0]/10',
    keywords: ['arbitrum', 'arb', 'arbitrum one', 'arbitrum nova'],
  },
  {
    id: 'optimism',
    name: 'Optimism',
    color: '#FF0420',
    bgColor: 'bg-[#FF0420]/10',
    keywords: ['optimism', 'op', 'op stack', 'optimistic'],
  },
  {
    id: 'base',
    name: 'Base',
    color: '#0052FF',
    bgColor: 'bg-[#0052FF]/10',
    keywords: ['base', 'coinbase chain'],
  },
  {
    id: 'sui',
    name: 'Sui',
    color: '#6FBCF0',
    bgColor: 'bg-[#6FBCF0]/10',
    keywords: ['sui', 'move language', 'mysten'],
  },
  {
    id: 'aptos',
    name: 'Aptos',
    color: '#4CD9A1',
    bgColor: 'bg-[#4CD9A1]/10',
    keywords: ['aptos', 'apt', 'move'],
  },
  {
    id: 'ton',
    name: 'TON',
    color: '#0098EA',
    bgColor: 'bg-[#0098EA]/10',
    keywords: ['ton', 'telegram', 'toncoin', 'func'],
  },
  {
    id: 'klaytn',
    name: 'Klaytn / Kaia',
    shortName: 'Klaytn',
    color: '#FF6B00',
    bgColor: 'bg-[#FF6B00]/10',
    keywords: ['klaytn', 'klay', 'kaia', 'kakao'],
  },
  {
    id: 'multichain',
    name: 'Multi-chain',
    color: '#8B5CF6',
    bgColor: 'bg-[#8B5CF6]/10',
    keywords: ['multi-chain', 'multichain', 'cross-chain', 'chain-agnostic', 'omnichain'],
  },
]

/**
 * Detect ecosystem from job title/description
 */
export function detectEcosystem(text: string): string[] {
  const lowerText = text.toLowerCase()
  const detected: string[] = []

  for (const eco of ECOSYSTEMS) {
    if (eco.keywords.some(kw => lowerText.includes(kw))) {
      detected.push(eco.id)
    }
  }

  return detected.length > 0 ? detected : ['other']
}

/**
 * Get ecosystem by ID
 */
export function getEcosystem(id: string): Ecosystem | undefined {
  return ECOSYSTEMS.find(e => e.id === id)
}

/**
 * Get ecosystem display name
 */
export function getEcosystemName(id: string): string {
  const eco = getEcosystem(id)
  return eco?.shortName || eco?.name || id
}
