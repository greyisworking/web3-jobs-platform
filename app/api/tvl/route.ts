import { NextRequest, NextResponse } from 'next/server'
import { getTVLByCompany } from '@/lib/api/defillama'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')

  if (!company) {
    return NextResponse.json({ error: 'Company name required' }, { status: 400 })
  }

  try {
    const tvl = await getTVLByCompany(company)
    return NextResponse.json({ tvl })
  } catch (error) {
    console.error('TVL API error:', error)
    return NextResponse.json({ tvl: null })
  }
}
