/**
 * Job Decay 스타일 계산기
 * 게시일 기준으로 시간이 지남에 따라 카드의 투명도/회색조를 적용
 */

interface DecayStyles {
  opacity: number
  grayscale: number
  decayLevel: number
}

/**
 * 게시일 기준으로 시각적 감쇄(decay) 스타일을 반환
 *
 * 감쇄 곡선:
 * - 0~7일: decay 0 (완전히 선명)
 * - 7~30일: decay 0~0.5 (점진적 퇴색)
 * - 30~90일: decay 0.5~1.0 (강한 퇴색)
 * - 90일 이상: decay 1.0 (최대 퇴색)
 *
 * opacity: 1 - decayLevel * 0.6 (범위: 1.0 → 0.4)
 * grayscale: decayLevel * 0.6 (범위: 0 → 0.6)
 */
export function getDecayStyles(postedDate: Date | string | null): DecayStyles {
  // 게시일이 없으면 감쇄 없음
  if (!postedDate) {
    return { opacity: 1, grayscale: 0, decayLevel: 0 }
  }

  const posted = typeof postedDate === 'string' ? new Date(postedDate) : postedDate
  const now = new Date()
  const diffMs = now.getTime() - posted.getTime()
  // 밀리초를 일 단위로 변환
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  let decayLevel: number

  if (diffDays <= 7) {
    // 7일 이내: 감쇄 없음
    decayLevel = 0
  } else if (diffDays <= 30) {
    // 7~30일: 선형 보간으로 0 → 0.5
    decayLevel = ((diffDays - 7) / (30 - 7)) * 0.5
  } else if (diffDays <= 90) {
    // 30~90일: 선형 보간으로 0.5 → 1.0
    decayLevel = 0.5 + ((diffDays - 30) / (90 - 30)) * 0.5
  } else {
    // 90일 초과: 최대 감쇄
    decayLevel = 1.0
  }

  return {
    opacity: 1 - decayLevel * 0.6,
    grayscale: decayLevel * 0.6,
    decayLevel,
  }
}
