# NEUN - Claude Instructions

> Reference document for Claude when working on the NEUN Web3 Jobs Platform.

---

## Core Principles

### Brand Identity
- **Mascot:** Pixelbara (pixel capybara with deadpan expression)
- **Tone:** Web3 meme culture + Professional balance
- **Language:** English with Web3 slang (gm ser, wagmi, ngmi, alpha, etc.)
- **Personality:** Friendly, encouraging, slightly ironic

### Design Tokens

```css
/* Colors */
--neun-primary: #22C55E;
--neun-primary-hover: #16A34A;
--a24-bg: #0F172A (dark) / #FFFFFF (light);
--a24-surface: #1E293B (dark) / #F8FAFC (light);
--a24-text: #F8FAFC (dark) / #1E293B (light);
--a24-muted: #94A3B8 (dark) / #64748B (light);
--a24-border: #334155 (dark) / #E2E8F0 (light);
--neun-danger: #EF4444;
--neun-warning: #F59E0B;
--neun-success: #22C55E;

/* Spacing (8px grid) */
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;
```

---

## UX Rules (MUST FOLLOW)

### 1. Fitts's Law - Touch Targets
```tsx
// All interactive elements minimum 44x44px
className="min-h-[44px] min-w-[44px]"
// or use utility class
className="touch-target-44"
```

### 2. Hick's Law - Limit Choices
- Navigation: **7 items max**
- Filter options: Use progressive disclosure
- Categorize when options exceed 7

### 3. Miller's Law - Chunk Information
- Job card: **5-7 info items max**
- Lists: **7 items per section**
- Group related information

### 4. Doherty Threshold - Speed
- Target: **< 0.4 seconds** response
- Always show skeleton/loading state immediately
- Use optimistic updates for instant feedback

### 5. Peak-End Rule - Celebrate Success
```tsx
import { useCelebration } from '@/app/components/ui'

const { celebrate, celebrationProps } = useCelebration()

// Trigger celebration
celebrate('download') // or 'apply', 'firstArticle', 'milestone'

// Render
<Celebration {...celebrationProps} />
```

### 6. Von Restorff Effect - Visual Emphasis
```tsx
// Urgent jobs
className="badge-urgent"

// Featured/recommended
className="badge-recommended"

// New items
className="badge-new-emphasis"
```

### 7. Postel's Law - Flexible Input
```tsx
import { fuzzySearch, fuzzyMatch } from '@/lib/fuzzy-search'

// Fuzzy search with typo tolerance
const results = fuzzySearch(items, query, {
  keys: ['title', 'company'],
  threshold: 0.3
})
```

---

## Code Rules

### TypeScript
- **Strict mode** is enabled - follow it
- Always define interfaces for props
- No `any` types without justification

### Components
- Reuse from `/app/components/ui`
- Available: `Button`, `Card`, `Input`, `Modal`, `Skeleton`, `Badge`, `FadeIn`, `Celebration`, `Progress`

### Styling
- Use **Tailwind CSS**
- Use **CSS variables** for colors (not hardcoded)
- Mobile-first (design for 375px, scale up)
- Support dark mode (use `dark:` variants)

### Images
```tsx
// Always use next/image
import Image from 'next/image'

<Image
  src={src}
  alt={alt}
  width={100}
  height={100}
  loading="lazy"
/>
```

### Error Boundaries
- Wrap pages in error boundaries
- Provide friendly error messages with recovery options

---

## Commit Messages

```
feat: New feature
fix: Bug fix
style: Style/UI changes
refactor: Code refactoring
docs: Documentation
perf: Performance improvement
test: Tests
chore: Maintenance

# Example
feat: Add job bookmark functionality

# With Co-Author
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Empty State Messages (Web3 Tone)

| Scenario | Message |
|----------|---------|
| No search results | "no alpha found... try different keywords" |
| No bookmarks | "no saved jobs yet... start exploring" |
| No articles | "no articles yet... be the first to drop alpha" |
| No jobs | "no jobs match your vibe... try adjusting filters" |
| No bounties | "no bounties available... check back soon ser" |

---

## Error Messages (Friendly)

| Scenario | Message |
|----------|---------|
| Wallet connection failed | "couldn't connect wallet. is MetaMask installed?" |
| Login required | "connect wallet to unlock this feature" |
| Loading failed | "something went wrong. try refreshing?" |
| Network error | "network issues... are you online?" |
| Form validation | "oops, something's not quite right" |
| Rate limited | "slow down ser... try again in a moment" |

---

## Component Usage Examples

### Button
```tsx
import { Button } from '@/app/components/ui'

<Button variant="primary" size="md">
  Apply Now
</Button>

// Variants: primary, secondary, ghost, danger, outline
// Sizes: sm, md, lg
```

### Card
```tsx
import { Card } from '@/app/components/ui'

<Card hover padding="md">
  Content here
</Card>
```

### Loading State
```tsx
import { Skeleton, JobCardSkeleton } from '@/app/components/ui'

// While loading
{isLoading ? <JobCardSkeleton /> : <JobCard job={job} />}
```

### Progress
```tsx
import { ProgressBar, LoadingSpinner } from '@/app/components/ui'

<ProgressBar value={50} /> // Determinate
<ProgressBar />           // Indeterminate
<LoadingSpinner text="Loading..." />
```

### Animation
```tsx
import { FadeIn } from '@/app/components/ui'

<FadeIn delay={0.1}>
  <Card>Content</Card>
</FadeIn>
```

---

## File References

| File | Purpose |
|------|---------|
| `/app/globals.css` | Design tokens, animations, utilities |
| `/app/components/ui/` | Reusable UI components |
| `/lib/fuzzy-search.ts` | Fuzzy search utility |
| `/lib/utils.ts` | Helper functions (cn, etc.) |
| `/types/` | TypeScript type definitions |
| `/docs/DESIGN_PRINCIPLES.md` | Full design documentation |

---

## Quick Checklist

Before submitting code:

- [ ] Uses design tokens (no hardcoded colors)
- [ ] Touch targets 44px minimum
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Loading states present
- [ ] Error handling included
- [ ] TypeScript types defined
- [ ] Accessible (ARIA labels)

---

*This file helps Claude maintain consistency across the NEUN codebase.*
