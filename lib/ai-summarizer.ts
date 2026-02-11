/**
 * AI Job Description Summarizer
 *
 * Uses Claude API to transform raw job descriptions into
 * structured, NEUN-style summaries with pixelbara tone.
 */

import Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// Types
// ============================================================================

export interface JobContext {
  title: string
  company: string
  location?: string | null
  salary?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  backers?: string[] | null  // VC backers - key for NEUN
  sector?: string | null
  tags?: string | null
  source?: string | null
  type?: string | null       // Full-time, Part-time, Contract
  remoteType?: string | null // Remote, Hybrid, Onsite
  experienceLevel?: string | null
}

export interface SummarizeResult {
  summary: string           // AI-generated summary in markdown
  success: boolean
  error?: string
  tokensUsed?: number
  costUsd?: number
}

// ============================================================================
// Prompts
// ============================================================================

const ENGLISH_SYSTEM_PROMPT = `You are a job description editor for NEUN, a Web3 jobs platform backed by top-tier VCs like a16z, Paradigm, and Hashed.

NEUN's vibe: friendly, web3-native, slightly degen but professional. Think "your crypto-native friend who actually reads the job posts."

Your task: Transform raw job descriptions into clean, scannable summaries that help web3 builders quickly assess if a role is worth their time.

IMPORTANT RULES:
1. NEVER invent information not in the original description
2. Remove spam prevention codes, boilerplate text, "mention this word" instructions
3. Keep the tone professional but approachable - light web3 flavor, not cringe
4. If VC/funding info is provided in context, highlight it prominently
5. Be concise - bullet points over paragraphs
6. If salary/comp info exists, always include it
7. Skip sections if there's no relevant info (don't make things up)
8. Flag potential red flags honestly but diplomatically`

const ENGLISH_FORMAT_TEMPLATE = `
Format your response EXACTLY like this (skip sections with no info):

## 💡 Why This Role Slaps
- [1-2 lines on why this role is notable - VC backing, company traction, unique opportunity]
- [If VC-backed, lead with that: "Series B with $X from [VC] — they're scaling hard"]

## 📋 TL;DR
- **Role:** [one-line summary of what you'll do]
- **Level:** [Junior/Mid/Senior/Lead/Executive]
- **Comp:** [salary range + token/equity if mentioned, or "Not listed"]
- **Setup:** [Remote/Hybrid/Onsite + location]
- **Team:** [team size if mentioned]
- **Stage:** [funding stage if known]

## 🎯 You Might Be a Fit If...
- [3-5 bullets, conversational but informative]
- [Focus on actual requirements, not wishy-washy "passion for X"]

## 🔧 What You'll Actually Do
- [5-7 core responsibilities, cut the corporate fluff]
- [Be specific - what will the first 90 days look like?]

## 🛠️ Stack & Tools
- [Tech stack, tools, platforms - only if mentioned]

## 🏢 About the Team
- [2-3 sentences about company/team]
- [ALWAYS mention VC backers if known - this is key for NEUN users]
- [Include funding amount if known]

## 🚩 Heads Up
- [Only include if there are genuine concerns, otherwise skip this section]
- [Examples: "No salary listed for Senior role", "Scope seems broad for one hire", "Trial period mentioned"]
`

const KOREAN_SYSTEM_PROMPT = `당신은 NEUN의 채용 공고 에디터입니다. NEUN은 a16z, Paradigm, Hashed 같은 top-tier VC가 투자한 Web3 채용 플랫폼입니다.

NEUN 톤앤매너: 친근하고 web3 네이티브한 느낌. 너무 딱딱하지 않게, 그렇다고 오글거리지도 않게.

역할: raw 채용 공고를 깔끔하고 스캔하기 쉬운 요약으로 변환해서 Web3 빌더들이 빠르게 판단할 수 있게 해주세요.

중요 규칙:
1. 원본에 없는 정보는 절대 만들어내지 마세요
2. 스팸 방지 코드, 보일러플레이트, "이 단어를 언급하세요" 같은 건 제거
3. 전문적이지만 친근한 톤 - 딱딱한 공고문 느낌 NO
4. VC/펀딩 정보가 있으면 강조해서 포함
5. 간결하게 - 문단보다는 불릿 포인트
6. 연봉/보상 정보가 있으면 반드시 포함
7. 해당 정보가 없는 섹션은 생략 (만들어내지 마세요)
8. 잠재적 레드플래그는 솔직하게 표시`

const KOREAN_FORMAT_TEMPLATE = `
다음 형식으로 작성하세요 (정보가 없는 섹션은 생략):

## 💡 이 공고가 주목받는 이유
- [1-2줄로 왜 이 역할이 흥미로운지 - VC 투자, 회사 성장세, 특별한 기회]
- [VC 투자 있으면 먼저 언급: "시리즈 B, [VC]로부터 X억 투자 — 급성장 중"]

## 📋 한눈에 보기
- **포지션:** [역할 한 줄 요약]
- **레벨:** [주니어/미들/시니어/리드/임원급]
- **보상:** [연봉 범위 + 토큰/스톡옵션 있으면 표시, 없으면 "미공개"]
- **근무형태:** [원격/하이브리드/출근 + 위치]
- **팀 규모:** [언급된 경우]
- **투자 단계:** [알려진 경우]

## 🎯 이런 사람이 맞아요
- [3-5개 불릿, 대화체로 실제 요구사항 중심]
- ["열정 있는 분" 같은 애매한 표현 말고 구체적으로]

## 🔧 실제로 하는 일
- [5-7개 핵심 업무, 회사 PR성 문구 제거]
- [입사 후 90일간 뭘 하게 될지 구체적으로]

## 🛠️ 기술 스택
- [사용 기술, 도구, 플랫폼 - 언급된 경우만]

## 🏢 팀 소개
- [회사/팀 소개 2-3문장]
- [VC 투자자 있으면 반드시 언급 - NEUN 유저들에게 중요한 정보]
- [투자금액 알려진 경우 포함]

## 🚩 참고 사항
- [진짜 우려되는 점 있을 때만 포함, 없으면 섹션 생략]
- [예: "시니어급인데 연봉 미공개", "한 명이 하기엔 범위가 넓어 보임"]
`

// ============================================================================
// Main Functions
// ============================================================================

let anthropicClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

/**
 * Detect if text is primarily Korean
 */
function isKorean(text: string): boolean {
  const koreanChars = text.match(/[\uAC00-\uD7AF]/g) || []
  const totalChars = text.replace(/\s/g, '').length
  return koreanChars.length / totalChars > 0.3
}

/**
 * Build context string from job metadata
 */
function buildContextString(context: JobContext): string {
  const parts: string[] = []

  parts.push(`Job Title: ${context.title}`)
  parts.push(`Company: ${context.company}`)

  if (context.location) parts.push(`Location: ${context.location}`)
  if (context.type) parts.push(`Employment Type: ${context.type}`)
  if (context.remoteType) parts.push(`Work Setup: ${context.remoteType}`)
  if (context.experienceLevel) parts.push(`Experience Level: ${context.experienceLevel}`)

  // Salary info
  if (context.salary) {
    parts.push(`Salary: ${context.salary}`)
  } else if (context.salaryMin || context.salaryMax) {
    const currency = context.salaryCurrency || 'USD'
    if (context.salaryMin && context.salaryMax) {
      parts.push(`Salary Range: ${currency} ${context.salaryMin.toLocaleString()} - ${context.salaryMax.toLocaleString()}`)
    } else if (context.salaryMin) {
      parts.push(`Minimum Salary: ${currency} ${context.salaryMin.toLocaleString()}`)
    } else if (context.salaryMax) {
      parts.push(`Maximum Salary: ${currency} ${context.salaryMax.toLocaleString()}`)
    }
  }

  // VC backers - VERY important for NEUN
  if (context.backers && context.backers.length > 0) {
    parts.push(`VC Backers: ${context.backers.join(', ')}`)
    parts.push(`⚠️ This is a VC-backed company - emphasize this in the summary!`)
  }

  if (context.sector) parts.push(`Sector: ${context.sector}`)
  if (context.tags) parts.push(`Tech Stack/Tags: ${context.tags}`)
  if (context.source) parts.push(`Source: ${context.source}`)

  return parts.join('\n')
}

/**
 * Clean raw description before sending to AI
 */
function preCleanDescription(text: string): string {
  // Remove obvious spam/boilerplate
  let cleaned = text
    // Base64-like spam codes
    .replace(/\b[A-Za-z0-9+\/]{30,}={0,2}\b/g, '')
    // Spam prevention phrases
    .replace(/mention\s+(?:the\s+)?word\s+[A-Z]+[^.]*\./gi, '')
    .replace(/this\s+is\s+a\s+beta\s+feature\s+to\s+avoid\s+spam[^.]*\./gi, '')
    .replace(/to\s+show\s+you\s+read\s+the\s+job\s+post[^.]*\./gi, '')
    // Excessive whitespace
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/[ \t]{3,}/g, '  ')
    .trim()

  // Truncate if too long (save tokens)
  if (cleaned.length > 8000) {
    cleaned = cleaned.substring(0, 8000) + '\n\n[Description truncated for processing]'
  }

  return cleaned
}

/**
 * Summarize a job description using Claude
 */
export async function summarizeJobDescription(
  rawDescription: string,
  context: JobContext,
  options: { forceLanguage?: 'en' | 'ko' } = {}
): Promise<SummarizeResult> {
  try {
    const client = getClient()

    // Detect language
    const isKoreanContent = options.forceLanguage === 'ko' ||
      (options.forceLanguage !== 'en' && isKorean(rawDescription))

    // Select prompts based on language
    const systemPrompt = isKoreanContent ? KOREAN_SYSTEM_PROMPT : ENGLISH_SYSTEM_PROMPT
    const formatTemplate = isKoreanContent ? KOREAN_FORMAT_TEMPLATE : ENGLISH_FORMAT_TEMPLATE

    // Pre-clean the description
    const cleanedDescription = preCleanDescription(rawDescription)
    const contextString = buildContextString(context)

    // Build the user message
    const userMessage = `Here is the job context:
---
${contextString}
---

Here is the raw job description to summarize:
---
${cleanedDescription}
---

Please transform this into a clean, scannable summary following this format:
${formatTemplate}

Remember:
- Don't invent information not in the original
- Skip sections if there's no relevant info
- If VC backers are mentioned in context, make sure to highlight them prominently
- Keep it professional but friendly, light web3 flavor`

    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    // Extract text from response
    const summary = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('\n')

    // Calculate cost (Claude Sonnet pricing as of 2024)
    // Input: $3 per 1M tokens, Output: $15 per 1M tokens
    const inputTokens = response.usage?.input_tokens || 0
    const outputTokens = response.usage?.output_tokens || 0
    const costUsd = (inputTokens * 3 + outputTokens * 15) / 1_000_000

    return {
      summary,
      success: true,
      tokensUsed: inputTokens + outputTokens,
      costUsd,
    }
  } catch (error) {
    console.error('AI summarization error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      summary: '',
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Batch summarize multiple jobs with rate limiting
 */
export async function batchSummarizeJobs(
  jobs: Array<{ id: string; rawDescription: string; context: JobContext }>,
  options: {
    delayMs?: number
    onProgress?: (completed: number, total: number, job: { id: string; success: boolean }) => void
  } = {}
): Promise<{
  results: Array<{ id: string; summary: string; success: boolean; error?: string }>
  totalCostUsd: number
  totalTokens: number
}> {
  const { delayMs = 1000, onProgress } = options
  const results: Array<{ id: string; summary: string; success: boolean; error?: string }> = []
  let totalCostUsd = 0
  let totalTokens = 0

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]

    const result = await summarizeJobDescription(job.rawDescription, job.context)

    results.push({
      id: job.id,
      summary: result.summary,
      success: result.success,
      error: result.error,
    })

    if (result.success) {
      totalCostUsd += result.costUsd || 0
      totalTokens += result.tokensUsed || 0
    }

    if (onProgress) {
      onProgress(i + 1, jobs.length, { id: job.id, success: result.success })
    }

    // Rate limiting
    if (i < jobs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return { results, totalCostUsd, totalTokens }
}

/**
 * Estimate cost for processing N jobs
 */
export function estimateCost(jobCount: number, avgDescriptionLength: number = 3000): {
  estimatedInputTokens: number
  estimatedOutputTokens: number
  estimatedCostUsd: number
} {
  // Rough estimate: 1 token ≈ 4 characters
  const avgInputTokens = Math.ceil(avgDescriptionLength / 4) + 500 // +500 for prompts
  const avgOutputTokens = 800 // Typical summary length

  const totalInputTokens = avgInputTokens * jobCount
  const totalOutputTokens = avgOutputTokens * jobCount

  // Claude Sonnet: $3 per 1M input, $15 per 1M output
  const costUsd = (totalInputTokens * 3 + totalOutputTokens * 15) / 1_000_000

  return {
    estimatedInputTokens: totalInputTokens,
    estimatedOutputTokens: totalOutputTokens,
    estimatedCostUsd: costUsd,
  }
}
