/**
 * Korean Job Translation System
 * Translates Korean job postings to English using simple pattern matching
 * For production, integrate with DeepL or Google Translate API
 */

// Comprehensive Korean job terms to English
const KOREAN_JOB_TERMS: Record<string, string> = {
  // Job titles - Core
  '개발자': 'Developer',
  '엔지니어': 'Engineer',
  '프론트엔드': 'Frontend',
  '프론트 엔드': 'Frontend',
  '백엔드': 'Backend',
  '백 엔드': 'Backend',
  '풀스택': 'Full Stack',
  '풀 스택': 'Full Stack',
  '시니어': 'Senior',
  '주니어': 'Junior',
  '리드': 'Lead',
  '팀장': 'Team Lead',
  '매니저': 'Manager',
  '디자이너': 'Designer',
  '프로덕트': 'Product',
  '기획자': 'Product Manager',
  '프로덕트 매니저': 'Product Manager',
  '콘텐츠': 'Content',
  '크리에이터': 'Creator',
  '마켓플레이스': 'Marketplace',
  '데이터': 'Data',
  '분석가': 'Analyst',
  '연구원': 'Researcher',
  '인턴': 'Intern',
  '계약직': 'Contract',
  '정규직': 'Full-time',
  '마케터': 'Marketer',
  '마케팅': 'Marketing',
  '운영': 'Operations',
  '총괄': 'Head',
  '담당자': 'Specialist',
  '코어': 'Core',
  '서비스': 'Service',
  '플랫폼': 'Platform',
  '보안': 'Security',
  '인프라': 'Infrastructure',
  '퍼포먼스': 'Performance',
  '글로벌': 'Global',
  '커뮤니티': 'Community',
  '경영지원': 'Business Support',
  '위험관리': 'Risk Management',
  '가상자산': 'Digital Asset',
  '수탁': 'Custody',

  // Tech terms - Blockchain
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
  '연계': 'Integration',

  // Employment terms
  '경력': '',
  '신입': 'Entry-level',
  '무관': '',
  '우대': 'Preferred',
  '필수': 'Required',
  '자격요건': 'Requirements',
  '우대사항': 'Preferred qualifications',
  '담당업무': 'Responsibilities',
  '근무지': 'Location',
  '재택근무': 'Remote',
  '하이브리드': 'Hybrid',
  '연봉': 'Salary',
  '협의': 'Negotiable',
  '복리후생': 'Benefits',
  '스톡옵션': 'Stock options',
  '상시': '',
  '채용': '',
  '모집': '',

  // Locations
  '서울': 'Seoul',
  '판교': 'Pangyo',
  '강남': 'Gangnam',
  '송파': 'Songpa',
  '성수': 'Seongsu',
  '역삼': 'Yeoksam',
  '구': '',

  // Common phrases
  '년 이상': '+ years',
  '년': 'years',
  '개월': 'months',
  '팀원': 'Team member',
  '협업': 'Collaboration',
  '커뮤니케이션': 'Communication',
  '팀': 'Team',
  '부서': 'Department',

  // Company suffixes
  '주식회사': '',
  '(주)': '',
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

  // Remove any remaining Korean characters and clean up
  translated = translated.replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g, ' ')
  translated = translated.replace(/\s{2,}/g, ' ').trim()
  translated = translated.replace(/^\s*[-–]\s*/, '').trim()
  translated = translated.replace(/\s*[-–]\s*$/, '').trim()

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
