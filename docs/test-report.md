# Test Report

**Generated**: 2026-01-27T12:58:09.314Z

## Summary

| Metric | Count |
|--------|-------|
| Total | 32 |
| Passed | 32 |
| Failed | 0 |
| Skipped | 0 |
| Pass Rate | 100.0% |

## computeBadges (20/20 passed)

| Status | Test | Duration | Error |
|--------|------|----------|-------|
| ✅ PASS | Verified badge with Hashed backer | 0ms |  |
| ✅ PASS | Verified badge with a16z backer (case-insensitive) | 1ms |  |
| ✅ PASS | Verified badge with Paradigm backer | 0ms |  |
| ✅ PASS | No Verified badge for non-matching backer (Kakao) | 0ms |  |
| ✅ PASS | No Verified badge when backers is null | 0ms |  |
| ✅ PASS | Web3 Perks badge with hasToken: true | 0ms |  |
| ✅ PASS | Web3 Perks badge when description mentions equity | 0ms |  |
| ✅ PASS | Web3 Perks badge when description mentions vesting | 0ms |  |
| ✅ PASS | Pre-IPO badge for Seed stage | 0ms |  |
| ✅ PASS | Pre-IPO badge for Series A stage | 0ms |  |
| ✅ PASS | No Pre-IPO badge for Established stage | 0ms |  |
| ✅ PASS | Remote badge when location contains "remote" | 0ms |  |
| ✅ PASS | No Remote badge for Seoul location | 0ms |  |
| ✅ PASS | Active badge for job posted within 30 days | 0ms |  |
| ✅ PASS | No Active badge for job posted 60 days ago | 0ms |  |
| ✅ PASS | English badge for >70% ASCII description | 0ms |  |
| ✅ PASS | No English badge for Korean text | 1ms |  |
| ✅ PASS | No English badge for short text (<= 20 chars) | 0ms |  |
| ✅ PASS | Multiple badges at once | 0ms |  |
| ✅ PASS | Empty job returns no badges | 0ms |  |

## findPriorityCompany (5/5 passed)

| Status | Test | Duration | Error |
|--------|------|----------|-------|
| ✅ PASS | Find by exact name (Hashed) | 0ms |  |
| ✅ PASS | Find by alias (DSRV Labs) | 0ms |  |
| ✅ PASS | Case-insensitive search (hashed) | 0ms |  |
| ✅ PASS | Returns null for unknown company | 0ms |  |
| ✅ PASS | Returns null for empty string | 0ms |  |

## Zod jobSchema (7/7 passed)

| Status | Test | Duration | Error |
|--------|------|----------|-------|
| ✅ PASS | Valid minimal job passes, defaults applied | 1ms |  |
| ✅ PASS | Missing title fails | 0ms |  |
| ✅ PASS | Missing company fails | 0ms |  |
| ✅ PASS | Missing url fails | 0ms |  |
| ✅ PASS | Missing source fails | 0ms |  |
| ✅ PASS | Short title (1 char) fails | 0ms |  |
| ✅ PASS | Invalid URL fails | 0ms |  |

