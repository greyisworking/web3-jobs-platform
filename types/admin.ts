export interface Admin {
  id: string
  email: string
  role: string
  created_at: string
}

export interface AdminSession {
  user: {
    id: string
    email: string
  }
  admin: Admin
}

export interface JobWithStatus {
  id: string
  title: string
  company: string
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
  reviewed_by: string | null
  reviewed_at: string | null
}

export interface DuplicateGroup {
  key: string
  jobs: JobWithStatus[]
  similarity: number
}

export interface ErrorLog {
  id: string
  source: string
  status: string
  jobCount: number
  error: string | null
  createdAt: string
}

export interface AdminJobsResponse {
  jobs: JobWithStatus[]
  total: number
  page: number
  pageSize: number
}

export interface AdminErrorsResponse {
  logs: ErrorLog[]
  total: number
  page: number
  pageSize: number
}

export interface BulkActionRequest {
  ids: string[]
}

export interface MergeRequest {
  keepId: string
  deleteIds: string[]
}

export interface DashboardStats {
  totalJobs: number
  pendingJobs: number
  approvedJobs: number
  rejectedJobs: number
  recentErrors: number
}
