import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()

    const { data: job, error } = await supabase
      .from('Job')
      .select('*')
      .eq('id', id)
      .eq('isActive', true)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
