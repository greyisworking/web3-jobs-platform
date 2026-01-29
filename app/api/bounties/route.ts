import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/bounties - List bounties
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') || 'open'
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('bounties')
      .select('*', { count: 'exact' })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: bounties, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      bounties: bounties || [],
      total: count || 0
    })
  } catch (error) {
    console.error('Bounties fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch bounties' }, { status: 500 })
  }
}

// POST /api/bounties - Create a new bounty
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()

    const {
      title,
      description,
      reward_amount,
      reward_token = 'ETH',
      reward_chain_id = 1,
      poster_address,
      poster_ens,
      category,
      skills,
      deadline,
    } = body

    if (!title || !reward_amount || !poster_address) {
      return NextResponse.json(
        { error: 'Title, reward amount, and poster address are required' },
        { status: 400 }
      )
    }

    const { data: bounty, error } = await supabase
      .from('bounties')
      .insert({
        title,
        description,
        reward_amount,
        reward_token,
        reward_chain_id,
        poster_address: poster_address.toLowerCase(),
        poster_ens,
        category,
        skills,
        deadline,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      bounty,
      message: 'get that bread'
    })
  } catch (error) {
    console.error('Bounty creation error:', error)
    return NextResponse.json({ error: 'Failed to create bounty' }, { status: 500 })
  }
}
