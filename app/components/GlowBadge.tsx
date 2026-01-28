import { cn } from '@/lib/utils'

interface GlowBadgeProps {
  name: string
  className?: string
}

export default function GlowBadge({ name, className }: GlowBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[11px]',
        'border border-a24-border dark:border-a24-dark-border',
        'text-a24-muted dark:text-a24-dark-muted',
        className
      )}
    >
      {name}
    </span>
  )
}
