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
  // Full spam sentences with keyword mentions (must come first)
  /when\s+applying,?\s*(?:please\s+)?mention\s+(?:the\s+)?word\s+\w+\s+to\s+show\s+you\s+read\s+the\s+job\s+post\s*(?:completely)?\.?\s*this\s+is\s+a\s+beta\s+feature\s+to\s+avoid\s+spam\s+applicants\.?\s*companies\s+can\s+search\s+these\s+words\s+to\s+find\s+applicants\s+that\s+read\s+this\s+and\s+to\s+see\s+they\s+are\s+human\.?/gi,
  // Spam sentences (individual)
  /when\s+applying[^.]*mention[^.]*word[^.]*\./gi,
  /mention\s+(?:the\s+)?word\s+[A-Z]+[^.]*\./gi,
  /this\s+is\s+a\s+beta\s+feature\s+to\s+avoid\s+spam[^.]*\./gi,
  /to\s+show\s+you\s+read\s+the\s+job\s+post[^.]*\./gi,
  /please\s+mention\s+[A-Z]+\s+in\s+your\s+application[^.]*\./gi,
  /include\s+the\s+word\s+[A-Z]+[^.]*\./gi,
  /companies\s+can\s+search\s+these\s+words[^.]*/gi,
  /to\s+find\s+applicants\s+that\s+read\s+this[^.]*/gi,
  /to\s+see\s+they\s+are\s+human[^.]*/gi,
  // Spam keywords in sentences
  /[^.]*\b(CANDYSHOP|YELLOWBIRD|PIZZATIME|MOONBEAM|STARLIGHT|BLUEMOON|GREENLIGHT|ROCKETSHIP)\b[^.]*/gi,
  // Base64 spam codes (various lengths)
  /\b[A-Za-z0-9+\/]{20,}={0,2}\b/g,
  /\bR[A-Za-z0-9]{8,}:/g,  // Patterns like RMjAwMToy...
]

const BOILERPLATE_LINE_PATTERNS = [
  /^apply\s*(?:now|for\s+this\s+job)\s*:?$/i,
  /^click\s*(?:here\s*)?to\s*apply\s*$/i,
  /^share\s*(?:this\s*)?(?:job|position)?/i,
  /^save\s*(?:this\s*)?job/i,
  /^report\s*(?:this\s*)?(?:job|listing)/i,
  /^similar\s*jobs?/i,
  /^related\s*(?:jobs?|positions?)/i,
  /^sourced\s*from/i,
  /^posted\s*(?:on|via|by)/i,
  // CTA phrases
  /^ready\s+to\s+(?:shape|join|build|apply|start|make|be\s+part)/i,
  /^interested\s*\?/i,
  /^sound\s+like\s+you\s*\?/i,
  /^think\s+you(?:'re|'d\s+be)\s+a\s+(?:good\s+)?fit\s*\?/i,
  /^excited\s+to\s+join/i,
  /^want\s+to\s+(?:join|work|be\s+part)/i,
  // EEO boilerplate
  /^equal\s+opportunity(?:\s+employer)?(?:\s*apply\s*now\s*:?\s*)?$/i,
  /^we\s+(?:are\s+an?\s+)?equal\s+opportunity/i,
  /^we\s+welcome\s+applicants\s+from\s+all\s+backgrounds/i,
  /^we\s+(?:value|celebrate|embrace)\s+diversity/i,
  /^we\s+hire\s+based\s+on\s+(?:talent|merit|skills)/i,
  /^we\s+(?:do\s+not|don't)\s+discriminate/i,
  /^all\s+qualified\s+applicants\s+will\s+receive/i,
  // Empty section headers (title with no content)
  /^\*\*(?:benefits?\s*(?:&|and)?\s*perks?|equal\s+opportunity|how\s+to\s+apply)\*\*$/i,
]

// Patterns to remove from end of content (trailing CTA/EEO)
const TRAILING_BOILERPLATE_PATTERNS = [
  // "Ready to..." CTA
  /(?:\n\n|\n)(?:\*\*)?ready\s+to\s+[^?]+\?(?:\*\*)?\s*$/i,
  // Standalone Apply Now / Apply for this job
  /(?:\n\n|\n)(?:\*\*)?apply\s*(?:now|for\s+this\s+job)\s*:?\s*(?:\*\*)?\s*$/i,
  /apply\s+for\s+this\s+job\s*$/i,
  // EEO statements
  /(?:\n\n|\n)we\s+welcome\s+applicants\s+from\s+all\s+backgrounds[^]*?$/i,
  /(?:\n\n|\n)we\s+are\s+an?\s+equal\s+opportunity\s+employer[^]*?$/i,
  // "Equal opportunityApply Now:" (stuck together)
  /(?:\n\n|\n)(?:\*\*)?equal\s*opportunity\s*(?:apply\s*now\s*:?)?(?:\*\*)?\s*$/i,
  // "Benefits & Perks" followed by "Equal opportunity" with no actual content
  /(?:\n\n|\n)(?:\*\*)?benefits?\s*(?:&|and)?\s*perks?(?:\*\*)?\s*(?:\n+)(?:\*\*)?equal\s*opportunity[^]*?$/i,
  // Multiple empty section headers at the end
  /(?:\n\n|\n)(?:\*\*)?(?:benefits?\s*(?:&|and)?\s*perks?|equal\s*opportunity|how\s+to\s+apply|apply\s*now)(?:\*\*)?\s*(?:\n+(?:\*\*)?(?:equal\s*opportunity|apply\s*now|benefits?)(?:\*\*)?\s*)*$/i,
  // Any combination of these at the very end with no content
  /(?:\n)(?:\*\*)?(?:equal\s*opportunity|apply\s*(?:now|for\s+this\s+job)\s*:?|benefits?\s*(?:&|and)?\s*perks?)(?:\*\*)?\s*(?:\n(?:\*\*)?(?:equal\s*opportunity|apply\s*(?:now|for\s+this\s+job)\s*:?|we\s+welcome)(?:\*\*)?[^\n]*)*\s*$/i,
  // "If you would like more information..." + "Apply for this job"
  /if\s+you\s+would\s+like\s+more\s+information[^.]+\.\s*apply\s+for\s+this\s+job\s*$/i,
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

/**
 * Clean raw description for display in "View raw" mode.
 * Decodes HTML entities and strips all HTML tags, returning plain text.
 */
export function cleanRawDescription(text: string): string {
  if (!text) return ''

  // Step 1: Robust HTML Entity Decoding (handle double/triple encoded)
  let prevText = ''
  let iterations = 0
  while (text !== prevText && iterations < 5) {
    prevText = text
    text = decode(text)
    iterations++
  }

  // Additional manual entity cleanup
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&bull;/gi, '•')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')

  // Step 2: Convert HTML to plain text with proper line breaks
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<strong[^>]*>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<b[^>]*>/gi, '')
    .replace(/<\/b>/gi, '')
    .replace(/<em[^>]*>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<i[^>]*>/gi, '')
    .replace(/<\/i>/gi, '')
    .replace(/<[^>]+>/g, '')  // Remove remaining HTML tags

  // Step 3: Handle broken/malformed HTML tags
  text = text
    // Broken closing tags: /p> /div> /strong> etc.
    .replace(/\/(?:strong|b|em|i|u|span|a)>\s*/gi, '')
    .replace(/\/(?:p|div|br|hr)>\s*/gi, '\n')
    .replace(/\/li>\s*/gi, '\n')
    .replace(/\/(?:ul|ol)>\s*/gi, '\n')
    .replace(/\/h[1-6]>\s*/gi, '\n\n')
    // Broken opening tags without <: br> p> div> li> strong> etc.
    .replace(/\bbr>\s*/gi, '\n')
    .replace(/\bp>\s*/gi, '\n')
    .replace(/\bdiv>\s*/gi, '\n')
    .replace(/\bli>\s*/gi, '• ')
    .replace(/\b(?:ul|ol)>\s*/gi, '\n')
    .replace(/\bh[1-6]>\s*/gi, '\n')
    .replace(/\b(?:strong|b|em|i|u|span|a)>\s*/gi, '')
    // Catch-all for any remaining broken tags
    .replace(/\/[a-z][a-z0-9]*>\s*/gi, '')
    .replace(/\b[a-z][a-z0-9]*>\s*/gi, '')

  // Step 4: Remove spam/boilerplate patterns
  for (const pattern of SPAM_PATTERNS) {
    text = text.replace(pattern, '')
  }

  // Step 5: Normalize whitespace
  text = text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    .trim()

  return text
}

function cleanText(text: string): string {
  if (!text) return ''

  // ============================================================================
  // Step 0: Robust HTML Entity Decoding (handle double/triple encoded)
  // ============================================================================
  // Some scraped content has entities like &amp;gt; which needs multiple decode passes
  let prevText = ''
  let iterations = 0
  while (text !== prevText && iterations < 5) {
    prevText = text
    text = decode(text)
    iterations++
  }

  // Additional manual entity cleanup
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&bull;/gi, '•')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')

  // ============================================================================
  // Step 1: Convert HTML structure to Markdown-like format
  // ============================================================================
  // First handle proper HTML tags
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<h[1-6][^>]*>/gi, '\n## ')
    .replace(/<strong[^>]*>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<b[^>]*>/gi, '**')
    .replace(/<\/b>/gi, '**')
    .replace(/<em[^>]*>/gi, '*')
    .replace(/<\/em>/gi, '*')
    .replace(/<i[^>]*>/gi, '*')
    .replace(/<\/i>/gi, '*')
    .replace(/<[^>]+>/g, ' ')  // Remove remaining HTML tags

  // ============================================================================
  // Step 2: Handle broken/malformed HTML tags (like /strong>, /p>, li>)
  // ============================================================================
  // These appear when entities are partially decoded or HTML is malformed
  text = text
    // Broken closing tags: /strong> /p> /div> /li> /ul> /ol> /h1> etc.
    .replace(/\/(?:strong|b|em|i|u|span|a)>\s*/gi, '')
    .replace(/\/(?:p|div|br|hr)>\s*/gi, '\n')
    .replace(/\/li>\s*/gi, '\n')
    .replace(/\/(?:ul|ol)>\s*/gi, '\n')
    .replace(/\/h[1-6]>\s*/gi, '\n\n')
    // Broken opening tags: p> div> li> ul> strong> etc.
    .replace(/(?:^|\s)p>\s*/gim, '\n')
    .replace(/(?:^|\s)div>\s*/gim, '\n')
    .replace(/(?:^|\s)br>\s*/gim, '\n')
    .replace(/(?:^|\s)li>\s*/gim, '- ')
    .replace(/(?:^|\s)(?:ul|ol)>\s*/gim, '\n')
    .replace(/(?:^|\s)h[1-6]>\s*/gim, '\n## ')
    .replace(/(?:^|\s)(?:strong|b)>\s*/gim, '**')
    .replace(/(?:^|\s)(?:em|i)>\s*/gim, '*')
    // Any remaining broken tags
    .replace(/\/[a-z][a-z0-9]*>\s*/gi, ' ')
    .replace(/(?:^|\s)[a-z][a-z0-9]*>\s*/gim, ' ')

  // ============================================================================
  // Step 3: Insert line breaks around section headers
  // ============================================================================
  text = text.replace(
    /((?:Key\s*)?Responsibilities\s*:|About\s+(?:the\s+)?(?:Role|Position|Company|Team|Us|\w+)\s*:|Requirements?\s*:|Qualifications?\s*:|What\s*You(?:'ll|\s*Will)\s*(?:Do|Be\s*Doing)\s*:|What\s*We\s*(?:Offer|Look\s*For)\s*:|Benefits?\s*:|Perks?\s*:|(?:Tech(?:nology)?\s*)?Stack\s*:|(?:Minimum|Preferred)\s*Qualifications?\s*:|Nice\s*to\s*Have\s*:|Why\s*(?:Join\s*Us|Work\s*(?:With|For)\s*Us)\s*:|(?:Who|What)\s*We(?:'re|\s*Are)\s*Looking\s*For\s*:|Your\s*(?:Role|Responsibilities)\s*:|(?:The\s*)?Opportunity\s*:|(?:Our\s*)?(?:Ideal\s*)?Candidate\s*:|(?:Job\s*)?Description\s*:|The\s*Role\s*:|Who\s*You\s*Are\s*:|What\s*You(?:'ll)?\s*Bring\s*:|Tools\s*(?:We\s*Use|&\s*Technologies)\s*:|Technical\s*Skill\s*Set[^:]*:)/gi,
    '\n\n$1\n'
  )

  // Headers without colons
  text = text
    .replace(/(?<![A-Za-z])((?:Key\s*)?Responsibilities)(?=[A-Z])/gi, '\n\n$1:\n')
    .replace(/(?<![A-Za-z])(Requirements?)(?=[A-Z])/g, '\n\n$1:\n')
    .replace(/(?<![A-Za-z])(Qualifications?)(?=[A-Z])/g, '\n\n$1:\n')

  // Break on sentence endings followed by capital letters
  text = text.replace(/\.([A-Z][a-z])/g, '.\n$1')

  // Break on bullet-like patterns
  text = text
    .replace(/([^•\-\n])(?=[•\-]\s+[A-Z])/g, '$1\n')
    .replace(/([.!?])(?=\d+[\.\)]\s)/g, '$1\n')

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

// Sub-heading patterns to detect and format (EXACT MATCHES ONLY)
const SUBHEADING_PATTERNS = [
  // Main section headings (these are used as h2 in buildMarkdownSummary)
  /^tl;?\s*dr$/i,
  /^about(?:\s+the\s+team)?$/i,
  /^about\s+us$/i,
  /^what\s+you(?:'ll)?\s+(?:actually\s+)?(?:do|get)$/i,
  /^you\s+might\s+be\s+a\s+fit\s+if\.{0,3}$/i,
  /^(?:tech\s+)?stack(?:\s*(?:&|and)\s*tools)?$/i,
  /^why\s+this\s+role\s+slaps$/i,
  // Success/timeline patterns
  /^what\s+success\s+looks\s+like$/i,
  /^in\s+your\s+first\s+\d+\s+days?$/i,
  /^by\s+(?:month|week|day)\s+\d+(?:\s*[-–]\s*\d+)?$/i,
  /^first\s+\d+\s+days?$/i,
  /^after\s+\d+\s+(?:months?|weeks?|days?)$/i,
  // Work style patterns
  /^how\s+we\s+work$/i,
  /^our\s+(?:culture|values|team|mission|vision)$/i,
  /^why\s+(?:join\s+us|work\s+(?:with|for|here))$/i,
  /^life\s+at\s+\w+$/i,
  /^the\s+role$/i,
  /^role$/i,
  // Requirements patterns
  /^job\s+requirements?$/i,
  /^must[\s-]?have(?:\s+(?:experience|skills?))?$/i,
  /^nice[\s-]?to[\s-]?have$/i,
  /^competencies?\s*(?:&|and)?\s*traits?$/i,
  /^skills?\s+(?:we\s+)?(?:need|require|want)$/i,
  /^preferred\s+(?:qualifications?|skills?)$/i,
  /^bonus\s+(?:points?|skills?)$/i,
  /^requirements?$/i,
  /^qualifications?$/i,
  // Benefits patterns
  /^benefits?\s*(?:&|and)?\s*perks?$/i,
  /^perks?\s*(?:&|and)?\s*benefits?$/i,
  /^what\s+(?:we|you)\s+(?:offer|get)$/i,
  /^compensation(?:\s+(?:&|and)\s+benefits?)?$/i,
  /^what\s+you\s+get$/i,
  // Other common patterns
  /^equal\s+opportunity(?:\s+(?:employer|statement))?$/i,
  /^diversity\s*(?:&|and)?\s*inclusion$/i,
  /^(?:our\s+)?(?:interview|hiring)\s+process$/i,
  /^location$/i,
  /^team\s+(?:overview|structure)$/i,
  /^(?:key\s+)?(?:responsibilities|duties)$/i,
  /^day[\s-]?to[\s-]?day$/i,
  /^your\s+(?:role|impact|responsibilities)$/i,
  /^ready\s+to\s+(?:join|shape|build|apply)/i,
]

// Patterns that should NOT be treated as subheadings (location values, short phrases, etc.)
const NOT_SUBHEADING_PATTERNS = [
  /^remote\s+\w+$/i,  // "Remote Americas", "Remote EMEA"
  /^(?:new\s+york|san\s+francisco|los\s+angeles|london|berlin|paris|tokyo|singapore)/i,
  /^(?:usa|uk|eu|emea|apac|americas?|europe|asia)/i,
  /^(?:full[\s-]?time|part[\s-]?time|contract|freelance)$/i,
  /^\$[\d,]+/,  // Salary figures
  /^\d+\+?\s*years?/i,  // Experience like "5+ years"
  /^(?:senior|junior|lead|staff|principal|intern)/i,
]

function isSubheading(text: string): boolean {
  const trimmed = text.trim().replace(/\*\*/g, '')  // Remove bold markers

  // Too long to be a subheading
  if (trimmed.length > 50) return false

  // Too short (single word that's not a known heading)
  if (trimmed.length < 4) return false

  // Check against NOT subheading patterns first
  for (const pattern of NOT_SUBHEADING_PATTERNS) {
    if (pattern.test(trimmed)) return false
  }

  // Check against known subheading patterns
  for (const pattern of SUBHEADING_PATTERNS) {
    if (pattern.test(trimmed)) return true
  }

  // NO generic title-like text detection - only match explicit patterns
  return false
}

function formatSection(content: string): string {
  // Step 1: Pre-process to split stuck-together sentences
  // Pattern: period followed directly by capital letter (no space)
  content = content.replace(/\.([A-Z][a-z])/g, '.\n$1')

  // Step 2: Detect "Label: Description" patterns and convert to bullet points
  // Common patterns: "Web3 Analytics:", "Technical Skills:", "Marketing Ops Proficiency:" etc.
  // Must be at start of line or after period/newline, followed by description
  const labelPattern = /(?:^|\n)([A-Z][A-Za-z0-9\s\/&]+):\s*([A-Z0-9])/g
  content = content.replace(labelPattern, '\n- **$1:** $2')

  const lines = content.split('\n')
  const formatted: string[] = []

  for (const line of lines) {
    let trimmed = line.trim()
    if (!trimmed) {
      formatted.push('')
      continue
    }

    // Check if this line is a sub-heading
    if (isSubheading(trimmed)) {
      // Format as bold sub-heading with spacing
      formatted.push('')
      formatted.push(`**${trimmed}**`)
      continue
    }

    // Convert various list markers to standard bullets
    if (/^[•\-\*\●\○\◦\▸\▹\→\►]\s/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^[•\-\*\●\○\◦\▸\▹\→\►]\s*/, '')
      // Check if bullet content has "Label: Description" pattern
      trimmed = '- ' + formatBulletContent(bulletContent)
    } else if (/^[a-z]\)\s/i.test(trimmed) || /^\([a-z]\)\s/i.test(trimmed)) {
      const bulletContent = trimmed.replace(/^(?:[a-z]\)|\([a-z]\))\s*/i, '')
      trimmed = '- ' + formatBulletContent(bulletContent)
    } else if (/^\d+[\.\)]\s/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^\d+[\.\)]\s*/, '')
      trimmed = '- ' + formatBulletContent(bulletContent)
    } else if (/^✓|✔|☑|☐|▪|▫/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^[✓✔☑☐▪▫]\s*/, '')
      trimmed = '- ' + formatBulletContent(bulletContent)
    } else if (/^- \*\*/.test(trimmed)) {
      // Already formatted with bold label, keep as is
    } else if (!trimmed.startsWith('-') && !trimmed.startsWith('#') && !trimmed.startsWith('**')) {
      // Check for inline "Label: Description" pattern at line start
      const inlineLabelMatch = trimmed.match(/^([A-Z][A-Za-z0-9\s\/&]{2,30}):\s+(.+)$/)
      if (inlineLabelMatch) {
        trimmed = `- **${inlineLabelMatch[1]}:** ${inlineLabelMatch[2]}`
      }
    }

    formatted.push(trimmed)
  }

  // Clean up multiple empty lines
  let result = formatted.join('\n')
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}

/**
 * Format bullet content - add bold to "Label:" patterns within bullet text
 */
function formatBulletContent(content: string): string {
  // Check if content starts with "Label: " pattern
  const labelMatch = content.match(/^([A-Z][A-Za-z0-9\s\/&]{2,30}):\s+(.+)$/)
  if (labelMatch) {
    return `**${labelMatch[1]}:** ${labelMatch[2]}`
  }
  return content
}

// ============================================================================
// TL;DR Generation
// ============================================================================

function generateTldr(metadata: JobMetadata): string {
  const parts: string[] = []

  // Role summary
  parts.push(`- **Role:** ${metadata.title} at ${metadata.company}`)

  // Level
  if (metadata.experienceLevel) {
    parts.push(`- **Level:** ${metadata.experienceLevel}`)
  }

  // Compensation
  if (metadata.salaryMin && metadata.salaryMax) {
    const currency = metadata.salaryCurrency || 'USD'
    parts.push(`- **Comp:** ${currency} ${metadata.salaryMin.toLocaleString()} - ${metadata.salaryMax.toLocaleString()}/yr`)
  } else if (metadata.salary) {
    parts.push(`- **Comp:** ${metadata.salary}`)
  } else {
    parts.push(`- **Comp:** Not listed`)
  }

  // Setup (remote/location)
  if (metadata.remoteType) {
    const location = metadata.location || 'Flexible'
    parts.push(`- **Setup:** ${metadata.remoteType} · ${location}`)
  } else if (metadata.location) {
    parts.push(`- **Location:** ${metadata.location}`)
  }

  // Type
  if (metadata.type) {
    parts.push(`- **Type:** ${metadata.type}`)
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
    parts.push('## Why This Role Slaps')
    parts.push(sections.whySlaps)
    parts.push('')
  }

  // TL;DR
  parts.push('## TL;DR')
  parts.push(sections.tldr)
  parts.push('')

  // Requirements
  if (sections.requirements) {
    parts.push('## You Might Be a Fit If...')
    parts.push(formatTimelineContent(sections.requirements))
    parts.push('')
  }

  // Responsibilities
  if (sections.responsibilities) {
    parts.push("## What You'll Actually Do")
    parts.push(formatTimelineContent(sections.responsibilities))
    parts.push('')
  }

  // Tech Stack
  if (sections.techStack) {
    parts.push('## Stack & Tools')
    parts.push(sections.techStack)
    parts.push('')
  }

  // About
  if (sections.about) {
    parts.push('## About the Team')
    parts.push(formatAboutSection(sections.about))
    parts.push('')
  }

  // Benefits
  if (sections.benefits) {
    parts.push('## What You Get')
    parts.push(sections.benefits)
    parts.push('')
  }

  // Build result and remove trailing boilerplate
  let result = parts.join('\n').trim()

  // Remove trailing CTA/EEO boilerplate (run multiple times to catch nested patterns)
  for (let i = 0; i < 3; i++) {
    const prevResult = result
    for (const pattern of TRAILING_BOILERPLATE_PATTERNS) {
      result = result.replace(pattern, '')
    }
    result = result.trim()
    if (result === prevResult) break
  }

  // Final cleanup: remove last lines if they're just boilerplate headers
  result = cleanTrailingBoilerplate(result)

  return result.trim()
}

/**
 * Remove trailing boilerplate headers that have no content
 */
function cleanTrailingBoilerplate(text: string): string {
  const lines = text.split('\n')

  // Remove trailing empty lines first
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop()
  }

  // Check last few lines for boilerplate-only content
  const boilerplateOnlyPatterns = [
    /^\*\*(?:benefits?\s*(?:&|and)?\s*perks?|equal\s*opportunity|apply\s*now|how\s+to\s+apply|ready\s+to)\*\*$/i,
    /^(?:benefits?\s*(?:&|and)?\s*perks?|equal\s*opportunity|apply\s*(?:now|for\s+this\s+job)\s*:?|how\s+to\s+apply)$/i,
    /^equal\s*opportunity\s*apply\s*now\s*:?$/i,
    /^ready\s+to\s+(?:shape|join|build|apply|start)/i,
    /^we\s+welcome\s+applicants/i,
    /^##\s+what\s+you\s+get$/i,  // Section header with no content following
    /^apply\s+for\s+this\s+job$/i,
    /^if\s+you\s+would\s+like\s+more\s+information/i,
  ]

  // Remove trailing boilerplate lines
  let removed = true
  while (removed && lines.length > 0) {
    removed = false
    const lastLine = lines[lines.length - 1].trim()

    // Check if last line is boilerplate
    for (const pattern of boilerplateOnlyPatterns) {
      if (pattern.test(lastLine)) {
        lines.pop()
        removed = true
        break
      }
    }

    // Also remove trailing empty lines after removal
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop()
    }
  }

  // Check if "## What You Get" section is empty (only has the header)
  const result = lines.join('\n')
  const emptyWhatYouGetPattern = /\n## What You Get\s*$/
  if (emptyWhatYouGetPattern.test(result)) {
    return result.replace(emptyWhatYouGetPattern, '')
  }

  return result
}

/**
 * Format "About the Team" section with better paragraph breaks and bold funding info
 */
function formatAboutSection(content: string): string {
  // Bold funding/investment information
  content = content.replace(
    /(\$\d+(?:\.\d+)?\s*(?:million|billion|M|B|k)?(?:\s+(?:in\s+)?(?:funding|investment|raised|secured|series\s+[A-Z]))?[^.]*(?:from|by|led by)[^.]+\.)/gi,
    '**$1**'
  )
  content = content.replace(
    /((?:secured|raised|received)\s+\$\d+[^.]+\.)/gi,
    '**$1**'
  )
  content = content.replace(
    /(backed\s+by\s+[^.]+(?:a16z|Paradigm|Sequoia|Coinbase|Binance|Pantera|Polychain)[^.]*\.)/gi,
    '**$1**'
  )

  // Split into paragraphs on topic changes
  const lines = content.split('\n')
  const paragraphs: string[] = []
  let currentParagraph: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '))
        currentParagraph = []
      }
      continue
    }

    // Check for topic change indicators
    const isTopicChange = /^(?:mission|our\s+(?:mission|vision|goal)|we\s+(?:believe|are\s+building)|the\s+(?:company|team|protocol))/i.test(trimmed)

    if (isTopicChange && currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '))
      currentParagraph = []
    }

    currentParagraph.push(trimmed)
  }

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '))
  }

  return paragraphs.join('\n\n')
}

/**
 * Format timeline content ("In your first 30 days", "By Month 4-6", etc.)
 * Split paragraph content into bullet points where appropriate
 */
function formatTimelineContent(content: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let inTimelineBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      result.push('')
      continue
    }

    // Check if this is a timeline sub-heading
    const isTimelineHeading = /^(?:\*\*)?(?:in\s+your\s+first\s+\d+\s+days?|by\s+(?:month|week|day)\s+\d+(?:\s*[-–]\s*\d+)?|first\s+\d+\s+days?|after\s+\d+\s+(?:months?|weeks?|days?))(?:\*\*)?$/i.test(trimmed)

    if (isTimelineHeading) {
      inTimelineBlock = true
      result.push('')
      // Ensure it's bold
      if (!trimmed.startsWith('**')) {
        result.push(`**${trimmed}**`)
      } else {
        result.push(trimmed)
      }
      continue
    }

    // Check if this is a "What Success Looks Like" type heading
    const isSuccessHeading = /^(?:\*\*)?what\s+success\s+looks\s+like(?:\*\*)?$/i.test(trimmed)
    if (isSuccessHeading) {
      inTimelineBlock = true
      result.push('')
      result.push(`**${trimmed.replace(/\*\*/g, '')}**`)
      continue
    }

    // If we're in a timeline block and this is a paragraph, try to split into bullets
    if (inTimelineBlock && !trimmed.startsWith('-') && !trimmed.startsWith('**') && trimmed.length > 50) {
      // Split on common separators
      const bullets = splitIntoBullets(trimmed)
      result.push(...bullets)
    } else {
      result.push(line)
    }

    // Exit timeline block on empty line or new section
    if (trimmed.startsWith('##') || trimmed.startsWith('**') && !isTimelineHeading) {
      inTimelineBlock = false
    }
  }

  return result.join('\n')
}

/**
 * Split a paragraph into bullet points
 */
function splitIntoBullets(text: string): string[] {
  // Try to split on sentence boundaries where each sentence describes a task/goal
  const sentences = text.split(/(?<=\.)\s+(?=[A-Z])/)

  if (sentences.length > 1) {
    return sentences.map(s => `- ${s.trim()}`)
  }

  // Try to split on commas followed by "and" or action verbs
  const parts = text.split(/,\s*(?=and\s|[a-z]+\s+(?:to|with|for|on|in)\s)/i)
  if (parts.length > 2) {
    return parts.map((p, i) => {
      const cleaned = p.trim().replace(/^and\s+/i, '')
      return `- ${cleaned}`
    })
  }

  // Return as single bullet if can't split
  return [`- ${text}`]
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
