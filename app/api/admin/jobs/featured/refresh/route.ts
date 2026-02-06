/**
 * POST /api/admin/jobs/featured/refresh
 * Admin-only: Recalculates featured scores and updates featured jobs.
 */

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { refreshFeaturedJobs } from '@/lib/featured-refresh';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await getAdminUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await refreshFeaturedJobs(supabase);

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('POST /api/admin/jobs/featured/refresh error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
