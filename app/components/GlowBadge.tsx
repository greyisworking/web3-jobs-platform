import { cn } from '@/lib/utils'

/** VC 브랜드 색상 맵 — 13개 주요 투자사 */
const VC_COLOR_MAP: Record<string, { bg: string; text: string; glow: string }> = {
  a16z: {
    bg: 'bg-orange-500/15 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-300',
    glow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]',
  },
  Paradigm: {
    bg: 'bg-blue-500/15 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]',
  },
  Hashed: {
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]',
  },
  Kakao: {
    bg: 'bg-yellow-500/15 dark:bg-yellow-500/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    glow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
  },
  'Kakao Ventures': {
    bg: 'bg-yellow-500/15 dark:bg-yellow-500/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    glow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
  },
  Dunamu: {
    bg: 'bg-sky-500/15 dark:bg-sky-500/20',
    text: 'text-sky-700 dark:text-sky-300',
    glow: 'shadow-[0_0_10px_rgba(14,165,233,0.3)]',
  },
  SoftBank: {
    bg: 'bg-slate-500/15 dark:bg-slate-500/20',
    text: 'text-slate-700 dark:text-slate-300',
    glow: 'shadow-[0_0_10px_rgba(100,116,139,0.3)]',
  },
  'Animoca Brands': {
    bg: 'bg-pink-500/15 dark:bg-pink-500/20',
    text: 'text-pink-700 dark:text-pink-300',
    glow: 'shadow-[0_0_10px_rgba(236,72,153,0.3)]',
  },
  Binance: {
    bg: 'bg-amber-500/15 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
  },
  'LINE Corporation': {
    bg: 'bg-green-500/15 dark:bg-green-500/20',
    text: 'text-green-700 dark:text-green-300',
    glow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
  },
  'Mirae Asset': {
    bg: 'bg-indigo-500/15 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    glow: 'shadow-[0_0_10px_rgba(99,102,241,0.3)]',
  },
  'KB Investment': {
    bg: 'bg-violet-500/15 dark:bg-violet-500/20',
    text: 'text-violet-700 dark:text-violet-300',
    glow: 'shadow-[0_0_10px_rgba(139,92,246,0.3)]',
  },
  Wemade: {
    bg: 'bg-cyan-500/15 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    glow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]',
  },
}

/** 알 수 없는 VC — 기본 회색 */
const DEFAULT_COLOR = {
  bg: 'bg-gray-500/15 dark:bg-gray-500/20',
  text: 'text-gray-700 dark:text-gray-300',
  glow: 'shadow-[0_0_10px_rgba(107,114,128,0.3)]',
}

interface GlowBadgeProps {
  name: string
  className?: string
}

export default function GlowBadge({ name, className }: GlowBadgeProps) {
  const colors = VC_COLOR_MAP[name] ?? DEFAULT_COLOR

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
        'border-hairline border-white/20',
        'transition-shadow duration-300',
        colors.bg,
        colors.text,
        `hover:${colors.glow}`,
        className
      )}
    >
      {name}
    </span>
  )
}
