import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

const supabase = createSupabaseServiceClient()

// GET /api/trust?wallet=0x...
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
  }

  try {
    // Get trust score
    const { data: trustScore } = await supabase
      .from('trust_scores')
      .select('*')
      .eq('wallet', wallet.toLowerCase())
      .single()

    // Get vouches received
    const { data: vouches } = await supabase
      .from('vouches')
      .select('*')
      .eq('vouchee_wallet', wallet.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(20)

    // Check blacklist
    const { data: blacklistEntry } = await supabase
      .from('blacklist')
      .select('*')
      .eq('wallet', wallet.toLowerCase())
      .is('lifted_at', null)
      .single()

    // Default score for new users
    const score = trustScore || {
      wallet: wallet.toLowerCase(),
      score: 50,
      vouch_count: 0,
      vouched_by_count: vouches?.length || 0,
      reports_against: 0,
      is_verified: false,
      is_blacklisted: !!blacklistEntry,
    }

    return NextResponse.json({
      trustScore: {
        wallet: score.wallet,
        score: score.score,
        vouchCount: score.vouch_count,
        vouchedByCount: score.vouched_by_count,
        reportsAgainst: score.reports_against,
        isVerified: score.is_verified,
        isBlacklisted: score.is_blacklisted,
      },
      vouches: vouches?.map(v => ({
        id: v.id,
        voucherWallet: v.voucher_wallet,
        voucheeWallet: v.vouchee_wallet,
        message: v.message,
        createdAt: v.created_at,
      })) || [],
    })
  } catch (error) {
    console.error('Error fetching trust data:', error)
    return NextResponse.json({ error: 'Failed to fetch trust data' }, { status: 500 })
  }
}
