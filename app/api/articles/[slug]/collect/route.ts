import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { collector_address, collector_ens } = body

    if (!collector_address) {
      return NextResponse.json({ error: 'Collector address required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    // Get article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Insert collector (upsert to avoid duplicates)
    const { error: collectError } = await supabase
      .from('article_collectors')
      .upsert({
        article_id: article.id,
        collector_address,
        collector_ens: collector_ens || null,
        amount: 0,
      }, {
        onConflict: 'article_id,collector_address',
      })

    if (collectError) {
      console.error('Collect error:', collectError)
      return NextResponse.json({ error: 'Failed to collect' }, { status: 500 })
    }

    // Increment collect count
    const { error: updateError } = await supabase.rpc('increment_article_collect', {
      p_article_id: article.id,
    })

    if (updateError) {
      console.error('Update error:', updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Collect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
