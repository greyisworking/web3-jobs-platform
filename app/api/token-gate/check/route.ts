import { NextRequest, NextResponse } from 'next/server'
import { checkTokenBalance } from '@/lib/onchain'

// POST /api/token-gate/check - Check if user meets token gate requirements
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, gate } = body

    if (!address || !gate) {
      return NextResponse.json({ error: 'Address and gate config required' }, { status: 400 })
    }

    const { type, contract, minBalance = 1, tokenId, chainId } = gate

    // For now, only support Ethereum mainnet
    if (chainId && chainId !== 1) {
      return NextResponse.json({
        hasAccess: false,
        message: 'Only Ethereum mainnet supported for now'
      })
    }

    const hasAccess = await checkTokenBalance(
      address,
      contract,
      type,
      minBalance,
      tokenId
    )

    return NextResponse.json({
      hasAccess,
      message: hasAccess ? 'welcome holder' : 'holders only. sorry anon'
    })
  } catch (error) {
    console.error('Token gate check error:', error)
    return NextResponse.json({ error: 'Failed to check token gate' }, { status: 500 })
  }
}
