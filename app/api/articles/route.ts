import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/articles - List published articles
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const tag = searchParams.get('tag')

    let query = supabase
      .from('articles')
      .select(`
        id, slug, title, excerpt, cover_image,
        author_name, author_address, author_ens,
        tags, reading_time, collect_count, tip_amount,
        published_at, view_count
      `, { count: 'exact' })
      .eq('published', true)
      .order('published_at', { ascending: false })

    // Filter by tag if provided
    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data: articles, error, count } = await query.range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({ articles: articles || [], total: count || 0 })
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

// POST /api/articles - Create article (authenticated users)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      tags,
      published,
      author_address,
      author_ens,
      author_name,
      author_email,
      author_avatar,
      reading_time,
    } = body

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Title, slug, and content are required' }, { status: 400 })
    }

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Use provided author info or fall back to user data
    const authorId = user.id
    const finalAuthorName = author_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous'
    const finalAuthorAddress = author_address || null
    const finalAuthorEns = author_ens || null
    const finalAuthorEmail = author_email || user.email || null
    const finalAuthorAvatar = author_avatar || user.user_metadata?.avatar_url || null

    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title: title.slice(0, 60),
        slug,
        excerpt,
        content,
        cover_image,
        tags: tags || [],
        author_id: authorId,
        author_name: finalAuthorName,
        author_address: finalAuthorAddress,
        author_ens: finalAuthorEns,
        author_email: finalAuthorEmail,
        author_avatar: finalAuthorAvatar,
        reading_time: reading_time || 1,
        published,
        published_at: published ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Failed to create article:', error)
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}
