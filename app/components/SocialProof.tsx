'use client'

import { useEffect, useState, useRef } from 'react'

const VC_LOGOS = [
  { name: 'a16z', color: '#22C55E' },
  { name: 'Paradigm', color: '#22C55E' },
  { name: 'Hashed', color: '#22C55E' },
  { name: 'Sequoia', color: '#22C55E' },
  { name: 'Dragonfly', color: '#22C55E' },
  { name: 'Polychain', color: '#22C55E' },
  { name: 'SoftBank', color: '#22C55E' },
  { name: 'Animoca', color: '#22C55E' },
  { name: 'Binance', color: '#22C55E' },
  { name: 'Electric Capital', color: '#22C55E' },
  { name: 'Pantera', color: '#22C55E' },
  { name: 'Galaxy Digital', color: '#22C55E' },
]

interface SocialProofData {
  vcBackedJobCount: number
  uniqueVCCount: number
}

export default function SocialProof() {
  const [data, setData] = useState<SocialProofData | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((json) => {
        const jobs = json.jobs ?? []
        const vcTeams = new Set<string>()
        let vcJobCount = 0

        for (const job of jobs) {
          if (job.backers && job.backers.length > 0) {
            vcJobCount++
            for (const backer of job.backers) {
              vcTeams.add(backer)
            }
          }
        }

        setData({
          vcBackedJobCount: vcJobCount,
          uniqueVCCount: vcTeams.size,
        })
      })
      .catch(() => {})
  }, [])

  // Auto-scroll marquee
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let animationId: number
    let scrollPos = 0

    const scroll = () => {
      scrollPos += 0.5
      if (scrollPos >= el.scrollWidth / 2) {
        scrollPos = 0
      }
      el.scrollLeft = scrollPos
      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className="py-8 border-t border-b border-a24-border dark:border-a24-dark-border overflow-hidden">
      <p className="text-center text-xs uppercase tracking-[0.3em] font-medium text-a24-muted dark:text-a24-dark-muted mb-4">
        Backed by Tier 1 VCs
        {data && data.vcBackedJobCount > 0 && (
          <span className="ml-3 font-light opacity-60">
            — {data.vcBackedJobCount} open roles
          </span>
        )}
      </p>

      {/* Marquee slider */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-hidden whitespace-nowrap"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Duplicate for seamless loop */}
        {[...VC_LOGOS, ...VC_LOGOS].map((vc, i) => (
          <span
            key={`${vc.name}-${i}`}
            className="flex-shrink-0 text-sm font-bold uppercase tracking-wider text-emerald-500"
          >
            {vc.name}
          </span>
        ))}
      </div>
    </div>
  )
}
