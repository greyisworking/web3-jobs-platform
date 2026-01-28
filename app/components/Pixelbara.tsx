'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

// ── Types ──
type PoseId =
  | 'blank' | 'dejected' | 'sparkle' | 'smoking' | 'sweating'
  | 'bling' | 'sleepy' | 'eating' | 'wink' | 'heroLaptop'
  | 'search' | 'building' | 'reading' | 'heart' | 'question' | 'coffee' | 'door'

type PoseAlias = 'main' | 'loading' | 'notfound' | 'empty' | 'success'
  | 'careers' | 'investors' | 'companies' | 'articles' | 'bookmarks' | 'error' | 'login'

interface PixelbaraProps {
  pose: PoseId | PoseAlias
  size?: number
  className?: string
  clickable?: boolean
  suppressHover?: boolean
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
// CUTE CAPYBARA COLORS - warm orange-brown, friendly & soft
const P: Record<string, [string, string]> = {
  // Face/fur colors - WARM ORANGE-BROWN
  H: ['#C4956A', '#D4A87A'],    // main fur - warm caramel
  h: ['#A67B52', '#B8956A'],    // darker fur/shadow
  b: ['#D4B090', '#E4C8A8'],    // belly/lighter fur - creamy

  // Eye colors - CUTE SPARKLY EYES (・ω・)
  e: ['#8B7355', '#A88960'],    // ears - soft brown
  x: ['#2D1B10', '#2D1B10'],    // eye pupil - deep brown (not pure black)
  o: ['#FFFFFF', '#FFFFFF'],    // eye white
  k: ['#FFFFFF', '#FFFFFF'],    // eye sparkle/highlight

  // Nose/Nostril - cute pink-ish brown
  N: ['#6B4A3A', '#8B6A5A'],    // nostril - softer brown

  // Blush - for extra cuteness
  B: ['#E8A090', '#F0B8A8'],    // pink blush

  // Accessories
  G: ['#2D1B10', '#E8E4E0'],    // glasses frame
  L: ['#60B0E0', '#90D0F0'],    // glasses lens - softer blue
  Q: ['#F0C040', '#FFD860'],    // gold/bling - warmer gold

  // Misc
  S: ['#404858', '#A0A8B8'],    // laptop
  s: ['#60D890', '#90F0B0'],    // laptop screen
  C: ['#F8F4F0', '#E0DCD8'],    // cigarette
  F: ['#FF6030', '#FF8050'],    // fire
  T: ['#A8A4A0', '#787470'],    // smoke
  w: ['#80C8F0', '#60B0E0'],    // water/sweat/tears
  Z: ['#80C8F0', '#60B0E0'],    // zzz
  M: ['#70B870', '#90D090'],    // grass
  W: ['#FFFFFF', '#404040'],    // white/speech bubble
  R: ['#30C860', '#60E890'],    // green (wagmi sign)
  r: ['#FFFFFF', '#103020'],    // wagmi text
  n: ['#4A3020', '#D8C8B0'],    // thin line - closed eyes
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
// ══ FACE-ONLY PIXEL ART (GEN Z DEADPAN STYLE) ══
// ══════════════════════════════════════════════════════════

// Base face - 16x12 grid, focused on the face
// Key features: GEN Z STARE (ㅡ_ㅡ) deadpan/judgmental eyes
// Eyes: horizontal lines 'n' = thin line eyes (deadpan)
// 'B' = blush, big nostrils
const FACE_ART = `
....ee....ee....
...eeee..eeee...
..HHHHHHHHHHHH..
.HHHHHHHHHHHHHH.
.HHnnnHHHnnnHHH.
.BHHHHHHHHHHHBh.
..HHHHHNNHHHHH..
..HHHHHNNHHHHh..
...HHbbbbbHHH...
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
// New eye structure: 2x2 blocks with 'o' (highlight) and 'x' (pupil)
// For closed eyes or special effects, replace all eye pixels
function replaceEyes(pixels: typeof FACE_PIXELS, char: string) {
  return pixels.map(p => {
    if (p.c === 'x' || p.c === 'o') {
      return { ...p, c: char }
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

// dejected: half-closed eyes (horizontal line)
function DejectedPose({ dark }: { dark: boolean }) {
  const face = replaceEyes(FACE_PIXELS, 'n')
  return <PixelSvg pixels={face} w={FACE_SIZE.w} h={FACE_SIZE.h} dark={dark} />
}

// sparkle: excited golden eyes
function SparklePose({ dark }: { dark: boolean }) {
  const face = replaceEyes(FACE_PIXELS, 'Q')
  const sparkles = [
    { x: 2, y: 3, c: 'Q' }, { x: 13, y: 3, c: 'Q' },
  ]
  return <PixelSvg pixels={[...face, ...sparkles]} w={FACE_SIZE.w} h={FACE_SIZE.h} dark={dark} />
}

// smoking: squinted eyes + cigarette sticking out
function SmokingPose({ dark }: { dark: boolean }) {
  const face = replaceEyes(FACE_PIXELS, 'n')
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
  // Sunglasses overlay - covers both rows of 2x2 eyes
  const GLASSES_ART = `
................
................
................
................
.GLLLGgGLLLGggg.
.GLLLGgGLLLGggg.
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
  const face = replaceEyes(FACE_PIXELS, 'n')
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
  // Keep left eye (positions 3-4), replace right eye (positions 8-9) with closed line
  const face = FACE_PIXELS.map(p => {
    // Right eye area (x >= 8 and x <= 9)
    if ((p.c === 'x' || p.c === 'o') && p.x >= 8 && p.x <= 9) {
      return { ...p, c: 'n' }
    }
    return p
  })
  return <PixelSvg pixels={face} w={FACE_SIZE.w} h={FACE_SIZE.h} dark={dark} />
}

// notfound: smoking + speech bubble
function NotFoundPose({ dark }: { dark: boolean }) {
  const face = replaceEyes(FACE_PIXELS, 'n')
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

// success: happy squint eyes (^_^) + WAGMI
function SuccessPose({ dark }: { dark: boolean }) {
  const face = [...FACE_PIXELS]
  // Happy eyes: ^ shape (curved up)
  const happyEyes = [
    { x: 3, y: 4, c: 'x' }, { x: 4, y: 3, c: 'x' }, { x: 5, y: 4, c: 'x' },
    { x: 9, y: 4, c: 'x' }, { x: 10, y: 3, c: 'x' }, { x: 11, y: 4, c: 'x' },
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
// ══ PAGE-SPECIFIC POSES ══
// ══════════════════════════════════════════════════════════

// search: magnifying glass, deadpan stare
function SearchPose({ dark }: { dark: boolean }) {
  const face = [...FACE_PIXELS]
  // Magnifying glass next to face
  const magnifier = [
    { x: 15, y: 3, c: 'G' }, { x: 16, y: 3, c: 'G' }, { x: 17, y: 3, c: 'G' },
    { x: 15, y: 4, c: 'G' }, { x: 17, y: 4, c: 'G' },
    { x: 15, y: 5, c: 'G' }, { x: 16, y: 5, c: 'G' }, { x: 17, y: 5, c: 'G' },
    { x: 18, y: 6, c: 'G' }, { x: 19, y: 7, c: 'G' }, { x: 20, y: 8, c: 'G' },
  ]
  return <PixelSvg pixels={[...face, ...magnifier]} w={21} h={FACE_SIZE.h} dark={dark} />
}

// building: hard hat + wrench (for companies)
function BuildingPose({ dark }: { dark: boolean }) {
  const face = [...FACE_PIXELS]
  // Hard hat on top
  const hardHat = [
    { x: 4, y: 0, c: 'Q' }, { x: 5, y: 0, c: 'Q' }, { x: 6, y: 0, c: 'Q' },
    { x: 7, y: 0, c: 'Q' }, { x: 8, y: 0, c: 'Q' }, { x: 9, y: 0, c: 'Q' },
    { x: 10, y: 0, c: 'Q' }, { x: 11, y: 0, c: 'Q' },
    { x: 3, y: 1, c: 'Q' }, { x: 4, y: 1, c: 'Q' }, { x: 5, y: 1, c: 'Q' },
    { x: 6, y: 1, c: 'Q' }, { x: 7, y: 1, c: 'Q' }, { x: 8, y: 1, c: 'Q' },
    { x: 9, y: 1, c: 'Q' }, { x: 10, y: 1, c: 'Q' }, { x: 11, y: 1, c: 'Q' },
    { x: 12, y: 1, c: 'Q' },
  ]
  return <PixelSvg pixels={[...face.map(p => ({ ...p, y: p.y + 2 })), ...hardHat]} w={FACE_SIZE.w} h={FACE_SIZE.h + 2} dark={dark} />
}

// reading: glasses + book/document
function ReadingPose({ dark }: { dark: boolean }) {
  const face = [...FACE_PIXELS]
  // Regular glasses (not sunglasses)
  const glasses = [
    { x: 2, y: 4, c: 'G' }, { x: 3, y: 4, c: 'L' }, { x: 4, y: 4, c: 'L' }, { x: 5, y: 4, c: 'G' },
    { x: 6, y: 4, c: 'G' }, { x: 7, y: 4, c: 'G' },
    { x: 8, y: 4, c: 'G' }, { x: 9, y: 4, c: 'L' }, { x: 10, y: 4, c: 'L' }, { x: 11, y: 4, c: 'G' },
  ]
  // Document/paper below
  const paper = [
    { x: 12, y: 7, c: 'W' }, { x: 13, y: 7, c: 'W' }, { x: 14, y: 7, c: 'W' }, { x: 15, y: 7, c: 'W' },
    { x: 12, y: 8, c: 'W' }, { x: 13, y: 8, c: 'n' }, { x: 14, y: 8, c: 'n' }, { x: 15, y: 8, c: 'W' },
    { x: 12, y: 9, c: 'W' }, { x: 13, y: 9, c: 'n' }, { x: 14, y: 9, c: 'W' }, { x: 15, y: 9, c: 'W' },
  ]
  return <PixelSvg pixels={[...face, ...glasses, ...paper]} w={17} h={FACE_SIZE.h} dark={dark} />
}

// heart: heart eyes for investors/bookmarks
function HeartPose({ dark }: { dark: boolean }) {
  const face = [...FACE_PIXELS]
  // Heart-shaped eyes
  const hearts = [
    { x: 2, y: 3, c: 'B' }, { x: 5, y: 3, c: 'B' },
    { x: 2, y: 4, c: 'B' }, { x: 3, y: 4, c: 'B' }, { x: 4, y: 4, c: 'B' }, { x: 5, y: 4, c: 'B' },
    { x: 3, y: 5, c: 'B' }, { x: 4, y: 5, c: 'B' },
    { x: 8, y: 3, c: 'B' }, { x: 11, y: 3, c: 'B' },
    { x: 8, y: 4, c: 'B' }, { x: 9, y: 4, c: 'B' }, { x: 10, y: 4, c: 'B' }, { x: 11, y: 4, c: 'B' },
    { x: 9, y: 5, c: 'B' }, { x: 10, y: 5, c: 'B' },
  ]
  return <PixelSvg pixels={[...face, ...hearts]} w={FACE_SIZE.w} h={FACE_SIZE.h} dark={dark} />
}

// question: confused face with ? bubble
function QuestionPose({ dark }: { dark: boolean }) {
  const face = [...FACE_PIXELS]
  const extra = (
    <>
      <circle cx={15} cy={3} r={2.5} fill={fill(dark, 'W')} />
      <text x={14} y={4} fill={fill(dark, 'N')} fontSize="3" fontWeight="bold" fontFamily="monospace">
        ?
      </text>
    </>
  )
  return <PixelSvg pixels={face} w={18} h={FACE_SIZE.h} dark={dark} extra={extra} />
}

// coffee: holding coffee cup (for late night grinding)
function CoffeePose({ dark }: { dark: boolean }) {
  const face = [...FACE_PIXELS]
  // Coffee cup
  const coffee = [
    { x: 14, y: 6, c: 'W' }, { x: 15, y: 6, c: 'W' }, { x: 16, y: 6, c: 'W' },
    { x: 14, y: 7, c: 'h' }, { x: 15, y: 7, c: 'h' }, { x: 16, y: 7, c: 'h' },
    { x: 14, y: 8, c: 'h' }, { x: 15, y: 8, c: 'h' }, { x: 16, y: 8, c: 'h' },
    { x: 17, y: 7, c: 'h' }, // Handle
  ]
  // Steam
  const steam = [
    { x: 14, y: 5, c: 'T' }, { x: 16, y: 4, c: 'T' },
  ]
  return <PixelSvg pixels={[...face, ...coffee, ...steam]} w={18} h={FACE_SIZE.h} dark={dark} />
}

// door: peeking from door (for login)
function DoorPose({ dark }: { dark: boolean }) {
  const face = [...FACE_PIXELS]
  // Door frame on left side
  const door = [
    { x: 0, y: 0, c: 'G' }, { x: 0, y: 1, c: 'G' }, { x: 0, y: 2, c: 'G' },
    { x: 0, y: 3, c: 'G' }, { x: 0, y: 4, c: 'G' }, { x: 0, y: 5, c: 'G' },
    { x: 0, y: 6, c: 'G' }, { x: 0, y: 7, c: 'G' }, { x: 0, y: 8, c: 'G' },
    { x: 0, y: 9, c: 'G' },
    { x: 1, y: 4, c: 'Q' }, // Door handle
  ]
  return <PixelSvg pixels={[...door, ...face.map(p => ({ ...p, x: p.x + 2 }))]} w={FACE_SIZE.w + 2} h={FACE_SIZE.h} dark={dark} />
}

// ══════════════════════════════════════════════════════════
// ══ FULL-BODY HERO POSE (laptop with green terminal) ══
// ══════════════════════════════════════════════════════════

// Full body capybara with sunglasses, holding laptop
// Eyes: 'n' = thin line deadpan eyes (Gen Z stare) - covered by glasses anyway
const HERO_BODY_ART = `
.......ee....ee...............
......eeee..eeee..............
.....HHHHHHHHHHHHHH...........
....HHHHHHHHHHHHHHHH..........
....HnnnHHHHnnnHHHHH..........
....BHHHHHHHHHHHHBh...........
.....HHHHHNNHHHHHH............
...HHHHHHHNNHHHHHHHHHH........
..HHHHHHHHHHHHHHHHHHHHh.......
.HHHHHHHHbbbbbbbbHHHHHHH......
.HHHHHHHHbbbbbbbbHHHHHHHh.....
..HHHHHHHHHHHHHHHHHHHHHh......
...HHHHHHHHHHHHHHHHHHHH........
....hhhh..........hhhh........
....hhhh..........hhhh........
`

const HERO_BODY_PIXELS = parseArt(HERO_BODY_ART)
const HERO_BODY_SIZE = artSize(HERO_BODY_ART)

function HeroLaptopPose({ dark }: { dark: boolean }) {
  const body = [...HERO_BODY_PIXELS]

  // Sunglasses overlay - covers 2 rows for the bigger cute eyes
  const glasses = [
    // Top row of glasses
    { x: 4, y: 4, c: 'G' }, { x: 5, y: 4, c: 'L' }, { x: 6, y: 4, c: 'L' }, { x: 7, y: 4, c: 'L' },
    { x: 8, y: 4, c: 'G' }, { x: 9, y: 4, c: 'G' },
    { x: 10, y: 4, c: 'L' }, { x: 11, y: 4, c: 'L' }, { x: 12, y: 4, c: 'L' },
    { x: 13, y: 4, c: 'G' }, { x: 14, y: 4, c: 'G' },
    // Bottom row of glasses
    { x: 4, y: 5, c: 'G' }, { x: 5, y: 5, c: 'L' }, { x: 6, y: 5, c: 'L' }, { x: 7, y: 5, c: 'L' },
    { x: 8, y: 5, c: 'G' }, { x: 9, y: 5, c: 'G' },
    { x: 10, y: 5, c: 'L' }, { x: 11, y: 5, c: 'L' }, { x: 12, y: 5, c: 'L' },
    { x: 13, y: 5, c: 'G' }, { x: 14, y: 5, c: 'G' },
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
  // Base poses
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
  // Page-specific poses
  search: SearchPose,
  building: BuildingPose,
  reading: ReadingPose,
  heart: HeartPose,
  question: QuestionPose,
  coffee: CoffeePose,
  door: DoorPose,
  // Page aliases
  main: HeroLaptopPose,
  careers: SearchPose,
  investors: HeartPose,
  companies: BuildingPose,
  articles: ReadingPose,
  bookmarks: HeartPose,
  login: DoorPose,
  // State aliases
  loading: SweatingPose,
  notfound: NotFoundPose,
  empty: EmptyPose,
  success: SuccessPose,
  error: SweatingPose,
}

// ── Meme content (Gen Z style) ──
const CLICK_QUOTES = [
  // Gen Z vibes
  'bruh', 'no cap this job bussin', 'slay', 'its giving... employed',
  'bestie ur hired', 'periodt', 'lowkey a vibe', 'highkey fire',
  'not me applying at 3am', 'real', 'facts no printer',
  // Crypto Gen Z
  'ser pls', 'gm', 'wagmi', 'ngmi fr', 'wen lambo',
  'this is fine', 'probably nothing', 'few understand',
  'touch grass', 'down bad', 'up only', 'LFG',
  // Mixed
  'ate and left no crumbs', 'understood the assignment',
  'main character energy', 'living rent free',
]

const TSUNDERE_MSGS = [
  '뭘 봐... (bruh)', '...', '*judges silently*', '별로야.',
  'mid tbh', '...관심 없어', '*stares in deadpan*', 'ok and?',
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
export default function Pixelbara({ pose, size = 120, className = '', clickable = false, suppressHover = false }: PixelbaraProps) {
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
    if (!clickable || suppressHover) return
    const msg = TSUNDERE_MSGS[Math.floor(Math.random() * TSUNDERE_MSGS.length)]
    setHoverMsg(msg)
  }, [clickable, suppressHover])

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

// ── MiniPixelbara (face only, compact) - Gen Z deadpan stare ──
export function MiniPixelbara({ className = '' }: { className?: string }) {
  const dark = useIsDark()
  // Gen Z deadpan eyes (ㅡ_ㅡ): n=thin line eyes
  const miniArt = `
..ee..ee
HHHHHHHH
HHHHHHHH
nnnHnnnH
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

// ── PixelbaraToggleIcon (for theme toggle) - Gen Z deadpan stare ──
export function PixelbaraToggleIcon({ withGlasses, className = '' }: { withGlasses: boolean; className?: string }) {
  const dark = useIsDark()
  // Gen Z deadpan eyes (ㅡ_ㅡ): n=thin line eyes, or sunglasses
  const miniArt = withGlasses
    ? `
..ee..ee
HHHHHHHH
GLLGLLGH
GLLGLLGH
HHHNNHhh
.HHHHHH.
`
    : `
..ee..ee
HHHHHHHH
HHHHHHHH
nnnHnnnH
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
