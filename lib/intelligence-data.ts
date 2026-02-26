import { createPublicSupabaseClient } from '@/lib/supabase-public'
import { findPriorityCompany } from '@/lib/priority-companies'

// ── Role classification (by title) ──
const ROLE_PATTERNS: Record<string, string[]> = {
  engineering: [
    'engineer', 'developer', 'architect', 'devops', 'sre', 'infrastructure',
    'backend', 'frontend', 'front-end', 'full stack', 'fullstack', 'smart contract',
    'protocol', 'blockchain dev', 'security engineer', 'auditor', 'researcher',
    'data engineer', 'machine learning', 'data scientist',
    // Korean
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
  // Check in order of specificity
  for (const role of ['ops', 'bd', 'marketing', 'engineering']) {
    if (ROLE_PATTERNS[role].some(p => t.includes(p))) return role
  }
  return 'other'
}

// ── Level classification (by title keywords) ──
const LEVEL_PATTERNS: Record<string, string[]> = {
  entry: ['junior', 'jr.', 'jr ', 'entry level', 'entry-level', 'intern', 'associate', 'graduate', 'trainee'],
  senior: ['senior', 'sr.', 'sr ', 'staff', 'principal', 'distinguished'],
  lead: ['lead', 'head of', 'director', 'vp ', 'vice president', 'chief', 'team lead', 'manager', 'c-level', 'cto', 'cfo'],
}

function classifyLevel(title: string): 'entry' | 'mid' | 'senior' | 'lead' {
  const t = title.toLowerCase()
  for (const level of ['lead', 'senior', 'entry'] as const) {
    if (LEVEL_PATTERNS[level].some(p => t.includes(p))) return level
  }
  return 'mid'
}

// ── Expanded skill keywords (extracted from actual JDs) ──
const ALL_SKILL_KEYWORDS: Record<string, string[]> = {
  // Programming Languages
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

  // Frameworks & Tools
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

  // Blockchain Platforms
  'Ethereum': ['ethereum', 'evm'],
  'Solana': ['solana'],
  'Polygon': ['polygon', 'matic'],
  'Arbitrum': ['arbitrum'],
  'Optimism': ['optimism', 'op stack'],
  'Base': [' base chain', 'base l2'],
  'Cosmos': ['cosmos', 'cosmwasm'],

  // DeFi Concepts
  'DeFi': ['defi', 'decentralized finance'],
  'AMM': ['amm', 'automated market maker'],
  'Lending': ['lending', 'borrowing'],
  'Staking': ['staking', 'yield'],
  'MEV': ['mev', 'maximal extractable'],
  'Oracles': ['oracle', 'chainlink'],
  'Smart Contract Audit': ['audit', 'vulnerability', 'pen test'],

  // Infrastructure
  'AWS': ['aws', 'amazon web services'],
  'Docker': ['docker', 'container'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'CI/CD': ['ci/cd', 'github actions', 'jenkins'],
  'PostgreSQL': ['postgresql', 'postgres'],
  'MongoDB': ['mongodb', 'mongo'],
  'Redis': ['redis'],
  'ZK Proofs': ['zero knowledge', 'zk-', 'zkp', 'zk proof'],

  // Marketing & Community
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

  // BD & Sales
  'Partnerships': ['partnership', 'partner relation'],
  'Sales': ['sales', 'selling', 'revenue generation'],
  'CRM': ['crm', 'salesforce', 'hubspot'],
  'Fundraising': ['fundraising', 'fundraise', 'capital raise'],
  'Negotiation': ['negotiation', 'negotiate'],
  'Ecosystem Development': ['ecosystem development', 'ecosystem growth'],
  'Client Relations': ['client relation', 'account manage'],
  'Deal Sourcing': ['deal flow', 'deal sourcing', 'pipeline management'],

  // Ops & Legal
  'Compliance': ['compliance', 'regulatory', 'aml', 'kyc'],
  'Legal': ['legal', 'contract law', 'corporate law', 'ip law'],
  'HR': ['human resources', 'hr ', 'people ops', 'people operations'],
  'Finance': ['financial planning', 'budgeting', 'financial model'],
  'Accounting': ['accounting', 'bookkeeping', 'gaap'],
  'Recruiting': ['recruiting', 'talent acquisition', 'sourcing candidate'],
  'Risk Management': ['risk management', 'risk assessment'],
  'Project Management': ['project management', 'scrum', 'agile', 'kanban'],

  // Cross-domain
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
  pixelbaraComment: string
  topCompanies: { name: string; count: number }[]
}

export interface IntelligenceData {
  totalJobs: number
  totalCompanies: number
  vcJobPercent: number
  roles: Record<string, RoleInsight>
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

const PIXELBARA_COMMENTS: Record<string, string> = {
  all: '"learn the meta, ser"',
  engineering: '"gm ser, keep building"',
  marketing: '"CT native? ur gonna make it"',
  bd: '"close deals, touch grass"',
  ops: '"someone\'s gotta do compliance"',
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
      .select('id, title, tags, description, company, location, salaryMin, salaryMax, salaryCurrency')
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

  // Count VC-backed jobs
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
      for (const [skill, count] of Object.entries(counts)) {
        skillByLevel[level][skill] = levelJobs.length > 0 ? Math.round((count / levelJobs.length) * 100) : 0
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

    // Auto-generate level insight (biggest jump Entry→Lead)
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

    // Rising skills (comparing normalized rates)
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

    // Cross-skills: skills that appear in this role but are "unexpected"
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
      pixelbaraComment: PIXELBARA_COMMENTS[roleKey],
      topCompanies,
    }
  }

  return {
    totalJobs: recentJobs.length,
    totalCompanies,
    vcJobPercent: recentJobs.length > 0 ? Math.round((vcCount / recentJobs.length) * 100) : 0,
    roles,
  }
}
