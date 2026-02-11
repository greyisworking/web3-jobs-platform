/**
 * POST /api/admin/jobs/badges
 * Bulk badge assignment for selected jobs
 *
 * Body: { ids: string[], badges: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { BADGE_VALUES } from '@/lib/badges';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await getAdminUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids, badges } = body as { ids?: string[]; badges?: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 });
    }
    if (!badges || !Array.isArray(badges)) {
      return NextResponse.json({ error: 'badges must be an array' }, { status: 400 });
    }

    // Validate badge values
    const validBadges = badges.filter((b) =>
      (BADGE_VALUES as readonly string[]).includes(b),
    );

    const supabase = await createSupabaseServerClient();

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const id of ids) {
      const { error: updateErr } = await supabase
        .from('Job')
        .update({ badges: validBadges })
        .eq('id', id);

      results.push({
        id,
        success: !updateErr,
        error: updateErr?.message,
      });
    }

    return NextResponse.json({
      success: true,
      updated: results.filter((r) => r.success).length,
      results,
    });
  } catch (err) {
    console.error('POST /api/admin/jobs/badges error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
