'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Download, RefreshCw, Copy, Check,
  Shuffle, Sparkles, Twitter, Square, Smartphone, Zap, Printer
} from 'lucide-react'
import { toast } from 'sonner'
import Pixelbara from '../components/Pixelbara'
import type { PoseId } from '../components/Pixelbara'
import { PixelSend } from '../components/PixelIcons'

// ══════════════════════════════════════════════════════════
// POSES - Organized by category for easy browsing
// ══════════════════════════════════════════════════════════

const POSES: { id: PoseId; label: string; category: string }[] = [
  // Basic poses
  { id: 'justVibing', label: 'just vibing', category: 'basic' },
  { id: 'sitting', label: 'sitting', category: 'basic' },
  { id: 'lyingDown', label: 'lying down', category: 'basic' },
  // Work poses
  { id: 'shippingCode', label: 'shipping code', category: 'work' },
  { id: 'lowBattery', label: 'low battery', category: 'work' },
  // Web3 poses
  { id: 'diamondHands', label: 'diamond hands', category: 'web3' },
  { id: 'toTheMoon', label: 'to the moon', category: 'web3' },
  { id: 'rugged', label: 'tired af', category: 'work' },
  { id: 'whaleMode', label: 'whale mode', category: 'web3' },
  { id: 'airdrop', label: 'airdrop', category: 'web3' },
  { id: 'apeIn', label: 'ape in', category: 'web3' },
  // New Web3 meme poses
  { id: 'probablyNothing', label: 'probably nothing', category: 'web3' },
  { id: 'wenMoon', label: 'wen moon', category: 'web3' },
  { id: 'fewUnderstand', label: 'few understand', category: 'web3' },
  { id: 'looksRare', label: 'looks rare', category: 'web3' },
  { id: 'ngmi', label: 'ngmi', category: 'web3' },
  { id: 'wagmi', label: 'wagmi', category: 'web3' },
  // Emotion poses
  { id: 'gmSer', label: 'gm ser', category: 'emotion' },
  { id: 'downBad', label: 'down bad', category: 'emotion' },
  { id: 'itsSoOver', label: 'its so over', category: 'emotion' },
  { id: 'wereSoBack', label: 'we so back', category: 'emotion' },
  // Meme legend poses
  { id: 'touchGrass', label: 'touch grass', category: 'meme' },
  { id: 'ecosystemFriends', label: 'ecosystem fren', category: 'meme' },
  { id: 'hotTub', label: 'hot tub', category: 'meme' },
]

// ══════════════════════════════════════════════════════════
// BACKGROUNDS - Simplified (no gradients for Canvas API)
// ══════════════════════════════════════════════════════════

const BACKGROUNDS: { id: string; label: string; value: string; textColor: string }[] = [
  { id: 'transparent', label: 'Transparent', value: 'transparent', textColor: '#ffffff' },
  { id: 'dark', label: 'Dark', value: '#0B0F19', textColor: '#ffffff' },
  { id: 'light', label: 'Light', value: '#F5F5F5', textColor: '#0B0F19' },
  { id: 'black', label: 'Pure Black', value: '#000000', textColor: '#ffffff' },
  { id: 'white', label: 'Pure White', value: '#FFFFFF', textColor: '#000000' },
  { id: 'ethereum', label: 'Ethereum', value: '#627EEA', textColor: '#ffffff' },
  { id: 'solana', label: 'Solana', value: '#9945FF', textColor: '#ffffff' },
  { id: 'bitcoin', label: 'Bitcoin', value: '#F7931A', textColor: '#000000' },
  { id: 'polygon', label: 'Polygon', value: '#8247E5', textColor: '#ffffff' },
  { id: 'arbitrum', label: 'Arbitrum', value: '#28A0F0', textColor: '#ffffff' },
  { id: 'optimism', label: 'Optimism', value: '#FF0420', textColor: '#ffffff' },
  { id: 'base', label: 'Base', value: '#0052FF', textColor: '#ffffff' },
  { id: 'pink', label: 'Pink', value: '#FF69B4', textColor: '#000000' },
  { id: 'green', label: 'Green', value: '#00FF87', textColor: '#000000' },
]

// ══════════════════════════════════════════════════════════
// DOWNLOAD SIZES (Aspect Ratio)
// ══════════════════════════════════════════════════════════

const DOWNLOAD_SIZES = [
  { id: 'square', label: '1:1', width: 1000, height: 1000, icon: Square },
  { id: 'story', label: '9:16', width: 1080, height: 1920, icon: Smartphone },
]

// ══════════════════════════════════════════════════════════
// QUALITY OPTIONS (Resolution)
// ══════════════════════════════════════════════════════════

const QUALITY_OPTIONS = [
  { id: 'standard', label: 'Standard', multiplier: 1, icon: Zap, desc: 'Web & Social' },
  { id: 'hd', label: 'HD', multiplier: 2, icon: Zap, desc: '2x Resolution' },
  { id: 'print', label: 'Print', multiplier: 3, icon: Printer, desc: '300dpi T-shirt' },
]

// ══════════════════════════════════════════════════════════
// GEN Z PRESETS
// ══════════════════════════════════════════════════════════

const PRESET_TEXTS: { top?: string; bottom: string }[] = [
  // OG Gen Z / Job hunting
  { bottom: 'not me job hunting at 3am' },
  { bottom: 'linkedin is scary' },
  { bottom: 'pls hire me ser' },
  { bottom: 'rent is due bestie' },
  { bottom: 'its giving... unemployed' },
  { bottom: 'me pretending to have 5 yrs experience' },
  { bottom: 'wen job ser' },
  { bottom: 'ngmi without coffee' },
  { bottom: 'touched grass, still unemployed' },
  { top: 'interviewer: weakness?', bottom: 'me: i care too much about being employed' },
  { top: 'salary: competitive', bottom: '*laughs in poverty*' },
  { bottom: 'recruiter ghosted me again' },
  { bottom: 'main character but unemployed' },
  { bottom: 'delulu is not the solulu' },
  { top: 'me explaining my gap year', bottom: 'it was a learning experience' },
  // Web3 degen classics
  { bottom: 'ser this is fine' },
  { bottom: 'rug where' },
  { top: 'gm to everyone', bottom: 'except sellers' },
  { bottom: 'down 90% but still vibing' },
  { bottom: 'not my first rug' },
  { bottom: 'few understand' },
  { bottom: '1 eth = 1 eth' },
  { bottom: 'probably nothing' },
  { top: 'trust me bro', bottom: 'i did my own research' },
  { bottom: 'wen moon ser' },
  { bottom: 'wagmi... right?' },
  { top: 'portfolio:', bottom: '-99% ytd' },
  { bottom: 'airdrop farming at 4am' },
  { top: 'me after buying the dip', bottom: 'it dipped more' },
  { bottom: 'ngmi but make it aesthetic' },
  { top: 'they said its the next 100x', bottom: 'it was not' },
  { bottom: 'when the startup rugs after 2 weeks' },
  { bottom: 'down bad fr fr' },
  { top: 'web3 is the future', bottom: 'the future:' },
  { bottom: 'touched grass. portfolio still red.' },
  { top: 'bear market survivor', bottom: '2022 veteran' },
  { bottom: 'still shipping in the bear' },
  { bottom: 'cope. seethe. hodl.' },
  { top: 'anon dev rug when?', bottom: 'asking for a friend' },
  { bottom: 'ser i am just a simple farmer' },
]

// ══════════════════════════════════════════════════════════
// TEXT COLORS
// ══════════════════════════════════════════════════════════

const TEXT_COLORS = [
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'black', label: 'Black', value: '#000000' },
  { id: 'yellow', label: 'Yellow', value: '#FFDD00' },
  { id: 'red', label: 'Red', value: '#FF0000' },
  { id: 'green', label: 'Green', value: '#00FF00' },
  { id: 'cyan', label: 'Cyan', value: '#00FFFF' },
  { id: 'pink', label: 'Pink', value: '#FF69B4' },
]

// ══════════════════════════════════════════════════════════
// CANVAS DRAWING UTILITIES
// ══════════════════════════════════════════════════════════

// Convert SVG element to Image
async function svgToImage(svgElement: SVGElement, width: number, height: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG'))
    }
    img.src = url
  })
}

// Draw meme text with stroke
function drawMemeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  textColor: string
) {
  ctx.save()
  ctx.font = `bold ${fontSize}px "Impact", "Arial Black", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Text stroke (outline)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = fontSize / 8
  ctx.lineJoin = 'round'
  ctx.strokeText(text, x, y, maxWidth)

  // Text fill
  ctx.fillStyle = textColor
  ctx.fillText(text, x, y, maxWidth)
  ctx.restore()
}

// ══════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════

export default function MemePage() {
  const [selectedPose, setSelectedPose] = useState<PoseId>('blank')
  const [selectedBg, setSelectedBg] = useState('dark')
  const [topText, setTopText] = useState('')
  const [bottomText, setBottomText] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [copied, setCopied] = useState(false)
  const [pixelbaraSize, setPixelbaraSize] = useState(280)
  const [downloadSize, setDownloadSize] = useState('square')
  const [quality, setQuality] = useState('standard')
  const pixelbaraRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    toast("time to make internet history", { duration: 3000 })
  }, [])

  const bg = BACKGROUNDS.find((b) => b.id === selectedBg) || BACKGROUNDS[1]
  const isTransparent = bg.value === 'transparent'
  const currentSize = DOWNLOAD_SIZES.find((s) => s.id === downloadSize) || DOWNLOAD_SIZES[0]
  const currentQuality = QUALITY_OPTIONS.find((q) => q.id === quality) || QUALITY_OPTIONS[0]

  // Random generation
  const handleRandom = useCallback(() => {
    const randomPose = POSES[Math.floor(Math.random() * POSES.length)]
    const randomBg = BACKGROUNDS.filter(b => b.id !== 'transparent')[Math.floor(Math.random() * (BACKGROUNDS.length - 1)) + 1]
    const randomPreset = PRESET_TEXTS[Math.floor(Math.random() * PRESET_TEXTS.length)]

    setSelectedPose(randomPose.id)
    setSelectedBg(randomBg.id)
    setTopText(randomPreset.top || '')
    setBottomText(randomPreset.bottom)
    setTextColor(randomBg.textColor)

    toast("vibes randomized", { duration: 2000 })
  }, [])

  // Apply preset
  const applyPreset = useCallback((preset: typeof PRESET_TEXTS[0]) => {
    setTopText(preset.top || '')
    setBottomText(preset.bottom)
  }, [])

  // ══════════════════════════════════════════════════════════
  // CANVAS API DOWNLOAD - True transparency support
  // ══════════════════════════════════════════════════════════
  const handleDownload = useCallback(async () => {
    if (!pixelbaraRef.current) return

    try {
      // Show loading for high-res
      if (currentQuality.multiplier > 1) {
        toast.loading("Generating high-res image...", { id: 'download' })
      }

      // Target dimensions
      const targetWidth = currentSize.width * currentQuality.multiplier
      const targetHeight = currentSize.height * currentQuality.multiplier

      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      // 1. Draw background (transparent = skip, color = fill)
      if (!isTransparent) {
        ctx.fillStyle = bg.value
        ctx.fillRect(0, 0, targetWidth, targetHeight)
      }
      // For transparent, canvas is already transparent (alpha = 0)

      // 2. Get Pixelbara SVG and draw it
      const svgElement = pixelbaraRef.current.querySelector('svg')
      if (svgElement) {
        // Clone SVG to avoid modifying the original
        const svgClone = svgElement.cloneNode(true) as SVGElement

        // Set explicit dimensions on SVG for proper scaling
        const viewBox = svgClone.getAttribute('viewBox')
        if (viewBox) {
          svgClone.setAttribute('width', String(targetWidth))
          svgClone.setAttribute('height', String(targetHeight))
        }

        // Calculate Pixelbara size relative to canvas
        const pixelbaraSizeRatio = pixelbaraSize / 500 // relative to preview max size
        const pixelbaraDrawSize = Math.min(targetWidth, targetHeight) * pixelbaraSizeRatio * 0.8

        // Convert SVG to image
        const img = await svgToImage(svgClone, pixelbaraDrawSize, pixelbaraDrawSize)

        // Draw centered (no offset - text will be positioned relative to this)
        const x = (targetWidth - pixelbaraDrawSize) / 2
        const y = (targetHeight - pixelbaraDrawSize) / 2

        ctx.imageSmoothingEnabled = false // Crisp pixels
        ctx.drawImage(img, x, y, pixelbaraDrawSize, pixelbaraDrawSize)
      }

      // Calculate text positions relative to Pixelbara (compact layout)
      const pixelbaraSizeRatioForText = pixelbaraSize / 500
      const pixelbaraDrawSizeForText = Math.min(targetWidth, targetHeight) * pixelbaraSizeRatioForText * 0.8
      const centerY = targetHeight / 2
      const fontSize = targetWidth * 0.08 // Bigger font (was 0.05)

      // 3. Draw top text - right above Pixelbara
      if (topText) {
        const textY = centerY - (pixelbaraDrawSizeForText / 2) - fontSize * 0.8
        drawMemeText(ctx, topText.toUpperCase(), targetWidth / 2, textY, targetWidth * 0.95, fontSize, textColor)
      }

      // 4. Draw bottom text - right below Pixelbara
      if (bottomText) {
        const textY = centerY + (pixelbaraDrawSizeForText / 2) + fontSize * 1.2
        drawMemeText(ctx, bottomText.toUpperCase(), targetWidth / 2, textY, targetWidth * 0.95, fontSize, textColor)
      }

      // 5. Draw watermark
      ctx.save()
      ctx.font = `${targetWidth * 0.015}px sans-serif`
      ctx.fillStyle = isTransparent ? 'rgba(255,255,255,0.3)' : `${bg.textColor}40`
      ctx.textAlign = 'right'
      ctx.fillText('neun.wtf', targetWidth - 10, targetHeight - 10)
      ctx.restore()

      // 6. Export as PNG
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      const qualitySuffix = currentQuality.multiplier > 1 ? `-${currentQuality.id}` : ''
      link.download = `pixelbara-meme-${currentSize.id}${qualitySuffix}-${Date.now()}.png`
      link.href = dataUrl
      link.click()

      toast.dismiss('download')
      const resolution = `${targetWidth}x${targetHeight}`
      toast.success(`Downloaded! (${resolution}px)${isTransparent ? ' - Transparent PNG' : ''}`, { duration: 3000 })
    } catch (error) {
      console.error('Failed to download:', error)
      toast.dismiss('download')
      toast.error("download failed... try again", { duration: 3000 })
    }
  }, [currentSize, currentQuality, isTransparent, bg, pixelbaraSize, topText, bottomText, textColor])

  // Copy to clipboard using Canvas API
  const handleCopy = useCallback(async () => {
    if (!pixelbaraRef.current) return

    try {
      // Target dimensions (use standard quality for clipboard)
      const targetWidth = currentSize.width
      const targetHeight = currentSize.height

      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      // 1. Draw background
      if (!isTransparent) {
        ctx.fillStyle = bg.value
        ctx.fillRect(0, 0, targetWidth, targetHeight)
      }

      // 2. Get Pixelbara SVG and draw it
      const svgElement = pixelbaraRef.current.querySelector('svg')
      if (svgElement) {
        const svgClone = svgElement.cloneNode(true) as SVGElement
        const viewBox = svgClone.getAttribute('viewBox')
        if (viewBox) {
          svgClone.setAttribute('width', String(targetWidth))
          svgClone.setAttribute('height', String(targetHeight))
        }

        const pixelbaraSizeRatio = pixelbaraSize / 500
        const pixelbaraDrawSize = Math.min(targetWidth, targetHeight) * pixelbaraSizeRatio * 0.8
        const img = await svgToImage(svgClone, pixelbaraDrawSize, pixelbaraDrawSize)

        const x = (targetWidth - pixelbaraDrawSize) / 2
        const y = (targetHeight - pixelbaraDrawSize) / 2

        ctx.imageSmoothingEnabled = false
        ctx.drawImage(img, x, y, pixelbaraDrawSize, pixelbaraDrawSize)
      }

      // 3. Draw texts (compact layout - close to Pixelbara)
      const pixelbaraSizeRatioForText = pixelbaraSize / 500
      const pixelbaraDrawSizeForText = Math.min(targetWidth, targetHeight) * pixelbaraSizeRatioForText * 0.8
      const centerY = targetHeight / 2
      const fontSize = targetWidth * 0.08 // Bigger font

      if (topText) {
        const textY = centerY - (pixelbaraDrawSizeForText / 2) - fontSize * 0.8
        drawMemeText(ctx, topText.toUpperCase(), targetWidth / 2, textY, targetWidth * 0.95, fontSize, textColor)
      }
      if (bottomText) {
        const textY = centerY + (pixelbaraDrawSizeForText / 2) + fontSize * 1.2
        drawMemeText(ctx, bottomText.toUpperCase(), targetWidth / 2, textY, targetWidth * 0.95, fontSize, textColor)
      }

      // 4. Watermark
      ctx.font = `${targetWidth * 0.015}px sans-serif`
      ctx.fillStyle = isTransparent ? 'rgba(255,255,255,0.3)' : `${bg.textColor}40`
      ctx.textAlign = 'right'
      ctx.fillText('neun.wtf', targetWidth - 10, targetHeight - 10)

      // 5. Copy to clipboard
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ])
          setCopied(true)
          toast.success("copied to clipboard!", { duration: 2000 })
          setTimeout(() => setCopied(false), 2000)
        }
      }, 'image/png')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error("copy failed... browser skill issue", { duration: 3000 })
    }
  }, [currentSize, isTransparent, bg, pixelbaraSize, topText, bottomText, textColor])

  // Share to Twitter
  const handleTwitterShare = useCallback(() => {
    const text = bottomText || topText || 'check out my meme'
    const url = 'https://neun.wtf/meme'
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ')}&url=${encodeURIComponent(url)}`
    window.open(tweetUrl, '_blank')
    toast("spreading the word fr", { duration: 2000 })
  }, [topText, bottomText])

  // Share to Telegram
  const handleTelegramShare = useCallback(() => {
    const text = bottomText || topText || 'check out my meme'
    const url = 'https://neun.wtf/meme'
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    window.open(telegramUrl, '_blank')
    toast("spreading the word fr", { duration: 2000 })
  }, [topText, bottomText])

  // Calculate preview dimensions
  const aspectRatio = currentSize.width / currentSize.height
  const previewMaxSize = 500

  let previewWidth: number
  let previewHeight: number

  if (aspectRatio >= 1) {
    previewWidth = previewMaxSize
    previewHeight = previewMaxSize / aspectRatio
  } else {
    previewHeight = previewMaxSize
    previewWidth = previewMaxSize * aspectRatio
  }

  return (
    <div className="min-h-screen bg-a24-bg">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-a24-muted hover:text-a24-text transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-a24-text">
                Meme Generator
              </h1>
              <p className="text-a24-muted text-sm">make memes not war</p>
            </div>
          </div>
          <Pixelbara pose="meme" size={80} clickable />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* ════════════════════════════════════════════════════════ */}
          {/* LEFT: Canvas Preview */}
          {/* ════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Preview Canvas - Compact layout matching download */}
            <div
              className="relative flex flex-col items-center justify-center overflow-hidden mx-auto"
              style={{
                // Checkered pattern for transparent preview (CSS only, not in download)
                background: isTransparent
                  ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 20px 20px'
                  : bg.value,
                width: `${previewWidth}px`,
                height: `${previewHeight}px`,
                imageRendering: 'pixelated',
              }}
            >
              {/* Compact content group - text close to Pixelbara */}
              <div className="flex flex-col items-center justify-center">
                {/* Top text - right above Pixelbara */}
                {topText && (
                  <p
                    className="text-center font-black uppercase leading-none mb-2 px-2"
                    style={{
                      fontSize: 'clamp(18px, 6vw, 40px)',
                      color: textColor,
                      fontFamily: 'Impact, "Arial Black", sans-serif',
                      fontWeight: 900,
                      textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000',
                      wordBreak: 'break-word',
                      maxWidth: '95%',
                    }}
                  >
                    {topText}
                  </p>
                )}

                {/* Pixelbara - centered */}
                <div
                  ref={pixelbaraRef}
                  style={{
                    width: `${pixelbaraSize}px`,
                    imageRendering: 'pixelated',
                  }}
                >
                  <Pixelbara pose={selectedPose} size={pixelbaraSize} />
                </div>

                {/* Bottom text - right below Pixelbara */}
                {bottomText && (
                  <p
                    className="text-center font-black uppercase leading-none mt-2 px-2"
                    style={{
                      fontSize: 'clamp(18px, 6vw, 40px)',
                      color: textColor,
                      fontFamily: 'Impact, "Arial Black", sans-serif',
                      fontWeight: 900,
                      textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000',
                      wordBreak: 'break-word',
                      maxWidth: '95%',
                    }}
                  >
                    {bottomText}
                  </p>
                )}
              </div>

              {/* Watermark */}
              <p
                className="absolute bottom-1 right-2 text-[8px] font-medium opacity-30"
                style={{ color: isTransparent ? '#888' : bg.textColor }}
              >
                neun.wtf
              </p>
            </div>

            {/* Download Options: Size + Quality */}
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
              {/* Aspect Ratio */}
              <div className="flex justify-center gap-1">
                {DOWNLOAD_SIZES.map((size) => {
                  const Icon = size.icon
                  return (
                    <button
                      key={size.id}
                      onClick={() => setDownloadSize(size.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold border transition-all ${
                        downloadSize === size.id
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent text-a24-muted border-a24-border hover:border-a24-text'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {size.label}
                    </button>
                  )
                })}
              </div>

              {/* Quality / Resolution */}
              <div className="flex justify-center gap-1">
                {QUALITY_OPTIONS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setQuality(q.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold border transition-all ${
                      quality === q.id
                        ? q.id === 'print'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-neun-success text-black border-neun-success'
                        : 'bg-transparent text-a24-muted border-a24-border hover:border-a24-text'
                    }`}
                    title={q.desc}
                  >
                    {q.id === 'print' ? <Printer className="w-3 h-3" /> : null}
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution info */}
            <p className="text-center text-[10px] text-a24-muted">
              {currentSize.width * currentQuality.multiplier} x {currentSize.height * currentQuality.multiplier}px
              {currentQuality.id === 'print' && ' (300dpi print ready)'}
              {isTransparent && ' | Transparent PNG'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={handleDownload}
                className="flex-1 min-w-[120px] max-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-a24-surface text-white font-bold hover:bg-gray-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleTwitterShare}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white font-bold border border-a24-border hover:bg-gray-900 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </button>
              <button
                onClick={handleTelegramShare}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] text-white font-bold hover:bg-[#0077b5] transition-colors"
              >
                <PixelSend size={16} />
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════ */}
          {/* RIGHT: Controls */}
          {/* ════════════════════════════════════════════════════════ */}
          <div className="space-y-5 bg-a24-surface p-4 sm:p-5 border border-a24-border">
            {/* Random Button */}
            <button
              onClick={handleRandom}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              <Shuffle className="w-4 h-4" />
              I&apos;m feeling lucky
            </button>

            {/* Pose Selection */}
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-a24-muted mb-2 font-bold">
                vibe check
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                {POSES.map((pose) => (
                  <button
                    key={pose.id}
                    onClick={() => setSelectedPose(pose.id)}
                    className={`p-2 text-center border transition-all ${
                      selectedPose === pose.id
                        ? 'bg-white text-black border-white'
                        : 'bg-a24-surface/50 text-a24-text border-a24-border hover:border-gray-500'
                    }`}
                  >
                    <span className="text-[9px] block leading-tight">{pose.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Slider */}
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-a24-muted mb-2 font-bold">
                how thicc: {pixelbaraSize}px
              </h3>
              <input
                type="range"
                min="120"
                max="400"
                value={pixelbaraSize}
                onChange={(e) => setPixelbaraSize(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Background Selection */}
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-a24-muted mb-2 font-bold">
                aesthetic
              </h3>
              <div className="grid grid-cols-7 gap-1.5">
                {BACKGROUNDS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBg(b.id)
                      if (b.id !== 'transparent') setTextColor(b.textColor)
                    }}
                    className={`w-full aspect-square border-2 transition-all ${
                      selectedBg === b.id
                        ? 'border-white scale-110 z-10'
                        : 'border-transparent hover:border-gray-500'
                    }`}
                    style={{
                      background: b.value === 'transparent'
                        ? 'repeating-conic-gradient(#444 0% 25%, #333 0% 50%) 50% / 8px 8px'
                        : b.value
                    }}
                    title={b.label}
                  />
                ))}
              </div>
            </div>

            {/* Text Inputs */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-a24-muted mb-1.5 font-bold">
                  Top Text
                </h3>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value.toUpperCase())}
                  placeholder="OPTIONAL"
                  className="w-full px-3 py-2 bg-a24-surface border border-a24-border text-white text-sm placeholder-gray-500 focus:border-purple-500 outline-none transition-colors font-bold uppercase"
                />
              </div>
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-a24-muted mb-1.5 font-bold">
                  Bottom Text
                </h3>
                <input
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value.toUpperCase())}
                  placeholder="ENTER YOUR TEXT"
                  className="w-full px-3 py-2 bg-a24-surface border border-a24-border text-white text-sm placeholder-gray-500 focus:border-purple-500 outline-none transition-colors font-bold uppercase"
                />
              </div>
            </div>

            {/* Text Color */}
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-a24-muted mb-2 font-bold">
                Text Color
              </h3>
              <div className="flex gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTextColor(c.value)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      textColor === c.value
                        ? 'border-white scale-110'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Gen Z Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] uppercase tracking-wider text-a24-muted font-bold">
                  Presets
                </h3>
                <button
                  onClick={() => applyPreset(PRESET_TEXTS[Math.floor(Math.random() * PRESET_TEXTS.length)])}
                  className="flex items-center gap-1 text-[10px] text-a24-muted hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Random
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
                {PRESET_TEXTS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(preset)}
                    className="px-2 py-1 text-[10px] bg-a24-surface/50 border border-a24-border hover:border-purple-500 hover:bg-gray-700 transition-colors text-a24-text truncate max-w-[160px]"
                  >
                    {preset.top ? `${preset.top.slice(0, 15)}...` : preset.bottom.slice(0, 20)}
                  </button>
                ))}
              </div>
            </div>

            {/* Pro tip */}
            <div className="p-3 bg-a24-surface/30 border border-a24-border/50">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-a24-text font-medium">Pro tip</p>
                  <p className="text-[10px] text-a24-muted mt-0.5">
                    Transparent = true PNG alpha! Perfect for stickers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
