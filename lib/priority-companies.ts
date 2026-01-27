/**
 * Priority Companies Registry
 * Korean Web3 companies with VC backing and metadata
 */

export interface PriorityCompany {
  name: string;
  aliases: string[];
  tier: 'P0' | 'P1' | 'P2';
  backers: string[];
  sector: string;
  office_location: string;
  hasToken: boolean;
  stage: string;
}

export const PRIORITY_COMPANIES: PriorityCompany[] = [
  // ── P0: Top-tier Korean Web3 companies ──
  {
    name: 'Hashed',
    aliases: ['hashed.com', 'Hashed Fund'],
    tier: 'P0',
    backers: ['Hashed'],
    sector: 'VC / Investment',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'DSRV',
    aliases: ['dsrvlabs', 'DSRV Labs'],
    tier: 'P0',
    backers: ['Hashed', 'Kakao Ventures'],
    sector: 'Infrastructure',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Series A',
  },
  {
    name: 'CryptoQuant',
    aliases: ['cryptoquant.com'],
    tier: 'P0',
    backers: ['Hashed', 'Mirae Asset'],
    sector: 'Analytics / Data',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Series B',
  },
  {
    name: 'Klaytn',
    aliases: ['Kaia', 'klaytn.foundation', 'Kaia Foundation'],
    tier: 'P0',
    backers: ['Kakao'],
    sector: 'Layer 1',
    office_location: 'Seoul, South Korea',
    hasToken: true,
    stage: 'Established',
  },
  {
    name: 'Wemade',
    aliases: ['WEMIX', 'wemade.com', 'wemix.com'],
    tier: 'P0',
    backers: ['Wemade'],
    sector: 'Gaming / Metaverse',
    office_location: 'Seoul, South Korea',
    hasToken: true,
    stage: 'Public',
  },
  {
    name: 'LINE NEXT',
    aliases: ['LINE', 'DOSI', 'Finschia', 'line-next'],
    tier: 'P0',
    backers: ['LINE Corporation'],
    sector: 'Platform / NFT',
    office_location: 'Seoul, South Korea',
    hasToken: true,
    stage: 'Established',
  },
  {
    name: 'Dunamu',
    aliases: ['Upbit', 'dunamu.com', 'upbit.com'],
    tier: 'P0',
    backers: ['Dunamu'],
    sector: 'Exchange',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },

  // ── P1: Strong Korean Web3 companies ──
  {
    name: 'Bithumb',
    aliases: ['bithumb.com', 'Bithumb Korea'],
    tier: 'P1',
    backers: [],
    sector: 'Exchange',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'Korbit',
    aliases: ['korbit.co.kr'],
    tier: 'P1',
    backers: ['SoftBank', 'Kakao Ventures'],
    sector: 'Exchange',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'Ozys',
    aliases: ['ozys.io', 'KLAYswap', 'Orbit Bridge'],
    tier: 'P1',
    backers: [],
    sector: 'DeFi',
    office_location: 'Seoul, South Korea',
    hasToken: true,
    stage: 'Established',
  },
  {
    name: 'Planetarium',
    aliases: ['planetariumhq', 'Nine Chronicles', 'planetarium.dev'],
    tier: 'P1',
    backers: ['Hashed', 'Animoca Brands'],
    sector: 'Gaming',
    office_location: 'Seoul, South Korea',
    hasToken: true,
    stage: 'Series A',
  },
  {
    name: 'NFTBank',
    aliases: ['nftbank.ai'],
    tier: 'P1',
    backers: ['Hashed', 'a16z'],
    sector: 'Analytics / NFT',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Series A',
  },
  {
    name: 'Lambda256',
    aliases: ['lambda256.io', 'Luniverse'],
    tier: 'P1',
    backers: ['Dunamu'],
    sector: 'Infrastructure',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'Ground X',
    aliases: ['groundx.xyz', 'GroundX'],
    tier: 'P1',
    backers: ['Kakao'],
    sector: 'Infrastructure',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'ICONLOOP',
    aliases: ['iconloop.com', 'ICON', 'iconloop'],
    tier: 'P1',
    backers: [],
    sector: 'Layer 1',
    office_location: 'Seoul, South Korea',
    hasToken: true,
    stage: 'Established',
  },
  {
    name: 'Cosmostation',
    aliases: ['cosmostation.io'],
    tier: 'P1',
    backers: ['Hashed'],
    sector: 'Infrastructure / Wallet',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'Xangle',
    aliases: ['xangle.io'],
    tier: 'P1',
    backers: ['Hashed', 'KB Investment'],
    sector: 'Analytics / Data',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Series A',
  },
  {
    name: 'DeSpread',
    aliases: ['despread.io'],
    tier: 'P1',
    backers: [],
    sector: 'Consulting / Marketing',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'ChainPartners',
    aliases: ['chainpartners.co', 'Chain Partners'],
    tier: 'P1',
    backers: [],
    sector: 'VC / Advisory',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'Superblock',
    aliases: ['superblock.co'],
    tier: 'P1',
    backers: [],
    sector: 'Infrastructure',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },

  // ── P2: Growing Korean Web3 companies ──
  {
    name: 'Yooldo',
    aliases: ['yooldo.gg'],
    tier: 'P2',
    backers: ['Animoca Brands'],
    sector: 'Gaming',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Seed',
  },
  {
    name: 'Presto Labs',
    aliases: ['presto.com', 'Presto'],
    tier: 'P2',
    backers: [],
    sector: 'Trading / Market Making',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'Streami',
    aliases: ['streami.co', 'Gopax parent'],
    tier: 'P2',
    backers: [],
    sector: 'Exchange',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'Crescendo',
    aliases: ['crescendo.finance'],
    tier: 'P2',
    backers: [],
    sector: 'DeFi',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Seed',
  },
  {
    name: 'Standard Protocol',
    aliases: ['standardprotocol.org'],
    tier: 'P2',
    backers: [],
    sector: 'DeFi',
    office_location: 'Seoul, South Korea',
    hasToken: true,
    stage: 'Seed',
  },
  {
    name: 'Somesing',
    aliases: ['somesing.io'],
    tier: 'P2',
    backers: [],
    sector: 'Social / Music',
    office_location: 'Seoul, South Korea',
    hasToken: true,
    stage: 'Established',
  },
  {
    name: 'Sandbox Network',
    aliases: ['sandbox.co.kr', 'Sandbox'],
    tier: 'P2',
    backers: [],
    sector: 'Media / Creator',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'Gopax',
    aliases: ['gopax.co.kr'],
    tier: 'P2',
    backers: ['Binance'],
    sector: 'Exchange',
    office_location: 'Seoul, South Korea',
    hasToken: false,
    stage: 'Established',
  },
  {
    name: 'Kakao Games',
    aliases: ['BORA', 'kakaogames.com', 'bora.eco'],
    tier: 'P2',
    backers: ['Kakao'],
    sector: 'Gaming / Metaverse',
    office_location: 'Seongnam, South Korea',
    hasToken: true,
    stage: 'Public',
  },
];

/**
 * Find a priority company by name (case-insensitive match on name + aliases)
 */
export function findPriorityCompany(name: string): PriorityCompany | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();

  for (const company of PRIORITY_COMPANIES) {
    if (company.name.toLowerCase() === lower) {
      return company;
    }
    for (const alias of company.aliases) {
      if (alias.toLowerCase() === lower) {
        return company;
      }
    }
  }
  return null;
}
