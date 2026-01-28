/**
 * Clean Korean job titles that have location, experience, and period
 * info concatenated into the title string.
 *
 * Examples:
 *   "데이터 분석가 [AI기술팀]서울 송파구경력 3년 이상상시"
 *     → "데이터 분석가 [AI기술팀]"
 *
 *   "프론트엔드 개발자 서울 강남구 경력 5년"
 *     → "프론트엔드 개발자"
 *
 *   "마케팅 매니저(신입/경력)"
 *     → "마케팅 매니저"
 */

const KOREAN_CITIES = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  '판교', '분당', '성남', '수원', '용인', '화성', '고양', '안양',
]

// Build a regex that matches city names (used as boundary for metadata)
const cityPattern = new RegExp(`(?:${KOREAN_CITIES.join('|')})`)

export function cleanJobTitle(raw: string): string {
  if (!raw) return raw

  let title = raw

  // 1) If a Korean city name appears and is followed by metadata keywords,
  //    remove from the city name to the end of the string.
  for (const city of KOREAN_CITIES) {
    const idx = title.indexOf(city)
    if (idx > 0) {
      const rest = title.slice(idx)
      // Only strip if the rest contains metadata-like content
      if (/(?:구|시|군|동|경력|년|이상|이하|상시|마감|수시|신입|무관|협의)/.test(rest)) {
        title = title.slice(0, idx).trim()
        break
      }
    }
  }

  // 2) Remove trailing parenthesized experience/employment type
  title = title.replace(/\s*\((?:신입\/?경력|경력\s*(?:무관|\d+\s*년?\s*(?:이상)?)|신입)\)\s*$/g, '')

  // 3) Remove standalone trailing experience/period text
  title = title.replace(/\s+(?:경력\s*(?:무관|\d+\s*년?\s*(?:이상|이하)?))\s*$/g, '')
  title = title.replace(/\s+(?:신입\/?경력|신입)\s*$/g, '')
  title = title.replace(/\s+(?:상시|수시|채용시\s*마감)\s*$/g, '')

  // 4) Clean up whitespace and trailing punctuation
  title = title.replace(/\s{2,}/g, ' ').trim()
  title = title.replace(/[\s\-·,]+$/, '').trim()

  // Fallback to original if we over-cleaned
  return title.length > 0 ? title : raw
}
