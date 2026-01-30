'use client'

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`
    const hasError = Boolean(error)

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-small font-medium text-a24-text dark:text-a24-dark-text mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-a24-muted dark:text-a24-dark-muted">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 py-2.5 text-body',
              'bg-a24-bg dark:bg-a24-dark-bg',
              'text-a24-text dark:text-a24-dark-text',
              'placeholder:text-a24-muted dark:placeholder:text-a24-dark-muted',
              'border transition-all duration-200',
              hasError
                ? 'border-neun-danger focus:border-neun-danger focus:ring-2 focus:ring-neun-danger/20'
                : 'border-a24-border dark:border-a24-dark-border focus:border-neun-primary focus:ring-2 focus:ring-neun-primary/20',
              'focus:outline-none',
              'disabled:bg-a24-surface disabled:text-a24-muted disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />

          {rightIcon && !hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-a24-muted dark:text-a24-dark-muted">
              {rightIcon}
            </div>
          )}

          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neun-danger">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-small text-neun-danger flex items-center gap-1">
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="mt-1.5 text-small text-a24-muted dark:text-a24-dark-muted">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
