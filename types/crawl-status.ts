// Crawl dashboard type definitions

export interface CrawlSession {
  sessionId: string
  startedAt: string
  endedAt: string
  duration: number // seconds
  successCount: number
  failedCount: number
  totalJobs: number
  sources: { name: string; status: string; jobCount: number }[]
}

export interface SourceHealth {
  name: string
  lastCrawledAt: string | null
  lastJobCount: number
  lastStatus: 'success' | 'failed'
  consecutiveFailures: number
  avgJobCount: number // average of last 5 runs
}

export interface DataQuality {
  activeJobs: number
  inactiveJobs: number
  todayExpired: number
  emptyDescription: number
  duplicateCount: number
}

export interface CrawlStatusResponse {
  runHistory: CrawlSession[]
  sourceHealth: SourceHealth[]
  dataQuality: DataQuality
}
