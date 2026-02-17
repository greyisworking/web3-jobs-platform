import type { TokenGate } from './web3'

export type RoleCategory =
  | 'Engineering'
  | 'Product'
  | 'Design'
  | 'Marketing/Growth'
  | 'Business Development'
  | 'Operations/HR'
  | 'Community/Support'

export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  category: string
  role?: RoleCategory | null  // Job role category
  url: string
  salary: string | null
  source: string
  region: string
  postedDate: Date | null
  crawledAt?: Date | string | null  // When job was added to our DB (for NEW badge)
  isActive?: boolean // true = active, false = expired
  backers?: string[] | null
  sector?: string | null
  office_location?: string | null
  badges?: string[] | null
  description?: string | null
  raw_description?: string | null  // Original unformatted description
  tags?: string | null
  // Enhanced job details
  requirements?: string | null
  responsibilities?: string | null
  benefits?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  deadline?: Date | null
  experienceLevel?: string | null
  remoteType?: string | null
  companyLogo?: string | null
  companyWebsite?: string | null
  // Web3 OG features
  token_gate?: TokenGate | null
  is_dao_job?: boolean
  is_alpha?: boolean
  // User-submitted jobs
  postedBy?: string | null  // Wallet address of submitter
  reportCount?: number
  isHidden?: boolean
  // Von Restorff Effect: Visual emphasis
  is_urgent?: boolean
  is_featured?: boolean
  // Featured auto-curation
  featured_score?: number
  featured_pinned?: boolean
  featured_at?: Date | string | null
}
