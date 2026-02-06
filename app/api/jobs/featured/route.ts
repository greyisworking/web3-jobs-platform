/**
 * GET /api/jobs/featured
 * Returns top 6 featured jobs for homepage display.
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: jobs, error } = await supabase
      .from('Job')
      .select('*')
      .eq('isActive', true)
      .eq('is_featured', true)
      .order('featured_pinned', { ascending: false })
      .order('featured_score', { ascending: false })
      .limit(6);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { jobs: jobs ?? [] },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (err: any) {
    console.error('GET /api/jobs/featured error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
