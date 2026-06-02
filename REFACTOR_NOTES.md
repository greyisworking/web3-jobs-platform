# Refactor Notes — refactor/components branch

## Completed

### Phase 1: Shared Utility Extraction

**1. `lib/tier-styles.ts`** — Tier badge styling
- `getTierBadgeClass(tier)`: returns Tailwind classes for P0/P1/P2/top/major/notable
- `getTierLabel(tier)`: returns display label for investor tiers
- **Consumers updated:**
  - `app/ecosystem/page.tsx` (CompanyCard + InvestorCard)
  - `app/ecosystem/[slug]/page.tsx` (company detail)
- **Removed:** 3 copies of 6-line tier style conditional

**2. `lib/escape-html.ts`** — HTML escaping for Telegram messages
- Single `escapeHtml()` function
- **Consumers updated:**
  - `bot/index.ts` (removed local copy)
  - `app/api/cron/check-alerts/route.ts` (removed local copy)

**3. `lib/cron-auth.ts`** — CRON_SECRET auth helper
- `verifyCronAuth(request)`: returns NextResponse error or null
- **Consumers updated:**
  - `app/api/cron/check-alerts/route.ts` (removed inline auth block)
- **Not yet applied to:** crawl, newsletter, cleanup-expired routes (lower priority, same pattern)

## Not Changed (documented for future)

### Phase 2 candidates (component extraction):
- `app/ecosystem/page.tsx` (571 lines) — CompanyCard, InvestorCard could be separate files
- `app/jobs/[id]/CareersDetailClient.tsx` (870 lines) — trust badges, VC reasons extractable
- `app/admin/(dashboard)/Dashboard4DX.tsx` (853 lines) — tab panels extractable

### Phase 3 candidates (Tailwind component classes):
- Recurring patterns: `border border-a24-border dark:border-a24-dark-border`, muted text, page backgrounds
- Could create `@layer components` classes in globals.css

### Phase 4 candidates (data files):
- `app/components/pixelbara-data.ts` (1539 lines) — could be JSON
- `app/learn/library/data.ts` (977 lines) — could be JSON

## Build Status
- All changes: `npm run build` ✅ passes
- No functionality changes — pure structural refactoring
