/**
 * Shared job description cleaning utilities
 *
 * Two functions:
 * - removeNoiseElements($)    – DOM-level removal before text extraction (cheerio)
 * - cleanDescriptionText(text) – regex-based text cleaning (post-extraction & DB cleanup)
 */

import type { CheerioAPI } from 'cheerio'
import { decodeHtmlEntities } from '../scripts/utils/htmlParser'

// ─── DOM-level noise removal (for crawling) ─────────────────────────────────

/**
 * Remove noisy DOM elements before extracting text.
 * Call this on a cloned cheerio element or the page $ before calling extractHTML().
 */
export function removeNoiseElements($: CheerioAPI, root?: ReturnType<CheerioAPI>): void {
  const scope = root ? $(root) : $.root()

  // Standard noise elements
  const removeSelectors = [
    'script', 'style', 'noscript', 'iframe', 'svg',
    'nav', 'header', 'footer',
    // Ads & promos
    '[class*="ad-"]', '[class*="advert"]', '[class*="promo"]', '[class*="banner"]',
    '[class*="sponsored"]',
    // Social sharing
    '[class*="share"]', '[class*="social"]', '[class*="sharing"]',
    // Related/recommended sections
    '[class*="related"]', '[class*="recommended"]', '[class*="similar"]',
    '[class*="you-may"]', '[class*="also-like"]', '[class*="more-jobs"]',
    // Salary comparison widgets
    '[class*="salary-comp"]', '[class*="salary-range"]', '[class*="salary-info"]',
    '[class*="average-salary"]', '[class*="compensation-data"]',
    // Profile/candidate recommendations
    '[class*="candidate"]', '[class*="profile-card"]', '[class*="recommended-profile"]',
    // Chat/AI interview widgets
    '[class*="chat"]', '[class*="interview"]', '[class*="cover-letter"]',
    '[class*="ai-assist"]', '[class*="chatbot"]',
    // Trust/verification UI
    '[class*="trust"]', '[class*="verified-badge"]', '[class*="verification"]',
    // Cookie/consent banners
    '[class*="cookie"]', '[class*="consent"]', '[class*="gdpr"]',
    // Newsletter/signup
    '[class*="newsletter"]', '[class*="subscribe"]', '[class*="signup"]',
    // Sidebar widgets
    '[class*="sidebar"]', '[class*="widget"]',
    // Report/flag
    '[class*="report"]', '[class*="flag-job"]',
    // Bookmark/save
    '[class*="bookmark"]', '[class*="save-job"]',
    // Apply button sections (separate from job content)
    '[class*="apply-section"]', '[class*="apply-btn"]', '[class*="apply-now"]',
    // Comment sections
    '[class*="comment"]', '[class*="discussion"]',
    // Pagination
    '[class*="pagination"]', '[class*="pager"]',
  ]

  for (const sel of removeSelectors) {
    scope.find(sel).remove()
  }
}

// ─── Text-level noise removal (post-extraction & DB cleanup) ────────────────

/**
 * Clean description HTML while PRESERVING formatting tags.
 * Use this when you have HTML content and want to keep structure for rendering.
 */
export function cleanDescriptionHtml(html: string): string {
  if (!html) return ''

  let cleaned = html

  // ── Remove script, style, and other non-content tags ──
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  cleaned = cleaned.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
  cleaned = cleaned.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
  cleaned = cleaned.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')

  // ── Remove inline styles and classes but keep the tags ──
  cleaned = cleaned.replace(/\s+style="[^"]*"/gi, '')
  cleaned = cleaned.replace(/\s+class="[^"]*"/gi, '')
  cleaned = cleaned.replace(/\s+id="[^"]*"/gi, '')

  // ── Decode HTML entities (using shared utility) ──
  cleaned = decodeHtmlEntities(cleaned)

  // ── Remove empty tags ──
  cleaned = cleaned.replace(/<(\w+)[^>]*>\s*<\/\1>/gi, '')

  // ── Normalize whitespace ──
  cleaned = cleaned.replace(/\n[ \t]*\n/g, '\n\n')
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  cleaned = cleaned.replace(/[ \t]+/g, ' ')
  cleaned = cleaned.trim()

  // ── Truncate to 10 000 chars ──
  if (cleaned.length > 10000) {
    cleaned = cleaned.slice(0, 10000)
  }

  return cleaned
}

/**
 * Comprehensive text-based description cleaning.
 * Removes source-site UI text, recommendations, salary widgets, etc.
 * NOTE: This strips ALL HTML tags. Use cleanDescriptionHtml() if you need to preserve formatting.
 */
export function cleanDescriptionText(text: string): string {
  if (!text) return ''

  let cleaned = text

  // ── Decode HTML entities first (using shared utility) ──
  cleaned = decodeHtmlEntities(cleaned)

  // ── Strip leftover HTML tags ──
  cleaned = cleaned.replace(/<[^>]+>/g, '')

  // ── Normalize whitespace before pattern matching ──
  // Convert "\n \n" (newline + spaces + newline) to clean double newline
  cleaned = cleaned.replace(/\n[ \t]*\n/g, '\n\n')

  // ── Junk patterns (order matters: broader patterns last) ──
  const junkPatterns: RegExp[] = [
    // ── web3.career specific: "Recommended Web3 X for this job" + profile blocks ──
    /Recommended\s+Web3\s+[\w\s]+(?:for this job|Developers?|Engineers?|Managers?|Designers?)[\s\S]*?(?=\n\n(?:[A-Z][\w]|$)|$)/gi,
    /Hire\s+Web3\s+[\w\s]+[\s\S]*?(?=\n\n(?:[A-Z][\w]|$)|$)/gi,

    // ── web3.career Stimulus.js chat form controller artifacts ──
    /chat#\w+[\s\S]*?(?:action="\/chat"[\s\S]*?)?(?=\n\n|$)/g,
    /\w+#\w+\s+\w+->[\s\S]*?(?=\n\n|$)/g,
    /action="[^"]*"\s*accept-charset[^"]*"[\s\S]*?(?=\n\n|$)/g,

    // ── "Apply Now:" followed by source site UI ──
    /Apply\s*(?:Now|for this job)\s*:?\s*\n[\s\S]*?(?=\n\n(?:[A-Z][\w])|$)/gi,

    // ── Profile names / recommendation blocks (See Profile pattern) ──
    /(?:\n\s*\w+\n\s*\n\s*\n\s*(?:\$[\d,]+k?\/year)?\s*\n?\s*[\w\s]+\n\s*See Profile\s*\n?)+/gi,
    /See\s+Profile/gi,

    // ── "X ago \n Apply" timestamp + apply button pattern ──
    /\d+[dwmhy]\s+ago\s*\n\s*Apply\b/gi,

    // ── Receive email notifications pattern ──
    /Receive\s*\n[\s\S]*?email-suggestions[\s\S]*?(?=\n\n|$)/gi,
    /email-suggestions#\w+/g,

    // ── Similar / Related / Recommended Jobs ──
    /similar\s*(?:web3\s*)?jobs?\s*[:\-]?\s*[\s\S]*?(?=\n\n|$)/gi,
    /related\s*(?:web3\s*)?jobs?\s*[:\-]?\s*[\s\S]*?(?=\n\n|$)/gi,
    /recommended\s*(?:web3\s*)?(?:jobs?|positions?|for you)\s*[:\-]?\s*[\s\S]*?(?=\n\n|$)/gi,
    /you\s*(?:may|might)\s*(?:also\s*)?like[\s\S]*?(?=\n\n|$)/gi,
    /more\s*(?:web3\s*)?jobs?\s*(?:at|from|like|in)[\s\S]*?(?=\n\n|$)/gi,
    /other\s*(?:open\s*)?(?:positions?|jobs?|roles?)\s*(?:at|from|in)[\s\S]*?(?=\n\n|$)/gi,
    /browse\s*(?:more\s*)?(?:web3\s*)?jobs?[\s\S]*?(?=\n\n|$)/gi,

    // ── Average Salary / Salary Comparison ──
    /(?:average|median|typical)\s*(?:web3\s*)?\w+\s*(?:manager|developer|engineer|designer|analyst)?\s*salary[\s\S]*?(?=\n\n|$)/gi,
    /web3\s+\w+(?:\s+\w+)?\s+salary[\s\S]*?(?=\n\n|$)/gi,
    /salary\s*(?:range|comparison|data|estimate|benchmark)[\s\S]*?(?=\n\n|$)/gi,
    /compensation\s*(?:data|range|overview)[\s\S]*?(?=\n\n|$)/gi,
    /(?:how\s*much\s*(?:does|do)\s*(?:a\s*)?web3)[\s\S]*?(?=\n\n|$)/gi,

    // ── Recommended Profiles / People ──
    /recommended\s*(?:web3\s*)?\w+\s*(?:managers?|developers?|engineers?|designers?)[\s\S]*?(?=\n\n|$)/gi,
    /(?:top|best)\s*(?:web3\s*)?\w+\s*(?:managers?|developers?|engineers?)\s*(?:profiles?|candidates?)[\s\S]*?(?=\n\n|$)/gi,
    /featured\s*(?:candidates?|profiles?|talent)[\s\S]*?(?=\n\n|$)/gi,

    // ── Cover Letter / AI Interview ──
    /cover\s*letter[\s\S]*?(?=\n\n|$)/gi,
    /ai\s*(?:interview|assistant|help)[\s\S]*?(?=\n\n|$)/gi,
    /generate\s*(?:a\s*)?cover\s*letter[\s\S]*?(?=\n\n|$)/gi,
    /prepare\s*(?:for\s*)?(?:the\s*)?interview[\s\S]*?(?=\n\n|$)/gi,
    /practice\s*interview[\s\S]*?(?=\n\n|$)/gi,

    // ── Share / Report / Bookmark UI text ──
    /share\s*(?:this\s*)?(?:job|position)?:?\s*/gi,
    /(?:^|\n)\s*(?:share|tweet|post|email)\s*(?:this)?(?:\s*(?:job|position))?:?\s*(?:\n|$)/gim,
    /share\s*(?:on|via)\s*(?:twitter|facebook|linkedin|telegram|email|x)[\s\S]*?(?:\n|$)/gi,
    /report\s*(?:this\s*)?(?:job|position|listing)[\s\S]*?(?:\n|$)/gi,
    /(?:save|bookmark)\s*(?:this\s*)?(?:job|position|listing)[\s\S]*?(?:\n|$)/gi,
    /flag\s*(?:this\s*)?(?:job|listing)[\s\S]*?(?:\n|$)/gi,
    /get\s*a\s*\w+\.?\w*\s*short\s*link/gi,

    // ── Trust Check / Verification UI ──
    /(?:verified|trust)\s*(?:check|badge|score)[\s\S]*?(?:looking\s*good\s*ser|passed|✓|✔)[\s\S]*?(?:\n|$)/gi,
    /trust\s*(?:score|check|level|rating)\s*[:\-]?\s*[\s\S]*?(?:\n\n|$)/gi,
    /(?:this\s*(?:job|company)\s*(?:is|has\s*been)\s*)?verified[\s\S]*?(?:\n|$)/gi,
    /looking\s*good\s*ser/gi,

    // ── Source site navigation/UI ──
    /(?:^|\n)\s*(?:home|about\s*us|contact|login|sign\s*(?:in|up)|register|my\s*account)\s*(?:\n|$)/gim,
    /(?:^|\n)\s*(?:back\s*to\s*(?:jobs?|search|home|results))\s*(?:\n|$)/gim,
    /(?:^|\n)\s*(?:apply\s*now|apply\s*for\s*this)\s*(?:\n|$)/gim,
    /(?:^|\n)\s*(?:search\s*(?:web3\s*)?jobs?)\s*(?:\n|$)/gim,
    /follow\s*us\s*(?:on)?[\s\S]*?(?:\n|$)/gi,
    /join\s*our\s*(?:community|discord|telegram)[\s\S]*?(?:\n|$)/gi,

    // ── Cookie / Privacy / Legal ──
    /(?:we\s*use\s*cookies|cookie\s*policy|privacy\s*policy)[\s\S]*?(?:\n\n|$)/gi,
    /(?:accept|decline)\s*(?:all\s*)?cookies?/gi,
    /(?:terms\s*(?:of\s*(?:service|use))|privacy\s*(?:notice|statement))[\s\S]*?(?:\n\n|$)/gi,

    // ── Company hiring boilerplate ──
    /\w+\s+is\s+hiring\s+(?:a\s+)?(?:remote\s+)?(?:web3\s+)?\w*\s*\n/gi,
    /remote\s+\w+\s*\n\s*\n/gi,

    // ── JS / CSS / Stimulus artifacts ──
    /function\s*\([^)]*\)\s*\{[^}]*\}/g,
    /var\s+\w+\s*=\s*[^;]+;/g,
    /const\s+\w+\s*=\s*[^;]+;/g,
    /let\s+\w+\s*=\s*[^;]+;/g,
    /\$\([^)]+\)\./g,
    /document\.\w+/g,
    /window\.\w+/g,
    /addEventListener\([^)]+\)/g,
    /querySelector\([^)]+\)/g,
    /@media\s*\([^)]+\)\s*\{[^}]*\}/g,
    /\.[a-z_-]+\s*\{[^}]*\}/gi,
    /data-\w+(?:-\w+)*="[^"]*"/g,

    // ── Footer boilerplate ──
    /(?:^|\n)©\s*\d{4}[\s\S]*?(?:\n\n|$)/gi,
    /all\s*rights?\s*reserved/gi,

    // ── Ads / Sponsored ──
    /(?:advertisement|sponsored|promoted)[\s\S]*?(?:\n\n|$)/gi,

    // ── Loading / Spinner text ──
    /loading\.{3,}/gi,
    /please\s*wait/gi,

    // ── Form element labels ──
    /(?:^|\n)\s*(?:submit|cancel|reset|clear)\s*(?:\n|$)/gim,

    // ── Email artifacts ──
    /\[email\s*protected\]/gi,

    // ── Literal backslash-n ──
    /\\n/g,

    // ── Bare domain names ──
    /(?:^|\n)\s*\w+\.(?:com|io|co|org|net)\s*(?:\n|$)/gim,

    // ── Empty bullet points ──
    /^•\s*$/gm,

    // ── Salary amount lines from profile recommendations (e.g. "$24k/year") ──
    /^\s*\$[\d,]+k?\/year\s*$/gm,

    // ── Orphaned short lines (likely leftover UI fragments, 1-2 words) ──
    // Only match lines that are clearly not content (very short + common UI words)
    /^\s*(?:Apply|View|Details|Read More|Load More|Show More|See All|Next|Previous|Close)\s*$/gim,

    // ── Location line artifacts from source site ──
    /Location:\s*[\w\s,]+\s*$/gim,
    /Compensation:\s*\n/gim,
  ]

  for (const pattern of junkPatterns) {
    cleaned = cleaned.replace(pattern, '\n\n')
  }

  // ── Final whitespace cleanup ──
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/g, '')

  // ── Discard if too short after cleaning (likely all noise) ──
  if (cleaned.length < 30) return ''

  // ── Truncate to 10 000 chars ──
  if (cleaned.length > 10000) {
    cleaned = cleaned.slice(0, 10000)
  }

  return cleaned
}
