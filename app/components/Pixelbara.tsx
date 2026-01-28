'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

// ══════════════════════════════════════════════════════════
// ══ TYPES ══
// ══════════════════════════════════════════════════════════

type PoseId =
  | 'blank' | 'coding' | 'search' | 'bling' | 'building'
  | 'reading' | 'heart' | 'ecosystem' | 'question' | 'sweating'
  | 'coffee' | 'door' | 'meme' | 'heroLaptop'
  | 'dejected' | 'sparkle' | 'smoking' | 'sleepy' | 'eating' | 'wink'
  | 'coin'

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
// ══ COLOR PALETTE - Naked Capybara Edition ══
// ══════════════════════════════════════════════════════════

const P: Record<string, [string, string]> = {
  // Fur - warm brown tones (main body)
  F: ['#C4956A', '#D4A57A'],   // Main fur - warm caramel
  f: ['#A67B52', '#B88B62'],   // Shadow fur - darker
  u: ['#D8A878', '#E8B888'],   // Lighter belly fur

  // Ears - pinkish inside
  E: ['#A67B52', '#B88B62'],   // Ear outline
  e: ['#D4A090', '#E4B0A0'],   // Ear inside - pink

  // Eyes - Gen Z stare (ㅡㅡ) - thin wide horizontal lines
  n: ['#2D1B10', '#1D0B00'],   // Eye line - very dark

  // Nose - BIG and prominent
  N: ['#5A3A2A', '#6A4A3A'],   // Nose main
  O: ['#2D1B10', '#1D0B00'],   // Nostrils - dark holes
  o: ['#4A2A1A', '#5A3A2A'],   // Nose shadow

  // Blush - subtle pink on cheeks
  B: ['#E8A090', '#F0B0A0'],

  // Accessories (Investors - gold chain only, NO sunglasses)
  Q: ['#F0C040', '#FFD860'],   // Gold chain
  q: ['#D4A030', '#E4B040'],   // Gold chain shadow

  // Laptop - MacBook style
  S: ['#E8E8E8', '#D8D8D8'],   // Laptop body - silver
  s: ['#1A2A1A', '#2A3A2A'],   // Screen - dark
  g: ['#40FF80', '#60FFA0'],   // Code - bright green
  k: ['#C0C0C0', '#B0B0B0'],   // Keyboard area

  // Items
  M: ['#505050', '#606060'],   // Magnifying glass
  m: ['#80C8F0', '#A0E0FF'],   // Magnifying glass lens
  R: ['#E85050', '#F06060'],   // Heart - red
  W: ['#F0F0F0', '#E0E0E0'],   // White/paper
  w: ['#80C8F0', '#A0E0FF'],   // Water/sweat
  Z: ['#80C8F0', '#A0E0FF'],   // Zzz
  T: ['#888888', '#999999'],   // Smoke
  C: ['#F0E8E0', '#E0D8D0'],   // Coffee cup
  c: ['#4A3020', '#5A4030'],   // Coffee liquid
  K: ['#2D2D2D', '#3D3D3D'],   // Book
  P: ['#3A3A3A', '#4A4A4A'],   // Pen/brush

  // Building
  b: ['#404050', '#505060'],   // Building

  // Door
  D: ['#5A4030', '#6A5040'],   // Door wood

  // Coins (for investors)
  G: ['#F0C040', '#FFD860'],   // Gold coin
  $: ['#50A050', '#60B060'],   // Dollar green

  // Alligator (proper side view)
  A: ['#3A6A3A', '#4A7A4A'],   // Alligator body - dark green
  a: ['#2A5A2A', '#3A6A3A'],   // Alligator shadow
  l: ['#6A9A6A', '#7AAA7A'],   // Alligator belly - lighter
  Y: ['#F0E040', '#FFE860'],   // Alligator eye
  t: ['#F0F0F0', '#E0E0E0'],   // Teeth
  X: ['#4A7A4A', '#5A8A5A'],   // Alligator spikes
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
// ══ NAKED CAPYBARA - Chubby, Round, No Clothes ══
// Wider body, longer spaced eyes (ㅡ  ㅡ), big protruding snout
// ══════════════════════════════════════════════════════════

// Base naked capybara - CHUBBY and ROUND
const BASE_ART = `
...........EeeE........EeeE...........
..........EeeeE........EeeeE..........
.........FFFFFFFFFFFFFFFFFFFFFF.......
........FFFFFFFFFFFFFFFFFFFFFFFF......
.......FFFFFFFFFFFFFFFFFFFFFFFFFF.....
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF....
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF....
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf....
.......FFFFFFFFFoNNNNNNoFFFFFFFf......
.......FFFFFFFoNNONNNONNoFFFFFFf......
........FFFFFFoNNNNNNNNNoFFFFFf.......
.........FFFFFFFFFFFFFFFFFFFf.........
..........FFFFFFFFFFFFFFFFFf..........
.........FFFFFuuuuuuuuuuFFFFF.........
........FFFFuuuuuuuuuuuuuuFFFF........
........FFFuuuuuuuuuuuuuuuFFFf........
.........FFFFuuuuuuuuuuuFFFFf.........
..........FFFFFFFFFFFFFFFFFf..........
...........fffff......fffff...........
...........ffff........ffff...........
`

const BASE_PIXELS = parseArt(BASE_ART)
const BASE_SIZE = artSize(BASE_ART)

// ══════════════════════════════════════════════════════════
// ══ CODING POSE - Capybara + MacBook with green code ══
// ══════════════════════════════════════════════════════════

const CODING_ART = `
...........EeeE........EeeE.....................................
..........EeeeE........EeeeE....................................
.........FFFFFFFFFFFFFFFFFFFFFF.................................
........FFFFFFFFFFFFFFFFFFFFFFFF................................
.......FFFFFFFFFFFFFFFFFFFFFFFFFF...............................
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF..............................
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF..............................
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf..............................
.......FFFFFFFFFoNNNNNNoFFFFFFFf................................
.......FFFFFFFoNNONNNONNoFFFFFFf................................
........FFFFFFoNNNNNNNNNoFFFFFf.................................
.........FFFFFFFFFFFFFFFFFFFf...................................
..........FFFFFFFFFFFFFFFFFf....................................
.........FFFFFuuuuuuuuuuFFFFF...................................
........FFFFuuuuuuuuuuuuuuFFFFF..SSSSSSSSSSSSSSSSS...............
........FFFuuuuuuuuuuuuuuuFFFFFFSsssssssssssssssssS..............
.........FFFFuuuuuuuuuuuFFFFf..Ssg.ggg.g.ggg.ggg.sS..............
..........FFFFFFFFFFFFFFFFFf...Ssg.g.g.g.g.g.g.g.sS..............
...........fffff......fffff....Ssg.ggg.g.ggg.ggg.sS..............
...........ffff........ffff....SsssssssssssssssssS..............
...............................SkkkkkkkkkkkkkkkkkS..............
................................SSSSSSSSSSSSSSSSS...............
`

// ══════════════════════════════════════════════════════════
// ══ SEARCH POSE - Capybara + Magnifying glass ══
// ══════════════════════════════════════════════════════════

const SEARCH_ART = `
...........EeeE........EeeE..............MMMMMM
..........EeeeE........EeeeE............M.mmmm.M
.........FFFFFFFFFFFFFFFFFFFFFF.........M.mmmm.M
........FFFFFFFFFFFFFFFFFFFFFFFF........M.mmmm.M
.......FFFFFFFFFFFFFFFFFFFFFFFFFF........MMMMMM
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF........M
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF........M
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf........M
.......FFFFFFFFFoNNNNNNoFFFFFFFf.........M
.......FFFFFFFoNNONNNONNoFFFFFFf........M
........FFFFFFoNNNNNNNNNoFFFFFf........M
.........FFFFFFFFFFFFFFFFFFFf.........M
..........FFFFFFFFFFFFFFFFFf.........M
.........FFFFFuuuuuuuuuuFFFFF.......M
........FFFFuuuuuuuuuuuuuuFFFF.....M
........FFFuuuuuuuuuuuuuuuFFFf....
.........FFFFuuuuuuuuuuuFFFFf.....
..........FFFFFFFFFFFFFFFFFf......
...........fffff......fffff.......
...........ffff........ffff.......
`

// ══════════════════════════════════════════════════════════
// ══ BLING POSE - Gold chain ONLY (NO sunglasses!) ══
// Investors page - flex with gold chain, Gen Z stare
// ══════════════════════════════════════════════════════════

const BLING_ART = `
...........EeeE........EeeE...........
..........EeeeE........EeeeE..........
.........FFFFFFFFFFFFFFFFFFFFFF.......
........FFFFFFFFFFFFFFFFFFFFFFFF......
.......FFFFFFFFFFFFFFFFFFFFFFFFFF.....
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF....
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF....
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf....
.......FFFFFFFFFoNNNNNNoFFFFFFFf......
.......FFFFFFFoNNONNNONNoFFFFFFf......
........FFFFFFoNNNNNNNNNoFFFFFf.......
.........FFFFFFFFFFFFFFFFFFFf.........
........QQQQQQQQQQQQQQQQQQQQQQ........
.........FFFFFuuuuuuuuuuFFFFF.........
........FFFFuuQQQQQQQQQuuuFFFF........
........FFFuuuuuuuuuuuuuuuFFFf........
.........FFFFuuuuuuuuuuuFFFFf.........
..........FFFFFFFFFFFFFFFFFf..........
...........fffff......fffff...........
...........ffff........ffff...........
`

// ══════════════════════════════════════════════════════════
// ══ COIN POSE - Holding coins (alternative for investors) ══
// ══════════════════════════════════════════════════════════

const COIN_ART = `
...........EeeE........EeeE...........GGG
..........EeeeE........EeeeE.........GGGGG
.........FFFFFFFFFFFFFFFFFFFFFF......GGGGG
........FFFFFFFFFFFFFFFFFFFFFFFF......GGG
.......FFFFFFFFFFFFFFFFFFFFFFFFFF.........
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF........
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF........
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf........
.......FFFFFFFFFoNNNNNNoFFFFFFFf..........
.......FFFFFFFoNNONNNONNoFFFFFFf..........
........FFFFFFoNNNNNNNNNoFFFFFf.....GGG...
.........FFFFFFFFFFFFFFFFFFFf......GGGGG..
..........FFFFFFFFFFFFFFFFFf.......GGGGG..
.........FFFFFuuuuuuuuuuFFFFF.......GGG...
........FFFFuuuuuuuuuuuuuuFFFF............
........FFFuuuuuuuuuuuuuuuFFFf............
.........FFFFuuuuuuuuuuuFFFFf.............
..........FFFFFFFFFFFFFFFFFf..............
...........fffff......fffff...............
...........ffff........ffff...............
`

// ══════════════════════════════════════════════════════════
// ══ BUILDING POSE - Standing in front of building ══
// ══════════════════════════════════════════════════════════

const BUILDING_ART = `
bbbbbbbbbbbbbbbbb...........EeeE........EeeE
bbb.bbb.bbb.bbbbb..........EeeeE........EeeeE
bbbbbbbbbbbbbbbbb.........FFFFFFFFFFFFFFFFFFFFFF
bbb.bbb.bbb.bbbbb........FFFFFFFFFFFFFFFFFFFFFFFF
bbbbbbbbbbbbbbbbb.......FFFFFFFFFFFFFFFFFFFFFFFFFF
bbb.bbb.bbb.bbbbb......FFFFFFFFFFFFFFFFFFFFFFFFFFFF
bbbbbbbbbbbbbbbbb......FFFFFFnnnnFFFFFFFFnnnnFFFFFF
bbb.bbb.bbb.bbbbb......BFFFFFFFFFFFFFFFFFFFFFFFFFBf
bbbbbbbbbbbbbbbbb.......FFFFFFFFFoNNNNNNoFFFFFFFf
bbb.bbb.bbb.bbbbb.......FFFFFFFoNNONNNONNoFFFFFFf
bbbbbbbbbbbbbbbbb........FFFFFFoNNNNNNNNNoFFFFFf
bbb.bbb.bbb.bbbbb.........FFFFFFFFFFFFFFFFFFFf
bbbbbbbbbbbbbbbbb..........FFFFFFFFFFFFFFFFFf
bbb.bbb.bbb.bbbbb.........FFFFFuuuuuuuuuuFFFFF
bbbbbbbbbbbbbbbbb........FFFFuuuuuuuuuuuuuuFFFF
bbb.bbb.bbb.bbbbb........FFFuuuuuuuuuuuuuuuFFFf
bbbbbbbbbbbbbbbbb.........FFFFuuuuuuuuuuuFFFFf
bbb.bbb.bbb.bbbbb..........FFFFFFFFFFFFFFFFFf
bbbbbbbbbbbbbbbbb...........fffff......fffff
bbb.bbb.bbb.bbbbb...........ffff........ffff
`

// ══════════════════════════════════════════════════════════
// ══ READING POSE - Capybara + Book ══
// ══════════════════════════════════════════════════════════

const READING_ART = `
...........EeeE........EeeE...........
..........EeeeE........EeeeE..........
.........FFFFFFFFFFFFFFFFFFFFFF.......
........FFFFFFFFFFFFFFFFFFFFFFFF......
.......FFFFFFFFFFFFFFFFFFFFFFFFFF.....
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF....
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF....
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf....
.......FFFFFFFFFoNNNNNNoFFFFFFFf......
.......FFFFFFFoNNONNNONNoFFFFFFf......
........FFFFFFoNNNNNNNNNoFFFFFf.......
.........FFFFFFFFFFFFFFFFFFFf.........
..........FFFFFFFFFFFFFFFFFf..........
.........FFFFFuuuuuuuuuuFFFFF.KKKKKK..
........FFFFuuuuuuuuuuuuuuFFFFKWWWWK..
........FFFuuuuuuuuuuuuuuuFFFfKnnnWK..
.........FFFFuuuuuuuuuuuFFFFf.KKKKKK..
..........FFFFFFFFFFFFFFFFFf..........
...........fffff......fffff...........
...........ffff........ffff...........
`

// ══════════════════════════════════════════════════════════
// ══ HEART POSE - Capybara + Holding heart ══
// ══════════════════════════════════════════════════════════

const HEART_ART = `
...........EeeE........EeeE...........
..........EeeeE........EeeeE..........
.........FFFFFFFFFFFFFFFFFFFFFF.......
........FFFFFFFFFFFFFFFFFFFFFFFF......
.......FFFFFFFFFFFFFFFFFFFFFFFFFF.....
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF....
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF....
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf....
.......FFFFFFFFFoNNNNNNoFFFFFFFf......
.......FFFFFFFoNNONNNONNoFFFFFFf......
........FFFFFFoNNNNNNNNNoFFFFFf.......
.........FFFFFFFFFFFFFFFFFFFf.........
..........FFFFFFFFFFFFFFFFFf..RRR.RRR.
.........FFFFFuuuuuuuuuuFFFFF.RRRRRRR.
........FFFFuuuuuuuuuuuuuuFFFF.RRRRR..
........FFFuuuuuuuuuuuuuuuFFFf..RRR...
.........FFFFuuuuuuuuuuuFFFFf....R....
..........FFFFFFFFFFFFFFFFFf..........
...........fffff......fffff...........
...........ffff........ffff...........
`

// ══════════════════════════════════════════════════════════
// ══ ECOSYSTEM POSE - Capybara riding REAL Alligator ══
// SIDE VIEW: tail on left, snout with teeth on right
// Only ONE face! Proper alligator structure
// ══════════════════════════════════════════════════════════

const ECOSYSTEM_ART = `
..........................EeeE........EeeE.................................
.........................EeeeE........EeeeE................................
........................FFFFFFFFFFFFFFFFFFFFFF.............................
.......................FFFFFFFFFFFFFFFFFFFFFFFF............................
......................FFFFFFFFFFFFFFFFFFFFFFFFFF...........................
.....................FFFFFFFFFFFFFFFFFFFFFFFFFFFF..........................
.....................FFFFFFnnnnFFFFFFFFnnnnFFFFFF..........................
.....................BFFFFFFFFFFFFFFFFFFFFFFFFFBf..........................
......................FFFFFFFFFoNNNNNNoFFFFFFFf............................
......................FFFFFFFoNNONNNONNoFFFFFFf............................
.......................FFFFFFoNNNNNNNNNoFFFFFf.............................
........................FFFFFFFFFFFFFFFFFFFf...............................
...............X.X.X.X.X.FFFuuuuuuuuuuuuuFFF.X.X.X.X.X.X.X.X...XYYYX........
..........aaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAtt...
.........aAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAt..
........aAlllllllllllllllllllllllllllllllllllllllllllllllllllllllllllAAAAAt.
........aAlllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllAAAAt
.......aAllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllAAAAt
.......aaAlllllllllllllllllllllllllllllllllllllllllllllllllllllllllllAAAAAt.
........aaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAt...
..........aa.aa.............aa.aa............aa.aa............aa.aa........
`

// ══════════════════════════════════════════════════════════
// ══ QUESTION/404 POSE - Capybara + Question mark ══
// ══════════════════════════════════════════════════════════

const QUESTION_ART = `
...........EeeE........EeeE.........WWWW
..........EeeeE........EeeeE.......W....W
.........FFFFFFFFFFFFFFFFFFFFFF....W....W
........FFFFFFFFFFFFFFFFFFFFFFFF.....W..
.......FFFFFFFFFFFFFFFFFFFFFFFFFF...W...
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF..W...
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF......
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf..W...
.......FFFFFFFFFoNNNNNNoFFFFFFFf........
.......FFFFFFFoNNONNNONNoFFFFFFf........
........FFFFFFoNNNNNNNNNoFFFFFf.........
.........FFFFFFFFFFFFFFFFFFFf...........
..........FFFFFFFFFFFFFFFFFf............
.........FFFFFuuuuuuuuuuFFFFF...........
........FFFFuuuuuuuuuuuuuuFFFF..........
........FFFuuuuuuuuuuuuuuuFFFf..........
.........FFFFuuuuuuuuuuuFFFFf...........
..........FFFFFFFFFFFFFFFFFf............
...........fffff......fffff.............
...........ffff........ffff.............
`

// ══════════════════════════════════════════════════════════
// ══ SWEATING POSE - Capybara + Sweat drops ══
// ══════════════════════════════════════════════════════════

const SWEATING_ART = `
...........EeeE........EeeE...........
..........EeeeE........EeeeE..........
.........FFFFFFFFFFFFFFFFFFFFFF....w..
........FFFFFFFFFFFFFFFFFFFFFFFF..w...
.......FFFFFFFFFFFFFFFFFFFFFFFFFF..w..
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF....
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF....
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf....
.......FFFFFFFFFoNNNNNNoFFFFFFFf......
.......FFFFFFFoNNONNNONNoFFFFFFf......
........FFFFFFoNNNNNNNNNoFFFFFf.......
.........FFFFFFFFFFFFFFFFFFFf.........
..........FFFFFFFFFFFFFFFFFf..........
.........FFFFFuuuuuuuuuuFFFFF.........
........FFFFuuuuuuuuuuuuuuFFFF........
........FFFuuuuuuuuuuuuuuuFFFf........
.........FFFFuuuuuuuuuuuFFFFf.........
..........FFFFFFFFFFFFFFFFFf..........
...........fffff......fffff...........
...........ffff........ffff...........
`

// ══════════════════════════════════════════════════════════
// ══ COFFEE POSE - Capybara + Drinking coffee ══
// ══════════════════════════════════════════════════════════

const COFFEE_ART = `
...........EeeE........EeeE...........
..........EeeeE........EeeeE..........
.........FFFFFFFFFFFFFFFFFFFFFF.......
........FFFFFFFFFFFFFFFFFFFFFFFF......
.......FFFFFFFFFFFFFFFFFFFFFFFFFF.....
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF....
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF....
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf....
.......FFFFFFFFFoNNNNNNoFFFFFFFf..TT..
.......FFFFFFFoNNONNNONNoFFFFFFf.T..T.
........FFFFFFoNNNNNNNNNoFFFFFf..CCC..
.........FFFFFFFFFFFFFFFFFFFf...CcccC.
..........FFFFFFFFFFFFFFFFFf....CcccC.
.........FFFFFuuuuuuuuuuFFFFF....CCC..
........FFFFuuuuuuuuuuuuuuFFFF........
........FFFuuuuuuuuuuuuuuuFFFf........
.........FFFFuuuuuuuuuuuFFFFf.........
..........FFFFFFFFFFFFFFFFFf..........
...........fffff......fffff...........
...........ffff........ffff...........
`

// ══════════════════════════════════════════════════════════
// ══ DOOR POSE - Capybara + Standing at door ══
// ══════════════════════════════════════════════════════════

const DOOR_ART = `
DDDDDD...........EeeE........EeeE
DDDDDD..........EeeeE........EeeeE
DDDDDD.........FFFFFFFFFFFFFFFFFFFFFF
DDDDDD........FFFFFFFFFFFFFFFFFFFFFFFF
DDDDDD.......FFFFFFFFFFFFFFFFFFFFFFFFFF
DDDDDD......FFFFFFFFFFFFFFFFFFFFFFFFFFFF
DDcDDD......FFFFFFnnnnFFFFFFFFnnnnFFFFFF
DDDDDD......BFFFFFFFFFFFFFFFFFFFFFFFFFBf
DDDDDD.......FFFFFFFFFoNNNNNNoFFFFFFFf
DDDDDD.......FFFFFFFoNNONNNONNoFFFFFFf
DDDDDD........FFFFFFoNNNNNNNNNoFFFFFf
DDDDDD.........FFFFFFFFFFFFFFFFFFFf
DDDDDD..........FFFFFFFFFFFFFFFFFf
DDDDDD.........FFFFFuuuuuuuuuuFFFFF
DDDDDD........FFFFuuuuuuuuuuuuuuFFFF
DDDDDD........FFFuuuuuuuuuuuuuuuFFFf
DDDDDD.........FFFFuuuuuuuuuuuFFFFf
DDDDDD..........FFFFFFFFFFFFFFFFFf
DDDDDD...........fffff......fffff
DDDDDD...........ffff........ffff
`

// ══════════════════════════════════════════════════════════
// ══ MEME POSE - Capybara + Holding pen/brush ══
// ══════════════════════════════════════════════════════════

const MEME_ART = `
...........EeeE........EeeE...........
..........EeeeE........EeeeE..........
.........FFFFFFFFFFFFFFFFFFFFFF.......
........FFFFFFFFFFFFFFFFFFFFFFFF......
.......FFFFFFFFFFFFFFFFFFFFFFFFFF.....
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF....
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF....
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf....
.......FFFFFFFFFoNNNNNNoFFFFFFFf......
.......FFFFFFFoNNONNNONNoFFFFFFf......
........FFFFFFoNNNNNNNNNoFFFFFf.......
.........FFFFFFFFFFFFFFFFFFFf.........
..........FFFFFFFFFFFFFFFFFf....P.....
.........FFFFFuuuuuuuuuuFFFFF....P....
........FFFFuuuuuuuuuuuuuuFFFF....P...
........FFFuuuuuuuuuuuuuuuFFFf.....P..
.........FFFFuuuuuuuuuuuFFFFf......P..
..........FFFFFFFFFFFFFFFFFf.......PPP
...........fffff......fffff...........
...........ffff........ffff...........
`

// ══════════════════════════════════════════════════════════
// ══ SLEEPING POSE ══
// ══════════════════════════════════════════════════════════

const SLEEPY_ART = `
...........EeeE........EeeE.......Z...
..........EeeeE........EeeeE.....Z....
.........FFFFFFFFFFFFFFFFFFFFFF...Z...
........FFFFFFFFFFFFFFFFFFFFFFFF......
.......FFFFFFFFFFFFFFFFFFFFFFFFFF.....
......FFFFFFFFFFFFFFFFFFFFFFFFFFFF....
......FFFFFFnnnnFFFFFFFFnnnnFFFFFF....
......BFFFFFFFFFFFFFFFFFFFFFFFFFBf....
.......FFFFFFFFFoNNNNNNoFFFFFFFf......
.......FFFFFFFoNNONNNONNoFFFFFFf......
........FFFFFFoNNNNNNNNNoFFFFFf.......
.........FFFFFFFFFFFFFFFFFFFf.........
..........FFFFFFFFFFFFFFFFFf..........
.........FFFFFuuuuuuuuuuFFFFF.........
........FFFFuuuuuuuuuuuuuuFFFF........
........FFFuuuuuuuuuuuuuuuFFFf........
.........FFFFuuuuuuuuuuuFFFFf.........
..........FFFFFFFFFFFFFFFFFf..........
...........fffff......fffff...........
...........ffff........ffff...........
`

// ══════════════════════════════════════════════════════════
// ══ POSE COMPONENTS ══
// ══════════════════════════════════════════════════════════

function BlankPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(BASE_ART)
  const size = artSize(BASE_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function CodingPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(CODING_ART)
  const size = artSize(CODING_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function SearchPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(SEARCH_ART)
  const size = artSize(SEARCH_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function BlingPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(BLING_ART)
  const size = artSize(BLING_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function CoinPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(COIN_ART)
  const size = artSize(COIN_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function BuildingPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(BUILDING_ART)
  const size = artSize(BUILDING_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function ReadingPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(READING_ART)
  const size = artSize(READING_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function HeartPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(HEART_ART)
  const size = artSize(HEART_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function EcosystemPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(ECOSYSTEM_ART)
  const size = artSize(ECOSYSTEM_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function QuestionPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(QUESTION_ART)
  const size = artSize(QUESTION_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function SweatingPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(SWEATING_ART)
  const size = artSize(SWEATING_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function CoffeePose({ dark }: { dark: boolean }) {
  const pixels = parseArt(COFFEE_ART)
  const size = artSize(COFFEE_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function DoorPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(DOOR_ART)
  const size = artSize(DOOR_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function MemePose({ dark }: { dark: boolean }) {
  const pixels = parseArt(MEME_ART)
  const size = artSize(MEME_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function SleepyPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(SLEEPY_ART)
  const size = artSize(SLEEPY_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

// Aliases for compatibility
function DejectedPose({ dark }: { dark: boolean }) {
  return <SweatingPose dark={dark} />
}

function SparklePose({ dark }: { dark: boolean }) {
  return <HeartPose dark={dark} />
}

function SmokingPose({ dark }: { dark: boolean }) {
  return <CoffeePose dark={dark} />
}

function EatingPose({ dark }: { dark: boolean }) {
  return <CoffeePose dark={dark} />
}

function WinkPose({ dark }: { dark: boolean }) {
  return <BlankPose dark={dark} />
}

// ══════════════════════════════════════════════════════════
// ══ POSE REGISTRY ══
// ══════════════════════════════════════════════════════════

const POSES: Record<string, (props: { dark: boolean }) => React.ReactNode> = {
  // Main poses
  blank: BlankPose,
  coding: CodingPose,
  heroLaptop: CodingPose,
  search: SearchPose,
  bling: BlingPose,
  coin: CoinPose,
  building: BuildingPose,
  reading: ReadingPose,
  heart: HeartPose,
  ecosystem: EcosystemPose,
  question: QuestionPose,
  sweating: SweatingPose,
  coffee: CoffeePose,
  door: DoorPose,
  meme: MemePose,
  sleepy: SleepyPose,

  // Legacy compatibility
  dejected: DejectedPose,
  sparkle: SparklePose,
  smoking: SmokingPose,
  eating: EatingPose,
  wink: WinkPose,

  // Page aliases
  main: CodingPose,
  careers: SearchPose,
  investors: BlingPose,  // Gold chain, no sunglasses
  companies: BuildingPose,
  articles: ReadingPose,
  bookmarks: HeartPose,
  login: DoorPose,

  // State aliases
  loading: CoffeePose,
  notfound: QuestionPose,
  empty: QuestionPose,
  success: HeartPose,
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
      case 'lunch': return 'coffee'
      case 'evening': return 'sweating'
      default: return 'coding'
    }
  }, [time])
  return <Pixelbara {...props} pose={pose} />
}

// Mini version - super compact (NO hoodie, NO sunglasses)
export function MiniPixelbara({ className = '' }: { className?: string }) {
  const dark = useIsDark()
  // Mini naked capybara with Gen Z stare
  const miniArt = `
...EeE......EeE...
..FFFFFFFFFFFFFF..
..FFnnFFFFFFnnFF..
...FFFoNNNNoFFF...
...FFuuuuuuuuFF...
...FFuuuuuuuuFF...
....fff..fff......
`
  const pixels = parseArt(miniArt)
  const { w, h } = artSize(miniArt)
  return (
    <span className={`inline-block ${className}`} style={{ width: 28, height: 18 }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet">
        {pixels.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={fill(dark, p.c)} />
        ))}
      </svg>
    </span>
  )
}

// Toggle icon version (NO sunglasses option anymore)
export function PixelbaraToggleIcon({ className = '' }: { className?: string }) {
  const dark = useIsDark()
  const miniArt = `
...EeE......EeE...
..FFFFFFFFFFFFFF..
..FFnnFFFFFFnnFF..
...FFFoNNNNoFFF...
...FFuuuuuuuuFF...
...FFuuuuuuuuFF...
....fff..fff......
`
  const pixels = parseArt(miniArt)
  const { w, h } = artSize(miniArt)
  return (
    <span className={`inline-block ${className}`} style={{ width: 28, height: 18 }}>
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
