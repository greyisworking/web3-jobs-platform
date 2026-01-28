'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Download, Share2, RefreshCw, Copy, Check,
  Shuffle, Sparkles, Twitter
} from 'lucide-react'
import { toast } from 'sonner'
import Pixelbara from '../components/Pixelbara'
import type { PoseId } from '../components/Pixelbara'
import { PixelSend } from '../components/PixelIcons'

// ══════════════════════════════════════════════════════════
// POSES
// ══════════════════════════════════════════════════════════

const POSES: { id: PoseId; label: string; emoji: string }[] = [
  { id: 'blank', label: 'Basic', emoji: 'ㅡ_ㅡ' },
  { id: 'heroLaptop', label: 'Laptop', emoji: '💻' },
  { id: 'bling', label: 'Gold Chain', emoji: '⛓️' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'sweating', label: 'Sweating', emoji: '😰' },
  { id: 'dejected', label: 'Sad', emoji: '😢' },
  { id: 'sleepy', label: 'Sleepy', emoji: '😴' },
  { id: 'eating', label: 'Eating', emoji: '🌿' },
  { id: 'ecosystem', label: 'On Alligator', emoji: '🐊' },
  { id: 'heart', label: 'Heart', emoji: '❤️' },
  { id: 'search', label: 'Search', emoji: '🔍' },
  { id: 'coin', label: 'Coins', emoji: '🪙' },
]

// ══════════════════════════════════════════════════════════
// BACKGROUNDS
// ══════════════════════════════════════════════════════════

const BACKGROUNDS: { id: string; label: string; value: string; textColor: string }[] = [
  // Solid colors
  { id: 'dark', label: 'Dark', value: '#0B0F19', textColor: '#ffffff' },
  { id: 'light', label: 'Light', value: '#F5F5F5', textColor: '#0B0F19' },
  { id: 'black', label: 'Pure Black', value: '#000000', textColor: '#ffffff' },
  // Chain colors
  { id: 'ethereum', label: 'Ethereum', value: '#627EEA', textColor: '#ffffff' },
  { id: 'solana', label: 'Solana', value: '#9945FF', textColor: '#ffffff' },
  { id: 'bitcoin', label: 'Bitcoin', value: '#F7931A', textColor: '#000000' },
  { id: 'polygon', label: 'Polygon', value: '#8247E5', textColor: '#ffffff' },
  { id: 'arbitrum', label: 'Arbitrum', value: '#28A0F0', textColor: '#ffffff' },
  { id: 'optimism', label: 'Optimism', value: '#FF0420', textColor: '#ffffff' },
  { id: 'base', label: 'Base', value: '#0052FF', textColor: '#ffffff' },
  // Gradients
  { id: 'web3-gradient', label: 'Web3', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textColor: '#ffffff' },
  { id: 'sunset', label: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', textColor: '#ffffff' },
  { id: 'ocean', label: 'Ocean', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', textColor: '#000000' },
  { id: 'neon', label: 'Neon', value: 'linear-gradient(135deg, #00ff87 0%, #60efff 100%)', textColor: '#000000' },
]

// ══════════════════════════════════════════════════════════
// GEN Z PRESETS
// ══════════════════════════════════════════════════════════

const PRESET_TEXTS: { top?: string; bottom: string }[] = [
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
  { bottom: 'when the startup rugs after 2 weeks' },
  { bottom: 'down bad fr fr' },
  { bottom: 'recruiter ghosted me again' },
  { top: 'web3 is the future', bottom: 'the future:' },
  { bottom: 'main character but unemployed' },
  { bottom: 'delulu is not the solulu' },
  { top: 'me explaining my gap year', bottom: 'it was a learning experience' },
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
// COMPONENT
// ══════════════════════════════════════════════════════════

export default function MemePage() {
  const [selectedPose, setSelectedPose] = useState<PoseId>('blank')
  const [selectedBg, setSelectedBg] = useState('dark')
  const [topText, setTopText] = useState('')
  const [bottomText, setBottomText] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [copied, setCopied] = useState(false)
  const [pixelbaraSize, setPixelbaraSize] = useState(220)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Show entry message
  useEffect(() => {
    toast("time to make internet history", { duration: 3000 })
  }, [])

  const bg = BACKGROUNDS.find((b) => b.id === selectedBg) || BACKGROUNDS[0]
  const isGradient = bg.value.includes('gradient')

  // Random generation
  const handleRandom = useCallback(() => {
    const randomPose = POSES[Math.floor(Math.random() * POSES.length)]
    const randomBg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]
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

  // Download as PNG
  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return

    try {
      // Dynamic import html-to-image
      const { toPng } = await import('html-to-image')

      const dataUrl = await toPng(canvasRef.current, {
        width: 1000,
        height: 1000,
        pixelRatio: 2,
        backgroundColor: isGradient ? undefined : bg.value,
      })

      const link = document.createElement('a')
      link.download = `pixelbara-meme-${Date.now()}.png`
      link.href = dataUrl
      link.click()

      toast("masterpiece. truly.", { duration: 3000 })
    } catch (error) {
      console.error('Failed to download:', error)
      toast("download failed... try screenshot bestie", { duration: 3000 })
    }
  }, [bg, isGradient])

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return

    try {
      const { toBlob } = await import('html-to-image')

      const blob = await toBlob(canvasRef.current, {
        width: 1000,
        height: 1000,
        pixelRatio: 2,
      })

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        setCopied(true)
        toast("copied to clipboard!", { duration: 2000 })
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error('Failed to copy:', error)
      toast("copy failed... browser skill issue", { duration: 3000 })
    }
  }, [])

  // Share to Twitter
  const handleTwitterShare = useCallback(() => {
    const text = bottomText || topText || 'check out my meme'
    const url = 'https://neun.xyz/meme'
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ')}&url=${encodeURIComponent(url)}`
    window.open(tweetUrl, '_blank')
    toast("spreading the word fr", { duration: 2000 })
  }, [topText, bottomText])

  // Share to Telegram
  const handleTelegramShare = useCallback(() => {
    const text = bottomText || topText || 'check out my meme'
    const url = 'https://neun.xyz/meme'
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    window.open(telegramUrl, '_blank')
    toast("spreading the word fr", { duration: 2000 })
  }, [topText, bottomText])

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Meme Generator
              </h1>
              <p className="text-gray-400 text-sm">make memes not war</p>
            </div>
          </div>
          <Pixelbara pose="wink" size={60} clickable />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* ════════════════════════════════════════════════════════ */}
          {/* LEFT: Canvas Preview */}
          {/* ════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Canvas */}
            <div
              ref={canvasRef}
              className="relative aspect-square flex flex-col items-center justify-center overflow-hidden rounded-lg"
              style={{
                background: bg.value,
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              {/* Top text */}
              {topText && (
                <p
                  className="absolute top-4 sm:top-8 left-4 right-4 text-center text-xl sm:text-3xl font-black uppercase leading-tight"
                  style={{
                    color: textColor,
                    fontFamily: 'Impact, Haettenschweiler, sans-serif',
                    textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000',
                    letterSpacing: '0.02em',
                  }}
                >
                  {topText}
                </p>
              )}

              {/* Pixelbara */}
              <Pixelbara pose={selectedPose} size={pixelbaraSize} />

              {/* Bottom text */}
              {bottomText && (
                <p
                  className="absolute bottom-4 sm:bottom-8 left-4 right-4 text-center text-xl sm:text-3xl font-black uppercase leading-tight"
                  style={{
                    color: textColor,
                    fontFamily: 'Impact, Haettenschweiler, sans-serif',
                    textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000',
                    letterSpacing: '0.02em',
                  }}
                >
                  {bottomText}
                </p>
              )}

              {/* Watermark */}
              <p
                className="absolute bottom-2 right-3 text-[10px] font-medium opacity-40"
                style={{ color: bg.textColor }}
              >
                neun.xyz
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center max-w-[600px] mx-auto">
              <button
                onClick={handleDownload}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white font-bold rounded hover:bg-gray-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleTwitterShare}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white font-bold rounded border border-gray-700 hover:bg-gray-900 transition-colors"
              >
                <Twitter className="w-4 h-4" />
                Tweet
              </button>
              <button
                onClick={handleTelegramShare}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] text-white font-bold rounded hover:bg-[#0077b5] transition-colors"
              >
                <PixelSend size={16} />
                Telegram
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════ */}
          {/* RIGHT: Controls */}
          {/* ════════════════════════════════════════════════════════ */}
          <div className="space-y-6 bg-gray-900/50 rounded-lg p-4 sm:p-6 border border-gray-800">
            {/* Random Button */}
            <button
              onClick={handleRandom}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              <Shuffle className="w-5 h-5" />
              I&apos;m feeling lucky
            </button>

            {/* Pose Selection */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-bold">
                Pose
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {POSES.map((pose) => (
                  <button
                    key={pose.id}
                    onClick={() => setSelectedPose(pose.id)}
                    className={`p-2 text-center rounded border transition-all ${
                      selectedPose === pose.id
                        ? 'bg-white text-black border-white'
                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-lg block">{pose.emoji}</span>
                    <span className="text-[10px] block mt-1">{pose.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Slider */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-bold">
                Size: {pixelbaraSize}px
              </h3>
              <input
                type="range"
                min="100"
                max="350"
                value={pixelbaraSize}
                onChange={(e) => setPixelbaraSize(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Background Selection */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-bold">
                Background
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {BACKGROUNDS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBg(b.id)
                      setTextColor(b.textColor)
                    }}
                    className={`w-full aspect-square rounded border-2 transition-all ${
                      selectedBg === b.id
                        ? 'border-white scale-110 z-10'
                        : 'border-transparent hover:border-gray-500'
                    }`}
                    style={{ background: b.value }}
                    title={b.label}
                  />
                ))}
              </div>
            </div>

            {/* Text Inputs */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
                  Top Text
                </h3>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value.toUpperCase())}
                  placeholder="OPTIONAL"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-purple-500 outline-none transition-colors font-bold uppercase"
                />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
                  Bottom Text
                </h3>
                <input
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value.toUpperCase())}
                  placeholder="ENTER YOUR TEXT"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-purple-500 outline-none transition-colors font-bold uppercase"
                />
              </div>
            </div>

            {/* Text Color */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-bold">
                Text Color
              </h3>
              <div className="flex gap-2">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTextColor(c.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                  Gen Z Presets
                </h3>
                <button
                  onClick={() => applyPreset(PRESET_TEXTS[Math.floor(Math.random() * PRESET_TEXTS.length)])}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Random
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2">
                {PRESET_TEXTS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded hover:border-purple-500 hover:bg-gray-700 transition-colors text-gray-300 truncate max-w-[200px]"
                  >
                    {preset.top ? `${preset.top} / ${preset.bottom}` : preset.bottom}
                  </button>
                ))}
              </div>
            </div>

            {/* Pro tip */}
            <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">Pro tip</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Share your meme on Twitter with #NEUN for a chance to be featured!
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
