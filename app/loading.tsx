'use client'

import { useState, useEffect } from 'react'
import Pixelbara from './components/Pixelbara'

// Pixel progress bar component
function PixelProgressBar({ progress }: { progress: number }) {
  const totalBlocks = 20
  const filledBlocks = Math.floor((progress / 100) * totalBlocks)

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: totalBlocks }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-4 transition-colors duration-150 ${
            i < filledBlocks
              ? 'bg-emerald-500 dark:bg-emerald-400'
              : 'bg-gray-300 dark:bg-gray-700'
          }`}
          style={{ imageRendering: 'pixelated' }}
        />
      ))}
    </div>
  )
}

// Animated dots
function LoadingDots() {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return <span className="inline-block w-6 text-left">{dots}</span>
}

export default function Loading() {
  const [progress, setProgress] = useState(0)
  const [blink, setBlink] = useState(false)

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 200)
    return () => clearInterval(interval)
  }, [])

  // Blink animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex flex-col items-center justify-center">
      {/* Pixelbara with blink effect */}
      <div className={`transition-opacity duration-100 ${blink ? 'opacity-80' : 'opacity-100'}`}>
        <Pixelbara pose="coffee" size={120} />
      </div>

      {/* Loading text */}
      <p className="mt-6 text-sm text-a24-muted dark:text-a24-dark-muted tracking-wide font-mono">
        loading alpha<LoadingDots />
      </p>

      {/* Pixel progress bar */}
      <div className="mt-4">
        <PixelProgressBar progress={progress} />
      </div>

      {/* Random web3 loading message */}
      <p className="mt-3 text-xs text-a24-muted/60 dark:text-a24-dark-muted/60 font-mono">
        {progress < 30 && 'connecting to blockchain...'}
        {progress >= 30 && progress < 60 && 'fetching on-chain data...'}
        {progress >= 60 && progress < 90 && 'decrypting alpha...'}
        {progress >= 90 && 'almost wagmi...'}
      </p>
    </div>
  )
}
