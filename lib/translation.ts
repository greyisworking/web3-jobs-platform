/**
 * Korean Job Translation System
 * Translates Korean job postings to English using comprehensive pattern matching
 * Ensures 100% English output for the NEUN platform
 */

// ══════════════════════════════════════════════════════════
// Korean company name → English name mapping
// ══════════════════════════════════════════════════════════
const KOREAN_COMPANY_NAMES: Record<string, string> = {
  // Exchanges
  '두나무': 'Dunamu',
  '업비트': 'Upbit',
  '빗썸': 'Bithumb',
  '빗썸코리아': 'Bithumb Korea',
  '코인원': 'Coinone',
  '코빗': 'Korbit',
  // Korean Web3
  '하이퍼리즘': 'Hyperism',
  '케이클원': 'Kaiclone',
  '알에프디코리아': 'RFD Korea',
  '디파이넘버': 'DeFi Number',
  '블록체인랩스': 'Blockchain Labs',
  '안랩블록체인컴퍼니': 'AhnLab Blockchain Company',
  '이노그리드': 'InnoGrid',
  '인피니티익스체인지코리아': 'Infinity Exchange Korea',
  '아이오트러스트': 'IoTrust',
  '아이지에이웍스': 'IGAWorks',
  '엔에프타임': 'nftime',
  '팩트블록': 'FactBlock',
  '아더월드': 'Otherworld',
  '클로인트': 'Kloent',
  '페블': 'Pebble',
  '한국디지털자산수탁': 'Korea Digital Asset Custody',
  '크립토랩': 'CryptoLab',
  '파이랩테크놀로지': 'PiLab Technology',
  '파인더갭': 'FinderGap',
  '오픈에셋': 'OpenAsset',
  '비트블루': 'BitBlue',
  '디라티오': 'DeRatio',
  '스타집': 'Starzip',
  '알로카도스': 'Allocados',
  '크로스앵글': 'CrossAngle',
  '오더바이': 'OrderBy',
  '비하베스트': 'BeHarvest',
  '디플래닛': 'DPlanet',
  '메타스타': 'MetaStar',
  '에이비랩스': 'AB Labs',
  '제이앤더블유랩스': 'J&W Labs',
  '로캘리': 'Locally',
  '천재교육': 'Chunjae Education',
  '에임드': 'Aimed',
  '티피씨인터넷': 'TPC Internet',
  '로똔다': 'Rotonda',
  '리얼월드에셋': 'Real World Asset',
  '엑시리스트': 'Exilist',
  // Korean Tech / VC
  '카카오': 'Kakao',
  '카카오엔터프라이즈': 'Kakao Enterprise',
  '그라운드엑스': 'Ground X',
  '클레이튼': 'Klaytn',
  '라인넥스트': 'LINE NEXT',
  '라인': 'LINE',
  '람다256': 'Lambda256',
  '해시드': 'Hashed',
  '체인파트너스': 'Chain Partners',
  '블로코': 'Blocko',
  '아이콘루프': 'ICONLOOP',
  '아이콘': 'ICON',
  '테라': 'Terra',
  '루니버스': 'Luniverse',
  '오지스': 'Ozys',
  '클립': 'Klip',
  '핑거': 'Finger',
  '헥슬란트': 'Hexlant',
  '미소': 'MISO',
  '삼성에스디에스': 'Samsung SDS',
  '삼성전자': 'Samsung Electronics',
  '네이버클라우드': 'Naver Cloud',
  '네이버': 'Naver',
  '토스': 'Toss',
  '비바리퍼블리카': 'Viva Republica',
  '크래프톤': 'Krafton',
  '넥슨': 'Nexon',
  '엔씨소프트': 'NCSoft',
  '컴투스': 'Com2uS',
  '위메이드': 'WeMade',
  '넷마블': 'Netmarble',
  '스카이마비스': 'Sky Mavis',
  '해치랩스': 'Hatch Labs',
  '수퍼블록': 'SuperBlock',
  '프레스토랩스': 'Presto Labs',
  '티맥스소프트': 'TmaxSoft',
  '한화시스템': 'Hanwha Systems',
  '에이비씨랩스': 'ABC Labs',
  '갤럭시디지털': 'Galaxy Digital',
  '매직에덴': 'Magic Eden',
  '레이어제로': 'LayerZero',
  '제타체인': 'ZetaChain',
  '수이': 'Sui',
  '앱토스': 'Aptos',
  '체인링크': 'Chainlink',
}

// ══════════════════════════════════════════════════════════
// Korean location → English location mapping
// ══════════════════════════════════════════════════════════
const KOREAN_LOCATIONS: Record<string, string> = {
  // Major cities
  '서울특별시': 'Seoul',
  '서울시': 'Seoul',
  '서울': 'Seoul',
  '부산광역시': 'Busan',
  '부산시': 'Busan',
  '부산': 'Busan',
  '대구광역시': 'Daegu',
  '대구': 'Daegu',
  '인천광역시': 'Incheon',
  '인천': 'Incheon',
  '광주광역시': 'Gwangju',
  '광주': 'Gwangju',
  '대전광역시': 'Daejeon',
  '대전': 'Daejeon',
  '울산광역시': 'Ulsan',
  '울산': 'Ulsan',
  '세종특별자치시': 'Sejong',
  '세종시': 'Sejong',
  '세종': 'Sejong',
  // Provinces
  '경기도': 'Gyeonggi',
  '경기': 'Gyeonggi',
  '강원도': 'Gangwon',
  '강원': 'Gangwon',
  '충청북도': 'Chungbuk',
  '충북': 'Chungbuk',
  '충청남도': 'Chungnam',
  '충남': 'Chungnam',
  '전라북도': 'Jeonbuk',
  '전북': 'Jeonbuk',
  '전라남도': 'Jeonnam',
  '전남': 'Jeonnam',
  '경상북도': 'Gyeongbuk',
  '경북': 'Gyeongbuk',
  '경상남도': 'Gyeongnam',
  '경남': 'Gyeongnam',
  '제주특별자치도': 'Jeju',
  '제주도': 'Jeju',
  '제주': 'Jeju',
  // Seoul districts (구)
  '강남구': 'Gangnam',
  '강남': 'Gangnam',
  '서초구': 'Seocho',
  '서초': 'Seocho',
  '송파구': 'Songpa',
  '송파': 'Songpa',
  '마포구': 'Mapo',
  '마포': 'Mapo',
  '영등포구': 'Yeongdeungpo',
  '영등포': 'Yeongdeungpo',
  '성동구': 'Seongdong',
  '성수동': 'Seongsu',
  '성수': 'Seongsu',
  '역삼동': 'Yeoksam',
  '역삼': 'Yeoksam',
  '삼성동': 'Samsung-dong',
  '용산구': 'Yongsan',
  '용산': 'Yongsan',
  '종로구': 'Jongno',
  '종로': 'Jongno',
  '중구': 'Jung-gu',
  '구로구': 'Guro',
  '구로': 'Guro',
  '금천구': 'Geumcheon',
  '금천': 'Geumcheon',
  // Tech hubs
  '판교': 'Pangyo',
  '분당구': 'Bundang',
  '분당': 'Bundang',
  '성남시': 'Seongnam',
  '성남': 'Seongnam',
  '수원시': 'Suwon',
  '수원': 'Suwon',
  '용인시': 'Yongin',
  '용인': 'Yongin',
  '화성시': 'Hwaseong',
  '화성': 'Hwaseong',
  '고양시': 'Goyang',
  '고양': 'Goyang',
  '안양시': 'Anyang',
  '안양': 'Anyang',
  // Country
  '대한민국': 'South Korea',
  '한국': 'South Korea',
}

// ══════════════════════════════════════════════════════════
// JD section header translations
// ══════════════════════════════════════════════════════════
const SECTION_HEADERS: Record<string, string> = {
  '회사소개': 'About Company',
  '회사 소개': 'About Company',
  '기업소개': 'About Company',
  '주요업무': 'Key Responsibilities',
  '주요 업무': 'Key Responsibilities',
  '담당업무': 'Responsibilities',
  '담당 업무': 'Responsibilities',
  '업무내용': 'Job Description',
  '업무 내용': 'Job Description',
  '자격요건': 'Requirements',
  '자격 요건': 'Requirements',
  '지원자격': 'Qualifications',
  '지원 자격': 'Qualifications',
  '필수요건': 'Required Qualifications',
  '필수 요건': 'Required Qualifications',
  '우대사항': 'Preferred Qualifications',
  '우대 사항': 'Preferred Qualifications',
  '혜택 및 복지': 'Benefits & Perks',
  '혜택및복지': 'Benefits & Perks',
  '복리후생': 'Benefits',
  '복리 후생': 'Benefits',
  '채용절차': 'Hiring Process',
  '채용 절차': 'Hiring Process',
  '전형절차': 'Hiring Process',
  '전형 절차': 'Hiring Process',
  '근무조건': 'Work Conditions',
  '근무 조건': 'Work Conditions',
  '근무환경': 'Work Environment',
  '근무 환경': 'Work Environment',
  '기술스택': 'Tech Stack',
  '기술 스택': 'Tech Stack',
  '이런 분을 찾습니다': 'Who We Are Looking For',
  '이런분을 찾습니다': 'Who We Are Looking For',
  '이런 분이면 더 좋습니다': 'Nice to Have',
  '이런분이면 더 좋습니다': 'Nice to Have',
  '합류하면 함께할 업무입니다': 'What You Will Do',
  '합류하면 함께 할 업무입니다': 'What You Will Do',
}

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
  '사업개발': 'Business Development',
  '영업': 'Sales',
  '파트너십': 'Partnership',
  '재무': 'Finance',
  '회계': 'Accounting',
  '인사': 'HR',
  '법무': 'Legal',
  '컴플라이언스': 'Compliance',
  '금융': 'Finance',
  '리서치': 'Research',
  '전략': 'Strategy',
  '솔루션': 'Solutions',
  '아키텍트': 'Architect',
  '테크니컬': 'Technical',
  'QA': 'QA',

  // Tech terms - Blockchain
  '블록체인': 'Blockchain',
  '스마트컨트랙트': 'Smart Contract',
  '스마트 컨트랙트': 'Smart Contract',
  '웹3': 'Web3',
  '디파이': 'DeFi',
  '엔에프티': 'NFT',
  '메타버스': 'Metaverse',
  '토큰': 'Token',
  '토큰이코노미': 'Tokenomics',
  '토큰 이코노미': 'Tokenomics',
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
  '파이썬': 'Python',
  '자바': 'Java',
  '코틀린': 'Kotlin',
  '스위프트': 'Swift',
  '앱': 'App',
  '클라우드': 'Cloud',
  '도커': 'Docker',
  '쿠버네티스': 'Kubernetes',
  '데브옵스': 'DevOps',
  'AI': 'AI',
  '인공지능': 'AI',
  '머신러닝': 'Machine Learning',
  '딥러닝': 'Deep Learning',

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
  '재택': 'Remote',
  '하이브리드': 'Hybrid',
  '연봉': 'Salary',
  '협의': 'Negotiable',
  '면접 후 결정': 'Negotiable after interview',
  '추후 협의': 'To be discussed',
  '복리후생': 'Benefits',
  '스톡옵션': 'Stock options',
  '상시': '',
  '채용': '',
  '모집': '',
  '합격보상금': 'Signing bonus',
  '추천보상금': 'Referral bonus',
  '만원': '0,000 KRW',

  // JD common phrases
  '이런 일을 해요': 'What You Will Do',
  '이런 분을 찾아요': 'Who We Are Looking For',
  '이런 분이면 좋아요': 'Nice to Have',
  '이렇게 일해요': 'How We Work',
  '함께할 업무': 'Your Responsibilities',
  '지원 자격': 'Qualifications',
  '우대 조건': 'Preferred Qualifications',
  '혜택': 'Benefits',

  // Common phrases
  '년 이상': '+ years',
  '년 이하': ' years or less',
  '년차': ' years experience',
  '년': ' years',
  '개월': ' months',
  '팀원': 'Team member',
  '협업': 'Collaboration',
  '커뮤니케이션': 'Communication',
  '팀': 'Team',
  '부서': 'Department',
  '및': 'and',
  '또는': 'or',
  '등': 'etc.',

  // Company suffixes
  '주식회사': '',
  '(주)': '',
}

// Check if text contains Korean characters
export function containsKorean(text: string | null | undefined): boolean {
  if (!text) return false
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text)
}

// Strip remaining Korean characters and clean up whitespace
function stripKorean(text: string): string {
  return text
    .replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Escape special regex characters in a string
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Term-based translation with all dictionaries
export function quickTranslateTerms(text: string | null | undefined): string {
  if (!text || !containsKorean(text)) return text || ''

  let translated = text

  // 1. Section headers first (longest match)
  const sortedHeaders = Object.entries(SECTION_HEADERS).sort(
    (a, b) => b[0].length - a[0].length
  )
  for (const [korean, english] of sortedHeaders) {
    translated = translated.replace(new RegExp(escapeRegExp(korean), 'g'), english)
  }

  // 2. Job terms (sorted by length for longest-match-first)
  const sortedTerms = Object.entries(KOREAN_JOB_TERMS).sort(
    (a, b) => b[0].length - a[0].length
  )
  for (const [korean, english] of sortedTerms) {
    translated = translated.replace(new RegExp(escapeRegExp(korean), 'g'), english)
  }

  // 3. Location names
  const sortedLocations = Object.entries(KOREAN_LOCATIONS).sort(
    (a, b) => b[0].length - a[0].length
  )
  for (const [korean, english] of sortedLocations) {
    translated = translated.replace(new RegExp(escapeRegExp(korean), 'g'), english)
  }

  return translated
}

/**
 * Translate Korean company name to English.
 * Checks known company name dictionary first, then falls back to
 * removing legal suffixes and stripping remaining Korean chars.
 */
export function translateCompanyName(name: string): string {
  if (!name || !containsKorean(name)) return name

  // Remove legal suffixes first
  let cleaned = name.trim()
  cleaned = cleaned.replace(/^\s*\(주\)\s*/g, '')
  cleaned = cleaned.replace(/\s*\(주\)\s*$/g, '')
  cleaned = cleaned.replace(/^\s*주식회사\s*/g, '')
  cleaned = cleaned.replace(/\s*주식회사\s*$/g, '')

  // Handle pattern: "한글이름(EnglishName)" → extract English from parentheses
  const parenEnglishMatch = cleaned.match(/^[^(]+\(([A-Za-z0-9][\w\s.&-]*)\)$/)
  if (parenEnglishMatch) {
    const koreanPart = cleaned.replace(/\(.*\)$/, '').trim()
    const englishPart = parenEnglishMatch[1].trim()
    // Check dictionary for the Korean part first
    if (KOREAN_COMPANY_NAMES[koreanPart]) {
      return KOREAN_COMPANY_NAMES[koreanPart]
    }
    // Otherwise use the parenthesized English name
    return englishPart
  }

  // Check exact match in dictionary
  if (KOREAN_COMPANY_NAMES[cleaned]) {
    return KOREAN_COMPANY_NAMES[cleaned]
  }

  // Check if original (with suffix) matches
  if (KOREAN_COMPANY_NAMES[name.trim()]) {
    return KOREAN_COMPANY_NAMES[name.trim()]
  }

  // Try partial match - longest key first for best specificity
  const sortedCompanies = Object.entries(KOREAN_COMPANY_NAMES).sort(
    (a, b) => b[0].length - a[0].length
  )
  for (const [korean, english] of sortedCompanies) {
    if (cleaned.includes(korean)) {
      return english
    }
  }

  // Fall back: apply term translations, then strip remaining Korean
  let translated = quickTranslateTerms(cleaned)
  translated = stripKorean(translated)

  return translated.length > 0 ? translated : name
}

/**
 * Translate Korean location string to English.
 * Handles composite locations like "서울특별시 강남구" → "Gangnam, Seoul"
 */
export function translateLocation(location: string): string {
  if (!location || !containsKorean(location)) return location

  // Sort location entries by length (longest first) for best matching
  const sortedLocations = Object.entries(KOREAN_LOCATIONS).sort(
    (a, b) => b[0].length - a[0].length
  )

  // Collect matched English parts
  const parts: string[] = []
  let remaining = location

  for (const [korean, english] of sortedLocations) {
    if (remaining.includes(korean)) {
      if (!parts.includes(english)) {
        parts.push(english)
      }
      remaining = remaining.replace(new RegExp(korean, 'g'), '')
    }
  }

  if (parts.length > 0) {
    // Reverse so district comes before city (e.g., "Gangnam, Seoul")
    // But only if we have both district and city level
    if (parts.length >= 2) {
      return parts.reverse().join(', ')
    }
    return parts[0]
  }

  // Fallback: term-based translation + strip Korean
  let translated = quickTranslateTerms(location)
  translated = stripKorean(translated)
  return translated.length > 0 ? translated : 'South Korea'
}

/**
 * Translate Korean tags to English equivalents.
 */
export function translateTags(tags: string[]): string[] {
  const TAG_MAP: Record<string, string> = {
    '블록체인': 'Blockchain',
    '가상자산': 'Digital Asset',
    '크립토': 'Crypto',
    '디파이': 'DeFi',
    '엔에프티': 'NFT',
    '메타버스': 'Metaverse',
    '웹3': 'Web3',
    '인공지능': 'AI',
    '머신러닝': 'Machine Learning',
    '딥러닝': 'Deep Learning',
    '프론트엔드': 'Frontend',
    '백엔드': 'Backend',
    '풀스택': 'Full Stack',
    '데이터': 'Data',
    '클라우드': 'Cloud',
    '데브옵스': 'DevOps',
    '보안': 'Security',
    '솔리디티': 'Solidity',
    '스마트컨트랙트': 'Smart Contract',
    '금융': 'Finance',
  }

  return tags.map(tag => {
    if (TAG_MAP[tag]) return TAG_MAP[tag]
    if (containsKorean(tag)) {
      let translated = quickTranslateTerms(tag)
      translated = stripKorean(translated)
      return translated.length > 0 ? translated : tag
    }
    return tag
  })
}

/**
 * Translate Korean salary string to English.
 * e.g., "합격보상금 100만원" → "Signing bonus ₩1,000,000"
 * e.g., "4000-6000" (만원) → "$30K-$45K" or "₩40M-₩60M"
 */
export function translateSalary(salary: string | null | undefined): string | null {
  if (!salary) return null
  if (!containsKorean(salary)) return salary

  let translated = salary

  // Replace Korean salary terms
  translated = translated.replace(/합격\s*보상금/g, 'Signing bonus')
  translated = translated.replace(/추천\s*보상금/g, 'Referral bonus')
  translated = translated.replace(/연봉/g, 'Annual salary')
  translated = translated.replace(/월급/g, 'Monthly salary')
  translated = translated.replace(/시급/g, 'Hourly rate')
  translated = translated.replace(/협의/g, 'Negotiable')
  translated = translated.replace(/면접\s*후\s*결정/g, 'Negotiable after interview')
  translated = translated.replace(/추후\s*협의/g, 'To be discussed')

  // Convert 억 + 만원 amounts: "1억 2,000만원" → "₩120,000,000"
  translated = translated.replace(/([\d,]+)\s*억\s*([\d,]+)\s*만\s*원/g, (_match, eok, man) => {
    const eokNum = parseInt(eok.replace(/,/g, '')) * 100000000
    const manNum = parseInt(man.replace(/,/g, '')) * 10000
    return `₩${(eokNum + manNum).toLocaleString()}`
  })

  // Convert standalone 억원: "1억원" → "₩100,000,000"
  translated = translated.replace(/([\d,]+)\s*억\s*원/g, (_match, eok) => {
    const amount = parseInt(eok.replace(/,/g, '')) * 100000000
    return `₩${amount.toLocaleString()}`
  })

  // Convert 만원 amounts: "4,500만원" → "₩45,000,000"
  translated = translated.replace(/([\d,]+)\s*만\s*원/g, (_match, num) => {
    const amount = parseInt(num.replace(/,/g, '')) * 10000
    return `₩${amount.toLocaleString()}`
  })

  // Strip any remaining Korean
  translated = stripKorean(translated)

  return translated.length > 0 ? translated : null
}

// Translate job title (best effort)
export function translateJobTitle(title: string): string {
  if (!containsKorean(title)) return title

  let translated = quickTranslateTerms(title)

  // Remove any remaining Korean characters and clean up
  translated = stripKorean(translated)
  translated = translated.replace(/^\s*[-–]\s*/, '').trim()
  translated = translated.replace(/\s*[-–]\s*$/, '').trim()

  return translated
}

/**
 * Fully translate a job description field to English.
 * Applies section headers, term translation, and strips remaining Korean.
 */
export function translateFullField(text: string | null | undefined): string | null {
  if (!text) return null
  if (!containsKorean(text)) return text

  let translated = quickTranslateTerms(text)
  translated = stripKorean(translated)

  return translated.length > 0 ? translated : null
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

  const translated = translateFullField(description) || description

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
export async function translateWithAPI(
  text: string,
  targetLang: 'en' | 'ko' = 'en'
): Promise<string> {
  if (targetLang === 'en' && containsKorean(text)) {
    return translateFullField(text) || text
  }
  return text
}
