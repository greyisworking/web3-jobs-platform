/**
 * Featured Score Engine
 * Computes a score for jobs to determine featured placement.
 * Pure function — no side effects.
 */

export const TOP_VCS_TIER1 = [
  'a16z', 'Paradigm', 'Sequoia', 'Polychain', 'Hashed', 'Binance', 'Coinbase Ventures',
] as const;

export const TOP_VCS_TIER2 = [
  'Dragonfly', 'Pantera', 'Multicoin', 'Lightspeed', 'Framework', 'Tiger Global',
] as const;

export const TOP_VCS_TIER3 = [
  'Haun', 'Hack VC', 'Electric Capital', 'Animoca', '1kx', 'Kakao',
] as const;

export const WEIGHTS = {
  vcTier1: 40,
  vcTier1Cap: 2,
  vcTier2: 25,
  vcTier2Cap: 2,
  vcTier3: 10,
  vcTier3Cap: 2,
  recencyMaxPoints: 50,
  recencyDays: 30,
  salaryHigh: 30,    // ≥200k
  salaryMid: 20,     // ≥100k
  salaryLow: 10,     // ≥50k
  jobTypeFullTime: 15,
  jobTypePartTime: 8,
  jobTypeContract: 5,
} as const;

interface JobForScore {
  backers?: string[] | null;
  postedDate?: Date | string | null;
  salary?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  type?: string | null;
}

function matchVCTier(backers: string[], tier: readonly string[]): number {
  let count = 0;
  for (const backer of backers) {
    const lower = backer.toLowerCase();
    for (const vc of tier) {
      if (lower.includes(vc.toLowerCase())) {
        count++;
        break;
      }
    }
  }
  return count;
}

function parseSalaryNumber(salary: string | null | undefined): number {
  if (!salary) return 0;
  // Extract numbers from salary string (e.g., "$150,000 - $200,000" → 200000)
  const numbers = salary.replace(/[^0-9.]/g, ' ').trim().split(/\s+/).filter(Boolean).map(Number);
  if (numbers.length === 0) return 0;
  // Use the highest number found
  const max = Math.max(...numbers);
  // Handle cases like "150" meaning 150k
  return max < 1000 ? max * 1000 : max;
}

/**
 * Compute a featured score for a job based on VC backing, recency, salary, and job type.
 * Max score: ~175 points.
 */
export function computeFeaturedScore(job: JobForScore): number {
  let score = 0;
  const backers = job.backers ?? [];

  // VC Tier scoring
  const tier1Matches = Math.min(matchVCTier(backers, TOP_VCS_TIER1), WEIGHTS.vcTier1Cap);
  score += tier1Matches * WEIGHTS.vcTier1;

  const tier2Matches = Math.min(matchVCTier(backers, TOP_VCS_TIER2), WEIGHTS.vcTier2Cap);
  score += tier2Matches * WEIGHTS.vcTier2;

  const tier3Matches = Math.min(matchVCTier(backers, TOP_VCS_TIER3), WEIGHTS.vcTier3Cap);
  score += tier3Matches * WEIGHTS.vcTier3;

  // Recency: linear decay over 30 days
  if (job.postedDate) {
    const posted = typeof job.postedDate === 'string' ? new Date(job.postedDate) : job.postedDate;
    const now = new Date();
    const daysOld = (now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld <= WEIGHTS.recencyDays) {
      score += Math.round(WEIGHTS.recencyMaxPoints * (1 - daysOld / WEIGHTS.recencyDays));
    }
  }

  // Salary scoring
  const salaryValue = job.salaryMax ?? job.salaryMin ?? parseSalaryNumber(job.salary);
  if (salaryValue >= 200000) score += WEIGHTS.salaryHigh;
  else if (salaryValue >= 100000) score += WEIGHTS.salaryMid;
  else if (salaryValue >= 50000) score += WEIGHTS.salaryLow;

  // Job type scoring
  const jobType = (job.type ?? '').toLowerCase();
  if (jobType.includes('full')) score += WEIGHTS.jobTypeFullTime;
  else if (jobType.includes('part')) score += WEIGHTS.jobTypePartTime;
  else if (jobType.includes('contract')) score += WEIGHTS.jobTypeContract;

  return score;
}
