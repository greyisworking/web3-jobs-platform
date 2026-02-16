/**
 * Job Description Formatter
 *
 * Cleans and formats raw job descriptions into readable markdown.
 * This is the foundation for the AI summary pipeline (Phase 2).
 *
 * Processing Pipeline:
 * 1. Raw text cleanup (HTML entities, tags, whitespace)
 * 2. Boilerplate removal (Apply now, social links, etc.)
 * 3. Section header detection and markdown conversion
 * 4. List detection and bullet point conversion
 * 5. Salary/compensation highlighting
 */

import { decode } from 'html-entities'
import { humanizeRuleBased, calculateAIScore } from './humanizer'

// ============================================================================
// Types
// ============================================================================

export interface FormatResult {
  formatted: string       // Cleaned and formatted markdown
  raw: string            // Original raw text (for preservation)
  sections: {
    description?: string
    requirements?: string
    responsibilities?: string
    benefits?: string
    salary?: string
    techStack?: string[]
  }
  metadata: {
    hasStructuredSections: boolean
    estimatedReadingTime: number  // in minutes
    wordCount: number
  }
}

export interface FormatterOptions {
  preserveHtml?: boolean      // Keep some HTML formatting (default: false)
  extractSections?: boolean   // Extract named sections (default: true)
  maxLength?: number          // Truncate if exceeds (default: 15000)
  humanize?: boolean          // Apply humanizer to remove AI patterns (default: true)
  humanizeThreshold?: number  // Min AI score to trigger humanization (default: 30)
}

// ============================================================================
// Constants
// ============================================================================

// Section header patterns (case-insensitive)
const SECTION_HEADERS = [
  // English headers
  { pattern: /^(?:about\s+(?:the\s+)?(?:role|position|job|opportunity|us|company)|company\s+overview)/i, heading: 'About' },
  { pattern: /^(?:key\s+)?responsibilities/i, heading: 'Responsibilities' },
  { pattern: /^(?:what\s+you(?:'ll|\s+will)\s+do|your\s+role|the\s+role|role\s+overview)/i, heading: 'What You\'ll Do' },
  { pattern: /^(?:requirements?|qualifications?|what\s+we(?:'re|\s+are)\s+looking\s+for)/i, heading: 'Requirements' },
  { pattern: /^(?:must\s+have|required\s+skills?|minimum\s+qualifications?)/i, heading: 'Required Skills' },
  { pattern: /^(?:nice\s+to\s+have|preferred|bonus\s+points?|plus)/i, heading: 'Nice to Have' },
  { pattern: /^(?:benefits?|perks?|what\s+we\s+offer|compensation|total\s+rewards?)/i, heading: 'Benefits' },
  { pattern: /^(?:tech(?:nology)?\s+stack|technologies|tools?\s+(?:we\s+use|&\s+technologies))/i, heading: 'Tech Stack' },
  { pattern: /^(?:skills?|technical\s+skills?|core\s+competencies)/i, heading: 'Skills' },
  { pattern: /^(?:experience|background)/i, heading: 'Experience' },
  { pattern: /^(?:education|academic)/i, heading: 'Education' },
  { pattern: /^(?:how\s+to\s+apply|application\s+process)/i, heading: 'How to Apply' },
  { pattern: /^(?:about\s+us|who\s+we\s+are|our\s+company|company\s+description)/i, heading: 'About Us' },
  { pattern: /^(?:why\s+join\s+us|why\s+work\s+(?:with|for)\s+us)/i, heading: 'Why Join Us' },
  { pattern: /^(?:team|the\s+team|our\s+team)/i, heading: 'The Team' },
  { pattern: /^(?:location|work\s+location|where)/i, heading: 'Location' },
  { pattern: /^(?:salary|compensation|pay)/i, heading: 'Compensation' },

  // Korean headers
  { pattern: /^(?:주요\s*업무|담당\s*업무|업무\s*내용)/i, heading: '주요 업무' },
  { pattern: /^(?:자격\s*요건|필수\s*요건|지원\s*자격)/i, heading: '자격 요건' },
  { pattern: /^(?:우대\s*사항|우대\s*조건)/i, heading: '우대 사항' },
  { pattern: /^(?:복리\s*후생|혜택|베네핏)/i, heading: '복리후생' },
  { pattern: /^(?:기술\s*스택|사용\s*기술)/i, heading: '기술 스택' },
  { pattern: /^(?:회사\s*소개|팀\s*소개)/i, heading: '회사 소개' },
  { pattern: /^(?:근무\s*조건|근무\s*환경)/i, heading: '근무 조건' },
  { pattern: /^(?:채용\s*절차|전형\s*절차)/i, heading: '채용 절차' },
]

// Boilerplate patterns to remove (line by line, not greedy)
const BOILERPLATE_PATTERNS = [
  // Apply/CTA buttons (single line only)
  /^apply\s*now\s*$/gim,
  /^click\s*(?:here\s*)?to\s*apply\s*$/gim,
  /^submit\s*(?:your\s*)?application\s*$/gim,
  /^apply\s*(?:for\s*)?(?:this\s*)?(?:job|position|role)\s*$/gim,

  // Social sharing (single line)
  /^share\s*(?:this\s*)?(?:job|position)?\s*(?:on|via)?\s*(?:twitter|facebook|linkedin|email).*$/gim,
  /^(?:follow|connect\s*with)\s*us\s*on\s*(?:twitter|linkedin|facebook).*$/gim,
  /^tweet\s*this\s*job.*$/gim,

  // Referral/recommendation (single line)
  /^know\s*someone\s*(?:who|that)\s*(?:would|might).*$/gim,
  /^refer\s*a\s*friend.*$/gim,
  /^recommended\s*(?:jobs?|positions?|candidates?).*$/gim,

  // Job board UI noise (single line)
  /^save\s*(?:this\s*)?job.*$/gim,
  /^report\s*(?:this\s*)?(?:job|listing).*$/gim,
  /^flag\s*(?:this\s*)?(?:job|listing).*$/gim,
  /^similar\s*jobs?.*$/gim,
  /^related\s*(?:jobs?|positions?).*$/gim,
  /^more\s*jobs?\s*(?:at|from|by).*$/gim,
  /^view\s*all\s*jobs?.*$/gim,
  /^back\s*to\s*(?:jobs?|search|results).*$/gim,

  // Source attribution (single line)
  /^sourced\s*from.*$/gim,
  /^posted\s*(?:on|via|by).*$/gim,
  /^originally\s*posted.*$/gim,
  /^job\s*source:.*$/gim,

  // Cookie/privacy notices (single line)
  /^we\s*use\s*cookies.*$/gim,
  /^by\s*(?:continuing|using)\s*(?:this\s*)?(?:site|website).*$/gim,
  /^privacy\s*policy\s*$/gim,
  /^terms\s*(?:of\s*)?(?:service|use)\s*$/gim,

  // Email subscription (single line)
  /^subscribe\s*(?:to\s*)?(?:our\s*)?(?:newsletter|updates).*$/gim,
  /^get\s*(?:job\s*)?alerts?.*$/gim,
  /^sign\s*up\s*for\s*(?:job\s*)?(?:alerts?|notifications?).*$/gim,

  // Misc UI elements
  /\[button\]/gi,
  /\[link\]/gi,
  /\[image\]/gi,
  /^loading\.\.\.$/gim,
  /^please\s*wait.*$/gim,

  // Spam prevention / anti-bot phrases (more aggressive patterns)
  /mention\s+(?:the\s+)?word\s+[A-Z]+.*$/gim,
  /this\s+is\s+a\s+beta\s+feature\s+to\s+avoid\s+spam.*$/gim,
  /to\s+show\s+you\s+read\s+the\s+job\s+post.*$/gim,
  /please\s+mention\s+[A-Z]+\s+in\s+your\s+application.*$/gim,
  /when\s+applying.*mention.*word.*$/gim,
  /include\s+the\s+word\s+[A-Z]+.*$/gim,
  // Standalone spam keywords (all caps, contextual fake words for spam detection)
  // NOTE: Removed BLOCKCHAIN as it's a legitimate term in web3 job postings
  /(?:^|\s)(CANDYSHOP|YELLOWBIRD|PIZZATIME)(?:\s|$)/gi,
]

// Base64-like spam prevention codes
// These are typically 40+ char strings with random-looking mixed case/numbers
// Pattern: Must look like actual Base64 spam codes, not legitimate content
function isBase64SpamCode(str: string): boolean {
  // Must be quite long (spam codes are typically 40+ chars)
  if (str.length < 40) return false

  // Must have Base64-like character distribution
  const hasLower = /[a-z]/.test(str)
  const hasUpper = /[A-Z]/.test(str)
  const hasNumber = /[0-9]/.test(str)

  // All three must be present for Base64
  if (!hasLower || !hasUpper || !hasNumber) return false

  // Must not look like words (CamelCase, PascalCase, etc.)
  const looksLikeWords = /^[A-Z][a-z]+(?:[A-Z][a-z]+)*$/.test(str)
  if (looksLikeWords) return false

  // Must not contain common word patterns
  const hasCommonWords = /(?:the|and|for|with|this|that|from|have|are|was|were|will|would|could|should|about|into|more|some|than|them|then|there|these|they|what|when|where|which|while|your|been|being|each|during|through)/i.test(str)
  if (hasCommonWords) return false

  // Must have high entropy (mix of different character types throughout)
  // Check that numbers are distributed throughout, not just at the end
  const firstHalf = str.slice(0, Math.floor(str.length / 2))
  const secondHalf = str.slice(Math.floor(str.length / 2))
  const firstHalfHasNumber = /[0-9]/.test(firstHalf)
  const secondHalfHasNumber = /[0-9]/.test(secondHalf)
  if (!firstHalfHasNumber && !secondHalfHasNumber) return false

  // Check for actual Base64 padding pattern (ends with = or ==)
  const hasBase64Padding = /={1,2}$/.test(str)

  // If it has Base64 padding, it's very likely a spam code
  if (hasBase64Padding && str.length >= 40) return true

  // Otherwise, require very specific characteristics
  // Count unique characters - spam codes have high variety
  const uniqueChars = new Set(str).size
  const varietyRatio = uniqueChars / str.length

  // Spam codes typically have 40-60% unique characters
  // Normal text has much lower variety
  return varietyRatio > 0.3 && str.length >= 50
}

// Salary/compensation patterns for highlighting
const SALARY_PATTERNS = [
  /\$[\d,]+(?:\s*[-–—]\s*\$?[\d,]+)?(?:\s*(?:k|K|per\s*(?:year|month|hour)|\/(?:yr|mo|hr|year|month|hour)|annually|monthly|hourly))?/g,
  /(?:USD|EUR|GBP|JPY|KRW|ETH|BTC|USDC|USDT)\s*[\d,]+(?:\s*[-–—]\s*[\d,]+)?/gi,
  /[\d,]+\s*(?:USD|EUR|GBP|JPY|KRW|ETH|BTC|USDC|USDT)/gi,
  /(?:salary|compensation|pay)(?:\s*(?:range|:))?\s*[\d,\$€£¥₩]+/gi,
  /(?:연봉|월급|시급)\s*[:：]?\s*[\d,]+\s*(?:만원|원)?/g,
]

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Format a raw job description into clean markdown
 */
export function formatJobDescription(
  rawText: string,
  options: FormatterOptions = {}
): FormatResult {
  const {
    preserveHtml = false,
    extractSections = true,
    maxLength = 15000,
    humanize = true,
    humanizeThreshold = 30,
  } = options

  if (!rawText || typeof rawText !== 'string') {
    return {
      formatted: '',
      raw: rawText || '',
      sections: {},
      metadata: { hasStructuredSections: false, estimatedReadingTime: 0, wordCount: 0 },
    }
  }

  const raw = rawText

  // Step 1: Clean raw text
  let text = cleanRawText(rawText, preserveHtml)

  // Step 2: Remove boilerplate
  text = removeBoilerplate(text)

  // Step 3: Format as markdown
  text = convertToMarkdown(text)

  // Step 4: Extract sections if requested
  const sections = extractSections ? extractNamedSections(text) : {}

  // Step 5: Highlight salary info
  text = highlightSalaryInfo(text)

  // Step 6: Final cleanup
  text = finalCleanup(text)

  // Step 7: Humanize (remove AI-generated patterns)
  if (humanize) {
    const aiScore = calculateAIScore(text)
    if (aiScore >= humanizeThreshold) {
      text = humanizeRuleBased(text)
    }
  }

  // Safety check: if formatting removed too much content, fallback to cleaned raw
  // This prevents the Somnia bug where content went from 5664 → 0 chars
  if (text.length < raw.length * 0.1 && raw.length > 100) {
    console.warn(`[description-formatter] Formatting removed too much content (${raw.length} → ${text.length}), falling back to cleaned raw`)
    // Do basic cleanup but still remove spam
    text = decode(rawText)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      // Remove Base64 spam codes
      .replace(/\b[A-Za-z0-9+\/]{20,}={1,2}\b/g, '')
      .replace(/\b[A-Za-z][A-Za-z0-9]{30,}\b/g, (match) => {
        const hasLower = /[a-z]/.test(match)
        const hasUpper = /[A-Z]/.test(match)
        const hasNumber = /[0-9]/.test(match)
        if (hasLower && hasUpper && hasNumber) return ''
        return match
      })
      // Remove spam keywords in context
      .replace(/[^.]*\b(CANDYSHOP|YELLOWBIRD|PIZZATIME)\b[^.]*/gi, '')
      .replace(/[^.]*mention\s+(?:the\s+)?word\s+[A-Z]+[^.]*/gi, '')
      .replace(/[^.]*this\s+is\s+a\s+beta\s+feature[^.]*/gi, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  // Truncate if needed
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '\n\n...(truncated)'
  }

  // Calculate metadata
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
  const estimatedReadingTime = Math.ceil(wordCount / 200) // ~200 wpm

  return {
    formatted: text,
    raw,
    sections,
    metadata: {
      hasStructuredSections: Object.keys(sections).length > 0,
      estimatedReadingTime,
      wordCount,
    },
  }
}

// ============================================================================
// Step 1: Clean Raw Text
// ============================================================================

function cleanRawText(text: string, preserveHtml: boolean): string {
  // Decode HTML entities (&amp; → &, &lt; → <, etc.)
  text = decode(text)

  // Handle common encoded characters
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&bull;/gi, '•')
    .replace(/&hellip;/gi, '...')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#8217;/gi, "'")
    .replace(/&#8220;/gi, '"')
    .replace(/&#8221;/gi, '"')
    .replace(/'/g, "'")  // Smart quotes
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')

  // Remove Base64-like spam prevention codes (standalone long alphanumeric strings)
  // Pattern 1: Strings with Base64 padding (ends with = or ==)
  text = text.replace(/\b[A-Za-z0-9+\/]{20,}={1,2}\b/g, '')

  // Pattern 2: Common Base64 spam patterns (IPv6-like encoded strings)
  // These often start with RMj, eyJ, etc.
  text = text.replace(/\b[A-Za-z][A-Za-z0-9+\/]{25,}\b/g, (match) => {
    // Check if it looks like Base64 spam
    const hasLower = /[a-z]/.test(match)
    const hasUpper = /[A-Z]/.test(match)
    const hasNumber = /[0-9]/.test(match)
    // Must have mixed case and numbers, and be random-looking
    if (hasLower && hasUpper && hasNumber && match.length >= 30) {
      // Check it's not a normal word pattern
      if (!/^[A-Z][a-z]+(?:[A-Z][a-z]+)*$/.test(match)) {
        return ''
      }
    }
    return match
  })

  // Pattern 3: Very long random strings without padding
  text = text.replace(/\b([A-Za-z0-9]{50,})\b/g, (match) => {
    return isBase64SpamCode(match) ? '' : match
  })

  if (!preserveHtml) {
    // Convert <br>, <p>, <div> to newlines
    text = text.replace(/<br\s*\/?>/gi, '\n')
    text = text.replace(/<\/p>/gi, '\n\n')
    text = text.replace(/<\/div>/gi, '\n')
    text = text.replace(/<\/li>/gi, '\n')
    text = text.replace(/<\/h[1-6]>/gi, '\n\n')

    // Convert <li> to bullet points
    text = text.replace(/<li[^>]*>/gi, '• ')

    // Convert headers to markdown
    text = text.replace(/<h1[^>]*>/gi, '\n# ')
    text = text.replace(/<h2[^>]*>/gi, '\n## ')
    text = text.replace(/<h3[^>]*>/gi, '\n### ')
    text = text.replace(/<h[4-6][^>]*>/gi, '\n#### ')

    // Convert <strong>, <b> to markdown bold
    text = text.replace(/<(?:strong|b)[^>]*>/gi, '**')
    text = text.replace(/<\/(?:strong|b)>/gi, '**')

    // Convert <em>, <i> to markdown italic
    text = text.replace(/<(?:em|i)[^>]*>/gi, '*')
    text = text.replace(/<\/(?:em|i)>/gi, '*')

    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, ' ')
  }

  // Remove script/style content that might have slipped through
  text = text.replace(/\{[^}]*\}/g, ' ') // CSS-like blocks
  text = text.replace(/\[[^\]]*\]/g, (match) => {
    // Keep if it looks like markdown link text, remove if looks like JS
    if (match.includes('(') || match.includes(';') || match.includes('=')) {
      return ' '
    }
    return match
  })

  // Add line breaks after section headers (text ending with :)
  // Pattern: "Header Text:" followed by content without newline
  text = text.replace(/([A-Z][^.!?\n]{3,50}:)([A-Z])/g, '$1\n\n$2')

  // Add line breaks before common section starters
  text = text.replace(/([.!?])([A-Z][a-z]+\s+(?:the\s+)?(?:Role|Position|Company|Team|Candidate|Responsibilities|Requirements|Benefits|Qualifications|Experience|Skills|About|Overview|Summary|Description|Duties|Tasks):?)/g, '$1\n\n$2')

  // Normalize whitespace
  text = text.replace(/\t/g, '  ')
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.replace(/^\s+|\s+$/gm, '')

  return text.trim()
}

// ============================================================================
// Step 2: Remove Boilerplate
// ============================================================================

function removeBoilerplate(text: string): string {
  // Process line by line for better control
  const lines = text.split('\n')
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim().toLowerCase()

    // Keep if empty (preserve paragraph breaks)
    if (trimmed === '') return true

    // Skip very short lines that are just punctuation
    if (trimmed.length < 3) return false
    if (/^[•\-\*\#\.\,\:\;]+$/.test(trimmed)) return false

    // Check against boilerplate patterns
    for (const pattern of BOILERPLATE_PATTERNS) {
      if (pattern.test(line)) {
        return false
      }
    }

    // Check for common boilerplate phrases (exact match or line start)
    const boilerplatePhrases = [
      'apply now',
      'apply for this job',
      'click to apply',
      'submit application',
      'share on twitter',
      'share on facebook',
      'share on linkedin',
      'follow us on',
      'save this job',
      'report this job',
      'similar jobs',
      'related jobs',
      'view all jobs',
      'sourced from',
      'posted via',
      'cookie policy',
      'privacy policy',
      'terms of service',
      'this is a beta feature',
      'to avoid spam applicants',
      'mention the word',
      'to show you read the job post',
    ]

    // Check for spam prevention code words (all caps words like CANDYSHOP)
    if (/\b[A-Z]{6,}\b/.test(line) && /mention|show|read|word|apply|include/i.test(line)) {
      return false
    }

    // Check for lines containing Base64-like spam codes
    if (/\b[A-Za-z][A-Za-z0-9]{25,}\b/.test(line)) {
      const match = line.match(/\b[A-Za-z][A-Za-z0-9]{25,}\b/)
      if (match) {
        const code = match[0]
        const hasLower = /[a-z]/.test(code)
        const hasUpper = /[A-Z]/.test(code)
        const hasNumber = /[0-9]/.test(code)
        // If it looks like a random code, filter the whole line
        if (hasLower && hasUpper && hasNumber) {
          return false
        }
      }
    }

    for (const phrase of boilerplatePhrases) {
      if (trimmed === phrase || trimmed.startsWith(phrase + ' ')) {
        return false
      }
    }

    return true
  })

  return filteredLines.join('\n')
}

// ============================================================================
// Step 3: Convert to Markdown
// ============================================================================

function convertToMarkdown(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()

    if (!line) {
      inList = false
      result.push('')
      continue
    }

    // Check if this is a section header
    const headerMatch = detectSectionHeader(line)
    if (headerMatch) {
      inList = false
      // Add spacing before header
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('')
      }
      result.push(`## ${headerMatch}`)
      result.push('')
      continue
    }

    // Check if this looks like a list item
    if (isListItem(line)) {
      const content = extractListContent(line)
      if (content) {
        result.push(`- ${content}`)
        inList = true
        continue
      }
    }

    // Check if this should be converted to a list item
    // (starts with capital letter, is short, follows other list items)
    if (inList && line.length < 150 && /^[A-Z가-힣]/.test(line) && !line.includes('.')) {
      result.push(`- ${line}`)
      continue
    }

    // Check for numbered items
    const numberedMatch = line.match(/^(\d+)[\.\)]\s*(.+)/)
    if (numberedMatch) {
      result.push(`${numberedMatch[1]}. ${numberedMatch[2]}`)
      inList = true
      continue
    }

    inList = false
    result.push(line)
  }

  return result.join('\n')
}

function detectSectionHeader(line: string): string | null {
  // Remove leading symbols that might indicate a header
  const cleaned = line.replace(/^[#\*\-•]+\s*/, '').replace(/:$/, '').trim()

  // IMPORTANT: Only match if the ENTIRE line is a header
  // Don't match "About Us: Content here" - only "About Us" or "About Us:"
  // Check if line has substantial content after the header pattern
  for (const { pattern, heading } of SECTION_HEADERS) {
    if (pattern.test(cleaned)) {
      // If the cleaned line is just the header pattern (with maybe trailing colon), it's a header
      // If there's substantial content after, it's NOT a header line
      const originalWithoutColon = line.replace(/:$/, '').trim()
      if (originalWithoutColon.length <= heading.length + 15) {
        // Allow some variation in header text (up to ~15 chars extra)
        return heading
      }
      // Line has content after header - not a standalone header
      return null
    }
  }

  // Check for ALL CAPS headers (likely section headers)
  // Must be standalone (no lowercase content after)
  if (/^[A-Z\s]{5,50}$/.test(cleaned) && !cleaned.includes('  ')) {
    // Title case it
    return cleaned.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

  // Check for headers ending with colon (common pattern)
  // Only if the line ENDS with colon (standalone header)
  if (line.endsWith(':') && line.length < 60 && !line.includes('.')) {
    const headerText = line.slice(0, -1).trim()
    // Check if it matches common header words AND is short enough to be a header
    if (headerText.length < 40 && /^(?:about|overview|description|summary|details|requirements?|qualifications?|responsibilities|duties|benefits?|perks?|compensation|salary|stack|skills?|experience|education)/i.test(headerText)) {
      return headerText
    }
  }

  return null
}

function isListItem(line: string): boolean {
  return /^[\•\-\*\●\○\◦\▸\▹\→\►]\s/.test(line) ||
         /^[a-z]\)\s/i.test(line) ||
         /^\([a-z]\)\s/i.test(line) ||
         /^✓|✔|☑|☐|▪|▫/.test(line)
}

function extractListContent(line: string): string {
  return line
    .replace(/^[\•\-\*\●\○\◦\▸\▹\→\►]\s*/, '')
    .replace(/^[a-z]\)\s*/i, '')
    .replace(/^\([a-z]\)\s*/i, '')
    .replace(/^✓|✔|☑|☐|▪|▫\s*/, '')
    .trim()
}

// ============================================================================
// Step 4: Extract Named Sections
// ============================================================================

function extractNamedSections(text: string): FormatResult['sections'] {
  const sections: FormatResult['sections'] = {}

  const lines = text.split('\n')
  let currentSection: keyof FormatResult['sections'] | null = null
  let currentContent: string[] = []

  const sectionMapping: Record<string, keyof FormatResult['sections']> = {
    'responsibilities': 'responsibilities',
    'what you\'ll do': 'responsibilities',
    '주요 업무': 'responsibilities',
    'requirements': 'requirements',
    'required skills': 'requirements',
    'qualifications': 'requirements',
    '자격 요건': 'requirements',
    'benefits': 'benefits',
    'perks': 'benefits',
    'compensation': 'salary',
    '복리후생': 'benefits',
    'tech stack': 'techStack',
    '기술 스택': 'techStack',
    'about': 'description',
    'about us': 'description',
    '회사 소개': 'description',
  }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        if (currentSection === 'techStack') {
          sections.techStack = currentContent
            .join('\n')
            .split(/[,\n]/)
            .map(s => s.replace(/^[\-\*•]\s*/, '').trim())
            .filter(s => s.length > 0)
        } else {
          sections[currentSection] = currentContent.join('\n').trim()
        }
      }

      // Start new section
      const headerText = line.slice(3).toLowerCase()
      currentSection = sectionMapping[headerText] || null
      currentContent = []
    } else if (currentSection) {
      currentContent.push(line)
    }
  }

  // Save last section
  if (currentSection && currentContent.length > 0) {
    if (currentSection === 'techStack') {
      sections.techStack = currentContent
        .join('\n')
        .split(/[,\n]/)
        .map(s => s.replace(/^[\-\*•]\s*/, '').trim())
        .filter(s => s.length > 0)
    } else {
      sections[currentSection] = currentContent.join('\n').trim()
    }
  }

  return sections
}

// ============================================================================
// Step 5: Highlight Salary Info
// ============================================================================

function highlightSalaryInfo(text: string): string {
  for (const pattern of SALARY_PATTERNS) {
    text = text.replace(pattern, (match) => `**${match}**`)
  }

  // Avoid double bolding
  text = text.replace(/\*{4,}/g, '**')

  return text
}

// ============================================================================
// Step 6: Final Cleanup
// ============================================================================

function finalCleanup(text: string): string {
  // Remove excessive blank lines
  text = text.replace(/\n{3,}/g, '\n\n')

  // Fix broken markdown (unclosed bold/italic)
  const boldCount = (text.match(/\*\*/g) || []).length
  if (boldCount % 2 !== 0) {
    text = text.replace(/\*\*([^*]+)$/, '$1') // Remove unclosed at end
  }

  const italicSingleCount = (text.match(/(?<!\*)\*(?!\*)/g) || []).length
  if (italicSingleCount % 2 !== 0) {
    text = text.replace(/\*([^*]+)$/, '$1')
  }

  // Ensure headers have proper spacing
  text = text.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')
  text = text.replace(/(#{1,6}\s[^\n]+)\n([^\n#])/g, '$1\n\n$2')

  // Clean up list formatting
  text = text.replace(/\n-\s*\n/g, '\n') // Remove empty list items
  text = text.replace(/(\n-[^\n]+)\n(?![-\d#\n])/g, '$1\n\n') // Add space after list blocks

  return text.trim()
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Quick clean function for use in crawlers (lighter weight)
 */
export function quickCleanDescription(text: string): string {
  if (!text) return ''

  // Decode HTML entities
  let cleaned = decode(text)

  // Basic HTML cleanup
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  // Remove boilerplate (quick patterns only)
  cleaned = cleaned
    .replace(/apply\s*now.*/gi, '')
    .replace(/share\s*(?:on|via).*/gi, '')
    .replace(/sourced\s*from.*/gi, '')

  // Normalize whitespace
  cleaned = cleaned
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return cleaned
}

/**
 * Check if description needs formatting (heuristic)
 */
export function needsFormatting(text: string): boolean {
  if (!text || text.length < 100) return false

  // Already has markdown headers
  if (/^#{1,6}\s/m.test(text)) return false

  // Has lots of unformatted text
  const lines = text.split('\n').filter(l => l.trim())
  const avgLineLength = text.length / lines.length

  // Long average line length suggests unformatted text
  if (avgLineLength > 200) return true

  // Has HTML entities
  if (/&(?:amp|lt|gt|nbsp|quot);/i.test(text)) return true

  // Has HTML tags
  if (/<[a-z][^>]*>/i.test(text)) return true

  return false
}

/**
 * Extract tech stack from description
 */
export function extractTechStack(text: string): string[] {
  const techPatterns = [
    // Programming languages
    /\b(?:JavaScript|TypeScript|Python|Rust|Go|Golang|Solidity|Java|C\+\+|Ruby|PHP|Swift|Kotlin|Scala|Haskell|Elixir|Erlang)\b/gi,
    // Frameworks
    /\b(?:React|Vue|Angular|Next\.?js|Node\.?js|Express|Django|Flask|FastAPI|Spring|Rails|Laravel)\b/gi,
    // Blockchain
    /\b(?:Ethereum|Solana|Cosmos|Polkadot|Avalanche|Arbitrum|Optimism|Polygon|zkSync|StarkNet|Sui|Aptos|Near|Web3\.?js|Ethers\.?js|Hardhat|Foundry|Anchor)\b/gi,
    // Databases
    /\b(?:PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|DynamoDB|Supabase|Firebase)\b/gi,
    // Cloud/Infra
    /\b(?:AWS|GCP|Azure|Docker|Kubernetes|Terraform|CI\/CD|GitHub\s*Actions)\b/gi,
  ]

  const found = new Set<string>()

  for (const pattern of techPatterns) {
    const matches = text.match(pattern) || []
    for (const match of matches) {
      found.add(match)
    }
  }

  return Array.from(found)
}
