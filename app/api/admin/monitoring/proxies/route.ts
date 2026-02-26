import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (_request, _admin) => {
  const supabase = await createSupabaseServerClient()

  const { data: proxies, error } = await supabase
    .from('proxy_status')
    .select('*')
    .order('last_checked', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    proxies: proxies || [],
    total: proxies?.length || 0,
  })
})
