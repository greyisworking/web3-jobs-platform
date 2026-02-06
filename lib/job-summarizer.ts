/**
 * Job Description Summarizer (Rule-based)
 *
 * Transforms raw job descriptions into structured NEUN-style summaries
 * without using external AI APIs.
 *
 * Structure:
 * - 💡 Why This Role Slaps (if VC-backed)
 * - 📋 TL;DR (auto-generated from metadata)
 * - 🎯 You Might Be a Fit If...
 * - 🔧 What You'll Actually Do
 * - 🛠️ Stack & Tools
 * - 🏢 About the Team
 * - 💰 What You Get
 */

import { decode } from 'html-entities'

// ============================================================================
// Types
// ============================================================================

export interface JobMetadata {
  title: string
  company: string
  location?: string | null
  salary?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  experienceLevel?: string | null
  remoteType?: string | null
  type?: string | null  // Full-time, Part-time, etc.
  backers?: string[] | null
  sector?: string | null
  tags?: string | null
}

export interface SummarizeResult {
  summary: string
  sections: {
    whySlaps?: string
    tldr: string
    requirements?: string
    responsibilities?: string
    techStack?: string
    about?: string
    benefits?: string
  }
  hasVCBacking: boolean
}

// ============================================================================
// Section Detection Patterns
// ============================================================================

const SECTION_PATTERNS: Array<{
  patterns: RegExp[]
  targetSection: keyof SummarizeResult['sections']
  emoji: string
  heading: string
}> = [
  {
    patterns: [
      /^(?:about\s*(?:the\s*)?(?:role|position|job|opportunity)|role\s*overview|the\s*role)/i,
      /^(?:position\s*)?summary/i,
      /^overview/i,
    ],
    targetSection: 'responsibilities',
    emoji: '🔧',
    heading: "What You'll Actually Do",
  },
  {
    patterns: [
      /^key\s*responsibilities/i,
      /^responsibilities/i,
      /^what\s*you(?:'ll|\s*will)\s*(?:do|be\s*doing)/i,
      /^your\s*(?:role|responsibilities)/i,
      /^duties/i,
      /^주요\s*업무/i,
      /^담당\s*업무/i,
    ],
    targetSection: 'responsibilities',
    emoji: '🔧',
    heading: "What You'll Actually Do",
  },
  {
    patterns: [
      /^requirements?/i,
      /^qualifications?/i,
      /^what\s*we(?:'re|\s*are)\s*looking\s*for/i,
      /^you(?:'ll)?\s*(?:bring|have|need)/i,
      /^must\s*have/i,
      /^required\s*(?:skills?|experience)/i,
      /^minimum\s*qualifications?/i,
      /^ideal\s*candidate/i,
      /^자격\s*요건/i,
      /^필수\s*요건/i,
    ],
    targetSection: 'requirements',
    emoji: '🎯',
    heading: 'You Might Be a Fit If...',
  },
  {
    patterns: [
      /^nice\s*to\s*have/i,
      /^preferred\s*(?:qualifications?|skills?)/i,
      /^bonus\s*(?:points?|if\s*you)/i,
      /^우대\s*사항/i,
    ],
    targetSection: 'requirements',
    emoji: '🎯',
    heading: 'You Might Be a Fit If...',
  },
  {
    patterns: [
      /^(?:tech(?:nology)?\s*)?stack\b/i,
      /^technologies\b/i,
      /^tools?\s*(?:we\s*use|&\s*technologies)/i,
      /^technical\s+skills?\b(?!\s*set)/i, // "Technical Skills" but NOT "Technical Skill Set"
      /^기술\s*스택/i,
    ],
    targetSection: 'techStack',
    emoji: '🛠️',
    heading: 'Stack & Tools',
  },
  {
    patterns: [
      /^about\s*(?:us|the\s*company|the\s*team)/i,
      /^about\s+\w+/i, // "About Somnia", "About Company", etc.
      /^who\s*we\s*are/i,
      /^company\s*(?:overview|description)/i,
      /^our\s*(?:company|team|mission)/i,
      /^회사\s*소개/i,
      /^팀\s*소개/i,
    ],
    targetSection: 'about',
    emoji: '🏢',
    heading: 'About the Team',
  },
  {
    patterns: [
      /^benefits?/i,
      /^perks?/i,
      /^what\s*we\s*offer/i,
      /^compensation\s*(?:&|and)\s*benefits?/i,
      /^why\s*(?:join\s*us|work\s*(?:with|for)\s*us)/i,
      /^복리\s*후생/i,
      /^혜택/i,
    ],
    targetSection: 'benefits',
    emoji: '💰',
    heading: 'What You Get',
  },
]

// ============================================================================
// Spam/Boilerplate Patterns
// ============================================================================

const SPAM_PATTERNS = [
  // Base64 spam codes
  /\b[A-Za-z0-9+\/]{30,}={0,2}\b/g,
  // Spam prevention phrases
  /when\s+applying[^.]*mention[^.]*word[^.]*\./gi,
  /mention\s+(?:the\s+)?word\s+[A-Z]+[^.]*\./gi,
  /this\s+is\s+a\s+beta\s+feature\s+to\s+avoid\s+spam[^.]*\./gi,
  /to\s+show\s+you\s+read\s+the\s+job\s+post[^.]*\./gi,
  /please\s+mention\s+[A-Z]+\s+in\s+your\s+application[^.]*\./gi,
  /include\s+the\s+word\s+[A-Z]+[^.]*\./gi,
  // "Companies can search these words" spam
  /companies\s+can\s+search\s+these\s+words[^.]*/gi,
  /to\s+find\s+applicants\s+that\s+read\s+this[^.]*/gi,
  /to\s+see\s+they\s+are\s+human[^.]*/gi,
  // Standalone spam keywords in context
  /[^.]*\b(CANDYSHOP|YELLOWBIRD|PIZZATIME|MOONBEAM|STARLIGHT)\b[^.]*/gi,
]

const BOILERPLATE_LINE_PATTERNS = [
  /^apply\s*now\s*$/i,
  /^click\s*(?:here\s*)?to\s*apply\s*$/i,
  /^share\s*(?:this\s*)?(?:job|position)?/i,
  /^save\s*(?:this\s*)?job/i,
  /^report\s*(?:this\s*)?(?:job|listing)/i,
  /^similar\s*jobs?/i,
  /^related\s*(?:jobs?|positions?)/i,
  /^sourced\s*from/i,
  /^posted\s*(?:on|via|by)/i,
]

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Summarize a job description using rule-based parsing
 */
export function summarizeJob(
  rawDescription: string,
  metadata: JobMetadata
): SummarizeResult {
  // Step 1: Clean the raw text
  let text = cleanText(rawDescription)

  // Step 2: Parse sections
  const parsedSections = parseSections(text)

  // Step 3: Generate structured sections
  const sections: SummarizeResult['sections'] = {
    tldr: generateTldr(metadata),
  }

  // Add "Why This Role Slaps" if VC-backed
  const hasVCBacking = metadata.backers && metadata.backers.length > 0
  if (hasVCBacking) {
    sections.whySlaps = generateWhySlaps(metadata)
  }

  // Map parsed sections to NEUN format
  if (parsedSections.responsibilities) {
    sections.responsibilities = formatSection(parsedSections.responsibilities)
  }
  if (parsedSections.requirements) {
    sections.requirements = formatSection(parsedSections.requirements)
  }
  if (parsedSections.techStack) {
    sections.techStack = formatSection(parsedSections.techStack)
  }
  if (parsedSections.about) {
    sections.about = formatSection(parsedSections.about)
  }
  if (parsedSections.benefits) {
    sections.benefits = formatSection(parsedSections.benefits)
  }

  // If no sections found, try to extract from the whole text
  if (!sections.responsibilities && !sections.requirements) {
    const extracted = extractFromUnstructured(text)
    if (extracted.responsibilities) {
      sections.responsibilities = formatSection(extracted.responsibilities)
    }
    if (extracted.requirements) {
      sections.requirements = formatSection(extracted.requirements)
    }
  }

  // Step 4: Build final markdown summary
  const summary = buildMarkdownSummary(sections, metadata)

  return {
    summary,
    sections,
    hasVCBacking: !!hasVCBacking,
  }
}

// ============================================================================
// Text Cleaning
// ============================================================================

function cleanText(text: string): string {
  if (!text) return ''

  // Pre-process: Insert line breaks around common section headers
  // Many job descriptions have no newlines, so we need to split them

  // Step 1: Insert newlines AFTER section header colons (Header: Content -> Header:\nContent)
  // Use a single comprehensive regex to avoid multiple passes causing overlapping matches
  // Match common section headers followed by colon
  text = text.replace(
    /((?:Key\s*)?Responsibilities\s*:|About\s+(?:the\s+)?(?:Role|Position|Company|Team|Us|\w+)\s*:|Requirements?\s*:|Qualifications?\s*:|What\s*You(?:'ll|\s*Will)\s*(?:Do|Be\s*Doing)\s*:|What\s*We\s*(?:Offer|Look\s*For)\s*:|Benefits?\s*:|Perks?\s*:|(?:Tech(?:nology)?\s*)?Stack\s*:|(?:Minimum|Preferred)\s*Qualifications?\s*:|Nice\s*to\s*Have\s*:|Why\s*(?:Join\s*Us|Work\s*(?:With|For)\s*Us)\s*:|(?:Who|What)\s*We(?:'re|\s*Are)\s*Looking\s*For\s*:|Your\s*(?:Role|Responsibilities)\s*:|(?:The\s*)?Opportunity\s*:|(?:Our\s*)?(?:Ideal\s*)?Candidate\s*:|(?:Job\s*)?Description\s*:|The\s*Role\s*:|Who\s*You\s*Are\s*:|What\s*You(?:'ll)?\s*Bring\s*:|Tools\s*(?:We\s*Use|&\s*Technologies)\s*:|Technical\s*Skill\s*Set[^:]*:)/gi,
    '\n\n$1\n'
  )

  // Also insert line breaks for headers without colons (followed by capital letters)
  text = text
    .replace(/(?<![A-Za-z])((?:Key\s*)?Responsibilities)(?=[A-Z])/gi, '\n\n$1:\n')
    .replace(/(?<![A-Za-z])(Requirements?)(?=[A-Z])/g, '\n\n$1:\n')
    .replace(/(?<![A-Za-z])(Qualifications?)(?=[A-Z])/g, '\n\n$1:\n')

  // Step 2: Also break on sentence endings followed by capital letters (likely new sections)
  text = text.replace(/\.([A-Z][a-z])/g, '.\n$1')

  // Step 3: Break on common bullet-like patterns
  text = text
    .replace(/([^•\-\n])(?=[•\-]\s+[A-Z])/g, '$1\n')
    .replace(/([.!?])(?=\d+[\.\)]\s)/g, '$1\n')

  // Decode HTML entities
  text = decode(text)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&bull;/gi, '•')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')

  // Remove HTML tags, preserving structure
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  // Remove spam patterns
  for (const pattern of SPAM_PATTERNS) {
    text = text.replace(pattern, '')
  }

  // Remove boilerplate lines
  const lines = text.split('\n')
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim()
    if (!trimmed) return true
    for (const pattern of BOILERPLATE_LINE_PATTERNS) {
      if (pattern.test(trimmed)) return false
    }
    return true
  })
  text = cleanedLines.join('\n')

  // Normalize whitespace
  text = text
    .replace(/[ \t]+/g, ' ')           // collapse multiple spaces/tabs to single space
    .replace(/\n{3,}/g, '\n\n')         // max 2 consecutive newlines
    .replace(/^[ \t]+|[ \t]+$/gm, '')   // trim spaces/tabs from line starts/ends (NOT newlines!)
    .trim()

  return text
}

// ============================================================================
// Section Parsing
// ============================================================================

function parseSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const lines = text.split('\n')

  let currentSection: string | null = null
  let currentContent: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // Check if this line is a section header
    let matchedSection: string | null = null
    for (const { patterns, targetSection } of SECTION_PATTERNS) {
      for (const pattern of patterns) {
        // Check if line matches pattern (with optional colon at end)
        const testLine = trimmed.replace(/:$/, '')
        if (pattern.test(testLine) || pattern.test(trimmed)) {
          matchedSection = targetSection
          break
        }
      }
      if (matchedSection) break
    }

    // Also check for ALL CAPS headers or headers ending with colon
    if (!matchedSection && trimmed.length < 60) {
      const isAllCaps = /^[A-Z\s]{5,}$/.test(trimmed) && !/\s{2,}/.test(trimmed)
      const endsWithColon = trimmed.endsWith(':') && !trimmed.includes('.')
      if (isAllCaps || endsWithColon) {
        // Try to match against section patterns
        for (const { patterns, targetSection } of SECTION_PATTERNS) {
          for (const pattern of patterns) {
            if (pattern.test(trimmed.replace(/:$/, ''))) {
              matchedSection = targetSection
              break
            }
          }
          if (matchedSection) break
        }
      }
    }

    if (matchedSection) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        const content = currentContent.join('\n').trim()
        if (content) {
          // Append if section already exists
          if (sections[currentSection]) {
            sections[currentSection] += '\n\n' + content
          } else {
            sections[currentSection] = content
          }
        }
      }
      // Start new section
      currentSection = matchedSection
      currentContent = []
    } else if (currentSection) {
      currentContent.push(line)
    }
  }

  // Save last section
  if (currentSection && currentContent.length > 0) {
    const content = currentContent.join('\n').trim()
    if (content) {
      if (sections[currentSection]) {
        sections[currentSection] += '\n\n' + content
      } else {
        sections[currentSection] = content
      }
    }
  }

  return sections
}

// ============================================================================
// Unstructured Text Extraction
// ============================================================================

function extractFromUnstructured(text: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const lines = text.split('\n')

  // Find bullet points - likely requirements or responsibilities
  const bulletLines: string[] = []
  const paragraphs: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^[•\-\*]\s/.test(trimmed) || /^\d+[\.\)]\s/.test(trimmed)) {
      bulletLines.push(trimmed)
    } else if (trimmed.length > 50) {
      paragraphs.push(trimmed)
    }
  }

  // Categorize bullet points
  const requirementKeywords = /experience|years?|degree|knowledge|proficien|familiar|skill|background|understanding/i
  const responsibilityKeywords = /develop|build|design|implement|create|manage|lead|collaborate|work\s+with|drive|own/i

  const requirements: string[] = []
  const responsibilities: string[] = []

  for (const bullet of bulletLines) {
    if (requirementKeywords.test(bullet)) {
      requirements.push(bullet)
    } else if (responsibilityKeywords.test(bullet)) {
      responsibilities.push(bullet)
    } else {
      // Default to responsibilities
      responsibilities.push(bullet)
    }
  }

  if (requirements.length > 0) {
    sections.requirements = requirements.join('\n')
  }
  if (responsibilities.length > 0) {
    sections.responsibilities = responsibilities.join('\n')
  }

  // First paragraph is often "about"
  if (paragraphs.length > 0) {
    sections.about = paragraphs[0]
  }

  return sections
}

// ============================================================================
// Section Formatting
// ============================================================================

function formatSection(content: string): string {
  const lines = content.split('\n')
  const formatted: string[] = []

  for (const line of lines) {
    let trimmed = line.trim()
    if (!trimmed) {
      formatted.push('')
      continue
    }

    // Convert various list markers to standard bullets
    if (/^[•\-\*\●\○\◦\▸\▹\→\►]\s/.test(trimmed)) {
      trimmed = '- ' + trimmed.replace(/^[•\-\*\●\○\◦\▸\▹\→\►]\s*/, '')
    } else if (/^[a-z]\)\s/i.test(trimmed) || /^\([a-z]\)\s/i.test(trimmed)) {
      trimmed = '- ' + trimmed.replace(/^(?:[a-z]\)|\([a-z]\))\s*/i, '')
    } else if (/^\d+[\.\)]\s/.test(trimmed)) {
      trimmed = '- ' + trimmed.replace(/^\d+[\.\)]\s*/, '')
    } else if (/^✓|✔|☑|☐|▪|▫/.test(trimmed)) {
      trimmed = '- ' + trimmed.replace(/^[✓✔☑☐▪▫]\s*/, '')
    }

    formatted.push(trimmed)
  }

  return formatted.join('\n').trim()
}

// ============================================================================
// TL;DR Generation
// ============================================================================

function generateTldr(metadata: JobMetadata): string {
  const parts: string[] = []

  // Role summary
  parts.push(`**Role:** ${metadata.title} at ${metadata.company}`)

  // Level
  if (metadata.experienceLevel) {
    parts.push(`**Level:** ${metadata.experienceLevel}`)
  }

  // Compensation
  if (metadata.salaryMin && metadata.salaryMax) {
    const currency = metadata.salaryCurrency || 'USD'
    parts.push(`**Comp:** ${currency} ${metadata.salaryMin.toLocaleString()} - ${metadata.salaryMax.toLocaleString()}/yr`)
  } else if (metadata.salary) {
    parts.push(`**Comp:** ${metadata.salary}`)
  } else {
    parts.push(`**Comp:** Not listed`)
  }

  // Setup (remote/location)
  if (metadata.remoteType) {
    const location = metadata.location || 'Flexible'
    parts.push(`**Setup:** ${metadata.remoteType} · ${location}`)
  } else if (metadata.location) {
    parts.push(`**Location:** ${metadata.location}`)
  }

  // Type
  if (metadata.type) {
    parts.push(`**Type:** ${metadata.type}`)
  }

  return parts.join('\n')
}

// ============================================================================
// "Why This Role Slaps" Generation
// ============================================================================

const VC_DESCRIPTIONS: Record<string, string> = {
  'a16z': 'backed by a16z, the most influential crypto VC',
  'Paradigm': 'backed by Paradigm, a research-driven crypto fund',
  'Hashed': "backed by Hashed, Asia's largest blockchain fund",
  'Binance': 'portfolio of Binance, the world\'s largest crypto exchange',
  'Coinbase': 'backed by Coinbase Ventures',
  'Sequoia': 'backed by Sequoia Capital',
  'SoftBank': 'backed by SoftBank',
  'Samsung Next': 'backed by Samsung Next',
  'Animoca Brands': 'backed by Animoca Brands, a GameFi leader',
  'Ribbit Capital': 'backed by Ribbit Capital, top fintech investors',
}

function generateWhySlaps(metadata: JobMetadata): string {
  if (!metadata.backers || metadata.backers.length === 0) return ''

  const parts: string[] = []

  // Find priority VC for description
  let vcDescription = ''
  for (const backer of metadata.backers) {
    if (VC_DESCRIPTIONS[backer]) {
      vcDescription = VC_DESCRIPTIONS[backer]
      break
    }
  }

  if (vcDescription) {
    parts.push(`- ${metadata.company} is ${vcDescription}`)
  } else {
    parts.push(`- Backed by ${metadata.backers.slice(0, 3).join(', ')}`)
  }

  // Add sector if available
  if (metadata.sector) {
    parts.push(`- Building in the ${metadata.sector} space`)
  }

  return parts.join('\n')
}

// ============================================================================
// Markdown Summary Builder
// ============================================================================

function buildMarkdownSummary(
  sections: SummarizeResult['sections'],
  metadata: JobMetadata
): string {
  const parts: string[] = []

  // Why This Role Slaps (if VC-backed)
  if (sections.whySlaps) {
    parts.push('## 💡 Why This Role Slaps')
    parts.push(sections.whySlaps)
    parts.push('')
  }

  // TL;DR
  parts.push('## 📋 TL;DR')
  parts.push(sections.tldr)
  parts.push('')

  // Requirements
  if (sections.requirements) {
    parts.push('## 🎯 You Might Be a Fit If...')
    parts.push(sections.requirements)
    parts.push('')
  }

  // Responsibilities
  if (sections.responsibilities) {
    parts.push("## 🔧 What You'll Actually Do")
    parts.push(sections.responsibilities)
    parts.push('')
  }

  // Tech Stack
  if (sections.techStack) {
    parts.push('## 🛠️ Stack & Tools')
    parts.push(sections.techStack)
    parts.push('')
  }

  // About
  if (sections.about) {
    parts.push('## 🏢 About the Team')
    parts.push(sections.about)
    parts.push('')
  }

  // Benefits
  if (sections.benefits) {
    parts.push('## 💰 What You Get')
    parts.push(sections.benefits)
    parts.push('')
  }

  return parts.join('\n').trim()
}

// ============================================================================
// Batch Processing
// ============================================================================

export interface BatchResult {
  id: string
  success: boolean
  beforeLength: number
  afterLength: number
  hasVCBacking: boolean
  sectionsFound: string[]
  error?: string
}

export async function summarizeJobBatch(
  jobs: Array<{
    id: string
    rawDescription: string
    metadata: JobMetadata
  }>,
  options: {
    onProgress?: (completed: number, total: number, result: BatchResult) => void
  } = {}
): Promise<{
  results: BatchResult[]
  summary: {
    total: number
    succeeded: number
    failed: number
    avgBeforeLength: number
    avgAfterLength: number
  }
}> {
  const results: BatchResult[] = []
  let totalBefore = 0
  let totalAfter = 0

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    try {
      const result = summarizeJob(job.rawDescription, job.metadata)
      const sectionsFound = Object.keys(result.sections).filter(
        k => result.sections[k as keyof typeof result.sections]
      )

      const batchResult: BatchResult = {
        id: job.id,
        success: true,
        beforeLength: job.rawDescription.length,
        afterLength: result.summary.length,
        hasVCBacking: result.hasVCBacking,
        sectionsFound,
      }

      results.push(batchResult)
      totalBefore += batchResult.beforeLength
      totalAfter += batchResult.afterLength

      if (options.onProgress) {
        options.onProgress(i + 1, jobs.length, batchResult)
      }
    } catch (err: any) {
      results.push({
        id: job.id,
        success: false,
        beforeLength: job.rawDescription.length,
        afterLength: 0,
        hasVCBacking: false,
        sectionsFound: [],
        error: err.message,
      })
    }
  }

  const succeeded = results.filter(r => r.success).length

  return {
    results,
    summary: {
      total: jobs.length,
      succeeded,
      failed: jobs.length - succeeded,
      avgBeforeLength: totalBefore / jobs.length,
      avgAfterLength: totalAfter / succeeded || 0,
    },
  }
}
