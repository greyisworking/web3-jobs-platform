/**
 * POST /api/admin/jobs/badges
 * Bulk badge assignment for selected jobs
 *
 * Body: { ids: string[], badges: string[] }
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  applyMiddleware,
  successResponse,
  errors,
} from '@/lib/api-utils';
import { BADGE_VALUES } from '@/lib/badges';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { error: middlewareError, headers } = applyMiddleware(request);
  if (middlewareError) return middlewareError;

  try {
    const body = await request.json();
    const { ids, badges } = body as { ids?: string[]; badges?: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errors.badRequest('ids must be a non-empty array', undefined, headers);
    }
    if (!badges || !Array.isArray(badges)) {
      return errors.badRequest('badges must be an array', undefined, headers);
    }

    // Validate badge values
    const validBadges = badges.filter((b) =>
      (BADGE_VALUES as readonly string[]).includes(b),
    );

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const id of ids) {
      const { error: updateErr } = await supabase
        .from('jobs')
        .update({ badges: validBadges })
        .eq('id', id);

      results.push({
        id,
        success: !updateErr,
        error: updateErr?.message,
      });
    }

    return successResponse({ updated: results.filter((r) => r.success).length, results }, 200, headers);
  } catch (err: any) {
    console.error('POST /api/admin/jobs/badges error:', err);
    return errors.databaseError(err.message, headers);
  }
}
