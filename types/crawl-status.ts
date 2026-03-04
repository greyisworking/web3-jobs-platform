// 크롤링 대시보드 타입 정의

export interface CrawlSession {
  sessionId: string
  startedAt: string
  endedAt: string
  duration: number // 초
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
  avgJobCount: number // 최근 5회 평균
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
