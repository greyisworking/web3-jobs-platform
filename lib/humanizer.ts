/**
 * Job Description Humanizer
 *
 * Transforms AI-generated or overly corporate job descriptions
 * into more natural, human-sounding text.
 *
 * Features:
 * - Rule-based transformations (fast, cheap)
 * - AI-powered rewriting (optional, for stubborn cases)
 */

// ============================================================================
// AI Detection Patterns
// ============================================================================

/**
 * Common AI writing indicators (based on Wikipedia's "Signs of AI writing")
 */
const AI_INDICATORS = {
  // Overused AI words
  aiWords: [
    'leverage', 'utilize', 'facilitate', 'streamline', 'optimize',
    'synergy', 'synergize', 'paradigm', 'holistic', 'robust',
    'cutting-edge', 'state-of-the-art', 'best-in-class', 'world-class',
    'innovative', 'revolutionary', 'transformative', 'disruptive',
    'empower', 'enable', 'enhance', 'elevate', 'cultivate',
    'spearhead', 'champion', 'drive', 'foster', 'nurture',
    'seamless', 'seamlessly', 'effortlessly', 'efficiently',
    'passionate', 'enthusiasm', 'thrilled', 'excited',
    'journey', 'landscape', 'ecosystem', 'sphere',
    'delve', 'dive deep', 'deep dive', 'unpack',
    'navigate', 'embark', 'endeavor', 'strive',
    'meticulous', 'meticulously', 'comprehensive', 'comprehensively',
    'multifaceted', 'dynamic', 'ever-evolving', 'fast-paced',
    'moreover', 'furthermore', 'additionally', 'consequently',
    'in conclusion', 'to summarize', 'in summary',
    'it is important to note', 'it should be noted',
    'needless to say', 'without a doubt',
  ],

  // Negative parallelisms ("not just X, but Y")
  negativeParallelisms: [
    /not just .+?, but (?:also )?/gi,
    /not only .+?, but (?:also )?/gi,
    /more than just/gi,
  ],

  // Rule of three patterns
  ruleOfThree: [
    /(\w+), (\w+), and (\w+)/g,  // "fast, reliable, and secure"
  ],

  // Em dash overuse
  emDashOveruse: /—/g,

  // Excessive conjunctive phrases
  conjunctivePhrases: [
    'as a result', 'in addition', 'on the other hand',
    'in this regard', 'with this in mind', 'to this end',
    'in light of', 'given that', 'in order to',
    'with respect to', 'in terms of', 'when it comes to',
  ],

  // Corporate filler phrases
  fillerPhrases: [
    'at the end of the day',
    'move the needle',
    'circle back',
    'touch base',
    'take it to the next level',
    'think outside the box',
    'hit the ground running',
    'low-hanging fruit',
    'value-add',
    'win-win',
    'game-changer',
    'core competency',
    'key stakeholders',
    'strategic alignment',
    'action items',
    'deliverables',
    'bandwidth',
    'synergistic',
  ],
}

// ============================================================================
// Replacement Maps
// ============================================================================

const WORD_REPLACEMENTS: Record<string, string[]> = {
  'leverage': ['use', 'apply', 'work with'],
  'utilize': ['use', 'work with'],
  'facilitate': ['help with', 'support', 'enable'],
  'streamline': ['simplify', 'improve', 'speed up'],
  'optimize': ['improve', 'fine-tune', 'make better'],
  'synergy': ['collaboration', 'teamwork'],
  'paradigm': ['approach', 'model', 'way'],
  'holistic': ['complete', 'full', 'overall'],
  'robust': ['strong', 'solid', 'reliable'],
  'cutting-edge': ['latest', 'modern', 'new'],
  'state-of-the-art': ['modern', 'latest', 'advanced'],
  'innovative': ['new', 'creative', 'fresh'],
  'transformative': ['significant', 'major', 'meaningful'],
  'disruptive': ['new', 'different', 'unconventional'],
  'empower': ['help', 'enable', 'support'],
  'enable': ['help', 'let', 'allow'],
  'enhance': ['improve', 'boost', 'strengthen'],
  'elevate': ['improve', 'raise', 'boost'],
  'cultivate': ['build', 'grow', 'develop'],
  'spearhead': ['lead', 'drive', 'run'],
  'champion': ['support', 'advocate for', 'push for'],
  'foster': ['encourage', 'support', 'build'],
  'seamless': ['smooth', 'easy'],
  'seamlessly': ['smoothly', 'easily'],
  'passionate': ['interested in', 'excited about', 'into'],
  'enthusiasm': ['interest', 'energy'],
  'journey': ['path', 'process', 'experience'],
  'landscape': ['space', 'field', 'area'],
  'ecosystem': ['community', 'space', 'world'],
  'delve': ['look into', 'explore', 'dig into'],
  'navigate': ['work through', 'handle', 'deal with'],
  'embark': ['start', 'begin', 'kick off'],
  'endeavor': ['try', 'work', 'effort'],
  'strive': ['work', 'aim', 'try'],
  'meticulous': ['careful', 'detailed', 'thorough'],
  'meticulously': ['carefully', 'thoroughly'],
  'comprehensive': ['complete', 'full', 'thorough'],
  'comprehensively': ['fully', 'completely', 'thoroughly'],
  'multifaceted': ['varied', 'diverse', 'complex'],
  'dynamic': ['active', 'changing', 'lively'],
  'fast-paced': ['busy', 'active', 'quick-moving'],
  'moreover': ['also', 'plus'],
  'furthermore': ['also', 'and'],
  'additionally': ['also', 'plus'],
  'consequently': ['so', 'as a result'],
}

const PHRASE_REPLACEMENTS: Record<string, string> = {
  'at the end of the day': 'ultimately',
  'move the needle': 'make a difference',
  'circle back': 'follow up',
  'touch base': 'check in',
  'take it to the next level': 'improve it',
  'think outside the box': 'be creative',
  'hit the ground running': 'start quickly',
  'low-hanging fruit': 'easy wins',
  'value-add': 'benefit',
  'game-changer': 'big deal',
  'core competency': 'strength',
  'key stakeholders': 'important people',
  'strategic alignment': 'agreement',
  'it is important to note': '',
  'it should be noted': '',
  'needless to say': '',
  'without a doubt': '',
  'in order to': 'to',
  'in terms of': 'for',
  'with respect to': 'about',
  'when it comes to': 'for',
  'in this regard': '',
  'with this in mind': '',
  'to this end': '',
  'in light of': 'given',
  'as a matter of fact': 'actually',
  'at this point in time': 'now',
  'due to the fact that': 'because',
  'in the event that': 'if',
  'for the purpose of': 'to',
  'in close proximity to': 'near',
  'a large number of': 'many',
  'the vast majority of': 'most',
  'on a daily basis': 'daily',
  'on a regular basis': 'regularly',
  'in the near future': 'soon',
  'at the present time': 'now',
  'in today\'s world': 'today',
  'in today\'s landscape': 'today',
  'in the modern era': 'today',
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Calculate AI-ness score (0-100)
 * Higher = more likely AI-generated
 */
export function calculateAIScore(text: string): number {
  if (!text || text.length < 100) return 0

  const lowerText = text.toLowerCase()
  let score = 0
  let indicators = 0

  // Check AI words (each match adds points)
  for (const word of AI_INDICATORS.aiWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    const matches = text.match(regex)
    if (matches) {
      score += matches.length * 2
      indicators++
    }
  }

  // Check negative parallelisms
  for (const pattern of AI_INDICATORS.negativeParallelisms) {
    const matches = text.match(pattern)
    if (matches) {
      score += matches.length * 5
      indicators++
    }
  }

  // Check conjunctive phrases
  for (const phrase of AI_INDICATORS.conjunctivePhrases) {
    if (lowerText.includes(phrase)) {
      score += 3
      indicators++
    }
  }

  // Check filler phrases
  for (const phrase of AI_INDICATORS.fillerPhrases) {
    if (lowerText.includes(phrase)) {
      score += 4
      indicators++
    }
  }

  // Check em dash overuse
  const emDashes = text.match(AI_INDICATORS.emDashOveruse)
  if (emDashes && emDashes.length > 3) {
    score += (emDashes.length - 3) * 2
    indicators++
  }

  // Normalize to 0-100
  const normalizedScore = Math.min(100, Math.round((score / (text.length / 500)) * 10))

  return normalizedScore
}

/**
 * Rule-based humanization (fast, no API calls)
 */
export function humanizeRuleBased(text: string): string {
  if (!text) return ''

  let result = text

  // 1. Replace corporate phrases
  for (const [phrase, replacement] of Object.entries(PHRASE_REPLACEMENTS)) {
    const regex = new RegExp(phrase, 'gi')
    result = result.replace(regex, replacement)
  }

  // 2. Replace AI-ish words (pick random replacement to vary)
  for (const [word, replacements] of Object.entries(WORD_REPLACEMENTS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    result = result.replace(regex, (match) => {
      // Preserve capitalization
      const replacement = replacements[Math.floor(Math.random() * replacements.length)]
      if (match[0] === match[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1)
      }
      return replacement
    })
  }

  // 3. Simplify negative parallelisms
  result = result.replace(/not just (.+?), but also /gi, '$1 and ')
  result = result.replace(/not only (.+?), but also /gi, '$1 and ')
  result = result.replace(/more than just (.+?),/gi, '$1 and more,')

  // 4. Add contractions (makes it sound more natural)
  const contractions: Record<string, string> = {
    'we are': "we're",
    'you are': "you're",
    'they are': "they're",
    'we will': "we'll",
    'you will': "you'll",
    'we have': "we've",
    'you have': "you've",
    'do not': "don't",
    'does not': "doesn't",
    'will not': "won't",
    'cannot': "can't",
    'is not': "isn't",
    'are not': "aren't",
    'it is': "it's",
    'that is': "that's",
    'there is': "there's",
  }

  for (const [full, contraction] of Object.entries(contractions)) {
    // Only replace in middle of sentences (not at start of paragraphs)
    const regex = new RegExp(`(?<=[a-z,] )${full}\\b`, 'gi')
    result = result.replace(regex, contraction)
  }

  // 5. Clean up double spaces and empty lines
  result = result.replace(/  +/g, ' ')
  result = result.replace(/\n\n\n+/g, '\n\n')
  result = result.trim()

  return result
}

/**
 * Full humanization with optional AI assistance
 */
export async function humanize(
  text: string,
  options: {
    useAI?: boolean
    threshold?: number  // Only humanize if AI score > threshold
  } = {}
): Promise<{
  original: string
  humanized: string
  aiScore: number
  wasModified: boolean
}> {
  const { useAI: _useAI = false, threshold = 30 } = options

  const aiScore = calculateAIScore(text)

  // Skip if below threshold
  if (aiScore < threshold) {
    return {
      original: text,
      humanized: text,
      aiScore,
      wasModified: false,
    }
  }

  // Apply rule-based humanization
  let humanized = humanizeRuleBased(text)

  // TODO: If useAI and still high score, use Claude API for deeper rewrite
  // This would be more expensive but more effective for stubborn cases

  return {
    original: text,
    humanized,
    aiScore,
    wasModified: humanized !== text,
  }
}

/**
 * Quick check if text needs humanization
 */
export function needsHumanization(text: string, threshold: number = 30): boolean {
  return calculateAIScore(text) >= threshold
}

// ============================================================================
// Exports
// ============================================================================

const humanizer = {
  calculateAIScore,
  humanizeRuleBased,
  humanize,
  needsHumanization,
}

export default humanizer
