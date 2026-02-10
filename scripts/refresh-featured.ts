/**
 * Standalone script to refresh featured jobs.
 * Usage: npm run refresh:featured
 */

import { createClient } from '@supabase/supabase-js';
import { refreshFeaturedJobs } from '../lib/featured-refresh';
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  console.log('⭐ Refreshing featured jobs...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const result = await refreshFeaturedJobs(supabase);

  console.log(`✅ Featured refresh complete!`);
  console.log(`   📊 Jobs scored: ${result.updated}`);
  console.log(`   📌 Pinned: ${result.pinned}`);
  console.log(`   🏆 Top scored: ${result.topScored}`);
}

main().catch((err) => {
  console.error('❌ Featured refresh failed:', err);
  process.exit(1);
});
