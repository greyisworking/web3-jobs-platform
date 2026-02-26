import { NextRequest, NextResponse } from 'next/server'
import {
  isValidWalletAddress,
  checkRateLimit,
  rateLimitedResponse,
  hasDuplicateAction,
  isSelfAction,
  meetsMinimumRequirements,
  sanitizeInput,
  sanitizeUrl,
} from '@/lib/security'
import { requireCSRF } from '@/lib/csrf'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

const supabase = createSupabaseServiceClient()

// Allowed report categories
const ALLOWED_CATEGORIES = ['scam', 'spam', 'harassment', 'impersonation', 'fraud', 'other']

// POST /api/trust/report - Create a report
export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfError = requireCSRF(request)
  if (csrfError) return csrfError

  try {
    const body = await request.json()
    const { reporterWallet, targetWallet, targetType, category, reason, evidenceUrls } = body

    // Validate required fields
    if (!reporterWallet || !targetWallet || !category || !reason) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    // Validate wallet addresses
    if (!isValidWalletAddress(reporterWallet) || !isValidWalletAddress(targetWallet)) {
      return NextResponse.json({ error: '올바른 지갑 주소 형식이 아닙니다.' }, { status: 400 })
    }

    // Self-report prevention
    if (isSelfAction(reporterWallet, targetWallet)) {
      return NextResponse.json({ error: '자기 자신을 신고할 수 없습니다.' }, { status: 400 })
    }

    // Rate limiting - stricter for reports
    const rateLimit = checkRateLimit(reporterWallet.toLowerCase(), 'report')
    if (rateLimit.limited) {
      return rateLimitedResponse(rateLimit.retryAfter!)
    }

    // Check minimum requirements
    const requirements = await meetsMinimumRequirements(reporterWallet)
    if (!requirements.eligible) {
      return NextResponse.json({ error: requirements.reason }, { status: 403 })
    }

    // Duplicate report prevention (within 30 days)
    const isDuplicate = await hasDuplicateAction(reporterWallet, targetWallet, 'report')
    if (isDuplicate) {
      return NextResponse.json({
        error: '이미 이 사용자를 최근에 신고했습니다. 30일 후에 다시 신고할 수 있습니다.',
      }, { status: 400 })
    }

    // Validate category
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: '유효하지 않은 신고 카테고리입니다.' }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedReason = sanitizeInput(reason, { limitKey: 'reason' })
    const sanitizedTargetType = sanitizeInput(targetType || 'user', { limitKey: 'name' })

    // Sanitize and validate evidence URLs
    const sanitizedUrls: string[] = []
    if (Array.isArray(evidenceUrls)) {
      for (const url of evidenceUrls.slice(0, 5)) { // Max 5 URLs
        const sanitized = sanitizeUrl(url)
        if (sanitized) {
          sanitizedUrls.push(sanitized)
        }
      }
    }

    // Create report
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_wallet: reporterWallet.toLowerCase(),
        target_wallet: targetWallet.toLowerCase(),
        target_type: sanitizedTargetType,
        category,
        reason: sanitizedReason,
        evidence_urls: sanitizedUrls,
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
