import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ isAdmin: false })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ isAdmin: !!admin })
  } catch (error) {
    console.error('Admin check failed:', error)
    return NextResponse.json({ isAdmin: false })
  }
}
