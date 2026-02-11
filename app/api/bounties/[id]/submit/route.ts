import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// POST /api/bounties/[id]/submit - Submit to a bounty
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const body = await request.json()

    const { hunter_address, hunter_ens, submission_url, description } = body

    if (!hunter_address) {
      return NextResponse.json({ error: 'Hunter address required' }, { status: 400 })
    }

    // Check bounty exists and is open
    const { data: bounty } = await supabase
      .from('bounties')
      .select('id, status')
      .eq('id', id)
      .single()

    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    if (bounty.status !== 'open' && bounty.status !== 'in_progress') {
      return NextResponse.json({ error: 'Bounty is not accepting submissions' }, { status: 400 })
    }

    // Create submission
    const { data: submission, error } = await supabase
      .from('bounty_submissions')
      .upsert({
        bounty_id: id,
        hunter_address: hunter_address.toLowerCase(),
        hunter_ens,
        submission_url,
        description,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      }, {
        onConflict: 'bounty_id,hunter_address'
      })
      .select()
      .single()

    if (error) throw error

    // Update bounty status and submission count
    await supabase
      .from('bounties')
      .update({
        status: 'in_progress',
        submissions_count: bounty.status === 'open' ? 1 : undefined,
      })
      .eq('id', id)

    // Increment submissions count - try RPC first
    try {
      await supabase.rpc('increment', { x: 1, row_id: id, table_name: 'bounties', column_name: 'submissions_count' })
    } catch {
      // RPC might not exist, skip silently
    }

    return NextResponse.json({
      submission,
      message: 'Submission received! Good luck ser'
    })
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
