'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

// ══════════════════════════════════════════════════════════
// ══ TYPES ══
// ══════════════════════════════════════════════════════════

type PoseId =
  | 'blank' | 'dejected' | 'sparkle' | 'smoking' | 'sweating'
  | 'bling' | 'sleepy' | 'eating' | 'wink' | 'heroLaptop'
  | 'search' | 'building' | 'reading' | 'heart' | 'question' | 'coffee' | 'door'
  | 'ecosystem'

type PoseAlias = 'main' | 'loading' | 'notfound' | 'empty' | 'success'
  | 'careers' | 'investors' | 'companies' | 'articles' | 'bookmarks' | 'error' | 'login'

interface PixelbaraProps {
  pose: PoseId | PoseAlias
  size?: number
  className?: string
  clickable?: boolean
  suppressHover?: boolean
}

// ══════════════════════════════════════════════════════════
// ══ HOOKS ══
// ══════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════
// ══ COLOR PALETTE ══
// ══════════════════════════════════════════════════════════
// Warm, friendly capybara colors - [light mode, dark mode]

const P: Record<string, [string, string]> = {
  // Main fur - warm caramel brown
  H: ['#C8A882', '#D4B896'],
  // Shadow fur - darker warm brown
  h: ['#A68B6A', '#B89B7A'],
  // Belly/lighter area - cream
  b: ['#E0CDB8', '#EAD9C8'],
  // Ear interior - pinkish brown
  e: ['#D4A090', '#E0B0A0'],
  // Ear outline - matches shadow fur
  E: ['#A68B6A', '#B89B7A'],

  // Eyes - SUPER SMALL for Gen Z deadpan (ㅡㅡ)
  // Just a thin dark line
  n: ['#3D2B1F', '#2D1B0F'],

  // Nose - BIG and prominent
  N: ['#6B4A3A', '#7B5A4A'],
  // Nostrils - dark
  O: ['#3D2B1F', '#2D1B0F'],

  // Blush - subtle pink
  B: ['#E8B0A0', '#F0C0B0'],

  // Accessories
  G: ['#2D1B10', '#E8E4E0'],    // glasses frame
  L: ['#70B8E8', '#90D0F8'],    // glasses lens
  Q: ['#F0C040', '#FFD860'],    // gold/bling

  // Items
  S: ['#404858', '#A0A8B8'],    // laptop
  s: ['#60D890', '#90F0B0'],    // screen glow
  C: ['#F8F4F0', '#E0DCD8'],    // cigarette
  F: ['#FF6030', '#FF8050'],    // fire
  T: ['#A8A4A0', '#C8C4C0'],    // smoke
  w: ['#80C8F0', '#A0E0FF'],    // water/sweat
  Z: ['#80C8F0', '#A0E0FF'],    // zzz
  M: ['#70B870', '#90D090'],    // grass
  W: ['#FFFFFF', '#404040'],    // white
  R: ['#30C860', '#60E890'],    // success green
  r: ['#FFFFFF', '#103020'],    // text on green

  // Alligator (for ecosystem pose)
  A: ['#5A8060', '#6A9070'],    // alligator body
  a: ['#4A7050', '#5A8060'],    // alligator shadow
  Y: ['#F8F080', '#FFE890'],    // alligator eye
}

function fill(dark: boolean, key: string): string {
  const pair = P[key]
  if (!pair) return 'transparent'
  return dark ? pair[1] : pair[0]
}

// ══════════════════════════════════════════════════════════
// ══ PIXEL ART ENGINE ══
// ══════════════════════════════════════════════════════════

function parseArt(art: string): { x: number; y: number; c: string }[] {
  const rows = art.trim().split('\n').map(r => r.trimEnd())
  const pixels: { x: number; y: number; c: string }[] = []
  for (let y = 0; y < rows.length; y++)
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x]
      if (ch !== '.' && ch !== ' ') pixels.push({ x, y, c: ch })
    }
  return pixels
}

function artSize(art: string): { w: number; h: number } {
  const rows = art.trim().split('\n').map(r => r.trimEnd())
  return { w: Math.max(...rows.map(r => r.length)), h: rows.length }
}

// ══════════════════════════════════════════════════════════
// ══ NEW CUTE CAPYBARA DESIGNS ══
// More refined pixels, round body, tiny eyes (ㅡㅡ)
// ══════════════════════════════════════════════════════════

// Face only - 20x16 grid, more refined
// Key: TINY EYES as horizontal lines (n)
// Big nose with clear nostrils (N, O)
// Round, soft shape
const FACE_ART = `
......EeeeE..EeeeE......
.....EeeeeE..EeeeeE.....
....HHHHHHHHHHHHHHHH....
...HHHHHHHHHHHHHHHHHH...
..HHHHHHHHHHHHHHHHHHH...
..HHHHHnnHHHHHHnnHHHH...
..BHHHHHHHHHHHHHHHHHBh..
..HHHHHHHHHHHHHHHHHHHH..
...HHHHHHHNNNNHHHHHHH...
...HHHHHHHNOONHHHHHHh...
....HHHHHHNNNNHHHHHh....
.....HHbbbbbbbbbHHH.....
......HHHHHHHHHHH.......
`

const FACE_PIXELS = parseArt(FACE_ART)
const FACE_SIZE = artSize(FACE_ART)

// Full body with laptop - 36x28 grid
// Chubby body, short legs, holding laptop
const HERO_BODY_ART = `
.........EeeeE..EeeeE...............
........EeeeeE..EeeeeE..............
.......HHHHHHHHHHHHHHHH.............
......HHHHHHHHHHHHHHHHHH............
.....HHHHHHHHHHHHHHHHHHH............
.....HHHHHnnHHHHHHnnHHHH............
.....BHHHHHHHHHHHHHHHHHBh...........
.....HHHHHHHHHHHHHHHHHHHH...........
......HHHHHHHNNNNHHHHHHH............
......HHHHHHHNOONHHHHHHh............
.....HHHHHHHHHHHHHHHHHHHH...........
....HHHHHHHHHHHHHHHHHHHHHH..........
...HHHHHHHHHbbbbbbHHHHHHHHH.........
..HHHHHHHHHbbbbbbbbHHHHHHHHH........
..HHHHHHHHHbbbbbbbbHHHHHHHHH........
...HHHHHHHHHHHHHHHHHHHHHHHHHH.......
....HHHHHHHHHHHHHHHHHHHHHHHH........
.....hhhh............hhhh...........
.....hhhh............hhhh...........
`

const HERO_BODY_PIXELS = parseArt(HERO_BODY_ART)
const HERO_BODY_SIZE = artSize(HERO_BODY_ART)

// Capybara on alligator - for Ecosystems page!
// "we chill with everyone" vibes
const ECOSYSTEM_ART = `
..........EeeeE..EeeeE..............
.........EeeeeE..EeeeeE.............
........HHHHHHHHHHHHHHHH............
.......HHHHHHHHHHHHHHHHHH...........
......HHHHHHHHHHHHHHHHHHH...........
......HHHHHnnHHHHHHnnHHHH...........
......BHHHHHHHHHHHHHHHHHBh..........
......HHHHHHHHHHHHHHHHHHHH..........
.......HHHHHHHNNNNHHHHHH............
.......HHHHHHHNOONHHHHHh............
......HHHHHHHHHHHHHHHHHHh...........
.....HHHHHHHHHbbbbbbHHHHHH..........
....HHHHHHHHHHbbbbbbHHHHHHH.........
...HHHHHHHHHHHHHHHHHHHHHHHHH........
...hhhhh..............hhhhh.........
..AAAAAAAAAAAAAAAAAAAAAAAAAA........
.AAAAAAYAAAAAAAAAAAAAAAAYaAAA.......
AAAAAAAaAAAAAAAAAAAAAAAAaaAAAA......
AAAAAAAAaaaaaaaaaaaaaaaaaAAAAA......
.AAAAAAAAAAAAAAAAAAAAAAAAAAAA.......
..AAAA..AAAA........AAAA..AAAA......
`

const ECOSYSTEM_PIXELS = parseArt(ECOSYSTEM_ART)
const ECOSYSTEM_SIZE = artSize(ECOSYSTEM_ART)

// ══════════════════════════════════════════════════════════
// ══ SVG RENDERER ══
// ══════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════
// ══ POSE COMPONENTS ══
// ══════════════════════════════════════════════════════════

// blank: expressionless default
function BlankPose({ dark }: { dark: boolean }) {
  return <PixelSvg pixels={FACE_PIXELS} w={FACE_SIZE.w} h={FACE_SIZE.h} dark={dark} />
}

// dejected: same as blank but with a tear
function DejectedPose({ dark }: { dark: boolean }) {
  const tear = [
    { x: 19, y: 7, c: 'w' },
    { x: 19, y: 8, c: 'w' },
  ]
  return <PixelSvg pixels={[...FACE_PIXELS, ...tear]} w={FACE_SIZE.w + 2} h={FACE_SIZE.h} dark={dark} />
}

// sparkle: golden sparkles
function SparklePose({ dark }: { dark: boolean }) {
  const sparkles = [
    { x: 3, y: 3, c: 'Q' }, { x: 4, y: 2, c: 'Q' },
    { x: 19, y: 3, c: 'Q' }, { x: 20, y: 2, c: 'Q' },
  ]
  return <PixelSvg pixels={[...FACE_PIXELS, ...sparkles]} w={FACE_SIZE.w + 2} h={FACE_SIZE.h} dark={dark} />
}

// smoking: cigarette + smoke
function SmokingPose({ dark }: { dark: boolean }) {
  const cigarette = [
    { x: 20, y: 9, c: 'C' }, { x: 21, y: 9, c: 'C' },
    { x: 22, y: 9, c: 'C' }, { x: 23, y: 9, c: 'F' },
  ]
  const smoke = [
    { x: 24, y: 8, c: 'T' }, { x: 23, y: 7, c: 'T' },
    { x: 25, y: 6, c: 'T' },
  ]
  return <PixelSvg pixels={[...FACE_PIXELS, ...cigarette, ...smoke]} w={26} h={FACE_SIZE.h} dark={dark} />
}

// sweating: worried sweat drops
function SweatingPose({ dark }: { dark: boolean }) {
  const sweat = [
    { x: 21, y: 5, c: 'w' },
    { x: 22, y: 6, c: 'w' },
    { x: 21, y: 7, c: 'w' },
  ]
  return <PixelSvg pixels={[...FACE_PIXELS, ...sweat]} w={FACE_SIZE.w + 4} h={FACE_SIZE.h} dark={dark} />
}

// bling: sunglasses + gold chain - THE MAIN POSE
function BlingPose({ dark }: { dark: boolean }) {
  // Sunglasses over the tiny eyes
  const glasses = [
    // Left lens
    { x: 5, y: 5, c: 'G' }, { x: 6, y: 5, c: 'L' }, { x: 7, y: 5, c: 'L' }, { x: 8, y: 5, c: 'L' }, { x: 9, y: 5, c: 'G' },
    { x: 5, y: 6, c: 'G' }, { x: 6, y: 6, c: 'L' }, { x: 7, y: 6, c: 'L' }, { x: 8, y: 6, c: 'L' }, { x: 9, y: 6, c: 'G' },
    // Bridge
    { x: 10, y: 5, c: 'G' }, { x: 11, y: 5, c: 'G' }, { x: 12, y: 5, c: 'G' },
    { x: 10, y: 6, c: 'G' }, { x: 11, y: 6, c: 'G' }, { x: 12, y: 6, c: 'G' },
    // Right lens
    { x: 13, y: 5, c: 'G' }, { x: 14, y: 5, c: 'L' }, { x: 15, y: 5, c: 'L' }, { x: 16, y: 5, c: 'L' }, { x: 17, y: 5, c: 'G' },
    { x: 13, y: 6, c: 'G' }, { x: 14, y: 6, c: 'L' }, { x: 15, y: 6, c: 'L' }, { x: 16, y: 6, c: 'L' }, { x: 17, y: 6, c: 'G' },
  ]

  // Gold chain
  const chain = [
    { x: 7, y: 12, c: 'Q' }, { x: 8, y: 12, c: 'Q' }, { x: 9, y: 12, c: 'Q' },
    { x: 10, y: 12, c: 'Q' }, { x: 11, y: 12, c: 'Q' }, { x: 12, y: 12, c: 'Q' },
    { x: 13, y: 12, c: 'Q' }, { x: 14, y: 12, c: 'Q' }, { x: 15, y: 12, c: 'Q' },
    { x: 10, y: 13, c: 'Q' }, { x: 11, y: 13, c: 'Q' }, { x: 12, y: 13, c: 'Q' },
  ]

  return <PixelSvg pixels={[...FACE_PIXELS, ...glasses, ...chain]} w={FACE_SIZE.w} h={FACE_SIZE.h + 2} dark={dark} />
}

// sleepy: zzz floating
function SleepyPose({ dark }: { dark: boolean }) {
  const zzz = [
    { x: 20, y: 3, c: 'Z' },
    { x: 22, y: 2, c: 'Z' },
    { x: 24, y: 1, c: 'Z' },
  ]
  return <PixelSvg pixels={[...FACE_PIXELS, ...zzz]} w={26} h={FACE_SIZE.h} dark={dark} />
}

// eating: grass in mouth
function EatingPose({ dark }: { dark: boolean }) {
  const grass = [
    { x: 18, y: 9, c: 'M' }, { x: 19, y: 9, c: 'M' }, { x: 20, y: 9, c: 'M' },
    { x: 18, y: 10, c: 'M' }, { x: 19, y: 10, c: 'M' },
    { x: 19, y: 11, c: 'M' },
  ]
  return <PixelSvg pixels={[...FACE_PIXELS, ...grass]} w={FACE_SIZE.w + 2} h={FACE_SIZE.h} dark={dark} />
}

// wink: one eye winking (^)
function WinkPose({ dark }: { dark: boolean }) {
  // Replace right eye with ^ shape
  const winkPixels = FACE_PIXELS.map(p => {
    if (p.c === 'n' && p.x >= 14 && p.x <= 15) {
      return { ...p, c: 'H' } // Hide right eye
    }
    return p
  })
  const wink = [
    { x: 14, y: 5, c: 'n' }, { x: 15, y: 4, c: 'n' }, { x: 16, y: 5, c: 'n' },
  ]
  return <PixelSvg pixels={[...winkPixels, ...wink]} w={FACE_SIZE.w} h={FACE_SIZE.h} dark={dark} />
}

// Hero laptop pose - full body with laptop
function HeroLaptopPose({ dark }: { dark: boolean }) {
  const body = [...HERO_BODY_PIXELS]

  // Sunglasses
  const glasses = [
    { x: 6, y: 5, c: 'G' }, { x: 7, y: 5, c: 'L' }, { x: 8, y: 5, c: 'L' }, { x: 9, y: 5, c: 'L' }, { x: 10, y: 5, c: 'G' },
    { x: 6, y: 6, c: 'G' }, { x: 7, y: 6, c: 'L' }, { x: 8, y: 6, c: 'L' }, { x: 9, y: 6, c: 'L' }, { x: 10, y: 6, c: 'G' },
    { x: 11, y: 5, c: 'G' }, { x: 12, y: 5, c: 'G' }, { x: 13, y: 5, c: 'G' },
    { x: 11, y: 6, c: 'G' }, { x: 12, y: 6, c: 'G' }, { x: 13, y: 6, c: 'G' },
    { x: 14, y: 5, c: 'G' }, { x: 15, y: 5, c: 'L' }, { x: 16, y: 5, c: 'L' }, { x: 17, y: 5, c: 'L' }, { x: 18, y: 5, c: 'G' },
    { x: 14, y: 6, c: 'G' }, { x: 15, y: 6, c: 'L' }, { x: 16, y: 6, c: 'L' }, { x: 17, y: 6, c: 'L' }, { x: 18, y: 6, c: 'G' },
  ]

  // Gold chain
  const chain = [
    { x: 10, y: 11, c: 'Q' }, { x: 11, y: 11, c: 'Q' }, { x: 12, y: 11, c: 'Q' },
    { x: 13, y: 11, c: 'Q' }, { x: 14, y: 11, c: 'Q' }, { x: 15, y: 11, c: 'Q' },
    { x: 12, y: 12, c: 'Q' }, { x: 13, y: 12, c: 'Q' },
  ]

  // Laptop
  const laptopX = 26
  const laptopY = 10
  const laptop: { x: number; y: number; c: string }[] = []

  // Screen frame
  for (let dy = 0; dy < 7; dy++)
    for (let dx = 0; dx < 10; dx++)
      laptop.push({ x: laptopX + dx, y: laptopY + dy, c: 'S' })

  // Screen glow
  for (let dy = 1; dy < 6; dy++)
    for (let dx = 1; dx < 9; dx++)
      laptop.push({ x: laptopX + dx, y: laptopY + dy, c: 's' })

  // Terminal lines
  const terminal = [
    { x: laptopX + 2, y: laptopY + 2, c: 'G' }, { x: laptopX + 3, y: laptopY + 2, c: 'G' },
    { x: laptopX + 4, y: laptopY + 2, c: 'G' }, { x: laptopX + 5, y: laptopY + 2, c: 'G' },
    { x: laptopX + 2, y: laptopY + 3, c: 'G' }, { x: laptopX + 3, y: laptopY + 3, c: 'G' },
    { x: laptopX + 2, y: laptopY + 4, c: 'Q' }, // cursor
  ]

  // Keyboard
  for (let dx = -1; dx < 11; dx++)
    laptop.push({ x: laptopX + dx, y: laptopY + 7, c: 'S' })

  return (
    <PixelSvg
      pixels={[...body, ...glasses, ...chain, ...laptop, ...terminal]}
      w={37}
      h={HERO_BODY_SIZE.h}
      dark={dark}
    />
  )
}

// Ecosystem pose - capybara on alligator!
function EcosystemPose({ dark }: { dark: boolean }) {
  return <PixelSvg pixels={ECOSYSTEM_PIXELS} w={ECOSYSTEM_SIZE.w} h={ECOSYSTEM_SIZE.h} dark={dark} />
}

// search: magnifying glass
function SearchPose({ dark }: { dark: boolean }) {
  const magnifier = [
    { x: 22, y: 4, c: 'G' }, { x: 23, y: 4, c: 'G' }, { x: 24, y: 4, c: 'G' },
    { x: 22, y: 5, c: 'G' }, { x: 24, y: 5, c: 'G' },
    { x: 22, y: 6, c: 'G' }, { x: 23, y: 6, c: 'G' }, { x: 24, y: 6, c: 'G' },
    { x: 25, y: 7, c: 'G' }, { x: 26, y: 8, c: 'G' }, { x: 27, y: 9, c: 'G' },
  ]
  return <PixelSvg pixels={[...FACE_PIXELS, ...magnifier]} w={28} h={FACE_SIZE.h} dark={dark} />
}

// building: hard hat
function BuildingPose({ dark }: { dark: boolean }) {
  const hat = [
    { x: 6, y: 0, c: 'Q' }, { x: 7, y: 0, c: 'Q' }, { x: 8, y: 0, c: 'Q' },
    { x: 9, y: 0, c: 'Q' }, { x: 10, y: 0, c: 'Q' }, { x: 11, y: 0, c: 'Q' },
    { x: 12, y: 0, c: 'Q' }, { x: 13, y: 0, c: 'Q' }, { x: 14, y: 0, c: 'Q' },
    { x: 15, y: 0, c: 'Q' }, { x: 16, y: 0, c: 'Q' },
    { x: 5, y: 1, c: 'Q' }, { x: 6, y: 1, c: 'Q' }, { x: 7, y: 1, c: 'Q' },
    { x: 8, y: 1, c: 'Q' }, { x: 9, y: 1, c: 'Q' }, { x: 10, y: 1, c: 'Q' },
    { x: 11, y: 1, c: 'Q' }, { x: 12, y: 1, c: 'Q' }, { x: 13, y: 1, c: 'Q' },
    { x: 14, y: 1, c: 'Q' }, { x: 15, y: 1, c: 'Q' }, { x: 16, y: 1, c: 'Q' },
    { x: 17, y: 1, c: 'Q' },
  ]
  const shiftedFace = FACE_PIXELS.map(p => ({ ...p, y: p.y + 2 }))
  return <PixelSvg pixels={[...hat, ...shiftedFace]} w={FACE_SIZE.w} h={FACE_SIZE.h + 2} dark={dark} />
}

// reading: glasses + paper
function ReadingPose({ dark }: { dark: boolean }) {
  const glasses = [
    { x: 4, y: 5, c: 'G' }, { x: 5, y: 5, c: 'L' }, { x: 6, y: 5, c: 'L' }, { x: 7, y: 5, c: 'L' }, { x: 8, y: 5, c: 'G' },
    { x: 9, y: 5, c: 'G' }, { x: 10, y: 5, c: 'G' }, { x: 11, y: 5, c: 'G' },
    { x: 12, y: 5, c: 'G' }, { x: 13, y: 5, c: 'L' }, { x: 14, y: 5, c: 'L' }, { x: 15, y: 5, c: 'L' }, { x: 16, y: 5, c: 'G' },
  ]
  const paper = [
    { x: 19, y: 8, c: 'W' }, { x: 20, y: 8, c: 'W' }, { x: 21, y: 8, c: 'W' }, { x: 22, y: 8, c: 'W' },
    { x: 19, y: 9, c: 'W' }, { x: 20, y: 9, c: 'n' }, { x: 21, y: 9, c: 'n' }, { x: 22, y: 9, c: 'W' },
    { x: 19, y: 10, c: 'W' }, { x: 20, y: 10, c: 'n' }, { x: 21, y: 10, c: 'W' }, { x: 22, y: 10, c: 'W' },
    { x: 19, y: 11, c: 'W' }, { x: 20, y: 11, c: 'W' }, { x: 21, y: 11, c: 'W' }, { x: 22, y: 11, c: 'W' },
  ]
  return <PixelSvg pixels={[...FACE_PIXELS, ...glasses, ...paper]} w={24} h={FACE_SIZE.h} dark={dark} />
}

// heart: heart eyes
function HeartPose({ dark }: { dark: boolean }) {
  // Replace eye area with hearts
  const faceNoEyes = FACE_PIXELS.filter(p => p.c !== 'n')
  const hearts = [
    // Left heart
    { x: 5, y: 4, c: 'B' }, { x: 8, y: 4, c: 'B' },
    { x: 5, y: 5, c: 'B' }, { x: 6, y: 5, c: 'B' }, { x: 7, y: 5, c: 'B' }, { x: 8, y: 5, c: 'B' },
    { x: 6, y: 6, c: 'B' }, { x: 7, y: 6, c: 'B' },
    // Right heart
    { x: 13, y: 4, c: 'B' }, { x: 16, y: 4, c: 'B' },
    { x: 13, y: 5, c: 'B' }, { x: 14, y: 5, c: 'B' }, { x: 15, y: 5, c: 'B' }, { x: 16, y: 5, c: 'B' },
    { x: 14, y: 6, c: 'B' }, { x: 15, y: 6, c: 'B' },
  ]
  return <PixelSvg pixels={[...faceNoEyes, ...hearts]} w={FACE_SIZE.w} h={FACE_SIZE.h} dark={dark} />
}

// question: ? bubble
function QuestionPose({ dark }: { dark: boolean }) {
  const extra = (
    <>
      <circle cx={22} cy={4} r={3} fill={fill(dark, 'W')} />
      <text x={20.5} y={5.5} fill={fill(dark, 'N')} fontSize="4" fontWeight="bold" fontFamily="monospace">
        ?
      </text>
    </>
  )
  return <PixelSvg pixels={FACE_PIXELS} w={26} h={FACE_SIZE.h} dark={dark} extra={extra} />
}

// coffee: holding coffee
function CoffeePose({ dark }: { dark: boolean }) {
  const cup = [
    { x: 20, y: 8, c: 'W' }, { x: 21, y: 8, c: 'W' }, { x: 22, y: 8, c: 'W' },
    { x: 20, y: 9, c: 'h' }, { x: 21, y: 9, c: 'h' }, { x: 22, y: 9, c: 'h' },
    { x: 20, y: 10, c: 'h' }, { x: 21, y: 10, c: 'h' }, { x: 22, y: 10, c: 'h' },
    { x: 23, y: 9, c: 'h' },
  ]
  const steam = [
    { x: 20, y: 7, c: 'T' }, { x: 22, y: 6, c: 'T' },
  ]
  return <PixelSvg pixels={[...FACE_PIXELS, ...cup, ...steam]} w={24} h={FACE_SIZE.h} dark={dark} />
}

// door: peeking from door
function DoorPose({ dark }: { dark: boolean }) {
  const door = []
  for (let y = 0; y < FACE_SIZE.h; y++) {
    door.push({ x: 0, y, c: 'G' })
    door.push({ x: 1, y, c: 'G' })
  }
  door.push({ x: 2, y: 6, c: 'Q' }) // handle
  const shiftedFace = FACE_PIXELS.map(p => ({ ...p, x: p.x + 3 }))
  return <PixelSvg pixels={[...door, ...shiftedFace]} w={FACE_SIZE.w + 4} h={FACE_SIZE.h} dark={dark} />
}

// notfound: ser pls bubble
function NotFoundPose({ dark }: { dark: boolean }) {
  const cigarette = [
    { x: 20, y: 11, c: 'C' }, { x: 21, y: 11, c: 'C' }, { x: 22, y: 11, c: 'F' },
  ]
  const smoke = [{ x: 23, y: 10, c: 'T' }, { x: 24, y: 9, c: 'T' }]
  const shiftedFace = FACE_PIXELS.map(p => ({ ...p, y: p.y + 3 }))
  const extra = (
    <>
      <rect x={16} y={0} width={12} height={5} rx={1} fill={fill(dark, 'W')} />
      <polygon points="17,5 19,5 16,7" fill={fill(dark, 'W')} />
      <text x={17} y={3.5} fill={fill(dark, 'N')} fontSize="3" fontWeight="bold" fontFamily="monospace">
        ser pls
      </text>
    </>
  )
  return (
    <PixelSvg
      pixels={[...shiftedFace, ...cigarette.map(p => ({ ...p, y: p.y + 3 })), ...smoke.map(p => ({ ...p, y: p.y + 3 }))]}
      w={26}
      h={FACE_SIZE.h + 5}
      dark={dark}
      extra={extra}
    />
  )
}

// empty: shrug vibes
function EmptyPose({ dark }: { dark: boolean }) {
  const extra = (
    <text x={2} y={FACE_SIZE.h + 3} fill={fill(dark, 'n')} fontSize="4" fontFamily="monospace">
      ¯\_(ツ)_/¯
    </text>
  )
  return <PixelSvg pixels={FACE_PIXELS} w={FACE_SIZE.w + 2} h={FACE_SIZE.h + 5} dark={dark} extra={extra} />
}

// success: WAGMI
function SuccessPose({ dark }: { dark: boolean }) {
  const shiftedFace = FACE_PIXELS.map(p => ({ ...p, y: p.y + 3 }))
  const extra = (
    <>
      <rect x={2} y={0} width={12} height={5} rx={1} fill={fill(dark, 'R')} />
      <text x={3} y={3.5} fill={fill(dark, 'r')} fontSize="3" fontWeight="bold" fontFamily="monospace">
        WAGMI
      </text>
    </>
  )
  return <PixelSvg pixels={shiftedFace} w={FACE_SIZE.w} h={FACE_SIZE.h + 5} dark={dark} extra={extra} />
}

// ══════════════════════════════════════════════════════════
// ══ POSE REGISTRY ══
// ══════════════════════════════════════════════════════════

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
  ecosystem: EcosystemPose,
  search: SearchPose,
  building: BuildingPose,
  reading: ReadingPose,
  heart: HeartPose,
  question: QuestionPose,
  coffee: CoffeePose,
  door: DoorPose,
  // Aliases
  main: HeroLaptopPose,
  careers: SearchPose,
  investors: HeartPose,
  companies: BuildingPose,
  articles: ReadingPose,
  bookmarks: HeartPose,
  login: DoorPose,
  loading: SweatingPose,
  notfound: NotFoundPose,
  empty: EmptyPose,
  success: SuccessPose,
  error: SweatingPose,
}

// ══════════════════════════════════════════════════════════
// ══ MEME CONTENT ══
// ══════════════════════════════════════════════════════════

const CLICK_QUOTES = [
  'bruh', 'no cap', 'slay', 'its giving... employed',
  'bestie ur hired', 'periodt', 'lowkey fire', 'real',
  'ser pls', 'gm', 'wagmi', 'ngmi fr', 'wen lambo',
  'probably nothing', 'few understand', 'touch grass',
  'ate and left no crumbs', 'main character energy',
]

const TSUNDERE_MSGS = [
  '뭘 봐...', '...', '*stares*', '별로야.',
  'mid tbh', '...관심 없어', 'ok and?', 'hm.',
]

export const TIME_MSGS: Record<TimeOfDay, string> = {
  dawn: 'why are you here at this hour...',
  morning: 'gm anon',
  lunch: '*munch munch*',
  afternoon: '...',
  evening: '퇴근하고 싶다...',
  night: 'this is fine',
}

// ══════════════════════════════════════════════════════════
// ══ MAIN COMPONENT ══
// ══════════════════════════════════════════════════════════

let globalClicks = 0
let easterEggTriggered = false

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

// ══════════════════════════════════════════════════════════
// ══ VARIANT COMPONENTS ══
// ══════════════════════════════════════════════════════════

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

// Mini version - super compact, Gen Z deadpan stare
export function MiniPixelbara({ className = '' }: { className?: string }) {
  const dark = useIsDark()
  const miniArt = `
..EeE..EeE..
.HHHHHHHHHH.
.HHnHHHHnHH.
.HHHHHHHHHH.
..HHHNNHHH..
...HHHHHH...
`
  const pixels = parseArt(miniArt)
  const { w, h } = artSize(miniArt)
  return (
    <span className={`inline-block ${className}`} style={{ width: 24, height: 18 }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet">
        {pixels.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={fill(dark, p.c)} />
        ))}
      </svg>
    </span>
  )
}

// Toggle icon version
export function PixelbaraToggleIcon({ withGlasses, className = '' }: { withGlasses: boolean; className?: string }) {
  const dark = useIsDark()
  const miniArt = withGlasses
    ? `
..EeE..EeE..
.HHHHHHHHHH.
.GLLGGLLGHH.
.GLLGGLLGHH.
..HHHNNHHH..
...HHHHHH...
`
    : `
..EeE..EeE..
.HHHHHHHHHH.
.HHnHHHHnHH.
.HHHHHHHHHH.
..HHHNNHHH..
...HHHHHH...
`
  const pixels = parseArt(miniArt)
  const { w, h } = artSize(miniArt)
  return (
    <span className={`inline-block ${className}`} style={{ width: 24, height: 18 }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet">
        {pixels.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={fill(dark, p.c)} />
        ))}
      </svg>
    </span>
  )
}

// ══════════════════════════════════════════════════════════
// ══ EXPORTS ══
// ══════════════════════════════════════════════════════════

export { useTimeOfDay }
export type { TimeOfDay, PoseId, PoseAlias }
