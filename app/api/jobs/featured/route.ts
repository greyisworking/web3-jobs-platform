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

    // Select only fields needed for job cards (exclude large text fields)
    const listFields = [
      'id', 'title', 'company', 'url', 'location', 'type', 'category',
      'salary', 'salaryMin', 'salaryMax', 'salaryCurrency', 'tags', 'source', 'region',
      'postedDate', 'crawledAt', 'updatedAt', 'isActive',
      'experienceLevel', 'remoteType', 'companyLogo',
      'backers', 'sector', 'badges'
    ].join(',');

    // Get recent jobs from priority sources (high-quality companies)
    const { data: jobs, error } = await supabase
      .from('Job')
      .select(listFields)
      .eq('isActive', true)
      .in('source', ['priority:greenhouse', 'priority:lever', 'priority:ashby'])
      .order('postedDate', { ascending: false })
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
  } catch (err) {
    console.error('GET /api/jobs/featured error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
