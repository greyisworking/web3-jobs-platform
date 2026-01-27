# Test Report

**Generated**: 2026-01-27T13:28:34.879Z

## Overall Summary

| Metric | Value |
|--------|-------|
| Suites Run | 4 |
| Suites Passed | 4 |
| Suites Failed | 0 |
| Total Duration | 24060ms |

## Suite Results

| Suite | Status | Duration |
|-------|--------|----------|
| Unit Tests | ✅ PASS | 433ms |
| API Tests | ✅ PASS | 4074ms |
| E2E Tests | ✅ PASS | 18817ms |
| Data Quality Tests | ✅ PASS | 736ms |

## Unit Tests

```

🧪 Unit Tests

  [32m✓[0m Verified badge with Hashed backer (0ms)
  [32m✓[0m Verified badge with a16z backer (case-insensitive) (0ms)
  [32m✓[0m Verified badge with Paradigm backer (0ms)
  [32m✓[0m No Verified badge for non-matching backer (Kakao) (0ms)
  [32m✓[0m No Verified badge when backers is null (0ms)
  [32m✓[0m Web3 Perks badge with hasToken: true (0ms)
  [32m✓[0m Web3 Perks badge when description mentions equity (0ms)
  [32m✓[0m Web3 Perks badge when description mentions vesting (0ms)
  [32m✓[0m Pre-IPO badge for Seed stage (0ms)
  [32m✓[0m Pre-IPO badge for Series A stage (0ms)
  [32m✓[0m No Pre-IPO badge for Established stage (0ms)
  [32m✓[0m Remote badge when location contains "remote" (0ms)
  [32m✓[0m No Remote badge for Seoul location (0ms)
  [32m✓[0m Active badge for job posted within 30 days (1ms)
  [32m✓[0m No Active badge for job posted 60 days ago (0ms)
  [32m✓[0m English badge for >70% ASCII description (0ms)
  [32m✓[0m No English badge for Korean text (0ms)
  [32m✓[0m No English badge for short text (<= 20 chars) (0ms)
  [32m✓[0m Multiple badges at once (0ms)
  [32m✓[0m Empty job returns no badges (0ms)
  [32m✓[0m Find by exact name (Hashed) (0ms)
  [32m✓[0m Find by alias (DSRV Labs) (0ms)
  [32m✓[0m Case-insensitive search (hashed) (0ms)
  [32m✓[0m Returns null for unknown company (0ms)
  [32m✓[0m Returns null for empty string (0ms)
  [32m✓[0m Valid minimal job passes, defaults applied (1ms)
  [32m✓[0m Missing title fails (0ms)
  [32m✓[0m Missing company fails (0ms)
  [32m✓[0m Missing url fails (0ms)
  [32m✓[0m Missing source fails (0ms)
  [32m✓[0m Short title (1 char) fails (0ms)
  [32m✓[0m Invalid URL fails (0ms)

[1mResults: 32 passed, 0 failed, 0 skipped out of 32[0m

```

## API Tests

```

🌐 API Tests

  [32m✓[0m GET /api/jobs returns 200 with jobs[] and stats{} (386ms)
  [32m✓[0m Response time < 2000ms (221ms)
  [32m✓[0m Jobs have required fields (id, title, company, url, source, region) (242ms)
  [32m✓[0m Jobs limited to ≤500 (227ms)
  [32m✓[0m ?badge=Verified returns only Verified jobs (or empty) (163ms)
  [32m✓[0m ?backer=Hashed returns only Hashed-backed jobs (or empty) (177ms)
  [32m✓[0m ?badge=NonExistent returns 200 (no crash) (117ms)
  [32m✓[0m stats.sources is a non-empty array (bug fix #2) (176ms)
  [32m✓[0m ?status=all no longer exposes inactive jobs (bug fix #1) (193ms)
  [32m✓[0m 10 concurrent requests all succeed (616ms)
  [32m✓[0m GET /api/admin/jobs returns 401 without auth (206ms)
  [32m✓[0m POST /api/admin/jobs/approve returns 401 without auth (73ms)
  [32m✓[0m POST /api/admin/jobs/reject returns 401 without auth (68ms)
  [32m✓[0m POST /api/admin/jobs/delete returns 401 without auth (72ms)
  [32m✓[0m POST /api/admin/jobs/merge returns 401 without auth (71ms)
  [32m✓[0m POST /api/admin/jobs/badges returns 401 without auth (95ms)
  [32m✓[0m GET /api/admin/jobs/duplicates returns 401 without auth (95ms)
  [32m✓[0m GET /api/admin/monitoring/crawl-history returns 401 without auth (102ms)
  [32m✓[0m GET /api/admin/monitoring/proxies returns 401 without auth (98ms)
  [32m✓[0m GET /api/admin/monitoring/errors returns 401 without auth (105ms)
  [32m✓[0m GET /api/admin/monitoring/stats returns 401 without auth (129ms)
  [32m✓[0m GET /api/admin/analytics/searches returns 401 without auth (107ms)

[1mResults: 22 passed, 0 failed, 0 skipped out of 22[0m

```

## E2E Tests

```

🖥️  E2E Tests

  [32m✓[0m Homepage loads, shows "Web3 Jobs Platform" heading (2583ms)
  [32m✓[0m Stats cards render (Total Jobs, Global, Korea) (99ms)
  [32m✓[0m All 7 filter dropdowns/inputs present (6ms)
  [32m✓[0m Search filter: type "developer", job count changes (1506ms)
  [32m✓[0m Region filter: select Korea, jobs show Korea (872ms)
  [32m✓[0m Job Type filter: select Full-time, count changes (1097ms)
  [32m✓[0m Location filter: select Remote, count changes (993ms)
  [32m✓[0m Source filter: select web3.career, all jobs show that source (866ms)
  [32m✓[0m Badge filter: select Active, jobs have Active badge (978ms)
  [32m✓[0m Clear all resets filters (879ms)
  [32m✓[0m Filter combination: Search + Region (1093ms)
  [32m✓[0m Active filter pills appear and are removable (686ms)
  [32m✓[0m Zero results shows empty message (1412ms)
  [32m✓[0m Job card has Apply button with valid href (85ms)
  [32m✓[0m Responsive: mobile (375px) — filters stack vertically (994ms)
  [32m✓[0m Responsive: tablet (768px) — layout adapts (990ms)
  [32m✓[0m Admin login page loads with form (1522ms)

[1mResults: 17 passed, 0 failed, 0 skipped out of 17[0m

```

## Data Quality Tests

```

📊 Data Quality Tests

  Fetched 256 jobs for analysis

  [32m✓[0m No null/empty titles (0ms)
  [32m✓[0m No null/empty companies (0ms)
  [32m✓[0m All URLs valid (start with http) (0ms)
  [32m✓[0m No duplicate URLs (0ms)
  [32m✓[0m All regions are "Global" or "Korea" (0ms)
  [32m✓[0m No empty type fields (0ms)
  [32m✓[0m No empty source fields (0ms)
  [32m✓[0m All badge values are from known set (0ms)

    Source Distribution:
      remoteok.com: 63
      web3kr.jobs: 59
      web3.career: 39
      jobs.solana.com: 28
      jobs.sui.io: 23
      remote3.co: 13
      ethereum.foundation: 11
      cryptojobslist.com: 7
      jobkorea.co.kr: 5
      rocketpunch.com: 5
      priority:wanted: 3
  [32m✓[0m Source distribution report (1ms)

    Region Distribution:
      Global: 184
      Korea: 72
  [32m✓[0m Region distribution report (0ms)

    Badge Distribution:
      Active: 106
      Remote: 78
  [32m✓[0m Badge distribution report (0ms)

    Job Type Distribution:
      Full-time: 186
      정규직: 56
      FullTime: 7
      Contract: 4
      Part-time: 2
      Internship: 1
  [32m✓[0m Job type distribution report (0ms)

    Priority company jobs: 3
      priority:wanted: 3
  [32m✓[0m Count priority-company jobs (source starts with priority:) (0ms)
  [32m✓[0m Stats totals are consistent (0ms)

[1mResults: 14 passed, 0 failed, 0 skipped out of 14[0m

```

