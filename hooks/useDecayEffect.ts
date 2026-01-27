'use client'

import { useMemo } from 'react'

type Freshness = 'Fresh' | 'Recent' | 'Aging' | 'Old' | 'Stale' | 'Expired'

interface DecayEffect {
  opacity: number
  blur: number
  grayscale: number
  isFading: boolean
  daysOld: number
  freshness: Freshness
  /** 호버 시 완전 선명 스타일 복원용 */
  hoverResetStyles: React.CSSProperties
  /** 페이딩 중이면 "마감 임박 기회" 툴팁 텍스트 */
  tooltipText: string | null
}

/**
 * 6단계 시각적 감쇄 훅
 *
 * 단계별 감쇄:
 * - 0~7일:   Fresh   — 완전 선명
 * - 7~14일:  Recent  — 미세 퇴색
 * - 14~30일: Aging   — 눈에 띄는 퇴색
 * - 30~60일: Old     — 강한 퇴색
 * - 60~90일: Stale   — 매우 강한 퇴색
 * - 90일+:   Expired — 최대 퇴색
 */
export function useDecayEffect(postedDate: Date | string | null): DecayEffect {
  return useMemo(() => {
    if (!postedDate) {
      return {
        opacity: 1,
        blur: 0,
        grayscale: 0,
        isFading: false,
        daysOld: 0,
        freshness: 'Fresh' as Freshness,
        hoverResetStyles: {},
        tooltipText: null,
      }
    }

    const posted = typeof postedDate === 'string' ? new Date(postedDate) : postedDate
    const now = new Date()
    const diffMs = now.getTime() - posted.getTime()
    const daysOld = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

    let opacity: number
    let blur: number
    let grayscale: number
    let freshness: Freshness

    if (daysOld <= 7) {
      freshness = 'Fresh'
      opacity = 1
      blur = 0
      grayscale = 0
    } else if (daysOld <= 14) {
      freshness = 'Recent'
      const t = (daysOld - 7) / 7
      opacity = 1 - t * 0.1
      blur = t * 0.5
      grayscale = t * 0.1
    } else if (daysOld <= 30) {
      freshness = 'Aging'
      const t = (daysOld - 14) / 16
      opacity = 0.9 - t * 0.15
      blur = 0.5 + t * 0.5
      grayscale = 0.1 + t * 0.15
    } else if (daysOld <= 60) {
      freshness = 'Old'
      const t = (daysOld - 30) / 30
      opacity = 0.75 - t * 0.15
      blur = 1 + t * 0.5
      grayscale = 0.25 + t * 0.15
    } else if (daysOld <= 90) {
      freshness = 'Stale'
      const t = (daysOld - 60) / 30
      opacity = 0.6 - t * 0.1
      blur = 1.5 + t * 0.5
      grayscale = 0.4 + t * 0.1
    } else {
      freshness = 'Expired'
      opacity = 0.4
      blur = 2
      grayscale = 0.6
    }

    const isFading = daysOld > 7

    return {
      opacity,
      blur,
      grayscale,
      isFading,
      daysOld,
      freshness,
      hoverResetStyles: {
        opacity: 1,
        filter: 'blur(0px) grayscale(0)',
      },
      tooltipText: isFading ? '마감 임박 기회' : null,
    }
  }, [postedDate])
}
