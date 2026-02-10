/**
 * Aggressive job title cleaning for Korean & English job postings.
 *
 * Cleaning priority (applied in order):
 * 1. Cut at first bracket or concatenated Korean metadata
 * 2. Remove [팀명], 【팀명】 brackets
 * 3. Remove company name prefix from title
 * 4. Remove "채용", "모집", "구인" patterns
 * 5. Remove location suffixes (, Korea / , Seoul / etc.)
 * 6. Remove work type suffixes ((Remote), (Hybrid), etc.)
 * 7. Remove trailing experience/period metadata
 * 8. Final whitespace cleanup
 */

const KOREAN_CITIES = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  '판교', '분당', '성남', '수원', '용인', '화성', '고양', '안양',
]

export function cleanJobTitle(raw: string, companyName?: string): string {
  if (!raw) return raw

  let title = raw.trim()

  // ── Step 1: Aggressive cut for concatenated mess ──
  // E.g. "브랜드 마케터 [마케팅팀]서울 송파구경력 5년 이상상시"
  // Cut at first [ or 【 that is followed by Korean text (team/dept bracket)
  const bracketCutMatch = title.match(/^(.+?)\s*[[\[【].*?[팀부본사업실센터].*?[\]】\]]/)
  if (bracketCutMatch) {
    const afterBracket = title.slice(bracketCutMatch[0].length)
    // If what follows the bracket is location/metadata, just keep pre-bracket part
    if (!afterBracket || /^[\s]*(?:서울|경기|판교|부산|대구|대전|인천|경력|신입|상시|수시)/.test(afterBracket)) {
      title = bracketCutMatch[1].trim()
    }
  }

  // Cut at Korean city name when followed by metadata (for concatenated strings)
  for (const city of KOREAN_CITIES) {
    const idx = title.indexOf(city)
    if (idx > 0) {
      const rest = title.slice(idx)
      if (/(?:구|시|군|동|경력|년|이상|이하|상시|마감|수시|신입|무관|협의)/.test(rest)) {
        title = title.slice(0, idx).trim()
        break
      }
    }
  }

  // Cut at 경력, 신입, 상시 when they appear as standalone suffixes
  title = title.replace(/\s*경력\s*(?:\d+\s*년?\s*(?:이상|이하)?|무관)?\s*$/, '')
  title = title.replace(/\s*(?:신입\/?경력|신입)\s*$/, '')
  title = title.replace(/\s*(?:상시|수시|채용시\s*마감)\s*$/, '')

  // ── Step 2: Remove ALL bracket content (team/dept names) ──
  // [AI기술팀], [플랫폼개발팀], 【마케팅본부】, etc.
  title = title.replace(/\s*[[\[【][^\]】\]]*[\]】\]]\s*/g, ' ')

  // ── Step 3: Remove company name prefix from title ──
  if (companyName) {
    const cleanCompany = cleanCompanyName(companyName)
    // Remove patterns: [Company], (Company), Company:, Company -, 【Company】
    const escaped = escapeRegex(cleanCompany)
    title = title.replace(new RegExp(`^\\s*[\\[\\(【]?${escaped}[\\]\\)】]?\\s*[:\\-]?\\s*`, 'i'), '')
    // Also try with the raw company name
    const escapedRaw = escapeRegex(companyName)
    title = title.replace(new RegExp(`^\\s*[\\[\\(【]?${escapedRaw}[\\]\\)】]?\\s*[:\\-]?\\s*`, 'i'), '')
  }

  // ── Step 4: Remove 채용/모집/구인 patterns ──
  title = title.replace(/\s*(?:정규직\s*)?(?:채용|모집|구인|인재채용|인재\s*모집)\s*$/g, '')
  title = title.replace(/^\s*(?:정규직\s*)?(?:채용|모집|구인|인재채용)\s*/g, '')

  // ── Step 5: Remove location suffixes ──
  // English: ", Korea", ", South Korea", ", Seoul", "- Korea", etc.
  title = title.replace(/\s*[,\-]\s*(?:South\s+)?Korea\s*$/i, '')
  title = title.replace(/\s*[,\-]\s*Seoul\s*$/i, '')
  title = title.replace(/\s*[,\-]\s*(?:Singapore|Japan|Tokyo|Hong Kong|Remote)\s*$/i, '')
  // Korean: ", 한국", ", 서울", ", 경기", etc.
  title = title.replace(/\s*[,\-]\s*(?:한국|대한민국)\s*$/g, '')
  for (const city of KOREAN_CITIES) {
    title = title.replace(new RegExp(`\\s*[,\\-]\\s*${city}\\s*$`, 'g'), '')
  }
  // Parenthesized: (Korea), (Seoul), (한국), (서울)
  title = title.replace(/\s*\(\s*(?:South\s+)?Korea\s*\)\s*$/i, '')
  title = title.replace(/\s*\(\s*Seoul\s*\)\s*$/i, '')
  title = title.replace(/\s*\(\s*(?:한국|서울|경기|판교)\s*\)\s*$/g, '')

  // ── Step 6: Remove work type suffixes ──
  title = title.replace(/\s*\(\s*(?:Remote|Hybrid|Onsite|On-site|원격|재택|하이브리드)\s*\)\s*$/ig, '')
  title = title.replace(/\s*[,\-]\s*(?:Remote|Hybrid)\s*$/i, '')
  // Remove "100% remote", "(US)", country codes
  title = title.replace(/\s*\(\s*(?:100%\s*)?(?:Remote|US|USA|UK|EU|APAC|EMEA|LATAM|Global)\s*\)\s*$/ig, '')
  title = title.replace(/\s*-\s*(?:100%\s*)?Remote\s*$/i, '')

  // ── Step 6.5: Remove tech stack / location suffixes ──
  // "-Rust/Go", "-Web3 Space at bondex", "- Crypto"
  title = title.replace(/\s*-\s*(?:Rust|Go|Python|TypeScript|Solidity|Node\.?js)(?:\/\w+)*\s*$/i, '')
  title = title.replace(/\s*-\s*Web3\s+(?:Space\s+)?(?:at\s+\w+)?\s*$/i, '')
  title = title.replace(/\s*-\s*(?:Crypto|Web3|Blockchain|DeFi|NFT)\s*$/i, '')

  // ── Step 6.6: Remove "Web3", "Crypto" as trailing keywords ──
  title = title.replace(/\s*[,\-]\s*(?:Web3|Crypto|Blockchain)\s*$/i, '')
  title = title.replace(/\s+(?:Web3|Crypto)\s*$/i, '')

  // ── Step 6.7: Remove Korean duplicate explanations in parentheses ──
  // (위험관리부서), (마케팅팀), (개발팀) etc.
  title = title.replace(/\s*\([^)]*(?:부서|팀|본부|사업부|센터|실)\)\s*$/g, '')

  // ── Step 7: Remove trailing parenthesized experience ──
  title = title.replace(/\s*\((?:신입\/?경력|경력\s*(?:무관|\d+\s*년?\s*(?:이상)?)|신입)\)\s*$/g, '')

  // ── Step 8: Final cleanup ──
  title = title.replace(/\s{2,}/g, ' ').trim()
  title = title.replace(/[\s\-·,/]+$/, '').trim()
  title = title.replace(/^[\s\-·,/]+/, '').trim()

  // ── Step 9: Title case common job words ──
  // "FE developer" → "FE Developer", "backend engineer" → "Backend Engineer"
  const TITLE_CASE_WORDS = [
    'developer', 'engineer', 'designer', 'manager', 'lead', 'architect',
    'analyst', 'specialist', 'director', 'consultant', 'coordinator',
    'administrator', 'associate', 'officer', 'executive', 'intern',
    'senior', 'junior', 'staff', 'principal', 'head', 'chief', 'vp',
  ]
  for (const word of TITLE_CASE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    title = title.replace(regex, (match) => {
      // Preserve all-caps (like "VP", "CEO")
      if (match === match.toUpperCase() && match.length <= 3) return match
      return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
    })
  }

  return title.length > 0 ? title : raw
}

/**
 * Clean company name by removing legal entity suffixes.
 *
 * Examples:
 *   "(주)핑거"       → "핑거"
 *   "주식회사 카카오"  → "카카오"
 *   "Acme Inc."      → "Acme"
 */
export function cleanCompanyName(raw: string): string {
  if (!raw) return raw

  let name = raw.trim()

  // Korean legal suffixes
  name = name.replace(/^\s*\(주\)\s*/g, '')
  name = name.replace(/\s*\(주\)\s*$/g, '')
  name = name.replace(/^\s*\(주식회사\)\s*/g, '')
  name = name.replace(/\s*\(주식회사\)\s*$/g, '')
  name = name.replace(/^\s*주식회사\s*/g, '')
  name = name.replace(/\s*주식회사\s*$/g, '')

  // English legal suffixes
  name = name.replace(/\s*,?\s*(?:Inc\.?|Corp\.?|Ltd\.?|Co\.?\s*,?\s*Ltd\.?|LLC|L\.L\.C\.?|PLC|Pte\.?\s*Ltd\.?|GmbH|AG|S\.A\.?|B\.V\.?)\s*$/i, '')

  // Clean up
  name = name.replace(/\s{2,}/g, ' ').trim()
  name = name.replace(/[\s\-·,]+$/, '').trim()

  return name.length > 0 ? name : raw
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
