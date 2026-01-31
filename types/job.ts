import type { TokenGate } from './web3'

export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  category: string
  url: string
  salary: string | null
  source: string
  region: string
  postedDate: Date | null
  status?: string // 'active' | 'expired' | 'closed'
  backers?: string[] | null
  sector?: string | null
  office_location?: string | null
  badges?: string[] | null
  description?: string | null
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
  // Von Restorff Effect: Visual emphasis
  is_urgent?: boolean
  is_featured?: boolean
}
