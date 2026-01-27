/**
 * Badge Engine
 * Computes and assigns badges to jobs based on configurable rules
 */

export const BADGE_VALUES = [
  'Verified',
  'Web3 Perks',
  'Pre-IPO',
  'Remote',
  'Active',
  'English',
] as const;

export type BadgeValue = (typeof BADGE_VALUES)[number];

export const BADGE_CONFIG: Record<BadgeValue, { bg: string; text: string }> = {
  Verified: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-800 dark:text-blue-200',
  },
  'Web3 Perks': {
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-800 dark:text-purple-200',
  },
  'Pre-IPO': {
    bg: 'bg-amber-100 dark:bg-amber-900',
    text: 'text-amber-800 dark:text-amber-200',
  },
  Remote: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-800 dark:text-green-200',
  },
  Active: {
    bg: 'bg-emerald-100 dark:bg-emerald-900',
    text: 'text-emerald-800 dark:text-emerald-200',
  },
  English: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-800 dark:text-gray-200',
  },
};

interface JobForBadges {
  backers?: string[] | null;
  description?: string | null;
  location?: string | null;
  postedDate?: string | Date | null;
  hasToken?: boolean;
  stage?: string | null;
}

const VERIFIED_BACKERS = ['Hashed', 'a16z', 'Paradigm'];

/**
 * Compute badges for a job based on its properties.
 * Pure function — no side effects.
 */
export function computeBadges(job: JobForBadges): BadgeValue[] {
  const badges: BadgeValue[] = [];
  const desc = (job.description ?? '').toLowerCase();

  // 1. Verified — backed by Hashed, a16z, or Paradigm
  if (job.backers?.some((b) => VERIFIED_BACKERS.some((vb) => b.toLowerCase() === vb.toLowerCase()))) {
    badges.push('Verified');
  }

  // 2. Web3 Perks — has token or description mentions equity/token
  if (job.hasToken || /\b(token|equity|stock\s*option|vesting)\b/i.test(desc)) {
    badges.push('Web3 Perks');
  }

  // 3. Pre-IPO — stage indicates pre-IPO
  if (job.stage && /^(seed|pre-seed|series\s*[a-c]|pre-ipo)/i.test(job.stage)) {
    badges.push('Pre-IPO');
  }

  // 4. Remote — location includes "remote"
  const loc = (job.location ?? '').toLowerCase();
  if (loc.includes('remote')) {
    badges.push('Remote');
  }

  // 5. Active — postedDate within last 30 days
  if (job.postedDate) {
    const posted = typeof job.postedDate === 'string' ? new Date(job.postedDate) : job.postedDate;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (posted >= thirtyDaysAgo) {
      badges.push('Active');
    }
  }

  // 6. English — ASCII ratio > 70% in description text
  if (job.description && job.description.length > 20) {
    const ascii = job.description.replace(/[^\x00-\x7F]/g, '').length;
    const ratio = ascii / job.description.length;
    if (ratio > 0.7) {
      badges.push('English');
    }
  }

  return badges;
}
