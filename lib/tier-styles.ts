/**
 * Shared tier badge styling for P0/P1/P2 company tiers
 * and top/major/notable investor tiers.
 */

export function getTierBadgeClass(tier: string): string {
  switch (tier) {
    case 'P0':
    case 'top':
      return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
    case 'P1':
    case 'major':
      return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  }
}

export function getTierLabel(tier: string): string {
  switch (tier) {
    case 'top': return 'TOP TIER'
    case 'major': return 'MAJOR'
    case 'notable': return 'NOTABLE'
    default: return tier
  }
}
