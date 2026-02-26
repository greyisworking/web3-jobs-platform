import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Map error_type to level for UI compatibility
const errorTypeToLevel: Record<string, string> = {
  network: 'ERROR',
  parse: 'WARN',
  validation: 'WARN',
  auth: 'CRITICAL',
  rate_limit: 'ERROR',
  unknown: 'ERROR',
}

const levelToErrorTypes: Record<string, string[]> = {
  CRITICAL: ['auth'],
  ERROR: ['network', 'rate_limit', 'unknown'],
  WARN: ['parse', 'validation'],
  INFO: [],
}

export const GET = withAdminAuth(async (request, _admin) => {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level') || undefined
  const keyword = searchParams.get('keyword') || undefined
  const dateFrom = searchParams.get('date_from') || undefined
  const dateTo = searchParams.get('date_to') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
  const offset = (page - 1) * pageSize

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('CrawlerErrors')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  // Filter by level (mapped to error_type)
  if (level && levelToErrorTypes[level]) {
    const types = levelToErrorTypes[level]
    if (types.length > 0) {
      query = query.in('error_type', types)
    }
  }

  if (keyword) {
    query = query.or(
      `message.ilike.%${keyword}%,source.ilike.%${keyword}%`
    )
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }

  const { data: rawLogs, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to match existing UI format
  const logs = (rawLogs || []).map((log) => ({
    id: log.id,
    timestamp: log.created_at,
    level: errorTypeToLevel[log.error_type] || 'ERROR',
    crawler_name: log.source,
    message: log.message,
    stack_trace: log.stack,
    url: log.url,
    status_code: log.status_code,
    error_type: log.error_type,
  }))

  return NextResponse.json({
    logs,
    total: count || 0,
    page,
    pageSize,
  })
})
