import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const SKILL_CATEGORIES: Record<string, Record<string, RegExp>> = {
  languages: {
    'Solidity': /\bsolidity\b/i,
    'Rust': /\brust\b/i,
    'Move': /\bmove\b/i,
    'TypeScript': /\btypescript\b/i,
    'Python': /\bpython\b/i,
    'Go': /\bgo(?:lang)?\b/i,
    'JavaScript': /\bjavascript\b/i,
    'Java': /\bjava\b/i,
    'C++': /\bc\+\+\b/i,
    'Cairo': /\bcairo\b/i,
    'Vyper': /\bvyper\b/i,
  },
  chains: {
    'Ethereum': /\bethereum\b/i,
    'Solana': /\bsolana\b/i,
    'Base': /\bbase\b/i,
    'Arbitrum': /\barbitrum\b/i,
    'Polygon': /\bpolygon\b/i,
    'Avalanche': /\bavalanche\b/i,
    'Sui': /\bsui\b/i,
    'Aptos': /\baptos\b/i,
    'TON': /\bton\b/i,
    'Bitcoin': /\bbitcoin\b/i,
    'Cosmos': /\bcosmos\b/i,
  },
  tools: {
    'React': /\breact\b/i,
    'Node.js': /\bnode\.?js\b/i,
    'AWS': /\baws\b/i,
    'Docker': /\bdocker\b/i,
    'Kubernetes': /\bkubernetes\b/i,
    'GraphQL': /\bgraphql\b/i,
    'PostgreSQL': /\bpostgre(?:sql|s)?\b/i,
    'MongoDB': /\bmongodb\b/i,
    'Redis': /\bredis\b/i,
  },
  domains: {
    'DeFi': /\bdefi\b/i,
    'NFT': /\bnfts?\b/i,
    'GameFi': /\bgamefi\b/i,
    'DAO': /\bdaos?\b/i,
    'L2': /\bl2\b/i,
    'ZK': /\bzk\b/i,
    'Bridge': /\bbridge\b/i,
    'Wallet': /\bwallets?\b/i,
    'DEX': /\bdex(?:es)?\b/i,
    'Lending': /\blending\b/i,
    'Staking': /\bstaking\b/i,
  },
}

// ── Level classification (replicated from intelligence-data.ts) ──
const LEVEL_PATTERNS: Record<string, string[]> = {
  entry: ['junior', 'jr.', 'jr ', 'entry level', 'entry-level', 'associate', 'graduate', 'trainee'],
  senior: ['senior', 'sr.', 'sr ', 'staff', 'principal', 'distinguished'],
  lead: [
    'head of', 'director', 'vp ', 'vice president', 'chief',
    'team lead', 'tech lead', 'c-level', 'cto', 'cfo', 'coo ', ' coo,', 'cmo',
    'engineering manager', 'general manager',
  ],
}

const LEAD_FALSE_POSITIVES = ['lead generat', 'leading']

const MANAGER_LEAD_PATTERNS = [
  'engineering manager', 'general manager', 'managing director',
  'country manager', 'regional manager', 'finance manager',
]

function classifyLevel(title: string): 'entry' | 'mid' | 'senior' | 'lead' {
  const t = title.toLowerCase()
  if (LEVEL_PATTERNS.lead.some(p => t.includes(p))) return 'lead'
  if (t.includes('lead') && !LEAD_FALSE_POSITIVES.some(fp => t.includes(fp))) return 'lead'
  if (t.includes('manager') && MANAGER_LEAD_PATTERNS.some(p => t.includes(p))) return 'lead'
  if (LEVEL_PATTERNS.senior.some(p => t.includes(p))) return 'senior'
  if (LEVEL_PATTERNS.entry.some(p => t.includes(p))) return 'entry'
  if (/\bintern\b/.test(t)) return 'entry'
  return 'mid'
}

const REGION_KEYWORDS: Record<string, string[]> = {
  korea: ['korea', 'south korea', 'seoul', '한국', '서울', '부산', '판교', '강남'],
  us: ['usa', 'united states', 'new york', 'san francisco', 'california', 'texas', 'chicago', 'miami', 'seattle', 'boston', 'los angeles'],
  remote: ['remote', 'worldwide', 'anywhere', 'global'],
}

function matchesRegion(location: string, region: string): boolean {
  if (region === 'all' || !region) return true
  const keywords = REGION_KEYWORDS[region]
  if (!keywords) return true
  const lower = location.toLowerCase()
  return keywords.some(kw => lower.includes(kw))
}

export async function GET(request: NextRequest) {
  const periodParam = request.nextUrl.searchParams.get('period') || '30'
  const regionParam = request.nextUrl.searchParams.get('region') || 'all'
  const periodDays = periodParam === 'all' ? 365 : parseInt(periodParam, 10)
  if (![7, 30, 90, 365].includes(periodDays)) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - periodDays)

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, description, experienceLevel, location')
    .eq('isActive', true)
    .gte('crawledAt', cutoff.toISOString())
    .limit(10000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (jobs || []).filter(row => matchesRegion(row.location || '', regionParam))

  // Aggregate skill counts
  const skillCounts: Record<string, Record<string, number>> = {
    languages: {}, chains: {}, tools: {}, domains: {},
  }
  const byLevel: Record<string, Record<string, number>> = {
    entry: {}, mid: {}, senior: {}, lead: {},
  }

  for (const job of rows) {
    const text = ((job.title || '') + ' ' + (job.description || '')).toLowerCase()
    const level = classifyLevel(job.title || '')

    for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
      for (const [name, regex] of Object.entries(skills)) {
        if (regex.test(text)) {
          skillCounts[category][name] = (skillCounts[category][name] || 0) + 1
          byLevel[level][name] = (byLevel[level][name] || 0) + 1
        }
      }
    }
  }

  // Sort each category descending
  const toSorted = (counts: Record<string, number>) =>
    Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

  const response = NextResponse.json({
    languages: toSorted(skillCounts.languages),
    chains: toSorted(skillCounts.chains),
    tools: toSorted(skillCounts.tools),
    domains: toSorted(skillCounts.domains),
    byLevel,
    totalJobs: rows.length,
  })

  response.headers.set('Cache-Control', 'public, s-maxage=300')
  return response
}
