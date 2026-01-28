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
        'bg-a24-surface dark:bg-a24-dark-surface',
        'border border-a24-border dark:border-a24-dark-border',
        'transition-colors duration-200',
        hover && 'hover:bg-a24-bg dark:hover:bg-a24-dark-bg',
        className
      )}
    >
      {children}
    </Tag>
  )
}
