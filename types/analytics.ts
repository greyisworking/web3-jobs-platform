export interface SearchQuery {
  id: string
  query: string
  user_id: string | null
  session_id: string | null
  results_count: number | null
  created_at: string
}

export interface TopSearchQuery {
  query: string
  count: number
}

export interface SearchTrend {
  date: string
  count: number
}

export interface SearchAnalyticsResponse {
  topQueries: TopSearchQuery[]
  trends: SearchTrend[]
  techStacks: TopSearchQuery[]
  totalSearches: number
}

export interface AuditLogEntry {
  id: string
  admin_id: string
  action: string
  details: Record<string, unknown> | null
  created_at: string
}

export interface CrawlerRunResponse {
  success: boolean
  message: string
  output?: string
}
