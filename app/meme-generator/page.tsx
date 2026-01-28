'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Share2, RefreshCw } from 'lucide-react'
import Pixelbara from '../components/Pixelbara'
import type { PoseId } from '../components/Pixelbara'

const POSES: { id: PoseId; label: string }[] = [
  { id: 'heroLaptop', label: 'Laptop' },
  { id: 'bling', label: 'Bling' },
  { id: 'smoking', label: 'Smoking' },
  { id: 'sweating', label: 'Sweating' },
  { id: 'dejected', label: 'Sad' },
  { id: 'sleepy', label: 'Sleepy' },
  { id: 'eating', label: 'Eating' },
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'search', label: 'Search' },
  { id: 'reading', label: 'Reading' },
  { id: 'blank', label: 'Blank' },
]

const BACKGROUNDS = [
  { id: 'dark', label: 'Dark', color: '#1a1a1a' },
  { id: 'light', label: 'Light', color: '#f5f5f5' },
  { id: 'purple', label: 'Purple', color: '#7c3aed' },
  { id: 'green', label: 'Green', color: '#10b981' },
  { id: 'blue', label: 'Blue', color: '#3b82f6' },
  { id: 'orange', label: 'Orange', color: '#f97316' },
  { id: 'pink', label: 'Pink', color: '#ec4899' },
]

const PRESET_TEXTS = [
  'not me job hunting at 3am',
  'linkedin is scary',
  'pls hire me ser',
  'rent is due bestie',
  'its giving... unemployed',
  'me pretending to have 5 yrs experience',
  'when the startup rugs after 2 weeks',
  'down bad fr fr',
  'touch grass they said',
  'wen offer letter',
  'interviewer: where do you see yourself in 5 years\nme: employed hopefully',
  'recruiter ghosted me again',
  'web3 is the future they said',
  'salary: competitive\n*laughs in poverty*',
]

export default function MemeGeneratorPage() {
  const [selectedPose, setSelectedPose] = useState<PoseId>('heroLaptop')
  const [selectedBg, setSelectedBg] = useState('dark')
  const [topText, setTopText] = useState('')
  const [bottomText, setBottomText] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)

  const getRandomPreset = useCallback(() => {
    const preset = PRESET_TEXTS[Math.floor(Math.random() * PRESET_TEXTS.length)]
    if (preset.includes('\n')) {
      const parts = preset.split('\n')
      setTopText(parts[0])
      setBottomText(parts[1])
    } else {
      setTopText('')
      setBottomText(preset)
    }
  }, [])

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return

    try {
      // Use html2canvas or similar library in production
      // For now, show alert
      alert('Download feature coming soon! For now, take a screenshot bestie')
    } catch (error) {
      console.error('Failed to download:', error)
    }
  }, [])

  const handleShare = useCallback(() => {
    const text = bottomText || topText || 'check out this meme'
    const url = 'https://neun.xyz/meme-generator'
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(tweetUrl, '_blank')
  }, [topText, bottomText])

  const bgColor = BACKGROUNDS.find((bg) => bg.id === selectedBg)?.color || '#1a1a1a'
  const textColor = selectedBg === 'light' ? '#1a1a1a' : '#ffffff'

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text mb-8 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-a24-text dark:text-a24-dark-text mb-2">
              Pixelbara Meme Generator
            </h1>
            <p className="text-a24-muted dark:text-a24-dark-muted text-sm">
              make memes not war
            </p>
          </div>
          <Pixelbara pose="wink" size={80} clickable />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div>
            <div
              ref={canvasRef}
              className="relative aspect-square flex flex-col items-center justify-center p-8 overflow-hidden"
              style={{ backgroundColor: bgColor }}
            >
              {/* Top text */}
              {topText && (
                <p
                  className="absolute top-6 left-0 right-0 text-center text-2xl font-bold px-4"
                  style={{
                    color: textColor,
                    textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                  }}
                >
                  {topText}
                </p>
              )}

              {/* Pixelbara */}
              <Pixelbara pose={selectedPose} size={200} />

              {/* Bottom text */}
              {bottomText && (
                <p
                  className="absolute bottom-6 left-0 right-0 text-center text-2xl font-bold px-4"
                  style={{
                    color: textColor,
                    textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                  }}
                >
                  {bottomText}
                </p>
              )}

              {/* Watermark */}
              <p
                className="absolute bottom-2 right-2 text-[10px] opacity-50"
                style={{ color: textColor }}
              >
                neun.xyz
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg hover:opacity-80 transition-opacity"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-a24-border dark:border-a24-dark-border hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Pose selection */}
            <div>
              <h3 className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-3">
                Choose Pose
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {POSES.map((pose) => (
                  <button
                    key={pose.id}
                    onClick={() => setSelectedPose(pose.id)}
                    className={`p-2 text-[11px] border transition-all ${
                      selectedPose === pose.id
                        ? 'bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg border-transparent'
                        : 'border-a24-border dark:border-a24-dark-border hover:border-a24-text dark:hover:border-a24-dark-text'
                    }`}
                  >
                    {pose.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background selection */}
            <div>
              <h3 className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-3">
                Background
              </h3>
              <div className="flex flex-wrap gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setSelectedBg(bg.id)}
                    className={`w-10 h-10 border-2 transition-all ${
                      selectedBg === bg.id
                        ? 'border-a24-text dark:border-a24-dark-text scale-110'
                        : 'border-transparent hover:border-a24-muted'
                    }`}
                    style={{ backgroundColor: bg.color }}
                    title={bg.label}
                  />
                ))}
              </div>
            </div>

            {/* Text inputs */}
            <div>
              <h3 className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-3">
                Top Text
              </h3>
              <input
                type="text"
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                placeholder="optional"
                className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
              />
            </div>

            <div>
              <h3 className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-3">
                Bottom Text
              </h3>
              <input
                type="text"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder="enter your text"
                className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
              />
            </div>

            {/* Preset texts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted">
                  Gen Z Presets
                </h3>
                <button
                  onClick={getRandomPreset}
                  className="flex items-center gap-1 text-[11px] text-a24-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Random
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_TEXTS.slice(0, 6).map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (preset.includes('\n')) {
                        const parts = preset.split('\n')
                        setTopText(parts[0])
                        setBottomText(parts[1])
                      } else {
                        setTopText('')
                        setBottomText(preset)
                      }
                    }}
                    className="px-3 py-1.5 text-[11px] bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border hover:border-a24-text dark:hover:border-a24-dark-text transition-colors truncate max-w-[150px]"
                  >
                    {preset.replace('\n', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Share CTA */}
            <div className="p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border">
              <p className="text-sm text-a24-muted dark:text-a24-dark-muted">
                Share your meme and help spread the word about NEUN!
              </p>
              <p className="text-[11px] text-a24-muted/60 dark:text-a24-dark-muted/60 mt-1">
                share and help a fren
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
