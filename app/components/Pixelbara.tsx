'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

// ── Types ──
interface PixelbaraProps {
  pose: 'main' | 'loading' | 'notfound' | 'empty' | 'success' | 'walk1' | 'walk2'
  size?: number
  className?: string
  clickable?: boolean
}

interface MiniPixelbaraProps {
  className?: string
}

// ── Dark mode hook ──
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

// ── Color palette: [light, dark] ──
const P: Record<string, [string, string]> = {
  '.': ['transparent', 'transparent'],
  H: ['#7B5B3A', '#C49A5A'],   // head/body brown
  h: ['#5C4033', '#A07848'],   // darker brown
  b: ['#A0836B', '#D4B896'],   // belly tan
  e: ['#4A3628', '#8A7060'],   // ear dark
  x: ['#1A1008', '#F0EDE8'],   // eye
  n: ['#2A1A0E', '#C8B8A0'],   // nose
  D: ['#4A3628', '#8A7060'],   // legs
  G: ['#1A1008', '#E0DDD8'],   // glasses frame
  L: ['#38BDF8', '#7DD3FC'],   // lens blue
  S: ['#334155', '#94A3B8'],   // laptop shell
  s: ['#4ADE80', '#86EFAC'],   // screen green
  C: ['#F5F0EB', '#D6D0C8'],   // coffee cup
  c: ['#3A1A08', '#6B3A18'],   // coffee liquid
  T: ['#9A9490', '#686460'],   // steam
  W: ['#FFFFFF', '#3A3835'],   // speech bubble
  Q: ['#EAB308', '#FDE047'],   // question mark yellow
  R: ['#22C55E', '#4ADE80'],   // sign green
  r: ['#FFFFFF', '#052E16'],   // sign text color
}

function fill(dark: boolean, key: string): string {
  const pair = P[key]
  if (!pair) return 'transparent'
  return dark ? pair[1] : pair[0]
}

// ── String-art → pixel array parser ──
function parseArt(art: string): { x: number; y: number; c: string }[] {
  const rows = art.trim().split('\n').map(r => r.trim())
  const pixels: { x: number; y: number; c: string }[] = []
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x]
      if (ch !== '.') pixels.push({ x, y, c: ch })
    }
  }
  return pixels
}

function artSize(art: string): { w: number; h: number } {
  const rows = art.trim().split('\n').map(r => r.trim())
  return { w: Math.max(...rows.map(r => r.length)), h: rows.length }
}

// ── Pixel art definitions ──
// Capybara base body (side view, 22x16)
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

// Main pose: sunglasses overlay
const GLASSES_ART = `
......................
......................
......................
......................
...GGLGGGGGGLGGggg...
......................
......................
......................
......................
......................
......................
......................
......................
......................
......................
......................
`

// Walking frame 1: front legs forward
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

// Walking frame 2: back legs forward
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
const GLASSES_PIXELS = parseArt(GLASSES_ART)
const WALK1_PIXELS = parseArt(WALK1_ART)
const WALK2_PIXELS = parseArt(WALK2_ART)
const BODY_SIZE = artSize(BODY_ART)

// ── SVG renderer ──
function PixelSvg({
  pixels,
  w,
  h,
  dark,
  extra,
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

// ── Poses ──
function MainPose({ dark }: { dark: boolean }) {
  // Merge body + glasses (glasses drawn on top)
  const all = [...BODY_PIXELS, ...GLASSES_PIXELS]
  // Laptop to the right
  const laptopX = 23
  const laptopY = 5
  const laptopPixels: { x: number; y: number; c: string }[] = []
  // Shell
  for (let dy = 0; dy < 5; dy++)
    for (let dx = 0; dx < 7; dx++)
      laptopPixels.push({ x: laptopX + dx, y: laptopY + dy, c: 'S' })
  // Screen inside
  for (let dy = 1; dy < 4; dy++)
    for (let dx = 1; dx < 6; dx++)
      laptopPixels.push({ x: laptopX + dx, y: laptopY + dy, c: 's' })
  // Keyboard base
  for (let dx = -1; dx < 8; dx++)
    laptopPixels.push({ x: laptopX + dx, y: laptopY + 5, c: 'S' })

  return <PixelSvg pixels={[...all, ...laptopPixels]} w={31} h={16} dark={dark} />
}

function LoadingPose({ dark }: { dark: boolean }) {
  // Closed eyes (horizontal lines)
  const body = BODY_PIXELS.map(p => {
    if (p.c === 'x') return { ...p, c: 'H' } // remove default eyes
    return p
  })
  const closedEyes = [
    { x: 5, y: 4, c: 'x' }, { x: 6, y: 4, c: 'x' }, { x: 7, y: 4, c: 'x' },
    { x: 13, y: 4, c: 'x' }, { x: 14, y: 4, c: 'x' }, { x: 15, y: 4, c: 'x' },
  ]
  // Coffee cup
  const cup = [
    { x: 22, y: 4, c: 'C' as string }, { x: 23, y: 4, c: 'C' as string }, { x: 24, y: 4, c: 'C' as string },
    { x: 22, y: 5, c: 'C' as string }, { x: 23, y: 5, c: 'c' as string }, { x: 24, y: 5, c: 'C' as string },
    { x: 22, y: 6, c: 'C' as string }, { x: 23, y: 6, c: 'c' as string }, { x: 24, y: 6, c: 'C' as string },
    { x: 22, y: 7, c: 'C' as string }, { x: 23, y: 7, c: 'C' as string }, { x: 24, y: 7, c: 'C' as string },
    { x: 25, y: 5, c: 'C' as string }, { x: 25, y: 6, c: 'C' as string }, // handle
    // Steam
    { x: 22, y: 2, c: 'T' as string }, { x: 23, y: 1, c: 'T' as string }, { x: 24, y: 3, c: 'T' as string },
  ]
  return <PixelSvg pixels={[...body, ...closedEyes, ...cup]} w={27} h={16} dark={dark} />
}

function NotFoundPose({ dark }: { dark: boolean }) {
  const confused = BODY_PIXELS.map(p => {
    if (p.c === 'x') return { ...p, c: 'Q' }
    return p
  })
  const extra = (
    <>
      <rect x={16} y={0} width={12} height={5} rx={1} fill={fill(dark, 'W')} />
      <polygon points="17,5 18,5 16,7" fill={fill(dark, 'W')} />
      <text
        x={17.5}
        y={3.5}
        fill={fill(dark, 'n')}
        fontSize="2.5"
        fontWeight="bold"
        fontFamily="monospace"
      >
        gm...?
      </text>
    </>
  )
  return (
    <PixelSvg
      pixels={confused.map(p => ({ ...p, y: p.y + 2 }))}
      w={29}
      h={18}
      dark={dark}
      extra={extra}
    />
  )
}

function EmptyPose({ dark }: { dark: boolean }) {
  // Flat mouth
  const body = [...BODY_PIXELS]
  const arms = [
    { x: 0, y: 7, c: 'h' }, { x: 0, y: 8, c: 'h' },
    { x: 21, y: 7, c: 'h' }, { x: 21, y: 8, c: 'h' },
  ]
  const mouth = [{ x: 18, y: 6, c: 'n' }, { x: 19, y: 6, c: 'n' }]
  return <PixelSvg pixels={[...body, ...arms, ...mouth]} w={22} h={16} dark={dark} />
}

function SuccessPose({ dark }: { dark: boolean }) {
  // Happy squint eyes
  const body = BODY_PIXELS.map(p => {
    if (p.c === 'x') return { ...p, c: 'H' }
    return p
  })
  const happyEyes = [
    { x: 5, y: 3, c: 'x' }, { x: 6, y: 4, c: 'x' }, { x: 7, y: 3, c: 'x' },
    { x: 13, y: 3, c: 'x' }, { x: 14, y: 4, c: 'x' }, { x: 15, y: 3, c: 'x' },
  ]
  const extra = (
    <>
      <rect x={23} y={3} width={10} height={5} rx={1} fill={fill(dark, 'R')} />
      <text
        x={24.3}
        y={6.5}
        fill={fill(dark, 'r')}
        fontSize="2.8"
        fontWeight="bold"
        fontFamily="monospace"
      >
        WAGMI
      </text>
    </>
  )
  const arm = [{ x: 22, y: 7, c: 'h' }, { x: 22, y: 8, c: 'h' }]
  return <PixelSvg pixels={[...body, ...happyEyes, ...arm]} w={34} h={16} dark={dark} extra={extra} />
}

function Walk1Pose({ dark }: { dark: boolean }) {
  return <PixelSvg pixels={WALK1_PIXELS} w={BODY_SIZE.w} h={BODY_SIZE.h} dark={dark} />
}
function Walk2Pose({ dark }: { dark: boolean }) {
  return <PixelSvg pixels={WALK2_PIXELS} w={BODY_SIZE.w} h={BODY_SIZE.h} dark={dark} />
}

const POSES: Record<string, (props: { dark: boolean }) => React.ReactNode> = {
  main: MainPose,
  loading: LoadingPose,
  notfound: NotFoundPose,
  empty: EmptyPose,
  success: SuccessPose,
  walk1: Walk1Pose,
  walk2: Walk2Pose,
}

// ── Web3 quotes ──
const QUOTES = [
  'gm ser',
  'wagmi',
  'probably nothing',
  'wen job?',
  'ngmi if you don\'t apply',
  'ser this is alpha',
  'few understand',
  'have fun staying poor',
  'looks rare',
  'wen moon?',
  'this is the way',
  'LFG!',
]

// ── Main component ──
export default function Pixelbara({ pose, size = 120, className = '', clickable = false }: PixelbaraProps) {
  const dark = useIsDark()
  const PoseComponent = POSES[pose]

  const handleClick = useCallback(() => {
    if (!clickable) return
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]
    toast(quote, {
      duration: 2000,
      className: 'text-sm font-bold tracking-wide',
    })
  }, [clickable])

  return (
    <div
      className={`inline-block select-none ${clickable ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''} ${className}`}
      style={{ width: size }}
      aria-label={`Pixelbara mascot - ${pose}`}
      role="img"
      onClick={clickable ? handleClick : undefined}
    >
      {PoseComponent && <PoseComponent dark={dark} />}
    </div>
  )
}

// ── Mini Pixelbara (inline, 16-20px) ──
export function MiniPixelbara({ className = '' }: MiniPixelbaraProps) {
  const dark = useIsDark()
  // Tiny 8x6 capybara head
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

// ── Walking Pixelbara (animated) ──
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

// ── Sunglasses-only toggle icon (for ThemeToggle) ──
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

// ── Cursor data URL (capybara head) ──
export function getPixelbaraCursorUrl(dark: boolean): string {
  const size = 24
  const grid = [
    '....ee..ee....',
    '...HHHHHHHH...',
    '..HHHHHHHHHH..',
    '..HHxHHHHxHHH.',
    '..HHHHHHHHHHnn',
    '..HHHHHHHHHHH.',
    '...HHHHHHHH...',
  ]
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 14 7" shape-rendering="crispEdges">`
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const ch = grid[y][x]
      if (ch !== '.') {
        const color = fill(dark, ch)
        svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`
      }
    }
  }
  svg += '</svg>'
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
