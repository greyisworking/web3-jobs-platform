import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ADMIN_EMAIL_WHITELIST } from '@/lib/admin-auth'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export const maxDuration = 120

type ContentMode = 'newsletter' | 'ludium-jobs' | 'ludium-article'

interface NewsletterJob {
  title: string
  company: string
  location?: string
  type?: string
  salary?: string | null
  backers?: string[] | null
  sector?: string | null
}

interface GenerateRequest {
  mode: ContentMode
  prompt: string
  context?: {
    jobs?: NewsletterJob[]
    period?: string
    topic?: string
  }
}

// System prompts for different modes
const SYSTEM_PROMPTS: Record<ContentMode, string> = {
  'newsletter': `You are a content writer for NEUN, a Web3 jobs platform.
Your task is to write professional newsletter content in English.

Style guidelines:
- Professional but approachable tone
- Web3-native language (gm, ser, etc. sparingly)
- Focus on value for job seekers
- Highlight VC-backed companies and hot opportunities
- Use markdown formatting
- Keep it scannable with bullet points and headers

Output format: Markdown newsletter content ready for email.`,

  'ludium-jobs': `You are Ludy, the friendly AI assistant for Ludium - a Web3 education and job platform.

Ludy's personality:
- Warm and encouraging
- Uses emojis naturally but not excessively
- Speaks like a knowledgeable friend, not a corporate bot
- Explains Web3 concepts clearly for newcomers
- Celebrates opportunities and growth

Your task: Create job listing content for Ludium's community.
- Highlight what makes each role exciting
- Explain technical requirements in accessible terms
- Mention company culture and growth potential
- Include any VC backing or notable aspects

Output both English and Korean versions.`,

  'ludium-article': `You are Ludy, the friendly AI assistant for Ludium - a Web3 education and job platform.

Ludy's personality:
- Educational and inspiring
- Makes complex topics accessible
- Uses analogies and examples
- Encourages learning and exploration
- Celebrates the Web3 community

Your task: Write educational/informative articles about Web3 topics.
- Start with a hook that draws readers in
- Break down complex concepts step by step
- Include practical examples or use cases
- End with actionable takeaways

Output both English and Korean versions.`,
}

const FORMAT_INSTRUCTIONS: Record<ContentMode, string> = {
  'newsletter': `
Format your response as a complete newsletter in markdown:

# [Catchy Title]

[Opening paragraph - set the scene for this week]

## This Week's Highlights
- [Key stats or trends]

## Featured Opportunities
[Job listings with company, role, location, key selling points]

## Companies to Watch
[Notable hiring companies]

## Closing
[Brief sign-off with CTA]
`,

  'ludium-jobs': `
Format your response as:

---ENGLISH---
## [Engaging Title]

[Introduction to the opportunities]

### [Company Name] - [Role]
- **What you'll do:** [Brief description]
- **Why it's exciting:** [Key selling points]
- **Requirements:** [Key skills needed]
- **Perks:** [Notable benefits]

[Repeat for each job]

---KOREAN---
## [한국어 제목]

[기회 소개]

### [회사명] - [직무]
- **하는 일:** [간략한 설명]
- **매력 포인트:** [핵심 장점]
- **필요 역량:** [필요한 스킬]
- **혜택:** [주목할 만한 복지]

[각 공고 반복]
`,

  'ludium-article': `
Format your response as:

---ENGLISH---
# [Engaging Title]

[Hook - grab attention in first paragraph]

## [Section 1]
[Content with examples]

## [Section 2]
[Content with practical tips]

## Key Takeaways
- [Actionable point 1]
- [Actionable point 2]
- [Actionable point 3]

---KOREAN---
# [한국어 제목]

[도입부 - 첫 문단에서 관심 유도]

## [섹션 1]
[예시와 함께 내용 설명]

## [섹션 2]
[실용적인 팁과 함께 내용]

## 핵심 정리
- [실행 가능한 포인트 1]
- [실행 가능한 포인트 2]
- [실행 가능한 포인트 3]
`,
}

export async function POST(request: Request) {
  // Check admin auth
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const supabase = createSupabaseServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!admin && !ADMIN_EMAIL_WHITELIST.includes(user.email || '')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body: GenerateRequest = await request.json()
    const { mode, prompt, context } = body

    if (!mode || !prompt) {
      return NextResponse.json({ error: 'mode and prompt are required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })
    const systemPrompt = SYSTEM_PROMPTS[mode]
    const formatInstructions = FORMAT_INSTRUCTIONS[mode]

    // Build the user message
    let userMessage = prompt

    if (context?.jobs && context.jobs.length > 0) {
      userMessage += '\n\nHere are the job listings to include:\n'
      for (const job of context.jobs) {
        userMessage += `\n- ${job.company}: ${job.title} (${job.location || 'Remote'})`
        if (job.salary) userMessage += ` - ${job.salary}`
        if (job.backers?.length) userMessage += ` - Backed by: ${job.backers.join(', ')}`
      }
    }

    if (context?.period) {
      userMessage += `\n\nTime period: ${context.period}`
    }

    if (context?.topic) {
      userMessage += `\n\nTopic: ${context.topic}`
    }

    userMessage += `\n\nPlease format your response as follows:${formatInstructions}`

    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    // Extract text from response
    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('\n')

    // Parse dual-language output if applicable
    let english = content
    let korean = ''

    if (mode !== 'newsletter') {
      const englishMatch = content.match(/---ENGLISH---\s*([\s\S]*?)(?=---KOREAN---|$)/)
      const koreanMatch = content.match(/---KOREAN---\s*([\s\S]*)$/)

      if (englishMatch) english = englishMatch[1].trim()
      if (koreanMatch) korean = koreanMatch[1].trim()
    }

    // Calculate tokens and cost
    const inputTokens = response.usage?.input_tokens || 0
    const outputTokens = response.usage?.output_tokens || 0
    const costUsd = (inputTokens * 3 + outputTokens * 15) / 1_000_000

    return NextResponse.json({
      success: true,
      content: {
        english,
        korean: korean || null,
        raw: content,
      },
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd: Math.round(costUsd * 10000) / 10000,
      },
    })
  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content' },
      { status: 500 }
    )
  }
}
