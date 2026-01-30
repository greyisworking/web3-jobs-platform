'use client'

import { useEffect, useState } from 'react'

const VC_LOGOS = [
  'a16z',
  'Paradigm',
  'Hashed',
  'Sequoia',
  'Dragonfly',
  'Polychain',
  'SoftBank',
  'Animoca',
  'Binance',
  'Electric Capital',
  'Pantera',
  'Galaxy Digital',
]

interface SocialProofData {
  vcBackedJobCount: number
  uniqueVCCount: number
}

export default function SocialProof() {
  const [data, setData] = useState<SocialProofData | null>(null)
  const [isPaused, setIsPaused] = useState(false)

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

      {/* CSS-based Marquee Animation */}
      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex gap-8 whitespace-nowrap ${isPaused ? '' : 'vc-marquee'}`}
          style={{ width: 'fit-content' }}
        >
          {/* First set */}
          {VC_LOGOS.map((name) => (
            <span
              key={`first-${name}`}
              className="flex-shrink-0 text-sm font-bold uppercase tracking-wider text-neun-primary hover:text-neun-primary-hover transition-colors cursor-default"
            >
              {name}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {VC_LOGOS.map((name) => (
            <span
              key={`second-${name}`}
              className="flex-shrink-0 text-sm font-bold uppercase tracking-wider text-neun-primary hover:text-neun-primary-hover transition-colors cursor-default"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
