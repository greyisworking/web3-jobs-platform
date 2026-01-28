'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

// ── Types ──
type PoseId =
  | 'blank' | 'dejected' | 'sparkle' | 'smoking' | 'sweating'
  | 'bling' | 'sleepy' | 'eating' | 'wink' | 'heroLaptop'

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
  // Face/fur colors
  H: ['#8B7355', '#C9A87C'],    // main fur
  h: ['#6B5344', '#A88960'],    // darker fur/shadow
  b: ['#A89070', '#D4C0A0'],    // belly/lighter fur

  // Eye colors
  e: ['#3A2820', '#6A5848'],    // ears
  x: ['#1A1008', '#F0EDE8'],    // eyes (pupils)

  // Nostril - THE STAR OF THE SHOW
  N: ['#2A1810', '#4A3828'],    // nostril dark

  // Accessories
  G: ['#1A1008', '#E0DDD8'],    // glasses frame
  L: ['#38BDF8', '#7DD3FC'],    // glasses lens
  Q: ['#EAB308', '#FDE047'],    // gold/bling

  // Misc
  S: ['#334155', '#94A3B8'],    // laptop
  s: ['#4ADE80', '#86EFAC'],    // laptop screen
  C: ['#F5F0EB', '#D6D0C8'],    // cigarette
  F: ['#FF4500', '#FF6030'],    // fire
  T: ['#9A9490', '#686460'],    // smoke
  w: ['#70B8E0', '#50A0D0'],    // water/sweat/tears
  Z: ['#70B8E0', '#50A0D0'],    // zzz
  M: ['#60A060', '#80C080'],    // grass
  W: ['#FFFFFF', '#3A3835'],    // white/speech bubble
  R: ['#22C55E', '#4ADE80'],    // green (wagmi sign)
  r: ['#FFFFFF', '#052E16'],    // wagmi text
  n: ['#2A1A0E', '#C8B8A0'],    // thin line
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

// ══════════════════════════════════════════════════════════
// ══ FACE-ONLY PIXEL ART (with PROMINENT NOSTRILS) ══
// ══════════════════════════════════════════════════════════

// Base face - 16x12 grid, focused on the adorable face
// Key feature: BIG ROUND NOSTRILS (the cutest part of capybara!)
const FACE_ART = `
....ee....ee....
...eeee..eeee...
..HHHHHHHHHHHH..
.HHHHHHHHHHHHHH.
.HHxHHHHHHxHHHH.
.HHHHHHHHHHHHHH.
.HHHHHHHHHHHHhh.
..HHHHHNNHHHHH..
..HHHHHNNHHHHh..
...HHHHHHHHHH...
....HHHHHHHH....
`

const FACE_PIXELS = parseArt(FACE_ART)
const FACE_SIZE = artSize(FACE_ART)

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
function replaceEyes(pixels: typeof FACE_PIXELS, leftChar: string, rightChar: string) {
  let leftDone = false
  return pixels.map(p => {
    if (p.c === 'x') {
      if (!leftDone) { leftDone = true; return { ...p, c: leftChar } }
      return { ...p, c: rightChar }
    }
    return p
  })
}

// ══════════════════════════════════════════════════════════
// ══ POSE COMPONENTS (Face-only versions) ══
// ══════════════════════════════════════════════════════════

// blank: expressionless default - just vibing
function BlankPose({ dark }: { dark: boolean }) {
  return <PixelSvg pixels={FACE_PIXELS} w={FACE_SIZE.w} h={FACE_SIZE.h} dark={dark} />
}

// dejected: half-closed eyes
function DejectedPose({ dark }: { dark: boolean }) {
  const face = replaceEyes(FACE_PIXELS, 'n', 'n')
  return <PixelSvg pixels={face} w={FACE_SIZE.w} h={FACE_SIZE.h} dark={dark} />
}

// sparkle: excited golden eyes
function SparklePose({ dark }: { dark: boolean }) {
  const face = replaceEyes(FACE_PIXELS, 'Q', 'Q')
  const sparkles = [
    { x: 2, y: 3, c: 'Q' }, { x: 13, y: 3, c: 'Q' },
  ]
  return <PixelSvg pixels={[...face, ...sparkles]} w={FACE_SIZE.w} h={FACE_SIZE.h} dark={dark} />
}

// smoking: squinted eyes + cigarette sticking out
function SmokingPose({ dark }: { dark: boolean }) {
  const face = replaceEyes(FACE_PIXELS, 'n', 'n')
  const cigarette = [
    { x: 14, y: 6, c: 'C' }, { x: 15, y: 6, c: 'C' },
    { x: 16, y: 6, c: 'C' }, { x: 17, y: 6, c: 'F' },
  ]
  const smoke = [
    { x: 18, y: 5, c: 'T' }, { x: 17, y: 4, c: 'T' },
    { x: 19, y: 3, c: 'T' },
  ]
  return <PixelSvg pixels={[...face, ...cigarette, ...smoke]} w={20} h={FACE_SIZE.h} dark={dark} />
}

// sweating: worried with sweat drops
function SweatingPose({ dark }: { dark: boolean }) {
  const face = [...FACE_PIXELS]
  const sweat = [
    { x: 15, y: 4, c: 'w' },
    { x: 16, y: 5, c: 'w' },
    { x: 15, y: 6, c: 'w' },
  ]
  return <PixelSvg pixels={[...face, ...sweat]} w={17} h={FACE_SIZE.h} dark={dark} />
}

// bling: THE MAIN POSE - sunglasses + gold chain
function BlingPose({ dark }: { dark: boolean }) {
  // Sunglasses overlay
  const GLASSES_ART = `
................
................
................
................
.GLLGggGGLLGggg.
................
`
  const glassesPixels = parseArt(GLASSES_ART)
  const all = [...FACE_PIXELS, ...glassesPixels]

  // Gold chain around neck area
  const chain = [
    { x: 4, y: 10, c: 'Q' }, { x: 5, y: 10, c: 'Q' }, { x: 6, y: 10, c: 'Q' },
    { x: 7, y: 10, c: 'Q' }, { x: 8, y: 10, c: 'Q' }, { x: 9, y: 10, c: 'Q' },
    { x: 10, y: 10, c: 'Q' }, { x: 11, y: 10, c: 'Q' },
    { x: 7, y: 11, c: 'Q' }, { x: 8, y: 11, c: 'Q' },
  ]

  return <PixelSvg pixels={[...all, ...chain]} w={FACE_SIZE.w} h={12} dark={dark} />
}

// sleepy: closed eyes + zzz
function SleepyPose({ dark }: { dark: boolean }) {
  const face = replaceEyes(FACE_PIXELS, 'n', 'n')
  const zzz = [
    { x: 14, y: 2, c: 'Z' },
    { x: 15, y: 1, c: 'Z' },
    { x: 16, y: 0, c: 'Z' },
  ]
  const drool = [{ x: 13, y: 8, c: 'w' }]
  return <PixelSvg pixels={[...face, ...zzz, ...drool]} w={17} h={FACE_SIZE.h} dark={dark} />
}

// eating: munching grass
function EatingPose({ dark }: { dark: boolean }) {
  const face = [...FACE_PIXELS]
  const grass = [
    { x: 13, y: 6, c: 'M' }, { x: 14, y: 6, c: 'M' },
    { x: 13, y: 7, c: 'M' }, { x: 14, y: 7, c: 'M' }, { x: 15, y: 7, c: 'M' },
    { x: 14, y: 8, c: 'M' },
  ]
  return <PixelSvg pixels={[...face, ...grass]} w={16} h={FACE_SIZE.h} dark={dark} />
}

// wink: one eye open, one closed
function WinkPose({ dark }: { dark: boolean }) {
  const face = replaceEyes(FACE_PIXELS, 'x', 'n')
  return <PixelSvg pixels={face} w={FACE_SIZE.w} h={FACE_SIZE.h} dark={dark} />
}

// notfound: smoking + speech bubble
function NotFoundPose({ dark }: { dark: boolean }) {
  const face = replaceEyes(FACE_PIXELS, 'n', 'n')
  const cigarette = [
    { x: 14, y: 8, c: 'C' }, { x: 15, y: 8, c: 'C' }, { x: 16, y: 8, c: 'F' },
  ]
  const smoke = [{ x: 17, y: 7, c: 'T' }, { x: 18, y: 6, c: 'T' }]
  const extra = (
    <>
      <rect x={12} y={0} width={11} height={4} rx={0.5} fill={fill(dark, 'W')} />
      <polygon points="13,4 14.5,4 12.5,5.5" fill={fill(dark, 'W')} />
      <text x={13} y={3} fill={fill(dark, 'N')} fontSize="2.5" fontWeight="bold" fontFamily="monospace">
        ser pls
      </text>
    </>
  )
  return (
    <PixelSvg
      pixels={[...face.map(p => ({ ...p, y: p.y + 2 })), ...cigarette.map(p => ({ ...p, y: p.y + 2 })), ...smoke.map(p => ({ ...p, y: p.y + 2 }))]}
      w={20}
      h={15}
      dark={dark}
      extra={extra}
    />
  )
}

// empty: shrugging vibes
function EmptyPose({ dark }: { dark: boolean }) {
  const face = [...FACE_PIXELS]
  const extra = (
    <text x={0} y={FACE_SIZE.h + 2} fill={fill(dark, 'n')} fontSize="3" fontFamily="monospace">
      ¯\_(ツ)_/¯
    </text>
  )
  return <PixelSvg pixels={face} w={FACE_SIZE.w} h={FACE_SIZE.h + 4} dark={dark} extra={extra} />
}

// success: happy squint eyes + WAGMI
function SuccessPose({ dark }: { dark: boolean }) {
  const face = FACE_PIXELS.map(p => (p.c === 'x' ? { ...p, c: 'H' } : p))
  const happyEyes = [
    { x: 3, y: 3, c: 'x' }, { x: 4, y: 4, c: 'x' }, { x: 5, y: 3, c: 'x' },
    { x: 10, y: 3, c: 'x' }, { x: 11, y: 4, c: 'x' }, { x: 12, y: 3, c: 'x' },
  ]
  const extra = (
    <>
      <rect x={0} y={0} width={8} height={4} rx={0.5} fill={fill(dark, 'R')} />
      <text x={0.5} y={3} fill={fill(dark, 'r')} fontSize="2.5" fontWeight="bold" fontFamily="monospace">
        WAGMI
      </text>
    </>
  )
  return <PixelSvg pixels={[...face.map(p => ({ ...p, y: p.y + 2 })), ...happyEyes.map(p => ({ ...p, y: p.y + 2 }))]} w={FACE_SIZE.w} h={FACE_SIZE.h + 4} dark={dark} extra={extra} />
}

// ══════════════════════════════════════════════════════════
// ══ FULL-BODY HERO POSE (laptop with green terminal) ══
// ══════════════════════════════════════════════════════════

// Full body capybara with sunglasses, holding laptop
const HERO_BODY_ART = `
.......ee....ee...............
......eeee..eeee..............
.....HHHHHHHHHHHHHH...........
....HHHHHHHHHHHHHHHH..........
....HHxHHHHHHHxHHHHH.........
....HHHHHHHHHHHHHHHHH.........
....HHHHHHHHHHHHHHnn.........
.....HHHHHNNHHHHHH............
...HHHHHHHNNHHHHHHHHHH........
..HHHHHHHHHHHHHHHHHHHHh......
.HHHHHHHHbbbbbbbbHHHHHHH.....
.HHHHHHHHbbbbbbbbHHHHHHHh....
..HHHHHHHHHHHHHHHHHHHHHh.....
...HHHHHHHHHHHHHHHHHHHH.......
....DDDD..........DDDD........
....DDDD..........DDDD........
`

const HERO_BODY_PIXELS = parseArt(HERO_BODY_ART)
const HERO_BODY_SIZE = artSize(HERO_BODY_ART)

function HeroLaptopPose({ dark }: { dark: boolean }) {
  const body = [...HERO_BODY_PIXELS]

  // Sunglasses overlay
  const glasses = [
    { x: 4, y: 4, c: 'G' }, { x: 5, y: 4, c: 'L' }, { x: 6, y: 4, c: 'L' },
    { x: 7, y: 4, c: 'G' }, { x: 8, y: 4, c: 'G' }, { x: 9, y: 4, c: 'G' },
    { x: 10, y: 4, c: 'G' }, { x: 11, y: 4, c: 'L' }, { x: 12, y: 4, c: 'L' },
    { x: 13, y: 4, c: 'G' }, { x: 14, y: 4, c: 'G' }, { x: 15, y: 4, c: 'G' },
  ]

  // Laptop - positioned to the right as if being held
  const laptopX = 20
  const laptopY = 7
  const laptop: { x: number; y: number; c: string }[] = []

  // Laptop screen frame (dark)
  for (let dy = 0; dy < 6; dy++)
    for (let dx = 0; dx < 9; dx++)
      laptop.push({ x: laptopX + dx, y: laptopY + dy, c: 'S' })

  // Green terminal screen (inner)
  for (let dy = 1; dy < 5; dy++)
    for (let dx = 1; dx < 8; dx++)
      laptop.push({ x: laptopX + dx, y: laptopY + dy, c: 's' })

  // Terminal text lines (dark on green)
  const terminalLines = [
    { x: laptopX + 2, y: laptopY + 1, c: 'G' },
    { x: laptopX + 3, y: laptopY + 1, c: 'G' },
    { x: laptopX + 4, y: laptopY + 1, c: 'G' },
    { x: laptopX + 5, y: laptopY + 1, c: 'G' },
    { x: laptopX + 2, y: laptopY + 2, c: 'G' },
    { x: laptopX + 3, y: laptopY + 2, c: 'G' },
    { x: laptopX + 2, y: laptopY + 3, c: 'G' },
    { x: laptopX + 3, y: laptopY + 3, c: 'G' },
    { x: laptopX + 4, y: laptopY + 3, c: 'G' },
    { x: laptopX + 6, y: laptopY + 3, c: 'G' },
    // Cursor blink
    { x: laptopX + 2, y: laptopY + 4, c: 'Q' },
  ]

  // Laptop base/keyboard
  for (let dx = -1; dx < 10; dx++)
    laptop.push({ x: laptopX + dx, y: laptopY + 6, c: 'S' })

  // Gold chain
  const chain = [
    { x: 8, y: 8, c: 'Q' }, { x: 9, y: 8, c: 'Q' }, { x: 10, y: 8, c: 'Q' },
    { x: 11, y: 8, c: 'Q' }, { x: 12, y: 8, c: 'Q' }, { x: 13, y: 8, c: 'Q' },
    { x: 10, y: 9, c: 'Q' }, { x: 11, y: 9, c: 'Q' },
  ]

  return (
    <PixelSvg
      pixels={[...body, ...glasses, ...chain, ...laptop, ...terminalLines]}
      w={30}
      h={HERO_BODY_SIZE.h}
      dark={dark}
    />
  )
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
  wink: WinkPose,
  heroLaptop: HeroLaptopPose,
  // Legacy aliases
  main: HeroLaptopPose,
  loading: SweatingPose,
  notfound: NotFoundPose,
  empty: EmptyPose,
  success: SuccessPose,
}

// ── Meme content ──
const CLICK_QUOTES = [
  'gm anon', 'wagmi', 'ngmi... jk', 'wen moon?',
  'this is fine', 'probably nothing', 'few understand',
  "ser, this is a wendy's", 'touch grass', "i'm in it for the tech",
  'not financial advice', 'LFG', 'looks rare',
  'down bad fr fr', 'up only', 'wen lambo',
]

const TSUNDERE_MSGS = [
  '뭘 봐...', '...', 'hmph.', 'b-baka', '별로야.',
  'whatever.', '...관심 없어', '*stares*',
]

export const TIME_MSGS: Record<TimeOfDay, string> = {
  dawn: 'why are you here at this hour...',
  morning: 'gm anon',
  lunch: '*munch munch*',
  afternoon: '...',
  evening: '퇴근하고 싶다...',
  night: 'this is fine',
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
      toast('YOU FOUND THE ALPHA', {
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
      case 'evening': return 'dejected'
      default: return 'bling'
    }
  }, [time])
  return <Pixelbara {...props} pose={pose} />
}

// ── MiniPixelbara (face only, compact) ──
export function MiniPixelbara({ className = '' }: { className?: string }) {
  const dark = useIsDark()
  const miniArt = `
..ee..ee
HHHHHHHH
HxHHHxHH
HHHHHHHH
HHHNNHhh
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

// ── PixelbaraToggleIcon (for theme toggle) ──
export function PixelbaraToggleIcon({ withGlasses, className = '' }: { withGlasses: boolean; className?: string }) {
  const dark = useIsDark()
  const miniArt = withGlasses
    ? `
..ee..ee
HHHHHHHH
GLLGGLGH
HHHHHHHH
HHHNNHhh
.HHHHHH.
`
    : `
..ee..ee
HHHHHHHH
HxHHHxHH
HHHHHHHH
HHHNNHhh
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
