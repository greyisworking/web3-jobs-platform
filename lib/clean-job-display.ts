/**
 * Frontend-side job description sanitizer.
 * Runs at render time to strip source-site UI noise from job descriptions.
 * Works on HTML strings (used with dangerouslySetInnerHTML).
 */

/** Patterns to remove — order matters (specific first, broad last) */
const NOISE_PATTERNS: RegExp[] = [
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

  // ── Share / Social ──
  /Share\s*(?:this\s*)?(?:job|position)?[\s\S]*?(?:Twitter|Facebook|LinkedIn|Telegram|URL|Email|X)[\s\S]*?(?:\n|$)/gi,
  /(?:^|\n)\s*(?:Share|Tweet|Post)\s*\n/gim,
  /(?:^|\n)\s*URL\s*\n/gim,
  /(?:^|\n)\s*(?:Twitter|LinkedIn|Telegram|Bookmark)\s*$/gim,

  // ── Trust / Verification ──
  /VERIFIED[\s\S]*?(?:Trust Check|passed|looking good)[\s\S]*?(?:\n|$)/gi,
  /Trust\s*Check\s*passed/gi,

  // ── Report ──
  /Report\s*(?:this\s*)?(?:company|job|listing)[\s\S]*?(?:\n|$)/gi,

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
