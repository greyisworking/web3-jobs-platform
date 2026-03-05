import { NextRequest, NextResponse } from 'next/server'
import {
  isValidWalletAddress,
  checkRateLimit,
  rateLimitedResponse,
  checkSybilRisk,
  meetsMinimumRequirements,
  isSelfAction,
  sanitizeInput,
} from '@/lib/security'
import { requireCSRF } from '@/lib/csrf'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

const supabase = createSupabaseServiceClient()

// POST /api/trust/vouch - Create a vouch
export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfError = requireCSRF(request)
  if (csrfError) return csrfError

  try {
    const body = await request.json()
    const { voucherWallet, voucheeWallet, message } = body

    // Validate required fields
    if (!voucherWallet || !voucheeWallet) {
      return NextResponse.json({ error: 'Wallet address is required.' }, { status: 400 })
    }

    // Validate wallet address format
    if (!isValidWalletAddress(voucherWallet) || !isValidWalletAddress(voucheeWallet)) {
      return NextResponse.json({ error: 'Invalid wallet address format.' }, { status: 400 })
    }

    // Self-action prevention
    if (isSelfAction(voucherWallet, voucheeWallet)) {
      return NextResponse.json({ error: 'You cannot vouch for yourself.' }, { status: 400 })
    }

    // Rate limiting
    const rateLimit = checkRateLimit(voucherWallet.toLowerCase(), 'vouch')
    if (rateLimit.limited) {
      return rateLimitedResponse(rateLimit.retryAfter!)
    }

    // Check minimum requirements
    const requirements = await meetsMinimumRequirements(voucherWallet)
    if (!requirements.eligible) {
      return NextResponse.json({ error: requirements.reason }, { status: 403 })
    }

    // Sybil risk check
    const sybilCheck = await checkSybilRisk(voucherWallet)
    if (sybilCheck.isSuspicious && sybilCheck.riskScore >= 70) {
      console.warn(`High sybil risk detected for ${voucherWallet}: ${sybilCheck.reason}`)
      return NextResponse.json({
        error: 'Suspicious activity detected. Please try again later.',
      }, { status: 403 })
    }

    // Check if already vouched (duplicate prevention)
    const { data: existing } = await supabase
      .from('vouches')
      .select('id')
      .eq('voucher_wallet', voucherWallet.toLowerCase())
      .eq('vouchee_wallet', voucheeWallet.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You have already vouched for this user.' }, { status: 400 })
    }

    // Sanitize message input
    const sanitizedMessage = message ? sanitizeInput(message, { limitKey: 'message' }) : null

    // Create vouch
    const { data, error } = await supabase
      .from('vouches')
      .insert({
        voucher_wallet: voucherWallet.toLowerCase(),
        vouchee_wallet: voucheeWallet.toLowerCase(),
        message: sanitizedMessage,
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
