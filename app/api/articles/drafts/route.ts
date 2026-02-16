import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/articles/drafts - Get current user's draft articles
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: drafts, error } = await supabase
      .from('articles')
      .select(`
        id, slug, title, excerpt, cover_image,
        tags, reading_time, created_at, updated_at
      `)
      .eq('author_id', user.id)
      .eq('published', false)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ drafts: drafts || [] })
  } catch (error) {
    console.error('Failed to fetch drafts:', error)
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 })
  }
}
