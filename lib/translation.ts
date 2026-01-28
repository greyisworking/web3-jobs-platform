/**
 * Korean Job Translation System
 * Translates Korean job postings to English using simple pattern matching
 * For production, integrate with DeepL or Google Translate API
 */

// Common Korean job terms to English
const KOREAN_JOB_TERMS: Record<string, string> = {
  // Job titles
  '개발자': 'Developer',
  '엔지니어': 'Engineer',
  '프론트엔드': 'Frontend',
  '백엔드': 'Backend',
  '풀스택': 'Full Stack',
  '시니어': 'Senior',
  '주니어': 'Junior',
  '리드': 'Lead',
  '매니저': 'Manager',
  '디자이너': 'Designer',
  '기획자': 'Product Manager',
  'PM': 'Product Manager',
  '데이터': 'Data',
  '분석가': 'Analyst',
  '연구원': 'Researcher',
  '인턴': 'Intern',
  '계약직': 'Contract',
  '정규직': 'Full-time',

  // Tech terms
  '블록체인': 'Blockchain',
  '스마트컨트랙트': 'Smart Contract',
  '스마트 컨트랙트': 'Smart Contract',
  '웹3': 'Web3',
  '디파이': 'DeFi',
  '엔에프티': 'NFT',
  '메타버스': 'Metaverse',
  '토큰': 'Token',
  '지갑': 'Wallet',
  '노드': 'Node',
  '프로토콜': 'Protocol',
  '레이어': 'Layer',
  '체인': 'Chain',
  '컨센서스': 'Consensus',
  '검증자': 'Validator',
  '솔리디티': 'Solidity',
  '러스트': 'Rust',
  '고랭': 'Golang',
  '타입스크립트': 'TypeScript',
  '자바스크립트': 'JavaScript',
  '리액트': 'React',
  '넥스트': 'Next.js',

  // Employment terms
  '경력': 'Experience',
  '신입': 'Entry-level',
  '무관': 'Not required',
  '우대': 'Preferred',
  '필수': 'Required',
  '자격요건': 'Requirements',
  '우대사항': 'Preferred qualifications',
  '담당업무': 'Responsibilities',
  '근무지': 'Location',
  '서울': 'Seoul',
  '판교': 'Pangyo',
  '강남': 'Gangnam',
  '재택근무': 'Remote',
  '하이브리드': 'Hybrid',
  '연봉': 'Salary',
  '협의': 'Negotiable',
  '복리후생': 'Benefits',
  '스톡옵션': 'Stock options',

  // Common phrases
  '~년 이상': '+ years',
  '년 이상': '+ years',
  '개월': 'months',
  '팀원': 'Team member',
  '협업': 'Collaboration',
  '커뮤니케이션': 'Communication',
}

// Check if text contains Korean characters
export function containsKorean(text: string): boolean {
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text)
}

// Simple term-based translation (for display purposes)
export function quickTranslateTerms(text: string): string {
  if (!containsKorean(text)) return text

  let translated = text

  // Sort by length (longer terms first) to avoid partial replacements
  const sortedTerms = Object.entries(KOREAN_JOB_TERMS).sort(
    (a, b) => b[0].length - a[0].length
  )

  for (const [korean, english] of sortedTerms) {
    translated = translated.replace(new RegExp(korean, 'g'), english)
  }

  return translated
}

// Translate job title (best effort)
export function translateJobTitle(title: string): string {
  if (!containsKorean(title)) return title

  let translated = quickTranslateTerms(title)

  // Clean up any remaining Korean if possible
  // In production, send to translation API

  return translated
}

// Translate job description sections
export function translateJobDescription(description: string): {
  original: string
  translated: string
  isKorean: boolean
} {
  const isKorean = containsKorean(description)

  if (!isKorean) {
    return { original: description, translated: description, isKorean: false }
  }

  // Basic translation using term replacement
  const translated = quickTranslateTerms(description)

  return { original: description, translated, isKorean: true }
}

// Get language indicator
export function getLanguageIndicator(text: string): 'ko' | 'en' | 'mixed' {
  const hasKorean = containsKorean(text)
  const hasEnglish = /[a-zA-Z]/.test(text)

  if (hasKorean && hasEnglish) return 'mixed'
  if (hasKorean) return 'ko'
  return 'en'
}

// Translation status for job cards
export interface TranslationStatus {
  isKorean: boolean
  needsTranslation: boolean
  translatedTitle?: string
}

export function getTranslationStatus(
  title: string,
  description?: string
): TranslationStatus {
  const titleIsKorean = containsKorean(title)
  const descIsKorean = description ? containsKorean(description) : false
  const needsTranslation = titleIsKorean || descIsKorean

  return {
    isKorean: titleIsKorean,
    needsTranslation,
    translatedTitle: titleIsKorean ? translateJobTitle(title) : undefined,
  }
}

// API-based translation (placeholder for production)
// In production, implement with DeepL or Google Cloud Translation
export async function translateWithAPI(
  text: string,
  targetLang: 'en' | 'ko' = 'en'
): Promise<string> {
  // Placeholder - return quick translation for now
  if (targetLang === 'en' && containsKorean(text)) {
    return quickTranslateTerms(text)
  }
  return text
}
