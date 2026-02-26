/**
 * POST /api/admin/jobs/featured/refresh
 * Admin-only: Recalculates featured scores and updates featured jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { refreshFeaturedJobs } from '@/lib/featured-refresh';

export const dynamic = 'force-dynamic';

export const POST = withAdminAuth(async (_request, _admin) => {
  try {
    const supabase = await createSupabaseServerClient();
    const result = await refreshFeaturedJobs(supabase);

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('POST /api/admin/jobs/featured/refresh error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
});
