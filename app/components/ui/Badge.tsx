'use client'

import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'

export type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: ReactNode
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  default: `
    bg-a24-surface dark:bg-a24-dark-surface
    text-a24-text dark:text-a24-dark-text
    border border-a24-border dark:border-a24-dark-border
  `,
  primary: `
    bg-neun-primary/10 text-neun-primary
    border border-neun-primary/20
  `,
  success: `
    bg-neun-success/10 text-neun-success
    border border-neun-success/20
  `,
  warning: `
    bg-neun-warning/10 text-neun-warning
    border border-neun-warning/20
  `,
  danger: `
    bg-neun-danger/10 text-neun-danger
    border border-neun-danger/20
  `,
  info: `
    bg-neun-info/10 text-neun-info
    border border-neun-info/20
  `,
  outline: `
    bg-transparent
    text-a24-muted dark:text-a24-dark-muted
    border border-a24-border dark:border-a24-dark-border
  `,
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2 py-1 text-small gap-1.5',
  lg: 'px-3 py-1.5 text-body gap-2',
}

export function Badge({
  variant = 'default',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium uppercase tracking-wider',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
}

// ══════════════════════════════════════════════
// Tag Component (interactive badge)
// ══════════════════════════════════════════════

interface TagProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  selected?: boolean
  onRemove?: () => void
  children: ReactNode
}

export function Tag({
  variant = 'default',
  size = 'md',
  selected = false,
  onRemove,
  className,
  children,
  ...props
}: TagProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center font-medium uppercase tracking-wider',
        'transition-all duration-200 cursor-pointer',
        'hover:opacity-80 active:scale-95',
        selected
          ? 'bg-neun-primary/20 text-neun-primary border border-neun-primary/30'
          : variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 hover:text-neun-danger transition-colors"
          aria-label="Remove tag"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </button>
  )
}

// ══════════════════════════════════════════════
// Status Badge (for job status, etc.)
// ══════════════════════════════════════════════

type StatusType = 'active' | 'pending' | 'expired' | 'draft' | 'rejected'

interface StatusBadgeProps {
  status: StatusType
  size?: BadgeSize
}

const statusConfig: Record<StatusType, { variant: BadgeVariant; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  pending: { variant: 'warning', label: 'Pending' },
  expired: { variant: 'danger', label: 'Expired' },
  draft: { variant: 'default', label: 'Draft' },
  rejected: { variant: 'danger', label: 'Rejected' },
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  )
}

export default Badge
