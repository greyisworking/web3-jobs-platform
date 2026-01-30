'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-neun-primary text-white font-semibold
    hover:bg-neun-primary-hover hover:shadow-green-md
    active:scale-[0.98]
    disabled:bg-a24-muted disabled:text-a24-bg disabled:cursor-not-allowed disabled:hover:shadow-none
  `,
  secondary: `
    bg-a24-surface text-a24-text font-medium
    border border-a24-border
    hover:bg-a24-border hover:border-a24-muted
    active:scale-[0.98]
    disabled:bg-a24-surface disabled:text-a24-muted disabled:cursor-not-allowed
  `,
  ghost: `
    bg-transparent text-a24-text font-medium
    hover:bg-a24-surface
    active:scale-[0.98]
    disabled:text-a24-muted disabled:cursor-not-allowed disabled:hover:bg-transparent
  `,
  danger: `
    bg-neun-danger text-white font-semibold
    hover:bg-red-600 hover:shadow-md
    active:scale-[0.98]
    disabled:bg-a24-muted disabled:text-a24-bg disabled:cursor-not-allowed
  `,
  outline: `
    bg-transparent text-neun-primary font-medium
    border border-neun-primary
    hover:bg-neun-primary hover:text-white
    active:scale-[0.98]
    disabled:border-a24-muted disabled:text-a24-muted disabled:cursor-not-allowed disabled:hover:bg-transparent
  `,
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-small gap-1.5',
  md: 'px-4 py-2 text-body gap-2',
  lg: 'px-6 py-3 text-body gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-neun-primary focus:ring-offset-2 focus:ring-offset-a24-bg',
          'btn-ripple', // Add ripple effect
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
