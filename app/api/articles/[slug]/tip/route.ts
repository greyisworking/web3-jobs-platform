import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { collector_address, collector_ens, amount, tx_hash } = body

    if (!collector_address || !amount) {
      return NextResponse.json({ error: 'Collector address and amount required' }, { status: 400 })
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

    // Record the tip in article_collectors (upsert to update if exists)
    const { error: tipError } = await supabase
      .from('article_collectors')
      .upsert({
        article_id: article.id,
        collector_address,
        collector_ens: collector_ens || null,
        amount,
        tx_hash: tx_hash || null,
      }, {
        onConflict: 'article_id,collector_address',
      })

    if (tipError) {
      console.error('Tip record error:', tipError)
      return NextResponse.json({ error: 'Failed to record tip' }, { status: 500 })
    }

    // Add tip amount to article total
    const { error: updateError } = await supabase.rpc('add_article_tip', {
      p_article_id: article.id,
      p_amount: amount,
    })

    if (updateError) {
      console.error('Update error:', updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tip error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
