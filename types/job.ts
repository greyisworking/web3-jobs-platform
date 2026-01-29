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
  backers?: string[] | null
  sector?: string | null
  office_location?: string | null
  badges?: string[] | null
  description?: string | null
  tags?: string | null
  // Web3 OG features
  token_gate?: TokenGate | null
  is_dao_job?: boolean
  is_alpha?: boolean
}
