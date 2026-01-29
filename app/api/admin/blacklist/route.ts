import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: blacklist, error } = await supabase
      .from('WalletBlacklist')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ blacklist: [] })
      }
      throw error
    }

    return NextResponse.json({ blacklist: blacklist || [] })
  } catch (error) {
    console.error('Failed to fetch blacklist:', error)
    return NextResponse.json({ blacklist: [] })
  }
}

export async function POST(request: Request) {
  try {
    const { wallet, reason } = await request.json()

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('WalletBlacklist')
      .upsert({
        wallet: wallet.toLowerCase(),
        reason: reason || 'Manual blacklist by admin',
      }, { onConflict: 'wallet' })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to add to blacklist:', error)
    return NextResponse.json(
      { error: 'Failed to add to blacklist' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { wallet } = await request.json()

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('WalletBlacklist')
      .delete()
      .eq('wallet', wallet.toLowerCase())

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove from blacklist:', error)
    return NextResponse.json(
      { error: 'Failed to remove from blacklist' },
      { status: 500 }
    )
  }
}
