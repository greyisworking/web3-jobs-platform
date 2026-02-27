import { createPublicSupabaseClient } from '@/lib/supabase-public'
import { findPriorityCompany } from '@/lib/priority-companies'

// ── Role classification (by title) ──
const ROLE_PATTERNS: Record<string, string[]> = {
  engineering: [
    'engineer', 'developer', 'architect', 'devops', 'sre', 'infrastructure',
    'backend', 'frontend', 'front-end', 'full stack', 'fullstack', 'smart contract',
    'protocol', 'blockchain dev', 'security engineer', 'auditor', 'researcher',
    'data engineer', 'machine learning', 'data scientist',
    '개발자', '개발', '엔지니어', '리서처',
  ],
  marketing: [
    'marketing', 'community', 'social media', 'content', 'growth', 'brand',
    'communications', 'pr ', 'public relations', 'kol', 'influencer', 'copywriter',
    'community manager', 'events',
    '마케팅', '마케터', '커뮤니티',
  ],
  bd: [
    'business development', 'bd ', 'partnership', 'sales', 'account executive',
    'ecosystem', 'fundrais', 'deal', 'client relation', 'revenue',
    '영업', 'BD',
  ],
  ops: [
    'compliance', 'legal', 'counsel', 'hr ', 'human resources', 'finance',
    'accounting', 'accountant', 'operations', 'recruiting', 'talent', 'people',
    'admin', 'project manager', 'program manager', 'office manager',
    '경영', '자금세탁', '통제',
  ],
}

function classifyRole(title: string): string {
  const t = title.toLowerCase()
  for (const role of ['ops', 'bd', 'marketing', 'engineering']) {
    if (ROLE_PATTERNS[role].some(p => t.includes(p))) return role
  }
  return 'other'
}

// ── Level classification (by title keywords) ──
// "manager" is intentionally excluded from lead patterns because
// "Community Manager", "Social Media Manager" etc. are mid-level roles.
// Only compound lead-manager titles are matched explicitly.
const LEVEL_PATTERNS: Record<string, string[]> = {
  entry: ['junior', 'jr.', 'jr ', 'entry level', 'entry-level', 'associate', 'graduate', 'trainee'],
  senior: ['senior', 'sr.', 'sr ', 'staff', 'principal', 'distinguished'],
  lead: [
    'head of', 'director', 'vp ', 'vice president', 'chief',
    'team lead', 'tech lead', 'c-level', 'cto', 'cfo', 'coo ', ' coo,', 'cmo',
    'engineering manager', 'general manager',
  ],
}

const LEAD_FALSE_POSITIVES = ['lead generat', 'leading']

const MANAGER_LEAD_PATTERNS = [
  'engineering manager', 'general manager', 'managing director',
  'country manager', 'regional manager', 'finance manager',
]

function classifyLevel(title: string): 'entry' | 'mid' | 'senior' | 'lead' {
  const t = title.toLowerCase()
  if (LEVEL_PATTERNS.lead.some(p => t.includes(p))) return 'lead'
  if (t.includes('lead') && !LEAD_FALSE_POSITIVES.some(fp => t.includes(fp))) return 'lead'
  if (t.includes('manager') && MANAGER_LEAD_PATTERNS.some(p => t.includes(p))) return 'lead'
  if (LEVEL_PATTERNS.senior.some(p => t.includes(p))) return 'senior'
  if (LEVEL_PATTERNS.entry.some(p => t.includes(p))) return 'entry'
  if (/\bintern\b/.test(t)) return 'entry'
  return 'mid'
}

// ── Region classification (by location) ──
const REGION_INFO: Record<string, { label: string; flag: string }> = {
  us:     { label: 'US',     flag: '\u{1F1FA}\u{1F1F8}' },
  remote: { label: 'Remote', flag: '\u{1F310}' },
  europe: { label: 'Europe', flag: '\u{1F1EA}\u{1F1FA}' },
  asia:   { label: 'Asia',   flag: '\u{1F1F8}\u{1F1EC}' },
  korea:  { label: 'Korea',  flag: '\u{1F1F0}\u{1F1F7}' },
  latam:  { label: 'LATAM',  flag: '\u{1F30D}' },
}

function classifyJobRegion(location: string): string {
  const l = location.toLowerCase()
  if (/\bremote\b/.test(l) || l.includes('worldwide') || l.includes('anywhere')) return 'remote'
  if (l.includes('korea') || l.includes('seoul') || l.includes('서울') || l.includes('한국')) return 'korea'
  if (l.includes('united states') || /\busa\b/.test(l) || /\bu\.s\./.test(l) ||
      l.includes('new york') || l.includes('san francisco') || l.includes('los angeles') ||
      l.includes('chicago') || l.includes('austin') || l.includes('miami') || l.includes('seattle') ||
      l.includes('denver') || l.includes('boston') || l.includes('washington') ||
      l.includes('california') || l.includes('texas') || l.includes(', ny') ||
      l.includes(', ca') || l.includes(', tx')) return 'us'
  if (/\buk\b/.test(l) || l.includes('united kingdom') || l.includes('london') ||
      l.includes('germany') || l.includes('berlin') || l.includes('france') || l.includes('paris') ||
      l.includes('netherlands') || l.includes('amsterdam') || l.includes('ireland') || l.includes('dublin') ||
      l.includes('switzerland') || l.includes('zurich') || l.includes('spain') ||
      l.includes('portugal') || l.includes('lisbon') || /\beurope\b/.test(l)) return 'europe'
  if (l.includes('singapore') || l.includes('hong kong') || l.includes('japan') || l.includes('tokyo') ||
      l.includes('india') || l.includes('bangalore') || l.includes('mumbai') ||
      l.includes('vietnam') || l.includes('thailand') || l.includes('indonesia') ||
      l.includes('dubai') || l.includes('uae') || l.includes('taiwan') || /\basia\b/.test(l)) return 'asia'
  if (l.includes('brazil') || l.includes('mexico') || l.includes('argentina') ||
      l.includes('colombia') || l.includes('chile') || l.includes('latin america') || l.includes('latam')) return 'latam'
  return 'other'
}

// ── Country classification within regions ──
const COUNTRY_MAP: { pattern: RegExp; name: string; flag: string; region: string }[] = [
  // US sub-regions
  { pattern: /new york|\bny\b/i, name: 'New York', flag: '\u{1F5FD}', region: 'us' },
  { pattern: /san francisco|sf\b/i, name: 'San Francisco', flag: '\u{1F309}', region: 'us' },
  { pattern: /los angeles|\bla\b.*ca/i, name: 'Los Angeles', flag: '\u{1F3AC}', region: 'us' },
  { pattern: /miami/i, name: 'Miami', flag: '\u{1F334}', region: 'us' },
  { pattern: /austin|texas|\btx\b/i, name: 'Texas', flag: '\u{2B50}', region: 'us' },
  { pattern: /seattle|washington.*state/i, name: 'Seattle', flag: '\u{2614}', region: 'us' },
  { pattern: /chicago/i, name: 'Chicago', flag: '\u{1F3D9}', region: 'us' },
  { pattern: /boston/i, name: 'Boston', flag: '\u{1F393}', region: 'us' },
  { pattern: /denver|colorado/i, name: 'Denver', flag: '\u{26F0}', region: 'us' },
  { pattern: /california|\bca\b/i, name: 'California', flag: '\u{2600}', region: 'us' },
  // Europe
  { pattern: /\buk\b|united kingdom|london|england/i, name: 'UK', flag: '\u{1F1EC}\u{1F1E7}', region: 'europe' },
  { pattern: /germany|berlin|munich/i, name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', region: 'europe' },
  { pattern: /france|paris/i, name: 'France', flag: '\u{1F1EB}\u{1F1F7}', region: 'europe' },
  { pattern: /netherlands|amsterdam/i, name: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}', region: 'europe' },
  { pattern: /ireland|dublin/i, name: 'Ireland', flag: '\u{1F1EE}\u{1F1EA}', region: 'europe' },
  { pattern: /switzerland|zurich/i, name: 'Switzerland', flag: '\u{1F1E8}\u{1F1ED}', region: 'europe' },
  { pattern: /spain|madrid|barcelona/i, name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}', region: 'europe' },
  { pattern: /portugal|lisbon/i, name: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}', region: 'europe' },
  // Asia
  { pattern: /singapore/i, name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}', region: 'asia' },
  { pattern: /hong kong/i, name: 'Hong Kong', flag: '\u{1F1ED}\u{1F1F0}', region: 'asia' },
  { pattern: /japan|tokyo/i, name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}', region: 'asia' },
  { pattern: /india|bangalore|mumbai/i, name: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'asia' },
  { pattern: /vietnam/i, name: 'Vietnam', flag: '\u{1F1FB}\u{1F1F3}', region: 'asia' },
  { pattern: /thailand|bangkok/i, name: 'Thailand', flag: '\u{1F1F9}\u{1F1ED}', region: 'asia' },
  { pattern: /dubai|uae/i, name: 'UAE', flag: '\u{1F1E6}\u{1F1EA}', region: 'asia' },
  { pattern: /taiwan/i, name: 'Taiwan', flag: '\u{1F1F9}\u{1F1FC}', region: 'asia' },
  // LATAM
  { pattern: /brazil|são paulo/i, name: 'Brazil', flag: '\u{1F1E7}\u{1F1F7}', region: 'latam' },
  { pattern: /mexico/i, name: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}', region: 'latam' },
  { pattern: /argentina|buenos aires/i, name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}', region: 'latam' },
  { pattern: /colombia/i, name: 'Colombia', flag: '\u{1F1E8}\u{1F1F4}', region: 'latam' },
]

function classifyCountry(location: string, region: string): { name: string; flag: string } | null {
  const l = location.toLowerCase()
  for (const c of COUNTRY_MAP) {
    if (c.region === region && c.pattern.test(l)) return { name: c.name, flag: c.flag }
  }
  return null
}

// Map classifyRole output to display label for Roles by Region
const ROLE_DISPLAY_SHORT: Record<string, string> = {
  engineering: 'Eng',
  marketing: 'Mkt/Growth',
  bd: 'BD',
  ops: 'Ops/HR',
  other: 'Other',
}

// ── Expanded skill keywords (extracted from actual JDs) ──
const ALL_SKILL_KEYWORDS: Record<string, string[]> = {
  'Solidity': ['solidity'],
  'Rust': ['rust'],
  'TypeScript': ['typescript', 'ts '],
  'JavaScript': ['javascript'],
  'Python': ['python'],
  'Go': ['golang', ' go ', 'go,', 'go.'],
  'Move': [' move '],
  'Cairo': ['cairo'],
  'C++': ['c++', 'cpp'],
  'Java': [' java ', 'java,'],
  'React': ['react', 'reactjs'],
  'Next.js': ['next.js', 'nextjs'],
  'Node.js': ['node.js', 'nodejs'],
  'Hardhat': ['hardhat'],
  'Foundry': ['foundry', 'forge'],
  'Ethers.js': ['ethers.js', 'ethersjs', 'ethers'],
  'Wagmi': ['wagmi'],
  'Viem': ['viem'],
  'TheGraph': ['the graph', 'thegraph', 'subgraph'],
  'GraphQL': ['graphql'],
  'Ethereum': ['ethereum', 'evm'],
  'Solana': ['solana'],
  'Polygon': ['polygon', 'matic'],
  'Arbitrum': ['arbitrum'],
  'Optimism': ['optimism', 'op stack'],
  'Base': [' base chain', 'base l2'],
  'Cosmos': ['cosmos', 'cosmwasm'],
  'DeFi': ['defi', 'decentralized finance'],
  'AMM': ['amm', 'automated market maker'],
  'Lending': ['lending', 'borrowing'],
  'Staking': ['staking', 'yield'],
  'MEV': ['mev', 'maximal extractable'],
  'Oracles': ['oracle', 'chainlink'],
  'Smart Contract Audit': ['audit', 'vulnerability', 'pen test'],
  'AWS': ['aws', 'amazon web services'],
  'Docker': ['docker', 'container'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'CI/CD': ['ci/cd', 'github actions', 'jenkins'],
  'PostgreSQL': ['postgresql', 'postgres'],
  'MongoDB': ['mongodb', 'mongo'],
  'Redis': ['redis'],
  'ZK Proofs': ['zero knowledge', 'zk-', 'zkp', 'zk proof'],
  'Twitter/X': ['twitter', 'x.com', ' x account', 'tweets'],
  'KOL Management': ['kol', 'key opinion leader'],
  'Content Strategy': ['content strategy', 'content marketing', 'editorial'],
  'Telegram': ['telegram'],
  'Discord': ['discord'],
  'SEO': ['seo', 'search engine optim'],
  'Community Management': ['community management', 'community building'],
  'Growth Hacking': ['growth hack', 'growth marketing', 'viral'],
  'Influencer Marketing': ['influencer', 'ambassador'],
  'Email Marketing': ['email marketing', 'newsletter', 'mailchimp'],
  'Brand Strategy': ['brand strategy', 'brand identity', 'branding'],
  'Social Media': ['social media', 'sns '],
  'Partnerships': ['partnership', 'partner relation'],
  'Sales': ['sales', 'selling', 'revenue generation'],
  'CRM': ['crm', 'salesforce', 'hubspot'],
  'Fundraising': ['fundraising', 'fundraise', 'capital raise'],
  'Negotiation': ['negotiation', 'negotiate'],
  'Ecosystem Development': ['ecosystem development', 'ecosystem growth'],
  'Client Relations': ['client relation', 'account manage'],
  'Deal Sourcing': ['deal flow', 'deal sourcing', 'pipeline management'],
  'Compliance': ['compliance', 'regulatory', 'aml', 'kyc'],
  'Legal': ['legal', 'contract law', 'corporate law', 'ip law'],
  'HR': ['human resources', 'hr ', 'people ops', 'people operations'],
  'Finance': ['financial planning', 'budgeting', 'financial model'],
  'Accounting': ['accounting', 'bookkeeping', 'gaap'],
  'Recruiting': ['recruiting', 'talent acquisition', 'sourcing candidate'],
  'Risk Management': ['risk management', 'risk assessment'],
  'Project Management': ['project management', 'scrum', 'agile', 'kanban'],
  'SQL': ['sql', 'mysql', 'postgresql query'],
  'Data Analysis': ['data analysis', 'data analytics', 'tableau', 'looker'],
  'Excel': ['excel', 'spreadsheet', 'google sheets'],
  'Figma': ['figma'],
  'Notion': ['notion'],
  'Google Analytics': ['google analytics', 'ga4'],
}

function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const [skill, keywords] of Object.entries(ALL_SKILL_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      found.push(skill)
    }
  }
  return found
}

// ── Types ──
export interface SkillEntry {
  skill: string
  percentage: number
  jobCount: number
}

export interface SkillLevelEntry {
  skill: string
  levels: { entry: number; mid: number; senior: number; lead: number }
  total: number
}

export interface RisingSkill {
  skill: string
  change: number
}

export interface CrossSkillInsight {
  skill: string
  percentage: number
  insight: string
}

export interface CountrySalaryData {
  name: string
  flag: string
  avgSalary: number
  jobCount: number
  percentage: number
}

export interface RegionSalaryData {
  key: string
  label: string
  flag: string
  avgSalary: number
  jobCount: number
  remotePercent: number
  countries: CountrySalaryData[]
}

export interface RegionRolesData {
  key: string
  label: string
  flag: string
  roles: { name: string; count: number; percentage: number }[]
  totalJobs: number
}

export interface RoleInsight {
  key: string
  label: string
  jobCount: number
  avgSalaryMin: number
  avgSalaryMax: number
  remotePercent: number
  hotSkills: SkillEntry[]
  skillLevelMatrix: SkillLevelEntry[]
  levelInsight: string
  risingSkills: RisingSkill[]
  crossSkills: CrossSkillInsight[]
  topCompanies: { name: string; count: number }[]
  regionSalaries: RegionSalaryData[]
}

export interface IntelligenceData {
  totalJobs: number
  totalCompanies: number
  vcJobPercent: number
  roles: Record<string, RoleInsight>
  regionRoles: RegionRolesData[]
}

// "Expected" skills for each role — used to detect cross-skills
const EXPECTED_SKILLS: Record<string, Set<string>> = {
  engineering: new Set([
    'Solidity', 'Rust', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Move', 'Cairo', 'C++', 'Java',
    'React', 'Next.js', 'Node.js', 'Hardhat', 'Foundry', 'Ethers.js', 'Wagmi', 'Viem', 'TheGraph', 'GraphQL',
    'Ethereum', 'Solana', 'Polygon', 'Arbitrum', 'Optimism', 'Base', 'Cosmos',
    'DeFi', 'AMM', 'Lending', 'Staking', 'MEV', 'Oracles', 'Smart Contract Audit',
    'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'PostgreSQL', 'MongoDB', 'Redis', 'ZK Proofs',
  ]),
  marketing: new Set([
    'Twitter/X', 'KOL Management', 'Content Strategy', 'Telegram', 'Discord',
    'SEO', 'Community Management', 'Growth Hacking', 'Influencer Marketing',
    'Email Marketing', 'Brand Strategy', 'Social Media',
  ]),
  bd: new Set([
    'Partnerships', 'Sales', 'CRM', 'Fundraising', 'Negotiation',
    'Ecosystem Development', 'Client Relations', 'Deal Sourcing',
  ]),
  ops: new Set([
    'Compliance', 'Legal', 'HR', 'Finance', 'Accounting', 'Recruiting',
    'Risk Management', 'Project Management',
  ]),
}

const ROLE_LABELS: Record<string, string> = {
  all: 'All Roles',
  engineering: 'Engineering',
  marketing: 'Marketing',
  bd: 'BD',
  ops: 'Ops',
}

const VC_WEIGHT = 2

export async function getIntelligenceData(): Promise<IntelligenceData> {
  const supabase = createPublicSupabaseClient()

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [recentRes, prevRes] = await Promise.all([
    supabase
      .from('Job')
      .select('id, title, tags, description, company, location, salaryMin, salaryMax, salaryCurrency, role')
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString()),
    supabase
      .from('Job')
      .select('id, title, tags, description')
      .eq('isActive', true)
      .gte('crawledAt', sixMonthsAgo.toISOString())
      .lt('crawledAt', threeMonthsAgo.toISOString()),
  ])

  const recentJobs = recentRes.data || []
  const prevJobs = prevRes.data || []
  const totalCompanies = new Set(recentJobs.map(j => j.company).filter(Boolean)).size

  let vcCount = 0
  for (const job of recentJobs) {
    if (findPriorityCompany(job.company)) vcCount++
  }

  // Classify jobs by role
  const jobsByRole: Record<string, typeof recentJobs> = {
    all: recentJobs,
    engineering: [],
    marketing: [],
    bd: [],
    ops: [],
  }

  for (const job of recentJobs) {
    const role = classifyRole(job.title || '')
    if (role !== 'other' && jobsByRole[role]) {
      jobsByRole[role].push(job)
    }
  }

  // Previous period by role (for rising skills)
  const prevByRole: Record<string, typeof prevJobs> = {
    all: prevJobs,
    engineering: [],
    marketing: [],
    bd: [],
    ops: [],
  }
  for (const job of prevJobs) {
    const role = classifyRole(job.title || '')
    if (role !== 'other' && prevByRole[role]) {
      prevByRole[role].push(job)
    }
  }

  // Build insight for each role
  const roles: Record<string, RoleInsight> = {}

  for (const roleKey of ['all', 'engineering', 'marketing', 'bd', 'ops']) {
    const jobs = jobsByRole[roleKey]
    const prev = prevByRole[roleKey]

    // Salary stats (USD only for consistency)
    const salaries = jobs
      .filter(j => j.salaryMin && j.salaryMax && (j.salaryCurrency === 'USD' || !j.salaryCurrency) && j.salaryMax < 1000000)
      .map(j => ({ min: j.salaryMin!, max: j.salaryMax! }))

    const avgMin = salaries.length > 0
      ? Math.round(salaries.reduce((s, v) => s + v.min, 0) / salaries.length / 1000) * 1000
      : 0
    const avgMax = salaries.length > 0
      ? Math.round(salaries.reduce((s, v) => s + v.max, 0) / salaries.length / 1000) * 1000
      : 0

    // Remote %
    const remoteCount = jobs.filter(j =>
      (j.location || '').toLowerCase().match(/remote|worldwide|global|anywhere/)
    ).length
    const remotePercent = jobs.length > 0 ? Math.round((remoteCount / jobs.length) * 100) : 0

    // Extract skills with VC weighting
    const skillCounts: Record<string, number> = {}
    let totalWeight = 0

    for (const job of jobs) {
      const isVc = findPriorityCompany(job.company) !== null
      const weight = isVc ? VC_WEIGHT : 1
      totalWeight += weight

      const text = [job.title || '', job.tags || '', job.description || ''].join(' ')
      const skills = extractSkillsFromText(text)
      for (const skill of skills) {
        skillCounts[skill] = (skillCounts[skill] || 0) + weight
      }
    }

    // Previous period skill counts (for rising detection)
    const prevSkillCounts: Record<string, number> = {}
    for (const job of prev) {
      const text = [job.title || '', job.tags || '', job.description || ''].join(' ')
      const skills = extractSkillsFromText(text)
      for (const skill of skills) {
        prevSkillCounts[skill] = (prevSkillCounts[skill] || 0) + 1
      }
    }

    // Sort and build hotSkills
    const sorted = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([skill, count]) => ({
        skill,
        percentage: totalWeight > 0 ? Math.round((count / totalWeight) * 100) : 0,
        jobCount: count,
      }))

    const hotSkills = sorted.filter(s => s.percentage >= 5).slice(0, 12)

    // ── Skill × Level heatmap matrix ──
    const jobsByLevel: Record<string, typeof jobs> = { entry: [], mid: [], senior: [], lead: [] }
    for (const job of jobs) {
      const level = classifyLevel(job.title || '')
      jobsByLevel[level].push(job)
    }

    const skillByLevel: Record<string, Record<string, number>> = {}
    for (const [level, levelJobs] of Object.entries(jobsByLevel)) {
      const counts: Record<string, number> = {}
      for (const job of levelJobs) {
        const text = [job.title || '', job.tags || '', job.description || ''].join(' ')
        const skills = extractSkillsFromText(text)
        for (const skill of skills) {
          counts[skill] = (counts[skill] || 0) + 1
        }
      }
      skillByLevel[level] = {}
      const MIN_LEVEL_SAMPLE = 5
      for (const [skill, count] of Object.entries(counts)) {
        skillByLevel[level][skill] = levelJobs.length >= MIN_LEVEL_SAMPLE
          ? Math.round((count / levelJobs.length) * 100)
          : 0
      }
    }

    const skillLevelMatrix: SkillLevelEntry[] = hotSkills.map(s => ({
      skill: s.skill,
      levels: {
        entry: skillByLevel.entry?.[s.skill] || 0,
        mid: skillByLevel.mid?.[s.skill] || 0,
        senior: skillByLevel.senior?.[s.skill] || 0,
        lead: skillByLevel.lead?.[s.skill] || 0,
      },
      total: s.jobCount,
    }))

    // Auto-generate level insight
    let maxJump = 0
    let maxJumpSkill = ''
    for (const s of skillLevelMatrix) {
      const jump = s.levels.lead - s.levels.entry
      if (jump > maxJump) { maxJump = jump; maxJumpSkill = s.skill }
    }
    const levelInsight = maxJumpSkill && maxJump > 0
      ? `${maxJumpSkill} demand jumps +${maxJump}pp from Entry → Lead level`
      : hotSkills[0]
        ? `${hotSkills[0].skill} is the most in-demand skill across all levels`
        : ''

    // Rising skills
    const risingSkills: RisingSkill[] = []
    for (const [skill, count] of Object.entries(skillCounts)) {
      const prevCount = prevSkillCounts[skill] || 0
      if (prevCount === 0 && count >= 3) {
        const recentRate = Math.round((count / jobs.length) * 100)
        risingSkills.push({ skill, change: recentRate })
        continue
      }
      if (prevCount > 0 && prev.length > 0 && jobs.length > 0) {
        const recentRate = count / jobs.length
        const prevRate = prevCount / prev.length
        const change = Math.round(((recentRate - prevRate) / prevRate) * 100)
        if (change >= 20) {
          risingSkills.push({ skill, change })
        }
      }
    }
    risingSkills.sort((a, b) => b.change - a.change)

    // Cross-skills
    const crossSkills: CrossSkillInsight[] = []
    const expected = EXPECTED_SKILLS[roleKey]
    if (expected && roleKey !== 'all') {
      for (const s of sorted) {
        if (!expected.has(s.skill) && s.percentage >= 10) {
          let insight = ''
          if (['Python', 'SQL', 'TypeScript', 'Data Analysis'].includes(s.skill)) {
            insight = `${s.percentage}% of ${ROLE_LABELS[roleKey]} roles require ${s.skill}`
          } else if (['Figma', 'Excel', 'Notion'].includes(s.skill)) {
            insight = `${s.skill} shows up in ${s.percentage}% of ${ROLE_LABELS[roleKey]} JDs`
          } else {
            insight = `Unexpected: ${s.percentage}% mention ${s.skill}`
          }
          crossSkills.push({ skill: s.skill, percentage: s.percentage, insight })
        }
      }
    }

    // Top companies
    const companyCounts: Record<string, number> = {}
    for (const job of jobs) {
      if (job.company) companyCounts[job.company] = (companyCounts[job.company] || 0) + 1
    }
    const topCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }))

    // ── Region salary data (per role) ──
    const regionJobsMap: Record<string, typeof jobs> = {}
    for (const job of jobs) {
      const region = classifyJobRegion(job.location || '')
      if (region === 'other') continue
      if (!regionJobsMap[region]) regionJobsMap[region] = []
      regionJobsMap[region].push(job)
    }

    const regionSalaries: RegionSalaryData[] = []
    for (const [regionKey, regionJobs] of Object.entries(regionJobsMap)) {
      const info = REGION_INFO[regionKey]
      if (!info) continue
      const withSalary = regionJobs.filter(j =>
        j.salaryMin && j.salaryMax && (j.salaryCurrency === 'USD' || !j.salaryCurrency) && j.salaryMax < 1000000
      )
      const avgSalary = withSalary.length >= 3
        ? Math.round(withSalary.reduce((s, j) => s + (j.salaryMin! + j.salaryMax!) / 2, 0) / withSalary.length / 1000) * 1000
        : 0
      const rCount = regionJobs.filter(j => (j.location || '').toLowerCase().includes('remote')).length

      // Country breakdown within region
      const countryJobsMap: Record<string, { name: string; flag: string; jobs: typeof regionJobs }> = {}
      for (const job of regionJobs) {
        const country = classifyCountry(job.location || '', regionKey)
        const key = country?.name ?? 'Other'
        if (!countryJobsMap[key]) countryJobsMap[key] = { name: key, flag: country?.flag ?? info.flag, jobs: [] }
        countryJobsMap[key].jobs.push(job)
      }
      const countries: CountrySalaryData[] = Object.values(countryJobsMap)
        .map(c => {
          const cWithSalary = c.jobs.filter(j =>
            j.salaryMin && j.salaryMax && (j.salaryCurrency === 'USD' || !j.salaryCurrency) && j.salaryMax < 1000000
          )
          const cAvg = cWithSalary.length >= 2
            ? Math.round(cWithSalary.reduce((s, j) => s + (j.salaryMin! + j.salaryMax!) / 2, 0) / cWithSalary.length / 1000) * 1000
            : 0
          return {
            name: c.name,
            flag: c.flag,
            avgSalary: cAvg,
            jobCount: c.jobs.length,
            percentage: regionJobs.length > 0 ? Math.round((c.jobs.length / regionJobs.length) * 100) : 0,
          }
        })
        .sort((a, b) => b.jobCount - a.jobCount)
        .slice(0, 5)

      regionSalaries.push({
        key: regionKey,
        label: info.label,
        flag: info.flag,
        avgSalary,
        jobCount: regionJobs.length,
        remotePercent: regionJobs.length > 0 ? Math.round((rCount / regionJobs.length) * 100) : 0,
        countries,
      })
    }
    regionSalaries.sort((a, b) => b.avgSalary - a.avgSalary)

    roles[roleKey] = {
      key: roleKey,
      label: ROLE_LABELS[roleKey],
      jobCount: jobs.length,
      avgSalaryMin: avgMin,
      avgSalaryMax: avgMax,
      remotePercent,
      hotSkills,
      skillLevelMatrix,
      levelInsight,
      risingSkills: risingSkills.slice(0, 5),
      crossSkills: crossSkills.slice(0, 3),
      topCompanies,
      regionSalaries,
    }
  }

  // ── Global region roles data ──
  const globalRegionJobs: Record<string, typeof recentJobs> = {}
  for (const job of recentJobs) {
    const region = classifyJobRegion(job.location || '')
    if (region === 'other') continue
    if (!globalRegionJobs[region]) globalRegionJobs[region] = []
    globalRegionJobs[region].push(job)
  }

  const regionRoles: RegionRolesData[] = []
  for (const [regionKey, regionJobs] of Object.entries(globalRegionJobs)) {
    const info = REGION_INFO[regionKey]
    if (!info) continue
    const roleCounts: Record<string, number> = {}
    for (const job of regionJobs) {
      const roleLabel = ROLE_DISPLAY_SHORT[classifyRole(job.title || '')] || 'Other'
      roleCounts[roleLabel] = (roleCounts[roleLabel] || 0) + 1
    }
    const total = regionJobs.length
    const rolesList = Object.entries(roleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))

    regionRoles.push({
      key: regionKey,
      label: info.label,
      flag: info.flag,
      roles: rolesList,
      totalJobs: total,
    })
  }
  regionRoles.sort((a, b) => b.totalJobs - a.totalJobs)

  return {
    totalJobs: recentJobs.length,
    totalCompanies,
    vcJobPercent: recentJobs.length > 0 ? Math.round((vcCount / recentJobs.length) * 100) : 0,
    roles,
    regionRoles,
  }
}
