import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/articles/[slug] - Get single article
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createSupabaseServerClient()

    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Increment view count
    await supabase
      .from('articles')
      .update({ view_count: (article.view_count || 0) + 1 })
      .eq('id', article.id)

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Failed to fetch article:', error)
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 })
  }
}

// PUT /api/articles/[slug] - Update article (author or admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createSupabaseServerClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the article first
    const { data: existingArticle, error: fetchError } = await supabase
      .from('articles')
      .select('id, author_id, published')
      .eq('slug', slug)
      .single()

    if (fetchError || !existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check if user is author or admin
    const isAuthor = existingArticle.author_id === user.id
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!isAuthor && !admin) {
      return NextResponse.json({ error: 'Not authorized to edit this article' }, { status: 403 })
    }

    const body = await request.json()
    const { title, slug: newSlug, excerpt, content, cover_image, tags, published } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (title !== undefined) updateData.title = title.slice(0, 60)
    if (newSlug !== undefined) updateData.slug = newSlug
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) updateData.content = content
    if (cover_image !== undefined) updateData.cover_image = cover_image
    if (tags !== undefined) updateData.tags = tags
    if (published !== undefined) {
      updateData.published = published
      if (published && !existingArticle.published) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: article, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Failed to update article:', error)
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
  }
}

// DELETE /api/articles/[slug] - Delete article (author can delete own drafts, admin can delete any)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createSupabaseServerClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the article first
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('id, author_id, published')
      .eq('slug', slug)
      .single()

    if (fetchError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check if user is author or admin
    const isAuthor = article.author_id === user.id
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    // Authors can only delete their own unpublished drafts
    // Admins can delete anything
    if (!admin && (!isAuthor || article.published)) {
      return NextResponse.json({ error: 'Not authorized to delete this article' }, { status: 403 })
    }

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('slug', slug)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete article:', error)
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 })
  }
}
