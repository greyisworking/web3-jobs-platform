'use client'

import { useEffect, useState } from 'react'

const TIER1_VCS = [
  'a16z', 'Hashed', 'Paradigm', 'Sequoia', 'Dragonfly',
  'Polychain', 'Pantera', 'SoftBank', 'Animoca', 'Binance',
  'Electric Capital', 'Galaxy Digital',
]

interface SocialProofData {
  vcBackedJobCount: number
  uniqueVCCount: number
}

export default function SocialProof() {
  const [data, setData] = useState<SocialProofData | null>(null)
  const [showVCs, setShowVCs] = useState(false)

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
    <div className="py-8 border-t border-b border-a24-border dark:border-a24-dark-border">
      <div
        className="text-center relative"
        onMouseEnter={() => setShowVCs(true)}
        onMouseLeave={() => setShowVCs(false)}
      >
        <p className="text-xs uppercase tracking-[0.3em] font-medium text-a24-muted dark:text-a24-dark-muted cursor-default">
          Backed by Tier 1 VCs
          {data && data.vcBackedJobCount > 0 && (
            <span className="ml-3 font-light opacity-60">
              — {data.vcBackedJobCount} open roles
            </span>
          )}
        </p>

        {/* Hover: VC names */}
        {showVCs && (
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 animate-in fade-in duration-200">
            {TIER1_VCS.map((vc) => (
              <span
                key={vc}
                className="text-[10px] uppercase tracking-[0.2em] font-light text-a24-muted/50 dark:text-a24-dark-muted/50"
              >
                {vc}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
