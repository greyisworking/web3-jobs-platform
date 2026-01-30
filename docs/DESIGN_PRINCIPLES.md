# NEUN Design & Development Principles

> Web3 Jobs Platform Design System & UX Guidelines

---

## 1. Brand Principles

| Item | Description |
|------|-------------|
| **Mission** | Connect Web3 talent with opportunities |
| **Tone & Manner** | Friendly + Meme Culture + Professional |
| **Mascot** | Pixelbara |
| **Target** | Web3 job seekers + Recruiters |
| **Slogan** | "Find your next Web3 opportunity" |

### Brand Voice
- Use Web3 slang naturally (gm, ser, wagmi, ngmi, alpha, etc.)
- Friendly but not unprofessional
- Encourage without being pushy
- Celebrate user achievements

---

## 2. Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--neun-primary` | `#22C55E` | Primary actions, CTAs, success states |
| `--neun-primary-hover` | `#16A34A` | Hover states |
| `--a24-bg` (dark) | `#0F172A` | Dark mode background |
| `--a24-bg` (light) | `#FFFFFF` | Light mode background |
| `--a24-surface` (dark) | `#1E293B` | Card backgrounds (dark) |
| `--a24-surface` (light) | `#F8FAFC` | Card backgrounds (light) |
| `--a24-text` (dark) | `#F8FAFC` | Primary text (dark) |
| `--a24-text` (light) | `#1E293B` | Primary text (light) |
| `--a24-muted` | `#64748B` / `#94A3B8` | Secondary text |
| `--a24-border` | `#E2E8F0` / `#334155` | Borders |
| `--neun-danger` | `#EF4444` | Errors, destructive actions |
| `--neun-warning` | `#F59E0B` | Warnings, cautions |
| `--neun-success` | `#22C55E` | Success states |
| `--neun-info` | `#3B82F6` | Information |

### Typography

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Heading 1 | 48px | Bold (700) | Page titles |
| Heading 2 | 36px | Bold (700) | Section titles |
| Heading 3 | 24px | SemiBold (600) | Card titles |
| Body | 16px | Regular (400) | Body text |
| Small | 14px | Regular (400) | Secondary text |
| Caption | 12px | Regular (400) | Labels, metadata |
| Pixel Font | Press Start 2P | - | Meme text only |

**Font Stack:**
```css
font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
```

### Spacing (8px Grid)

| Token | Value |
|-------|-------|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |
| `space-16` | 64px |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Small elements |
| `radius-md` | 8px | Cards, inputs |
| `radius-lg` | 12px | Modals |
| `radius-full` | 9999px | Pills, avatars |

### Shadows

```css
/* Card shadow */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* Modal shadow */
box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);

/* Green glow (primary) */
box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);

/* Card hover (dark mode) */
box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(34, 197, 94, 0.1);
```

---

## 3. UX Principles

### Core Principles

| Principle | Description |
|-----------|-------------|
| **3-Second Rule** | User understands site purpose within 3 seconds |
| **3-Click Rule** | Goal achievement within 3 clicks |
| **Friendly Errors** | Include solution in error messages |
| **Meaningful Empty States** | Pixelbara + Next action CTA |

### UX Laws Applied

#### Fitts's Law
> The time to reach a target is proportional to the distance and inversely proportional to the size.

**Implementation:**
- All buttons/touch targets minimum **44x44px**
- Primary CTAs placed in thumb-reachable areas on mobile
- Important actions near screen center
- CSS class: `.touch-target-44`

#### Hick's Law
> The time to make a decision increases with the number and complexity of choices.

**Implementation:**
- Minimize choices through categorization
- Progressive disclosure for filters
- Navigation limited to **7 items or less**
- Meme poses organized into category tabs

#### Miller's Law
> The average person can hold 7 (plus/minus 2) items in working memory.

**Implementation:**
- Job card info limited to **5-7 items**
- Section items **7 or less**
- Chunked information display
- Clear visual hierarchy

#### Postel's Law
> Be liberal in what you accept, conservative in what you send.

**Implementation:**
- Search with **fuzzy matching** (typo tolerance)
- Flexible form inputs
- Accept various date formats
- Graceful degradation
- See: `lib/fuzzy-search.ts`

#### Peak-End Rule
> People judge experiences based on the peak moment and the end.

**Implementation:**
- Meme download: Celebration with confetti
- Job application: "Good luck anon!" encouragement
- First article: "Welcome to the alpha club!" celebration
- Milestone achievements: Trophy + congratulations
- See: `components/ui/Celebration.tsx`

#### Von Restorff Effect
> Items that stand out are more likely to be remembered.

**Implementation:**
- Urgent hiring: **Red badge + pulse animation**
- Featured jobs: **Green border glow**
- NEW badge: **Emphasized styling**
- CSS classes: `.badge-urgent`, `.badge-recommended`, `.badge-new-emphasis`

#### Doherty Threshold
> Productivity soars when computer and users interact at a pace (<400ms) that ensures neither has to wait.

**Implementation:**
- All pages respond within **0.4 seconds**
- Skeleton UI displayed immediately
- Optimistic updates (bookmark reflects instantly)
- Progress bars for longer operations
- See: `components/ui/Progress.tsx`, `components/ui/Skeleton.tsx`

---

## 4. Development Principles

### Code Quality

| Principle | Implementation |
|-----------|----------------|
| Component Reuse | Button, Card, Modal, Input in `/components/ui` |
| Type Safety | TypeScript strict mode enabled |
| Error Handling | Error boundaries at page level |
| Consistency | Shared design tokens via CSS variables |

### Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Score | 90+ |
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Core Web Vitals | Pass |

### Performance Techniques
- Mobile-first design (375px baseline)
- `next/image` for optimized images
- Lazy loading for off-screen content
- API caching with SWR
- Code splitting with dynamic imports
- Memoization with `React.memo`, `useMemo`, `useCallback`

### Folder Structure

```
/app
  /components
    /ui          # Reusable UI (Button, Input, Card, Modal...)
    /layout      # Layout components (Header, Footer...)
    /features    # Feature components (JobCard, MemeGenerator...)
  /[page]        # Page routes
/hooks           # Custom React hooks
/lib             # Utilities and helpers
/types           # TypeScript type definitions
/constants       # Constants and config
/public          # Static assets
/docs            # Documentation
```

### Component Guidelines

1. **Single Responsibility** - One component, one purpose
2. **Props Interface** - Always define TypeScript interfaces
3. **Default Props** - Provide sensible defaults
4. **Composition** - Prefer composition over inheritance
5. **Accessibility** - Include ARIA labels, keyboard navigation

---

## 5. Web3 Principles

| Principle | Description |
|-----------|-------------|
| **Wallet = Identity** | Wallet address serves as user ID |
| **Transparent Trust** | Trust Score logic is public |
| **Community Governance** | Report → Vote → Blacklist flow |
| **On-chain Verification** | Verify wallet age, NFTs, transactions |
| **Decentralized Mindset** | User owns their data |

### Trust Score Components

- Wallet age (older = more trusted)
- Transaction history
- NFT holdings
- VC backing verification
- Community vouches
- Report history

---

## 6. Checklist

### New Feature Checklist

- [ ] Follows 8px grid spacing
- [ ] Uses design tokens (not hardcoded colors)
- [ ] Touch targets 44px minimum
- [ ] Mobile-first responsive
- [ ] Dark mode support
- [ ] Loading states with skeleton
- [ ] Error states with helpful message
- [ ] Empty states with Pixelbara
- [ ] Accessible (keyboard nav, ARIA)
- [ ] TypeScript strict compliant

### PR Review Checklist

- [ ] No hardcoded colors (use CSS variables)
- [ ] No magic numbers (use spacing tokens)
- [ ] Components are reusable
- [ ] Proper error handling
- [ ] Performance optimized (memo, lazy load)
- [ ] Mobile responsive
- [ ] Dark mode tested
- [ ] Accessibility checked

---

## Quick Reference

### CSS Classes

```css
/* Touch targets */
.touch-target-44    /* 44px minimum */
.touch-target-48    /* 48px minimum */

/* Badges */
.badge-urgent       /* Red pulse */
.badge-recommended  /* Green glow */
.badge-new-emphasis /* Emphasized NEW */

/* Grid spacing */
.gap-grid-1  /* 8px */
.gap-grid-2  /* 16px */
.gap-grid-3  /* 24px */
.gap-grid-4  /* 32px */

/* Loading */
.skeleton-shimmer   /* Shimmer animation */

/* Celebration */
.celebration-text   /* Gradient shine */
.celebration-bounce /* Bounce animation */
```

### Component Imports

```tsx
import { Button } from '@/app/components/ui'
import { Card, JobCard } from '@/app/components/ui'
import { Input } from '@/app/components/ui'
import { Modal } from '@/app/components/ui'
import { Skeleton, JobCardSkeleton } from '@/app/components/ui'
import { Celebration, useCelebration } from '@/app/components/ui'
import { ProgressBar, LoadingSpinner } from '@/app/components/ui'
import { FadeIn } from '@/app/components/ui'
import { fuzzySearch, fuzzyMatch } from '@/lib/fuzzy-search'
```

---

*Last updated: January 2025*
*Maintained by NEUN Team*
