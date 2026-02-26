import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { syncOnChainProfile, calculateBadges } from '@/lib/onchain'
// GET /api/profile/[address] - Get user profile with badges
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    // Get existing profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single()

    // Get badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('*')
      .eq('wallet_address', address.toLowerCase())

    if (profile) {
      return NextResponse.json({
        profile: {
          ...profile,
          badges: badges || []
        }
      })
    }

    // Profile doesn't exist yet
    return NextResponse.json({
      profile: null,
      message: 'Profile not synced yet'
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// POST /api/profile/[address] - Sync on-chain data and update profile
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { ens_name, display_name, bio } = body

    const supabase = await createSupabaseServerClient()
    const normalizedAddress = address.toLowerCase()

    // Sync on-chain data
    const onChainData = await syncOnChainProfile(normalizedAddress)

    // Upsert profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: normalizedAddress,
        ens_name: ens_name || null,
        display_name: display_name || null,
        bio: bio || null,
        ...onChainData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'wallet_address'
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile upsert error:', profileError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Calculate and update badges
    const earnedBadges = calculateBadges(profile)

    for (const badgeType of earnedBadges) {
      await supabase
        .from('user_badges')
        .upsert({
          wallet_address: normalizedAddress,
          badge_type: badgeType,
          badge_data: {},
          verified_at: new Date().toISOString(),
        }, {
          onConflict: 'wallet_address,badge_type'
        })
    }

    // Get all badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('*')
      .eq('wallet_address', normalizedAddress)

    return NextResponse.json({
      profile: {
        ...profile,
        badges: badges || []
      },
      message: 'ur history is showing ser'
    })
  } catch (error) {
    console.error('Profile sync error:', error)
    return NextResponse.json({ error: 'Failed to sync profile' }, { status: 500 })
  }
}
