import Anthropic from '@anthropic-ai/sdk'

export interface ParsedQuery {
  roleKeyword: string | null
  remote: boolean | null
  other: string | null
}

// ── 한글→영문 매핑 테이블 ──────────────────────────────────────────────────

const KO_EN_MAP: Record<string, string> = {
  // 직무
  '커뮤니티': 'community',
  '매니저': 'manager',
  '개발자': 'developer',
  '엔지니어': 'engineer',
  '디자이너': 'designer',
  '마케팅': 'marketing',
  '프론트엔드': 'frontend',
  '프론트': 'frontend',
  '백엔드': 'backend',
  '백': 'backend',
  '풀스택': 'fullstack',
  '데브옵스': 'devops',
  '데이터': 'data',
  '리서치': 'research',
  '리서처': 'research',
  '그로스': 'growth',
  '세일즈': 'sales',
  '영업': 'sales',
  'BD': 'business development',
  '사업개발': 'business development',
  'PM': 'product manager',
  '프로덕트매니저': 'product manager',
  '오퍼레이션': 'operations',
  '운영': 'operations',
  '분석가': 'analyst',
  '기획자': 'product',
  '보안': 'security',
  '인프라': 'infrastructure',
  '디파이': 'defi',
  '솔리디티': 'solidity',
  '러스트': 'rust',
  '블록체인': 'blockchain',
  // remote 키워드 (제거용 — remote 플래그로 처리)
  '리모트': '',
  '원격': '',
  '재택': '',
}

// 불용어 (검색에 불필요한 단어)
const STOPWORDS = new Set([
  '공고', '구함', '있어', '보여줘', '찾아줘', '자리', '채용', '잡',
  '알려줘', '검색', '찾기', '뭐', '좀', '해줘', '줘', '있나', '있어요',
])

const REMOTE_KEYWORDS = /리모트|원격|재택|remote/i

// ── 매핑 기반 파싱 (기본 경로) ───────────────────────────────────────────

function parseWithMapping(message: string): ParsedQuery {
  const remote = REMOTE_KEYWORDS.test(message)

  // 단어 분리 후 한글→영문 변환
  const words = message.split(/[\s,]+/).filter(Boolean)
  const translated: string[] = []

  for (const word of words) {
    // 불용어 제거
    if (STOPWORDS.has(word)) continue

    const lower = word.toLowerCase()
    // 영문은 그대로 통과
    if (/^[a-z0-9\-_/]+$/i.test(word)) {
      if (!REMOTE_KEYWORDS.test(word)) translated.push(lower)
      continue
    }
    // 한글 → 매핑 테이블에서 변환 (원문 + 대문자 변형 둘 다 시도)
    const mapped = KO_EN_MAP[word] ?? KO_EN_MAP[word.toUpperCase()]
    if (mapped !== undefined) {
      if (mapped !== '') translated.push(mapped)
    } else {
      // 매핑에 없는 한글은 그대로 (부분 매칭 시도)
      translated.push(word)
    }
  }

  const roleKeyword = translated.join(' ') || null

  return { roleKeyword, remote: remote || null, other: null }
}

// ── LLM 기반 파싱 (옵트인) ──────────────────────────────────────────────

const SYSTEM_PROMPT = `사용자의 구직 질의에서 다음을 JSON으로 추출하라:
- roleKeyword: 직무 키워드 (예: "community manager", "developer", "디자이너"). 영어로 변환해서 출력.
- remote: 원격 근무 여부 (true/false/null). "리모트", "remote", "재택" 등이 있으면 true.
- other: 그 외 키워드 (예: "solidity", "DeFi", "senior"). 없으면 null.

반드시 JSON만 출력. 설명 금지. 예시:
{"roleKeyword": "community manager", "remote": true, "other": null}`

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY가 없습니다')
    client = new Anthropic({ apiKey })
  }
  return client
}

async function parseWithLLM(message: string): Promise<ParsedQuery> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: message }],
  })

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  console.log('[parse] LLM raw response:', text)

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('JSON not found in response')

  const parsed = JSON.parse(jsonMatch[0]) as ParsedQuery
  return {
    roleKeyword: parsed.roleKeyword || null,
    remote: typeof parsed.remote === 'boolean' ? parsed.remote : null,
    other: parsed.other || null,
  }
}

// ── 메인 진입점 ─────────────────────────────────────────────────────────
// BOT_USE_LLM=true 로 설정하면 LLM 사용 (기본: off → 매핑만)

export async function parseQuery(message: string): Promise<ParsedQuery> {
  const useLLM = process.env.BOT_USE_LLM === 'true'

  if (useLLM) {
    try {
      const result = await parseWithLLM(message)
      console.log('[parse] LLM result:', JSON.stringify(result))
      return result
    } catch (err) {
      console.warn('[parse] LLM 실패, 매핑 폴백:', (err as Error).message)
    }
  }

  const result = parseWithMapping(message)
  console.log('[parse] mapping result:', JSON.stringify(result))
  return result
}
