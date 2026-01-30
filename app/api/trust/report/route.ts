import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/trust/report - Create a report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reporterWallet, targetWallet, targetType, category, reason, evidenceUrls } = body

    if (!reporterWallet || !targetWallet || !category || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (reporterWallet.toLowerCase() === targetWallet.toLowerCase()) {
      return NextResponse.json({ error: "You can't report yourself" }, { status: 400 })
    }

    // Create report
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_wallet: reporterWallet.toLowerCase(),
        target_wallet: targetWallet.toLowerCase(),
        target_type: targetType || 'user',
        category,
        reason,
        evidence_urls: evidenceUrls || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating report:', error)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    // Log the action
    await supabase.from('trust_logs').insert([
      {
        wallet: reporterWallet.toLowerCase(),
        action: 'report_filed',
        related_wallet: targetWallet.toLowerCase(),
        related_id: data.id,
        reason: category,
      },
      {
        wallet: targetWallet.toLowerCase(),
        action: 'report_received',
        related_wallet: reporterWallet.toLowerCase(),
        related_id: data.id,
        reason: category,
      },
    ])

    // Update trust score cache
    await supabase.rpc('update_trust_score_cache', { p_wallet: targetWallet.toLowerCase() })

    return NextResponse.json({
      success: true,
      report: {
        id: data.id,
        reporterWallet: data.reporter_wallet,
        targetWallet: data.target_wallet,
        category: data.category,
        status: data.status,
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    console.error('Error in report API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/trust/report?target=0x... - Get reports against a wallet
export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('target')

  if (!target) {
    return NextResponse.json({ error: 'Target wallet required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('target_wallet', target.toLowerCase())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }

  return NextResponse.json({
    reports: data?.map(r => ({
      id: r.id,
      reporterWallet: r.reporter_wallet,
      targetWallet: r.target_wallet,
      targetType: r.target_type,
      category: r.category,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
    })) || [],
  })
}
