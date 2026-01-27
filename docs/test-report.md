# Test Report

**Generated**: 2026-01-27T13:17:36.013Z

## Overall Summary

| Metric | Value |
|--------|-------|
| Suites Run | 4 |
| Suites Passed | 4 |
| Suites Failed | 0 |
| Total Duration | 23897ms |

## Suite Results

| Suite | Status | Duration |
|-------|--------|----------|
| Unit Tests | ✅ PASS | 427ms |
| API Tests | ✅ PASS | 5101ms |
| E2E Tests | ✅ PASS | 17651ms |
| Data Quality Tests | ✅ PASS | 718ms |

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
  [32m✓[0m Active badge for job posted within 30 days (0ms)
  [32m✓[0m No Active badge for job posted 60 days ago (0ms)
  [32m✓[0m English badge for >70% ASCII description (0ms)
  [32m✓[0m No English badge for Korean text (0ms)
  [32m✓[0m No English badge for short text (<= 20 chars) (0ms)
  [32m✓[0m Multiple badges at once (0ms)
  [32m✓[0m Empty job returns no badges (0ms)
  [32m✓[0m Find by exact name (Hashed) (0ms)
  [32m✓[0m Find by alias (DSRV Labs) (0ms)
  [32m✓[0m Case-insensitive search (hashed) (1ms)
  [32m✓[0m Returns null for unknown company (0ms)
  [32m✓[0m Returns null for empty string (0ms)
  [32m✓[0m Valid minimal job passes, defaults applied (0ms)
  [32m✓[0m Missing title fails (1ms)
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

  [32m✓[0m GET /api/jobs returns 200 with jobs[] and stats{} (1123ms)
  [32m✓[0m Response time < 2000ms (220ms)
  [32m✓[0m Jobs have required fields (id, title, company, url, source, region) (270ms)
  [32m✓[0m Jobs limited to ≤500 (168ms)
  [32m✓[0m ?badge=Verified returns only Verified jobs (or empty) (298ms)
  [32m✓[0m ?backer=Hashed returns only Hashed-backed jobs (or empty) (119ms)
  [32m✓[0m ?badge=NonExistent returns 200 (no crash) (121ms)
  [32m✓[0m stats.sources is a non-empty array (bug fix #2) (121ms)
  [32m✓[0m ?status=all no longer exposes inactive jobs (bug fix #1) (165ms)
  [32m✓[0m 10 concurrent requests all succeed (584ms)
  [32m✓[0m GET /api/admin/jobs returns 401 without auth (237ms)
  [32m✓[0m POST /api/admin/jobs/approve returns 401 without auth (105ms)
  [32m✓[0m POST /api/admin/jobs/reject returns 401 without auth (99ms)
  [32m✓[0m POST /api/admin/jobs/delete returns 401 without auth (107ms)
  [32m✓[0m POST /api/admin/jobs/merge returns 401 without auth (113ms)
  [32m✓[0m POST /api/admin/jobs/badges returns 401 without auth (119ms)
  [32m✓[0m GET /api/admin/jobs/duplicates returns 401 without auth (121ms)
  [32m✓[0m GET /api/admin/monitoring/crawl-history returns 401 without auth (119ms)
  [32m✓[0m GET /api/admin/monitoring/proxies returns 401 without auth (122ms)
  [32m✓[0m GET /api/admin/monitoring/errors returns 401 without auth (124ms)
  [32m✓[0m GET /api/admin/monitoring/stats returns 401 without auth (133ms)
  [32m✓[0m GET /api/admin/analytics/searches returns 401 without auth (129ms)

[1mResults: 22 passed, 0 failed, 0 skipped out of 22[0m

```

## E2E Tests

```

🖥️  E2E Tests

  [32m✓[0m Homepage loads, shows "Web3 Jobs Platform" heading (1588ms)
  [32m✓[0m Stats cards render (Total Jobs, Global, Korea) (86ms)
  [32m✓[0m All 7 filter dropdowns/inputs present (5ms)
  [32m✓[0m Search filter: type "developer", job count changes (1463ms)
  [32m✓[0m Region filter: select Korea, jobs show Korea (859ms)
  [32m✓[0m Job Type filter: select Full-time, count changes (1036ms)
  [32m✓[0m Location filter: select Remote, count changes (967ms)
  [32m✓[0m Source filter: select web3.career, all jobs show that source (841ms)
  [32m✓[0m Badge filter: select Active, jobs have Active badge (952ms)
  [32m✓[0m Clear all resets filters (852ms)
  [32m✓[0m Filter combination: Search + Region (1068ms)
  [32m✓[0m Active filter pills appear and are removable (650ms)
  [32m✓[0m Zero results shows empty message (1359ms)
  [32m✓[0m Job card has Apply button with valid href (63ms)
  [32m✓[0m Responsive: mobile (375px) — filters stack vertically (961ms)
  [32m✓[0m Responsive: tablet (768px) — layout adapts (948ms)
  [32m✓[0m Admin login page loads with form (1657ms)

[1mResults: 17 passed, 0 failed, 0 skipped out of 17[0m

```

## Data Quality Tests

```

📊 Data Quality Tests

  Fetched 251 jobs for analysis

  [32m✓[0m No null/empty titles (0ms)
  [32m✓[0m No null/empty companies (0ms)
  [32m✓[0m All URLs valid (start with http) (0ms)
  [32m✓[0m No duplicate URLs (0ms)
  [32m✓[0m All regions are "Global" or "Korea" (0ms)
  [32m✓[0m No empty type fields (0ms)
  [32m✓[0m No empty source fields (1ms)
  [32m✓[0m All badge values are from known set (0ms)

    Source Distribution:
      remoteok.com: 63
      web3kr.jobs: 59
      web3.career: 37
      jobs.solana.com: 25
      jobs.sui.io: 23
      remote3.co: 13
      ethereum.foundation: 11
      cryptojobslist.com: 7
      jobkorea.co.kr: 5
      rocketpunch.com: 5
      priority:wanted: 3
  [32m✓[0m Source distribution report (0ms)

    Region Distribution:
      Global: 179
      Korea: 72
  [32m✓[0m Region distribution report (0ms)

    Badge Distribution:
      Active: 104
      Remote: 78
  [32m✓[0m Badge distribution report (0ms)

    Job Type Distribution:
      Full-time: 181
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

