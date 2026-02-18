// Error Logs
export type ErrorLevel = 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO'

export interface ErrorLog {
  id: string
  timestamp: string
  level: ErrorLevel
  message: string
  crawler_name: string | null
  stack_trace: string | null
  created_at: string
  // Additional fields from CrawlerErrors
  url?: string | null
  status_code?: number | null
  error_type?: string | null
}

export interface ErrorLogsFilters {
  level?: ErrorLevel
  keyword?: string
  date_from?: string
  date_to?: string
  page?: number
  pageSize?: number
}

export interface ErrorLogsResponse {
  logs: ErrorLog[]
  total: number
  page: number
  pageSize: number
}

// Proxy Status
export type ProxyStatusType = 'active' | 'blocked' | 'slow'

export interface ProxyStatus {
  id: string
  proxy_url: string
  status: ProxyStatusType
  latency_ms: number | null
  success_rate: number | null
  last_used: string | null
  last_checked: string
  total_requests: number
  failed_requests: number
}

export interface ProxyLatencyPoint {
  timestamp: string
  latency_ms: number
  proxy_url: string
}

export interface ProxyStatusResponse {
  proxies: ProxyStatus[]
  total: number
}

// Crawl Runs
export type CrawlRunStatus = 'running' | 'completed' | 'failed'

export interface CrawlRun {
  id: string
  started_at: string
  completed_at: string | null
  status: CrawlRunStatus
  jobs_found: number
  jobs_saved: number
  errors_count: number
  crawler_name: string | null
}

export interface CrawlHistoryResponse {
  runs: CrawlRun[]
  total: number
  page: number
  pageSize: number
}

// Monitoring Stats
export interface MonitoringStats {
  todayErrors: number
  yesterdayErrors: number
  errorsTrend: number // percentage change
  activeProxies: number
  totalProxies: number
  todaySuccessRate: number
  todayJobsCrawled: number
}
