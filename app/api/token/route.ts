import { NextRequest, NextResponse } from 'next/server'
import { getTokenInfoByCompany } from '@/lib/api/coingecko'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')

  if (!company) {
    return NextResponse.json({ error: 'Company name required' }, { status: 400 })
  }

  try {
    const token = await getTokenInfoByCompany(company)
    return NextResponse.json({ token })
  } catch (error) {
    console.error('Token API error:', error)
    return NextResponse.json({ token: null })
  }
}
