'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

// ── Types ──
type PoseId =
  | 'blank' | 'dejected' | 'sparkle' | 'smoking' | 'sweating'
  | 'bling' | 'sleepy' | 'eating' | 'leaving' | 'wink'
  | 'walk1' | 'walk2'

type PoseAlias = 'main' | 'loading' | 'notfound' | 'empty' | 'success'

interface PixelbaraProps {
  pose: PoseId | PoseAlias
  size?: number
  className?: string
  clickable?: boolean
}

// ── Hooks ──
function useIsDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

type TimeOfDay = 'dawn' | 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night'

function useTimeOfDay(): TimeOfDay {
  const [time, setTime] = useState<TimeOfDay>('morning')
  useEffect(() => {
    const check = () => {
      const h = new Date().getHours()
      if (h >= 0 && h < 6) setTime('dawn')
      else if (h < 11) setTime('morning')
      else if (h < 13) setTime('lunch')
      else if (h < 18) setTime('afternoon')
      else if (h < 21) setTime('evening')
      else setTime('night')
    }
    check()
    const id = setInterval(check, 60000)
    return () => clearInterval(id)
  }, [])
  return time
}

// ── Color palette: [light, dark] ──
const P: Record<string, [string, string]> = {
  H: ['#7B5B3A', '#C49A5A'],
  h: ['#5C4033', '#A07848'],
  b: ['#A0836B', '#D4B896'],
  e: ['#4A3628', '#8A7060'],
  x: ['#1A1008', '#F0EDE8'],
  n: ['#2A1A0E', '#C8B8A0'],
  D: ['#4A3628', '#8A7060'],
  G: ['#1A1008', '#E0DDD8'],
  L: ['#38BDF8', '#7DD3FC'],
  S: ['#334155', '#94A3B8'],
  s: ['#4ADE80', '#86EFAC'],
  C: ['#F5F0EB', '#D6D0C8'],
  c: ['#3A1A08', '#6B3A18'],
  T: ['#9A9490', '#686460'],
  W: ['#FFFFFF', '#3A3835'],
  Q: ['#EAB308', '#FDE047'],
  R: ['#22C55E', '#4ADE80'],
  r: ['#FFFFFF', '#052E16'],
  // New palette entries
  F: ['#FF4500', '#FF6030'],   // fire/cigarette tip
  w: ['#70B8E0', '#50A0D0'],   // water/sweat
  g: ['#1A1008', '#E0DDD8'],   // glasses frame (alias for mini)
  K: ['#704020', '#A06030'],   // briefcase brown
  Z: ['#70B8E0', '#50A0D0'],   // zzz
  M: ['#60A060', '#80C080'],   // grass/munch green
}

function fill(dark: boolean, key: string): string {
  const pair = P[key]
  if (!pair) return 'transparent'
  return dark ? pair[1] : pair[0]
}

// ── String-art engine ──
function parseArt(art: string): { x: number; y: number; c: string }[] {
  const rows = art.trim().split('\n').map(r => r.trim())
  const pixels: { x: number; y: number; c: string }[] = []
  for (let y = 0; y < rows.length; y++)
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x]
      if (ch !== '.') pixels.push({ x, y, c: ch })
    }
  return pixels
}

function artSize(art: string): { w: number; h: number } {
  const rows = art.trim().split('\n').map(r => r.trim())
  return { w: Math.max(...rows.map(r => r.length)), h: rows.length }
}

// ── Base pixel art ──
const BODY_ART = `
......ee....ee........
.....eeee..eeee.......
....HHHHHHHHHHHHHH....
...HHHHHHHHHHHHHHHH...
...HHxHHHHHHHxHHHHH..
...HHHHHHHHHHHHHHHHH..
...HHHHHHHHHHHHHHnn..
....HHHHHHHHHHHHHH....
..HHHHHHHHHHHHHHHHHH..
.HHHHHHHHHHHHHHHHHHHH.
HHHHHHbbbbbbbbHHHHHHH
HHHHHHbbbbbbbbHHHHHHH
.HHHHHHHHHHHHHHHHHHHH.
..HHHHHHHHHHHHHHHHHH..
...DDDD........DDDD...
...DDDD........DDDD...
`

const WALK1_ART = `
......ee....ee........
.....eeee..eeee.......
....HHHHHHHHHHHHHH....
...HHHHHHHHHHHHHHHH...
...HHxHHHHHHHxHHHHH..
...HHHHHHHHHHHHHHHHH..
...HHHHHHHHHHHHHHnn..
....HHHHHHHHHHHHHH....
..HHHHHHHHHHHHHHHHHH..
.HHHHHHHHHHHHHHHHHHHH.
HHHHHHbbbbbbbbHHHHHHH
HHHHHHbbbbbbbbHHHHHHH
.HHHHHHHHHHHHHHHHHHHH.
..HHHHHHHHHHHHHHHHHH..
..DDDD..........DDDD..
...DDDD..........DDDD.
`

const WALK2_ART = `
......ee....ee........
.....eeee..eeee.......
....HHHHHHHHHHHHHH....
...HHHHHHHHHHHHHHHH...
...HHxHHHHHHHxHHHHH..
...HHHHHHHHHHHHHHHHH..
...HHHHHHHHHHHHHHnn..
....HHHHHHHHHHHHHH....
..HHHHHHHHHHHHHHHHHH..
.HHHHHHHHHHHHHHHHHHHH.
HHHHHHbbbbbbbbHHHHHHH
HHHHHHbbbbbbbbHHHHHHH
.HHHHHHHHHHHHHHHHHHHH.
..HHHHHHHHHHHHHHHHHH..
....DDDD........DDDD..
...DDDD..........DDDD.
`

const BODY_PIXELS = parseArt(BODY_ART)
const WALK1_PIXELS = parseArt(WALK1_ART)
const WALK2_PIXELS = parseArt(WALK2_ART)
const BODY_SIZE = artSize(BODY_ART)

// ── SVG renderer ──
function PixelSvg({
  pixels, w, h, dark, extra,
}: {
  pixels: { x: number; y: number; c: string }[]
  w: number
  h: number
  dark: boolean
  extra?: React.ReactNode
}) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
    >
      {pixels.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={fill(dark, p.c)} />
      ))}
      {extra}
    </svg>
  )
}

// ── Helper: replace eye pixels ──
function replaceEyes(pixels: typeof BODY_PIXELS, leftChar: string, rightChar: string) {
  let leftDone = false
  return pixels.map(p => {
    if (p.c === 'x') {
      if (!leftDone) { leftDone = true; return { ...p, c: leftChar } }
      return { ...p, c: rightChar }
    }
    return p
  })
}

// ── Pose Components ──

// blank: expressionless default
function BlankPose({ dark }: { dark: boolean }) {
  return <PixelSvg pixels={BODY_PIXELS} w={BODY_SIZE.w} h={BODY_SIZE.h} dark={dark} />
}

// dejected: half-closed eyes, droopy
function DejectedPose({ dark }: { dark: boolean }) {
  // Replace eyes with horizontal line (use 'n' for thin dark eyes)
  const body = replaceEyes(BODY_PIXELS, 'n', 'n')
  return <PixelSvg pixels={body} w={BODY_SIZE.w} h={BODY_SIZE.h} dark={dark} />
}

// sparkle: excited golden eyes
function SparklePose({ dark }: { dark: boolean }) {
  const body = replaceEyes(BODY_PIXELS, 'Q', 'Q')
  // Add sparkle dots around eyes
  const sparkles = [
    { x: 4, y: 3, c: 'Q' }, { x: 6, y: 3, c: 'Q' },
    { x: 12, y: 3, c: 'Q' }, { x: 14, y: 3, c: 'Q' },
  ]
  return <PixelSvg pixels={[...body, ...sparkles]} w={BODY_SIZE.w} h={BODY_SIZE.h} dark={dark} />
}

// smoking: squinted eyes + cigarette
function SmokingPose({ dark }: { dark: boolean }) {
  const body = replaceEyes(BODY_PIXELS, 'n', 'n')
  const cigarette = [
    { x: 19, y: 6, c: 'C' }, { x: 20, y: 6, c: 'C' },
    { x: 21, y: 6, c: 'C' }, { x: 22, y: 6, c: 'F' },
  ]
  // Smoke wisps
  const smoke = [
    { x: 23, y: 5, c: 'T' }, { x: 22, y: 4, c: 'T' },
    { x: 24, y: 3, c: 'T' }, { x: 23, y: 2, c: 'T' },
  ]
  return <PixelSvg pixels={[...body, ...cigarette, ...smoke]} w={25} h={BODY_SIZE.h} dark={dark} />
}

// sweating: worried eyes + sweat drops
function SweatingPose({ dark }: { dark: boolean }) {
  const body = [...BODY_PIXELS]
  const sweat = [
    { x: 21, y: 3, c: 'w' },
    { x: 22, y: 4, c: 'w' },
    { x: 21, y: 5, c: 'w' },
    { x: 22, y: 6, c: 'w' },
  ]
  return <PixelSvg pixels={[...body, ...sweat]} w={23} h={BODY_SIZE.h} dark={dark} />
}

// bling: sunglasses + gold chain + laptop (the OG main pose)
function BlingPose({ dark }: { dark: boolean }) {
  const GLASSES_ART = `
......................
......................
......................
......................
...GGLGGGGGGLGGggg...
......................
`
  const glassesPixels = parseArt(GLASSES_ART)
  const all = [...BODY_PIXELS, ...glassesPixels]
  // Gold chain on neck
  const chain = [
    { x: 7, y: 8, c: 'Q' }, { x: 8, y: 8, c: 'Q' }, { x: 9, y: 8, c: 'Q' },
    { x: 10, y: 8, c: 'Q' }, { x: 11, y: 8, c: 'Q' }, { x: 12, y: 8, c: 'Q' },
    { x: 13, y: 8, c: 'Q' }, { x: 10, y: 9, c: 'Q' },
  ]
  // Laptop
  const laptopX = 23, laptopY = 5
  const laptop: typeof BODY_PIXELS = []
  for (let dy = 0; dy < 5; dy++)
    for (let dx = 0; dx < 7; dx++)
      laptop.push({ x: laptopX + dx, y: laptopY + dy, c: 'S' })
  for (let dy = 1; dy < 4; dy++)
    for (let dx = 1; dx < 6; dx++)
      laptop.push({ x: laptopX + dx, y: laptopY + dy, c: 's' })
  for (let dx = -1; dx < 8; dx++)
    laptop.push({ x: laptopX + dx, y: laptopY + 5, c: 'S' })

  return <PixelSvg pixels={[...all, ...chain, ...laptop]} w={31} h={16} dark={dark} />
}

// sleepy: closed eyes + zzz floating
function SleepyPose({ dark }: { dark: boolean }) {
  const body = replaceEyes(BODY_PIXELS, 'n', 'n')
  const zzz = [
    { x: 20, y: 1, c: 'Z' },
    { x: 22, y: 0, c: 'Z' },
    { x: 21, y: 2, c: 'Z' },
  ]
  // Drool
  const drool = [{ x: 18, y: 7, c: 'w' }]
  return <PixelSvg pixels={[...body, ...zzz, ...drool]} w={23} h={BODY_SIZE.h} dark={dark} />
}

// eating: munching grass
function EatingPose({ dark }: { dark: boolean }) {
  const body = [...BODY_PIXELS]
  // Grass hanging from mouth
  const grass = [
    { x: 19, y: 6, c: 'M' }, { x: 20, y: 6, c: 'M' },
    { x: 19, y: 7, c: 'M' }, { x: 20, y: 7, c: 'M' }, { x: 21, y: 7, c: 'M' },
    { x: 20, y: 8, c: 'M' },
  ]
  return <PixelSvg pixels={[...body, ...grass]} w={22} h={BODY_SIZE.h} dark={dark} />
}

// leaving: walking away with briefcase
function LeavingPose({ dark }: { dark: boolean }) {
  const body = [...BODY_PIXELS]
  // Small briefcase beside body
  const briefcase = [
    { x: 21, y: 10, c: 'K' }, { x: 22, y: 10, c: 'K' }, { x: 23, y: 10, c: 'K' },
    { x: 21, y: 11, c: 'K' }, { x: 22, y: 11, c: 'K' }, { x: 23, y: 11, c: 'K' },
    { x: 21, y: 12, c: 'K' }, { x: 22, y: 12, c: 'K' }, { x: 23, y: 12, c: 'K' },
    { x: 22, y: 9, c: 'K' }, // handle
  ]
  return <PixelSvg pixels={[...body, ...briefcase]} w={24} h={BODY_SIZE.h} dark={dark} />
}

// wink: one eye open, one closed
function WinkPose({ dark }: { dark: boolean }) {
  const body = replaceEyes(BODY_PIXELS, 'x', 'n')
  return <PixelSvg pixels={body} w={BODY_SIZE.w} h={BODY_SIZE.h} dark={dark} />
}

// notfound: smoking + speech bubble
function NotFoundPose({ dark }: { dark: boolean }) {
  const body = replaceEyes(BODY_PIXELS, 'n', 'n')
  const cigarette = [
    { x: 19, y: 6, c: 'C' }, { x: 20, y: 6, c: 'C' }, { x: 21, y: 6, c: 'F' },
  ]
  const smoke = [{ x: 22, y: 5, c: 'T' }, { x: 23, y: 4, c: 'T' }]
  const extra = (
    <>
      <rect x={16} y={0} width={12} height={3.5} rx={0.5} fill={fill(dark, 'W')} />
      <polygon points="17,3.5 18.5,3.5 16.5,5" fill={fill(dark, 'W')} />
      <text x={17} y={2.8} fill={fill(dark, 'n')} fontSize="2.2" fontWeight="bold" fontFamily="monospace">
        ser pls
      </text>
    </>
  )
  return (
    <PixelSvg
      pixels={[...body.map(p => ({ ...p, y: p.y + 2 })), ...cigarette.map(p => ({ ...p, y: p.y + 2 })), ...smoke.map(p => ({ ...p, y: p.y + 2 }))]}
      w={25}
      h={18}
      dark={dark}
      extra={extra}
    />
  )
}

// empty: shrugging with raised arms
function EmptyPose({ dark }: { dark: boolean }) {
  const body = [...BODY_PIXELS]
  const arms = [
    { x: 0, y: 7, c: 'h' }, { x: 0, y: 8, c: 'h' },
    { x: 21, y: 7, c: 'h' }, { x: 21, y: 8, c: 'h' },
  ]
  return <PixelSvg pixels={[...body, ...arms]} w={22} h={BODY_SIZE.h} dark={dark} />
}

// success: happy squint eyes + WAGMI sign
function SuccessPose({ dark }: { dark: boolean }) {
  const body = BODY_PIXELS.map(p => (p.c === 'x' ? { ...p, c: 'H' } : p))
  const happyEyes = [
    { x: 5, y: 3, c: 'x' }, { x: 6, y: 4, c: 'x' }, { x: 7, y: 3, c: 'x' },
    { x: 13, y: 3, c: 'x' }, { x: 14, y: 4, c: 'x' }, { x: 15, y: 3, c: 'x' },
  ]
  const arm = [{ x: 22, y: 7, c: 'h' }, { x: 22, y: 8, c: 'h' }]
  const extra = (
    <>
      <rect x={23} y={3} width={10} height={5} rx={1} fill={fill(dark, 'R')} />
      <text x={24.3} y={6.5} fill={fill(dark, 'r')} fontSize="2.8" fontWeight="bold" fontFamily="monospace">
        WAGMI
      </text>
    </>
  )
  return <PixelSvg pixels={[...body, ...happyEyes, ...arm]} w={34} h={16} dark={dark} extra={extra} />
}

function Walk1Pose({ dark }: { dark: boolean }) {
  return <PixelSvg pixels={WALK1_PIXELS} w={BODY_SIZE.w} h={BODY_SIZE.h} dark={dark} />
}
function Walk2Pose({ dark }: { dark: boolean }) {
  return <PixelSvg pixels={WALK2_PIXELS} w={BODY_SIZE.w} h={BODY_SIZE.h} dark={dark} />
}

// ── Pose registry ──
const POSES: Record<string, (props: { dark: boolean }) => React.ReactNode> = {
  blank: BlankPose,
  dejected: DejectedPose,
  sparkle: SparklePose,
  smoking: SmokingPose,
  sweating: SweatingPose,
  bling: BlingPose,
  sleepy: SleepyPose,
  eating: EatingPose,
  leaving: LeavingPose,
  wink: WinkPose,
  walk1: Walk1Pose,
  walk2: Walk2Pose,
  // Legacy aliases
  main: BlingPose,
  loading: SweatingPose,
  notfound: NotFoundPose,
  empty: EmptyPose,
  success: SuccessPose,
}

// ── Meme content ──
const CLICK_QUOTES = [
  'gm anon ☀️', 'wagmi 🤝', 'ngmi... jk 😤', 'wen moon? 🌙',
  'this is fine 🔥', 'probably nothing 👀', 'few understand 🧠',
  'ser, this is a wendy\'s 🍔', 'touch grass 🌿', 'i\'m in it for the tech 💻',
  'not financial advice 📉', 'LFG 🚀', 'looks rare 👀',
  'down bad fr fr 📉', 'up only 📈', 'wen lambo 🏎️',
]

const TSUNDERE_MSGS = [
  '뭘 봐...', '...', 'hmph.', 'b-baka', '별로야.',
  'whatever.', '...관심 없어', '*stares*',
]

export const TIME_MSGS: Record<TimeOfDay, string> = {
  dawn: 'why are you here at this hour... 😴',
  morning: 'gm anon ☀️',
  lunch: '*munch munch* 🌿',
  afternoon: '...',
  evening: '퇴근하고 싶다... 🚶',
  night: 'this is fine 🔥',
}

// ── Easter egg state ──
let globalClicks = 0
let easterEggTriggered = false

// ── Main component ──
export default function Pixelbara({ pose, size = 120, className = '', clickable = false }: PixelbaraProps) {
  const dark = useIsDark()
  const [hoverMsg, setHoverMsg] = useState<string | null>(null)
  const PoseComponent = POSES[pose] ?? POSES.blank

  const handleClick = useCallback(() => {
    if (!clickable) return
    globalClicks++
    if (globalClicks === 10 && !easterEggTriggered) {
      easterEggTriggered = true
      toast('🔮 YOU FOUND THE ALPHA', {
        description: 'Hidden role: Chief Capybara Officer at Pixelbara Labs. DM us.',
        duration: 8000,
      })
      return
    }
    const quote = CLICK_QUOTES[Math.floor(Math.random() * CLICK_QUOTES.length)]
    toast(quote, { duration: 2000, className: 'text-sm font-bold tracking-wide' })
  }, [clickable])

  const handleMouseEnter = useCallback(() => {
    if (!clickable) return
    const msg = TSUNDERE_MSGS[Math.floor(Math.random() * TSUNDERE_MSGS.length)]
    setHoverMsg(msg)
  }, [clickable])

  const handleMouseLeave = useCallback(() => setHoverMsg(null), [])

  return (
    <div
      className={`relative inline-block select-none ${clickable ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''} ${className}`}
      style={{ width: size }}
      aria-label={`Pixelbara mascot - ${pose}`}
      role="img"
      onClick={clickable ? handleClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hoverMsg && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] whitespace-nowrap bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg z-50 pointer-events-none">
          {hoverMsg}
        </span>
      )}
      <PoseComponent dark={dark} />
    </div>
  )
}

// ── TimeAwarePixelbara ──
export function TimeAwarePixelbara(props: Omit<PixelbaraProps, 'pose'>) {
  const time = useTimeOfDay()
  const pose = useMemo((): PoseId => {
    switch (time) {
      case 'dawn': return 'sleepy'
      case 'lunch': return 'eating'
      case 'evening': return 'leaving'
      default: return 'bling'
    }
  }, [time])
  return <Pixelbara {...props} pose={pose} />
}

// ── MiniPixelbara ──
export function MiniPixelbara({ className = '' }: { className?: string }) {
  const dark = useIsDark()
  const miniArt = `
..ee..ee
.HHHHHH.
HHxHHxHH
HHHHHHHH
HHHHHHnn
.HHHHHH.
`
  const pixels = parseArt(miniArt)
  const { w, h } = artSize(miniArt)
  return (
    <span className={`inline-block ${className}`} style={{ width: 18, height: 14 }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet">
        {pixels.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={fill(dark, p.c)} />
        ))}
      </svg>
    </span>
  )
}

// ── WalkingPixelbara ──
export function WalkingPixelbara({ size = 60, className = '' }: { size?: number; className?: string }) {
  const dark = useIsDark()
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 2), 400)
    return () => clearInterval(id)
  }, [])
  const pixels = frame === 0 ? WALK1_PIXELS : WALK2_PIXELS
  return (
    <div className={`inline-block select-none ${className}`} style={{ width: size }}>
      <PixelSvg pixels={pixels} w={BODY_SIZE.w} h={BODY_SIZE.h} dark={dark} />
    </div>
  )
}

// ── PixelbaraToggleIcon ──
export function PixelbaraToggleIcon({ withGlasses, className = '' }: { withGlasses: boolean; className?: string }) {
  const dark = useIsDark()
  const miniArt = withGlasses
    ? `
..ee..ee
.HHHHHH.
HGLGGLGH
HHHHHHHH
HHHHHHnn
.HHHHHH.
`
    : `
..ee..ee
.HHHHHH.
HHxHHxHH
HHHHHHHH
HHHHHHnn
.HHHHHH.
`
  const pixels = parseArt(miniArt)
  const { w, h } = artSize(miniArt)
  return (
    <span className={`inline-block ${className}`} style={{ width: 20, height: 16 }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet">
        {pixels.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={fill(dark, p.c)} />
        ))}
      </svg>
    </span>
  )
}

// ── Exports for other components ──
export { useTimeOfDay }
export type { TimeOfDay, PoseId, PoseAlias }
