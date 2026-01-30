import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/trust/vouch - Create a vouch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { voucherWallet, voucheeWallet, message } = body

    if (!voucherWallet || !voucheeWallet) {
      return NextResponse.json({ error: 'Both wallet addresses required' }, { status: 400 })
    }

    if (voucherWallet.toLowerCase() === voucheeWallet.toLowerCase()) {
      return NextResponse.json({ error: "You can't vouch for yourself" }, { status: 400 })
    }

    // Check if already vouched
    const { data: existing } = await supabase
      .from('vouches')
      .select('id')
      .eq('voucher_wallet', voucherWallet.toLowerCase())
      .eq('vouchee_wallet', voucheeWallet.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already vouched for this user' }, { status: 400 })
    }

    // Create vouch
    const { data, error } = await supabase
      .from('vouches')
      .insert({
        voucher_wallet: voucherWallet.toLowerCase(),
        vouchee_wallet: voucheeWallet.toLowerCase(),
        message: message || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating vouch:', error)
      return NextResponse.json({ error: 'Failed to create vouch' }, { status: 500 })
    }

    // Log the action
    await supabase.from('trust_logs').insert([
      {
        wallet: voucherWallet.toLowerCase(),
        action: 'vouch_given',
        related_wallet: voucheeWallet.toLowerCase(),
        related_id: data.id,
      },
      {
        wallet: voucheeWallet.toLowerCase(),
        action: 'vouch_received',
        related_wallet: voucherWallet.toLowerCase(),
        related_id: data.id,
      },
    ])

    // Update trust score cache
    await supabase.rpc('update_trust_score_cache', { p_wallet: voucheeWallet.toLowerCase() })

    return NextResponse.json({
      success: true,
      vouch: {
        id: data.id,
        voucherWallet: data.voucher_wallet,
        voucheeWallet: data.vouchee_wallet,
        message: data.message,
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    console.error('Error in vouch API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/trust/vouch - Remove a vouch
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { voucherWallet, voucheeWallet } = body

    if (!voucherWallet || !voucheeWallet) {
      return NextResponse.json({ error: 'Both wallet addresses required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('vouches')
      .delete()
      .eq('voucher_wallet', voucherWallet.toLowerCase())
      .eq('vouchee_wallet', voucheeWallet.toLowerCase())

    if (error) {
      console.error('Error removing vouch:', error)
      return NextResponse.json({ error: 'Failed to remove vouch' }, { status: 500 })
    }

    // Log the action
    await supabase.from('trust_logs').insert({
      wallet: voucherWallet.toLowerCase(),
      action: 'vouch_removed',
      related_wallet: voucheeWallet.toLowerCase(),
    })

    // Update trust score cache
    await supabase.rpc('update_trust_score_cache', { p_wallet: voucheeWallet.toLowerCase() })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in unvouch API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/trust/vouch?voucher=0x...&vouchee=0x... - Check if vouched
export async function GET(request: NextRequest) {
  const voucher = request.nextUrl.searchParams.get('voucher')
  const vouchee = request.nextUrl.searchParams.get('vouchee')

  if (!voucher || !vouchee) {
    return NextResponse.json({ error: 'Both wallet addresses required' }, { status: 400 })
  }

  const { data } = await supabase
    .from('vouches')
    .select('id')
    .eq('voucher_wallet', voucher.toLowerCase())
    .eq('vouchee_wallet', vouchee.toLowerCase())
    .single()

  return NextResponse.json({ hasVouched: !!data })
}
