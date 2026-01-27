import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type {
  TopSearchQuery,
  SearchTrend,
  SearchAnalyticsResponse,
} from '@/types/analytics'

export const dynamic = 'force-dynamic'

const TECH_KEYWORDS = [
  'solidity', 'rust', 'typescript', 'javascript', 'python', 'go', 'react',
  'nextjs', 'node', 'web3', 'blockchain', 'defi', 'nft', 'smart contract',
  'ethereum', 'solana', 'sui', 'move', 'cairo', 'vyper', 'hardhat',
  'foundry', 'aws', 'docker', 'kubernetes', 'graphql', 'sql',
]

export async function GET(request: NextRequest) {
  try {
    await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('date_from') || undefined
  const dateTo = searchParams.get('date_to') || undefined

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('search_queries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)

  const { data: searches, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const allSearches = searches || []

  // Top 10 queries
  const queryCounts = new Map<string, number>()
  for (const s of allSearches) {
    const q = s.query.toLowerCase().trim()
    queryCounts.set(q, (queryCounts.get(q) || 0) + 1)
  }
  const topQueries: TopSearchQuery[] = [...queryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }))

  // Search trends (group by date)
  const dateCounts = new Map<string, number>()
  for (const s of allSearches) {
    const date = s.created_at.substring(0, 10) // YYYY-MM-DD
    dateCounts.set(date, (dateCounts.get(date) || 0) + 1)
  }
  const trends: SearchTrend[] = [...dateCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))

  // Tech stack popularity from queries
  const techCounts = new Map<string, number>()
  for (const s of allSearches) {
    const lower = s.query.toLowerCase()
    for (const tech of TECH_KEYWORDS) {
      if (lower.includes(tech)) {
        techCounts.set(tech, (techCounts.get(tech) || 0) + 1)
      }
    }
  }
  const techStacks: TopSearchQuery[] = [...techCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([query, count]) => ({ query, count }))

  const response: SearchAnalyticsResponse = {
    topQueries,
    trends,
    techStacks,
    totalSearches: allSearches.length,
  }

  return NextResponse.json(response)
}
