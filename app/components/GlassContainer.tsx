import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

const BLUR_MAP = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
} as const

interface GlassContainerProps {
  children: ReactNode
  className?: string
  blur?: keyof typeof BLUR_MAP
  hover?: boolean
  as?: 'div' | 'section' | 'article' | 'header' | 'footer'
}

export default function GlassContainer({
  children,
  className,
  blur = 'md',
  hover = false,
  as: Tag = 'div',
}: GlassContainerProps) {
  return (
    <Tag
      className={cn(
        BLUR_MAP[blur],
        'bg-white/70 dark:bg-white/10',
        'border-hairline border-white/30 dark:border-white/15',
        'rounded-xl shadow-glass',
        'transition-all duration-300 ease-out',
        hover && 'hover:bg-white/80 dark:hover:bg-white/15 hover:shadow-glow hover:scale-[1.01]',
        className
      )}
    >
      {children}
    </Tag>
  )
}
