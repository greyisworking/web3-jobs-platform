'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  type PoseId,
  type PoseAlias,
  type PixelbaraProps,
  type TimeOfDay,
  fill,
  parseArt,
  artSize,
  BASE_ART,
  HERO_LAPTOP_ART,
  SEARCH_ART,
  BLING_ART,
  COFFEE_ART,
  SWEATING_ART,
  SLEEPY_ART,
  HEART_ART,
  COIN_ART,
  QUESTION_ART,
  BUILDING_ART,
  READING_ART,
  DOOR_ART,
  MEME_ART,
  ECOSYSTEM_FRIENDS_ART,
  HODL_ART,
  RUG_ART,
  GM_SER_ART,
  APE_IN_ART,
  AIRDROP_ART,
  DOWN_BAD_ART,
  SITTING_ART,
  LYING_DOWN_ART,
  LOW_BATTERY_ART,
  DIAMOND_HANDS_ART,
  TO_THE_MOON_ART,
  WHALE_MODE_ART,
  ITS_SO_OVER_ART,
  WERE_SO_BACK_ART,
  TOUCH_GRASS_ART,
  HOT_TUB_ART,
  PROBABLY_NOTHING_ART,
  WENDYS_ART,
  WEN_MOON_ART,
  FEW_UNDERSTAND_ART,
  LOOKS_RARE_ART,
  NGMI_ART,
  WAGMI_ART,
  CLICK_QUOTES,
  TSUNDERE_MSGS,
  TIME_MSGS,
} from './pixelbara-data'

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
// ══ SVG RENDERER - CRISP PIXELS, NO GAPS ══
// ══════════════════════════════════════════════════════════

function PixelSvg({
  pixels, w, h, dark,
}: {
  pixels: { x: number; y: number; c: string }[]
  w: number
  h: number
  dark: boolean
}) {
  // Group pixels by type for animation targeting
  const eyePixels = pixels.filter(p => p.c === 'n')
  const earPixels = pixels.filter(p => ['E', 'e', 'i'].includes(p.c))
  const otherPixels = pixels.filter(p => p.c !== 'n' && !['E', 'e', 'i'].includes(p.c))

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      style={{
        imageRendering: 'pixelated',
        shapeRendering: 'crispEdges',
      }}
    >
      {/* Other body pixels */}
      {otherPixels.map((p, i) => (
        <rect
          key={`body-${i}`}
          x={p.x}
          y={p.y}
          width={1.01}
          height={1.01}
          fill={fill(dark, p.c)}
          style={{ shapeRendering: 'crispEdges' }}
        />
      ))}
      {/* Ear pixels - with wiggle animation on hover */}
      <g className="pixelbara-ears">
        {earPixels.map((p, i) => (
          <rect
            key={`ear-${i}`}
            x={p.x}
            y={p.y}
            width={1.01}
            height={1.01}
            fill={fill(dark, p.c)}
            style={{ shapeRendering: 'crispEdges' }}
          />
        ))}
      </g>
      {/* Eye pixels - with blink animation */}
      <g className="pixelbara-eyes">
        {eyePixels.map((p, i) => (
          <rect
            key={`eye-${i}`}
            x={p.x}
            y={p.y}
            width={1.01}
            height={1.01}
            fill={fill(dark, p.c)}
            style={{ shapeRendering: 'crispEdges' }}
          />
        ))}
      </g>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// ══ POSE COMPONENTS ══
// ══════════════════════════════════════════════════════════

function BlankPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(BASE_ART)
  const size = artSize(BASE_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function HeroLaptopPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(HERO_LAPTOP_ART)
  const size = artSize(HERO_LAPTOP_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function CodingPose({ dark }: { dark: boolean }) {
  return <HeroLaptopPose dark={dark} />
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

function HeartPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(HEART_ART)
  const size = artSize(HEART_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function CoffeePose({ dark }: { dark: boolean }) {
  const pixels = parseArt(COFFEE_ART)
  const size = artSize(COFFEE_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function SweatingPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(SWEATING_ART)
  const size = artSize(SWEATING_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function SleepyPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(SLEEPY_ART)
  const size = artSize(SLEEPY_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function QuestionPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(QUESTION_ART)
  const size = artSize(QUESTION_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function MemePose({ dark }: { dark: boolean }) {
  const pixels = parseArt(MEME_ART)
  const size = artSize(MEME_ART)
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

function DoorPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(DOOR_ART)
  const size = artSize(DOOR_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function EcosystemPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(ECOSYSTEM_FRIENDS_ART)
  const size = artSize(ECOSYSTEM_FRIENDS_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

// New Web3 Poses
function HodlPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(HODL_ART)
  const size = artSize(HODL_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function _RugPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(RUG_ART)
  const size = artSize(RUG_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function _GmPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(GM_SER_ART)
  const size = artSize(GM_SER_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function TouchGrassPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(TOUCH_GRASS_ART)
  const size = artSize(TOUCH_GRASS_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function _OnsenPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(HOT_TUB_ART)
  const size = artSize(HOT_TUB_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function AirdropPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(AIRDROP_ART)
  const size = artSize(AIRDROP_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function DownBadPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(DOWN_BAD_ART)
  const size = artSize(DOWN_BAD_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

// New Meme Generator Poses
function JustVibingPose({ dark }: { dark: boolean }) {
  return <BlankPose dark={dark} />
}

function SittingPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(SITTING_ART)
  const size = artSize(SITTING_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function LyingDownPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(LYING_DOWN_ART)
  const size = artSize(LYING_DOWN_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function ShippingCodePose({ dark }: { dark: boolean }) {
  return <HeroLaptopPose dark={dark} />
}

function LowBatteryPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(LOW_BATTERY_ART)
  const size = artSize(LOW_BATTERY_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

// Legacy alias
function _PhoneCheckPose({ dark }: { dark: boolean }) {
  return <LowBatteryPose dark={dark} />
}

function DiamondHandsPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(DIAMOND_HANDS_ART)
  const size = artSize(DIAMOND_HANDS_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function ToTheMoonPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(TO_THE_MOON_ART)
  const size = artSize(TO_THE_MOON_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function RuggedPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(RUG_ART)
  const size = artSize(RUG_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function WhaleModePose({ dark }: { dark: boolean }) {
  const pixels = parseArt(WHALE_MODE_ART)
  const size = artSize(WHALE_MODE_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function ApeInPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(APE_IN_ART)
  const size = artSize(APE_IN_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function GmSerPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(GM_SER_ART)
  const size = artSize(GM_SER_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function ItsSoOverPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(ITS_SO_OVER_ART)
  const size = artSize(ITS_SO_OVER_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function WereSoBackPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(WERE_SO_BACK_ART)
  const size = artSize(WERE_SO_BACK_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function EcosystemFriendsPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(ECOSYSTEM_FRIENDS_ART)
  const size = artSize(ECOSYSTEM_FRIENDS_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

// Legacy alias
function _RidingMarketPose({ dark }: { dark: boolean }) {
  return <EcosystemFriendsPose dark={dark} />
}

function HotTubPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(HOT_TUB_ART)
  const size = artSize(HOT_TUB_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

// New Web3 Meme Poses
function ProbablyNothingPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(PROBABLY_NOTHING_ART)
  const size = artSize(PROBABLY_NOTHING_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function WendysPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(WENDYS_ART)
  const size = artSize(WENDYS_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function WenMoonPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(WEN_MOON_ART)
  const size = artSize(WEN_MOON_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function FewUnderstandPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(FEW_UNDERSTAND_ART)
  const size = artSize(FEW_UNDERSTAND_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function LooksRarePose({ dark }: { dark: boolean }) {
  const pixels = parseArt(LOOKS_RARE_ART)
  const size = artSize(LOOKS_RARE_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function NgmiPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(NGMI_ART)
  const size = artSize(NGMI_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

function WagmiPose({ dark }: { dark: boolean }) {
  const pixels = parseArt(WAGMI_ART)
  const size = artSize(WAGMI_ART)
  return <PixelSvg pixels={pixels} w={size.w} h={size.h} dark={dark} />
}

// Aliases
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
  blank: BlankPose,
  coding: CodingPose,
  heroLaptop: HeroLaptopPose,
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
  dejected: DejectedPose,
  sparkle: SparklePose,
  smoking: SmokingPose,
  eating: EatingPose,
  wink: WinkPose,
  // Meme generator poses (18 poses - BOLD & IMPACTFUL)
  justVibing: JustVibingPose,
  sitting: SittingPose,
  lyingDown: LyingDownPose,
  shippingCode: ShippingCodePose,
  lowBattery: LowBatteryPose,
  diamondHands: DiamondHandsPose,
  toTheMoon: ToTheMoonPose,
  rugged: RuggedPose,
  whaleMode: WhaleModePose,
  airdrop: AirdropPose,
  apeIn: ApeInPose,
  gmSer: GmSerPose,
  downBad: DownBadPose,
  itsSoOver: ItsSoOverPose,
  wereSoBack: WereSoBackPose,
  touchGrass: TouchGrassPose,
  ecosystemFriends: EcosystemFriendsPose,
  hotTub: HotTubPose,
  // New Web3 meme poses
  probablyNothing: ProbablyNothingPose,
  wendys: WendysPose,
  wenMoon: WenMoonPose,
  fewUnderstand: FewUnderstandPose,
  looksRare: LooksRarePose,
  ngmi: NgmiPose,
  wagmi: WagmiPose,
  // Legacy aliases
  hodl: HodlPose,
  rug: RuggedPose,
  gm: GmSerPose,
  onsen: HotTubPose,
  phoneCheck: LowBatteryPose,
  ridingMarket: EcosystemFriendsPose,
  // Page aliases
  main: HeroLaptopPose,
  careers: SearchPose,
  investors: BlingPose,
  companies: BuildingPose,
  articles: ReadingPose,
  bookmarks: HeartPose,
  login: DoorPose,
  loading: CoffeePose,
  notfound: QuestionPose,
  empty: QuestionPose,
  success: HeartPose,
  error: SweatingPose,
}

// ══════════════════════════════════════════════════════════
// ══ MAIN COMPONENT ══
// ══════════════════════════════════════════════════════════

let globalClicks = 0
let easterEggTriggered = false

export default function Pixelbara({ pose, size = 180, className = '', clickable = false, suppressHover = false }: PixelbaraProps) {
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
      className={`relative inline-block select-none pixelbara-animated group ${clickable ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''} ${className}`}
      style={{
        width: size,
        imageRendering: 'pixelated',
      }}
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

// Mini version - unbothered sleepy eyes
export function MiniPixelbara({ className = '' }: { className?: string }) {
  const dark = useIsDark()
  const miniArt = `
....EeE......EeE....
...FFFFFFFFFFFFFF...
..FFFFFFFFFFFFFFFF..
..FFFFnnnnnnnnFFFF..
...FFFFoNNNNoFFFF...
....FFuuuuuuuuFF....
....FFuuuuuuuuFF....
.....fff..fff.......
`
  const pixels = parseArt(miniArt)
  const { w, h } = artSize(miniArt)
  // Use aspect-ratio to maintain proper proportions
  const aspectRatio = w / h
  return (
    <span
      className={`inline-block flex-shrink-0 ${className}`}
      style={{
        width: 28,
        aspectRatio: aspectRatio,
        imageRendering: 'pixelated'
      }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
        {pixels.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={1.01} height={1.01} fill={fill(dark, p.c)} style={{ shapeRendering: 'crispEdges' }} />
        ))}
      </svg>
    </span>
  )
}

export function PixelbaraToggleIcon({ className = '' }: { className?: string }) {
  const dark = useIsDark()
  const miniArt = `
....EeE......EeE....
...FFFFFFFFFFFFFF...
..FFFFFFFFFFFFFFFF..
..FFFFnnnnnnnnFFFF..
...FFFFoNNNNoFFFF...
....FFuuuuuuuuFF....
....FFuuuuuuuuFF....
.....fff..fff.......
`
  const pixels = parseArt(miniArt)
  const { w, h } = artSize(miniArt)
  return (
    <span className={`inline-block ${className}`} style={{ width: 32, height: 20, imageRendering: 'pixelated' }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
        {pixels.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={1.01} height={1.01} fill={fill(dark, p.c)} style={{ shapeRendering: 'crispEdges' }} />
        ))}
      </svg>
    </span>
  )
}

// ══════════════════════════════════════════════════════════
// ══ EXPORTS ══
// ══════════════════════════════════════════════════════════

export { useTimeOfDay, TIME_MSGS }
export type { TimeOfDay, PoseId, PoseAlias }
