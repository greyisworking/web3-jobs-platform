/**
 * Shared job description cleaning utilities
 *
 * Two functions:
 * - removeNoiseElements($)    – DOM-level removal before text extraction (cheerio)
 * - cleanDescriptionText(text) – regex-based text cleaning (post-extraction & DB cleanup)
 */

import type { CheerioAPI } from 'cheerio'

// ─── DOM-level noise removal (for crawling) ─────────────────────────────────

/**
 * Remove noisy DOM elements before extracting text.
 * Call this on a cloned cheerio element or the page $ before calling extractHTML().
 */
export function removeNoiseElements($: CheerioAPI, root?: any): void {
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
 * Comprehensive text-based description cleaning.
 * Removes source-site UI text, recommendations, salary widgets, etc.
 */
export function cleanDescriptionText(text: string): string {
  if (!text) return ''

  let cleaned = text

  // ── Strip leftover HTML tags ──
  cleaned = cleaned.replace(/<[^>]+>/g, '')

  // ── HTML entities ──
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/&#\d+;/g, ' ')

  // ── Junk patterns (order matters: broader patterns last) ──
  const junkPatterns: RegExp[] = [
    // ── Similar / Related / Recommended Jobs ──
    /similar\s*(?:web3\s*)?jobs?\s*[:\-]?\s*[\s\S]*?(?=\n{2,}|$)/gi,
    /related\s*(?:web3\s*)?jobs?\s*[:\-]?\s*[\s\S]*?(?=\n{2,}|$)/gi,
    /recommended\s*(?:web3\s*)?(?:jobs?|positions?|for you)\s*[:\-]?\s*[\s\S]*?(?=\n{2,}|$)/gi,
    /you\s*(?:may|might)\s*(?:also\s*)?like[\s\S]*?(?=\n{2,}|$)/gi,
    /more\s*(?:web3\s*)?jobs?\s*(?:at|from|like|in)[\s\S]*?(?=\n{2,}|$)/gi,
    /other\s*(?:open\s*)?(?:positions?|jobs?|roles?)\s*(?:at|from|in)[\s\S]*?(?=\n{2,}|$)/gi,
    /browse\s*(?:more\s*)?(?:web3\s*)?jobs?[\s\S]*?(?=\n{2,}|$)/gi,

    // ── Average Salary / Salary Comparison ──
    /(?:average|median|typical)\s*(?:web3\s*)?\w+\s*(?:manager|developer|engineer|designer|analyst)?\s*salary[\s\S]*?(?=\n{2,}|$)/gi,
    /web3\s+\w+(?:\s+\w+)?\s+salary[\s\S]*?(?=\n{2,}|$)/gi,
    /salary\s*(?:range|comparison|data|estimate|benchmark)[\s\S]*?(?=\n{2,}|$)/gi,
    /compensation\s*(?:data|range|overview)[\s\S]*?(?=\n{2,}|$)/gi,
    /(?:how\s*much\s*(?:does|do)\s*(?:a\s*)?web3)[\s\S]*?(?=\n{2,}|$)/gi,
    /\$[\d,]+(?:k)?\s*[-–]\s*\$[\d,]+(?:k)?\s*(?:per\s*year|\/yr|annually)?(?:\s*(?:USD|EUR|GBP))?[\s\S]*?(?=\n{2,}|$)/gi,

    // ── Recommended Profiles / People ──
    /recommended\s*(?:web3\s*)?\w+\s*(?:managers?|developers?|engineers?|designers?)[\s\S]*?(?=\n{2,}|$)/gi,
    /(?:top|best)\s*(?:web3\s*)?\w+\s*(?:managers?|developers?|engineers?)\s*(?:profiles?|candidates?)[\s\S]*?(?=\n{2,}|$)/gi,
    /featured\s*(?:candidates?|profiles?|talent)[\s\S]*?(?=\n{2,}|$)/gi,

    // ── Cover Letter / AI Interview ──
    /cover\s*letter[\s\S]*?(?=\n{2,}|$)/gi,
    /ai\s*(?:interview|assistant|help)[\s\S]*?(?=\n{2,}|$)/gi,
    /generate\s*(?:a\s*)?cover\s*letter[\s\S]*?(?=\n{2,}|$)/gi,
    /prepare\s*(?:for\s*)?(?:the\s*)?interview[\s\S]*?(?=\n{2,}|$)/gi,
    /practice\s*interview[\s\S]*?(?=\n{2,}|$)/gi,

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
    /trust\s*(?:score|check|level|rating)\s*[:\-]?\s*[\s\S]*?(?:\n{2,}|$)/gi,
    /(?:this\s*(?:job|company)\s*(?:is|has\s*been)\s*)?verified[\s\S]*?(?:\n|$)/gi,
    /looking\s*good\s*ser/gi,
    /ngmi|wagmi|gm\s*ser/gi,

    // ── Source site navigation/UI ──
    /(?:^|\n)\s*(?:home|about\s*us|contact|login|sign\s*(?:in|up)|register|my\s*account)\s*(?:\n|$)/gim,
    /(?:^|\n)\s*(?:back\s*to\s*(?:jobs?|search|home|results))\s*(?:\n|$)/gim,
    /(?:^|\n)\s*(?:apply\s*now|apply\s*for\s*this)\s*(?:\n|$)/gim,
    /(?:^|\n)\s*(?:search\s*(?:web3\s*)?jobs?)\s*(?:\n|$)/gim,
    /follow\s*us\s*(?:on)?[\s\S]*?(?:\n|$)/gi,
    /join\s*our\s*(?:community|discord|telegram)[\s\S]*?(?:\n|$)/gi,

    // ── Cookie / Privacy / Legal ──
    /(?:we\s*use\s*cookies|cookie\s*policy|privacy\s*policy)[\s\S]*?(?:\n{2,}|$)/gi,
    /(?:accept|decline)\s*(?:all\s*)?cookies?/gi,
    /(?:terms\s*(?:of\s*(?:service|use))|privacy\s*(?:notice|statement))[\s\S]*?(?:\n{2,}|$)/gi,

    // ── Company hiring boilerplate ──
    /\w+\s+is\s+hiring\s+(?:a\s+)?(?:remote\s+)?(?:web3\s+)?\w*\s*\n/gi,
    /remote\s+\w+\s*\n\s*\n/gi,

    // ── JS / CSS artifacts ──
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

    // ── Footer boilerplate ──
    /(?:^|\n)©\s*\d{4}[\s\S]*?(?:\n{2,}|$)/gi,
    /all\s*rights?\s*reserved/gi,

    // ── Ads / Sponsored ──
    /(?:advertisement|sponsored|promoted)[\s\S]*?(?:\n{2,}|$)/gi,

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
