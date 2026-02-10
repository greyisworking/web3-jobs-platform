/**
 * Frontend-side job description sanitizer.
 * Runs at render time to strip source-site UI noise from job descriptions.
 * Works on HTML strings (used with dangerouslySetInnerHTML).
 */

/** Patterns to remove — order matters (specific first, broad last) */
const NOISE_PATTERNS: RegExp[] = [
  // ── Diversity/EEO boilerplate ──
  /We\s+(?:know\s+that\s+)?(?:are\s+(?:an?\s+)?)?(?:equal\s+opportunity|committed\s+to\s+(?:diversity|building\s+a\s+diverse)|believe\s+(?:in\s+)?(?:diversity|that\s+diversity))[\s\S]*?(?:protected\s+(?:class|characteristics?|status)|without\s+regard\s+to\s+(?:race|gender)|affirmative\s+action|accommodation|disability)[\s\S]*?(?:\.\s*\n|\.\s*$)/gi,
  /(?:Equal\s+Opportunity|EEO)\s+(?:Employer|Statement)[\s\S]*?(?:\.\s*\n|\.\s*$)/gi,
  /We\s+(?:celebrate|embrace|value)\s+diversity[\s\S]*?(?:\.\s*\n|\.\s*$)/gi,
  /(?:We\s+)?(?:don'?t|do\s+not)\s+discriminate[\s\S]*?(?:\.\s*\n|\.\s*$)/gi,
  /All\s+qualified\s+applicants\s+will\s+receive\s+consideration[\s\S]*?(?:\.\s*\n|\.\s*$)/gi,
  /We\s+encourage\s+(?:all\s+)?(?:qualified\s+)?(?:candidates|applicants|individuals)[\s\S]*?(?:apply|to\s+apply)[\s\S]*?(?:\.\s*\n|\.\s*$)/gi,

  // ── "Apply Now:" and everything after ──
  /Apply\s*(?:Now|for this job)\s*:?\s*[\s\S]*$/i,

  // ── web3.career: "Recommended Web3 X for this job" + profile blocks ──
  /Recommended\s+Web3\s+[\w\s]+(?:for this job|Developers?|Engineers?|Managers?|Designers?)[\s\S]*/gi,
  /Hire\s+Web3\s+[\w\s]+[\s\S]*/gi,

  // ── Profile recommendation blocks (See Profile) ──
  /(?:\n\s*\w+\n\s*\n\s*(?:\$[\d,]+k?\/year)?\s*\n?\s*[\w\s]+\n\s*See Profile\s*\n?)+[\s\S]*/gi,
  /See\s+Profile/gi,

  // ── Stimulus.js / chat controller artifacts ──
  /chat#\w+[\s\S]*/g,
  /\w+#\w+\s+\w+->[\s\S]*/g,
  /action="[^"]*"\s*accept-charset[\s\S]*/g,
  /data-\w+(?:-\w+)*="[^"]*"/g,

  // ── Share / Social / Bookmark (standalone words on their own line) ──
  /Share\s*(?:this\s*)?(?:job|position)?[\s\S]*?(?:Twitter|Facebook|LinkedIn|Telegram|URL|Email|X)[\s\S]*?(?:\n|$)/gi,
  /(?:^|\n)\s*(?:Share|Tweet|Post)\s*\n/gim,
  /(?:^|\n)\s*URL\s*\n/gim,
  /(?:^|\n)\s*(?:Twitter|LinkedIn|Telegram|Bookmark)\s*$/gim,
  // Standalone "Apply Now", "Share", "Bookmark" on their own line
  /^\s*Apply\s*Now\s*$/gim,
  /^\s*Share\s*$/gim,
  /^\s*Bookmark\s*$/gim,

  // ── Trust / Verification ──
  /VERIFIED[\s\S]*?(?:Trust Check|passed|looking good)[\s\S]*?(?:\n|$)/gi,
  /Trust\s*Check\s*passed/gi,
  /VERIFIED\s*Trust\s*Check\s*passed/gi,

  // ── Report ──
  /Report\s*(?:this\s*)?(?:company|job|listing)[\s\S]*?(?:\n|$)/gi,

  // ── Sourced from web3.career / source attribution ──
  /Sourced\s*from\s*web3\.career[\s\S]*?(?:\n|$)/gi,
  /Sourced\s*from\s*[\w.]+[\s\S]*?(?:\n|$)/gi,

  // ── Email noise ──
  /\[email(?:\s*protected)?\]/gi,

  // ── "Receive email" notification widgets ──
  /Receive\s*[\s\S]*?email-suggestions[\s\S]*?(?:\n\n|$)/gi,
  /email-suggestions#\w+/g,

  // ── Salary amount lines from profile recommendations ──
  /^\s*\$[\d,]+k?\/year\s*$/gm,

  // ── "Tech Stack" heading and everything after (already shown as tags) ──
  /(?:^|\n)\s*(?:#{1,3}\s*)?Tech\s*Stack\s*:?\s*\n[\s\S]*$/gi,

  // ── Duplicate email addresses (real emails like user@example.com) ──
  // Keeps first occurrence, handled separately in cleanJobDisplay()

  // ── Orphaned UI labels ──
  /^\s*(?:Apply|View|Details|Read More|Load More|Show More|See All|Close)\s*$/gim,

  // ── Timestamp + Apply button pattern ──
  /\d+[dwmhy]\s+ago\s*\n\s*Apply\b/gi,

  // ── Location/Compensation artifacts from source ──
  /^\s*Location:\s*[\w\s,]+\s*$/gim,
  /^\s*Compensation:\s*$/gim,
]

/**
 * Remove duplicate sections.
 * If "Requirements" or "Benefits & Perks" heading appears in description
 * but is already rendered as a separate section, strip the duplicate.
 */
const DUPLICATE_SECTION_HEADINGS = [
  /(?:^|\n)\s*(?:#{1,3}\s*)?Requirements?\s*:?\s*\n/gi,
  /(?:^|\n)\s*(?:#{1,3}\s*)?Benefits?\s*(?:&\s*Perks?)?\s*:?\s*\n/gi,
  /(?:^|\n)\s*(?:#{1,3}\s*)?Responsibilities?\s*:?\s*\n/gi,
]

// ── Section headings that deserve a double line break before them ──
const SECTION_HEADINGS = [
  'About (?:the |Us|Company)',
  'Key Responsibilities',
  'Qualifications',
  'Requirements',
  'Responsibilities',
  'Benefits',
  'What (?:You\'ll|We) (?:Do|Offer|Need|Bring|Expect)',
  'Who (?:You Are|We Are|Are We)',
  'How (?:to Apply|You\'ll)',
  'Why (?:Join|Work)',
  'Job (?:Description|Summary|Requirements)',
  'Role (?:Summary|Overview|Description)',
  'Our (?:Team|Mission|Values|Culture)',
  'Your (?:Role|Responsibilities|Impact)',
  'Preferred (?:Qualifications|Skills)',
  'Required (?:Qualifications|Skills)',
  'Nice to Have',
  'Bonus Points',
  'Perks',
  'Compensation',
]

// ── Sentence-start patterns that should be on their own line ──
const SENTENCE_STARTERS = [
  'Deep knowledge of',
  'Experience (?:administering|with|in|managing|building|designing|developing|deploying|working)',
  'Familiarity with',
  'Proficiency (?:in|with)',
  'Strong (?:understanding|knowledge|experience|background|communication|analytical)',
  'Ability to',
  'Proven (?:experience|track record|ability)',
  'Excellent (?:communication|problem|written|verbal|analytical)',
  'Bachelor(?:\'s)?\\s*(?:degree|in)',
  'Master(?:\'s)?\\s*(?:degree|in)',
  '\\d+\\+?\\s*years?\\s*(?:of\\s*)?(?:experience|working)',
  'Understanding of',
  'Knowledge of',
  'Comfortable (?:with|working)',
  'Passion(?:ate)? (?:for|about)',
  'Must (?:have|be)',
  'You (?:will|are|have|should|must)',
  'We (?:are|offer|provide|expect|need)',
  'The (?:ideal|successful|role|position|team|candidate)',
  'This (?:role|position|is)',
  'As (?:a|an|the)',
  'Work(?:ing)? (?:with|closely|alongside)',
  'Design(?:ing)? (?:and|,)',
  'Build(?:ing)? (?:and|,)',
  'Develop(?:ing)? (?:and|,)',
  'Lead(?:ing)? (?:the|a|and)',
  'Manage(?:ing)? (?:the|a|and)',
  'Collaborate(?:ing)? (?:with|closely|across)',
  'Participate(?:ing)? in',
  'Responsible for',
  'Ensure(?:ing)? ',
  'Implement(?:ing)? ',
  'Maintain(?:ing)? ',
  'Support(?:ing)? ',
  'Research(?:ing)? ',
  'Monitor(?:ing)? ',
  'Create(?:ing)? ',
  'Conduct(?:ing)? ',
  'Analyze(?:ing)? ',
  'Communicate(?:ing)? ',
]

/**
 * Add structure to plain-text job descriptions.
 * Inserts line breaks before section headings, numbered items, and sentence starters.
 */
function formatPlainTextDescription(text: string): string {
  let result = text

  // 1) Break before section headings — capture heading to avoid partial re-matches
  //    Also handle headings at the very start of the text
  const sectionPattern = '(?:' + SECTION_HEADINGS.join('|') + ')'
  const sectionMidRe = new RegExp('(?<=\\S)\\s*(' + sectionPattern + ')', 'gi')
  result = result.replace(sectionMidRe, '\n\n$1\n')
  // Handle heading at start of string
  const sectionStartRe = new RegExp('^(' + sectionPattern + ')(?=\\S)', 'i')
  result = result.replace(sectionStartRe, '$1\n')

  // 2) Normalize numbered items: "1.Market" → "1. Market" (add space after dot if missing)
  result = result.replace(/(\d+\.)(?=[A-Za-z])/g, '$1 ')

  // 3) Break before numbered list items glued to text
  result = result.replace(/(?<=\S)\s*(?=\d+\.\s[A-Z0-9])/g, '\n')

  // 4) Break before sentence starters — after sentence-ending punctuation (with or without space)
  //    Exclude numbered list periods (e.g. "2. Collaborate") with negative lookbehind for digits
  const sentenceRe = new RegExp(
    '(?<!\\d)([.!?;)])\\s*(?=' + SENTENCE_STARTERS.join('|') + ')',
    'g'
  )
  result = result.replace(sentenceRe, '$1\n')

  // 5) Generic sentence boundary: period/!/? or colon directly followed by capital letter (no space)
  //    e.g. "environment.We" → "environment.\nWe", "Strategy:Develop" → "Strategy:\nDevelop"
  result = result.replace(/(?<!\d)([.!?:])(?=[A-Z][a-z])/g, '$1\n')

  // 6) Break before common field labels glued to text
  //    e.g. "RepresentativeLocation:" → "Representative\nLocation:"
  result = result.replace(
    /(?<=\S)\s*(?=(?:Location|Company|Contact|Email|Phone|Salary|Type|Category|Industry|Department)\s*:)/gi,
    '\n'
  )

  // 7) Format "SubTitle:" patterns as bold (e.g. "Platform Administration:")
  result = result.replace(
    /(?:^|\n)([A-Z][\w\s&/''-]{2,40})\s*:\s*(?=\n|[A-Z])/gm,
    '\n\n<strong>$1:</strong>\n'
  )

  // 8) Format ALL-CAPS headings as bold (e.g. "KEY RESPONSIBILITIES")
  result = result.replace(
    /(?:^|\n)([A-Z][A-Z\s&/'-]{3,40})(?=\n)/gm,
    (match, heading) => {
      if (heading === heading.toUpperCase() && heading.trim().length > 3) {
        return '\n\n<strong>' + heading.trim() + '</strong>\n'
      }
      return match
    }
  )

  // 6) Separate concatenated tech stack tags (e.g. "engineercryptodefi" → "engineer crypto defi")
  const TECH_KW = 'engineer|developer|solidity|rust|typescript|javascript|react|node|python|go|blockchain|crypto|defi|nft|web3|smart\\s*contract|aws|docker|kubernetes|ethereum|solana|cosmos|polkadot|substrate|graphql|sql|nosql|mongodb|postgresql|redis|api|sdk|frontend|backend|fullstack|full[\\s-]stack|devops|security|audit|protocol|dapp|token|staking|bridge|oracle|layer[\\s-]?[12]|zk|zero[\\s-]knowledge|rollup|l1|l2'
  const techConcatRe = new RegExp('\\b(' + TECH_KW + ')((?:' + TECH_KW + ')+)\\b', 'gi')
  const techSplitRe = new RegExp(TECH_KW, 'gi')
  result = result.replace(techConcatRe, (match, first, rest) => {
    const kw = rest.match(techSplitRe)
    return kw && kw.length > 0 ? first + ' ' + kw.join(' ') : match
  })

  // 7) Convert \n → <br> for HTML rendering
  result = result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')

  return result
}

/**
 * Clean a job description HTML string for display.
 * Strips source-site UI noise while preserving actual job content.
 */
export function cleanJobDisplay(html: string | null | undefined): string {
  if (!html) return ''

  let cleaned = html

  // Apply noise patterns
  for (const pattern of NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '')
  }

  // Deduplicate email addresses — keep only the first occurrence
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const seenEmails = new Set<string>()
  cleaned = cleaned.replace(emailRe, (match) => {
    const lower = match.toLowerCase()
    if (seenEmails.has(lower)) return ''
    seenEmails.add(lower)
    return match
  })

  // ── Format plain-text descriptions (few/no HTML tags) ──
  const htmlTagCount = (cleaned.match(/<[a-z]/gi) || []).length
  if (htmlTagCount < 5) {
    cleaned = formatPlainTextDescription(cleaned)
  }

  // Fix common encoding issues (HTML entities that weren't decoded)
  cleaned = cleaned
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')

  // Clean up whitespace
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(<br\s*\/?>){3,}/gi, '<br/><br/>')
    .trim()

  return cleaned
}

/**
 * Clean description and remove sections that are already rendered separately.
 * Use this when requirements/responsibilities/benefits are shown as separate sections.
 */
export function cleanJobDisplayWithSections(
  html: string | null | undefined,
  hasSeparateSections: { requirements?: boolean; responsibilities?: boolean; benefits?: boolean }
): string {
  let cleaned = cleanJobDisplay(html)

  if (hasSeparateSections.requirements) {
    for (const p of DUPLICATE_SECTION_HEADINGS.filter((_, i) => i === 0)) {
      cleaned = cleaned.replace(p, '\n')
    }
  }
  if (hasSeparateSections.benefits) {
    for (const p of DUPLICATE_SECTION_HEADINGS.filter((_, i) => i === 1)) {
      cleaned = cleaned.replace(p, '\n')
    }
  }
  if (hasSeparateSections.responsibilities) {
    for (const p of DUPLICATE_SECTION_HEADINGS.filter((_, i) => i === 2)) {
      cleaned = cleaned.replace(p, '\n')
    }
  }

  return cleaned.replace(/\n{3,}/g, '\n\n').trim()
}
