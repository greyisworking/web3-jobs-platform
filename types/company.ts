export interface Company {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  website: string | null
  description: string | null
  industry: string | null
  size: string | null
  location: string | null
  founded_year: number | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface CompanyJob {
  id: string
  title: string
  company: string
  company_id: string
  location: string
  type: string
  category: string
  description: string | null
  url: string
  salary: string | null
  tags: string | null
  source: string
  region: string
  postedDate: string | null
  crawledAt: string
  updatedAt: string
  isActive: boolean
  status: string
  view_count: number
  apply_count: number
}

export interface JobApplication {
  id: string
  job_id: string
  applicant_email: string | null
  applicant_name: string | null
  resume_url: string | null
  cover_letter: string | null
  status: 'pending' | 'reviewed' | 'contacted' | 'rejected'
  created_at: string
}

export interface JobView {
  id: string
  job_id: string
  viewer_ip: string | null
  user_agent: string | null
  referrer: string | null
  viewed_at: string
}

export interface CompanyDashboardStats {
  totalJobs: number
  activeJobs: number
  totalViews: number
  totalApplies: number
  avgConversion: number
}
