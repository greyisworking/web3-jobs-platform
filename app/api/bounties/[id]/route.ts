import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/bounties/[id] - Get bounty details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()

    const { data: bounty, error } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    // Get submissions
    const { data: submissions } = await supabase
      .from('bounty_submissions')
      .select('*')
      .eq('bounty_id', id)
      .order('submitted_at', { ascending: false })

    return NextResponse.json({
      bounty,
      submissions: submissions || []
    })
  } catch (error) {
    console.error('Bounty fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch bounty' }, { status: 500 })
  }
}

// PUT /api/bounties/[id] - Update bounty status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const body = await request.json()

    const { status, winner_address, payout_tx_hash } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (winner_address) updateData.winner_address = winner_address.toLowerCase()
    if (payout_tx_hash) updateData.payout_tx_hash = payout_tx_hash

    const { data: bounty, error } = await supabase
      .from('bounties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // If bounty completed, update hunter stats
    if (status === 'completed' && winner_address) {
      await supabase.rpc('update_bounty_hunter_stats', {
        p_address: winner_address.toLowerCase()
      })

      // Update rankings
      await supabase.rpc('update_bounty_rankings')
    }

    return NextResponse.json({ bounty })
  } catch (error) {
    console.error('Bounty update error:', error)
    return NextResponse.json({ error: 'Failed to update bounty' }, { status: 500 })
  }
}
