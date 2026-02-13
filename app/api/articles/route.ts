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

// POST /api/articles - Create article (wallet-connected users or admin)
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
      reading_time,
    } = body

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Title, slug, and content are required' }, { status: 400 })
    }

    // Wallet-based auth - if author_address is provided, use that
    // Otherwise fall back to admin auth
    let authorId = null
    let finalAuthorName = author_name || 'Anonymous'
    let finalAuthorAddress = author_address || null
    let finalAuthorEns = author_ens || null

    if (!author_address) {
      // Check admin auth for non-wallet submissions
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Wallet connection or admin auth required' }, { status: 401 })
      }

      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!admin) {
        return NextResponse.json({ error: 'Admin access required for non-wallet submissions' }, { status: 403 })
      }

      authorId = user.id
      finalAuthorName = user.email?.split('@')[0] || 'NEUN'
    }

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
