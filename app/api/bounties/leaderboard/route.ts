import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/bounties/leaderboard - Get bounty hunter leaderboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const { data: hunters, error } = await supabase
      .from('bounty_hunters')
      .select('*')
      .gt('bounties_completed', 0)
      .order('rank', { ascending: true, nullsFirst: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      hunters: hunters || [],
      message: 'top hunters in the game'
    })
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
