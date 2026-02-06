/**
 * Featured Jobs Refresh Orchestrator
 * Fetches all active jobs, scores them, and syncs featured status.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { computeFeaturedScore } from './featured-score';

const FEATURED_LIMIT = 6;

interface RefreshResult {
  updated: number;
  pinned: number;
  topScored: number;
}

export async function refreshFeaturedJobs(
  supabase: SupabaseClient,
): Promise<RefreshResult> {
  // 1. Fetch all active jobs
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, backers, postedDate, salary, salaryMin, salaryMax, type, featured_pinned')
    .eq('isActive', true);

  if (error) throw new Error(`Failed to fetch jobs: ${error.message}`);
  if (!jobs || jobs.length === 0) return { updated: 0, pinned: 0, topScored: 0 };

  // 2. Compute scores for all jobs
  const scored = jobs.map((job) => ({
    id: job.id as string,
    score: computeFeaturedScore(job),
    pinned: job.featured_pinned === true,
  }));

  // 3. Batch update featured_score
  for (const item of scored) {
    await supabase
      .from('Job')
      .update({ featured_score: item.score })
      .eq('id', item.id);
  }

  // 4. Determine top 6: pinned first, then highest scored
  const pinned = scored.filter((j) => j.pinned);
  const unpinned = scored
    .filter((j) => !j.pinned)
    .sort((a, b) => b.score - a.score);

  const winners: string[] = [
    ...pinned.map((j) => j.id),
    ...unpinned.map((j) => j.id),
  ].slice(0, FEATURED_LIMIT);

  const winnersSet = new Set(winners);
  const losers = scored.filter((j) => !winnersSet.has(j.id)).map((j) => j.id);

  // 5. Mark winners as featured
  if (winners.length > 0) {
    await supabase
      .from('Job')
      .update({ is_featured: true, featured_at: new Date().toISOString() })
      .in('id', winners);
  }

  // 6. Clear featured from losers (batch in chunks to avoid query limits)
  const CHUNK_SIZE = 500;
  for (let i = 0; i < losers.length; i += CHUNK_SIZE) {
    const chunk = losers.slice(i, i + CHUNK_SIZE);
    await supabase
      .from('Job')
      .update({ is_featured: false, featured_at: null })
      .in('id', chunk);
  }

  return {
    updated: scored.length,
    pinned: pinned.length,
    topScored: Math.min(unpinned.length, FEATURED_LIMIT - pinned.length),
  };
}
