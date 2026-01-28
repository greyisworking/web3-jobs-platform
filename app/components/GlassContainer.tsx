import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface GlassContainerProps {
  children: ReactNode
  className?: string
  hover?: boolean
  as?: 'div' | 'section' | 'article' | 'header' | 'footer'
}

export default function GlassContainer({
  children,
  className,
  hover = false,
  as: Tag = 'div',
}: GlassContainerProps) {
  return (
    <Tag
      className={cn(
        'bg-white dark:bg-sub-dark-surface',
        'border border-sub-border dark:border-sub-border-dark',
        'transition-colors duration-200',
        hover && 'hover:bg-sub-offwhite dark:hover:bg-sub-dark-bg',
        className
      )}
    >
      {children}
    </Tag>
  )
}
