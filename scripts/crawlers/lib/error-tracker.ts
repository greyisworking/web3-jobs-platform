/**
 * Error Tracker - Logs crawler errors to database for monitoring
 */

import { supabase } from '../../../lib/supabase-script'

export interface CrawlerError {
  source: string
  errorType: 'network' | 'parse' | 'validation' | 'auth' | 'rate_limit' | 'unknown'
  message: string
  url?: string
  statusCode?: number
  stack?: string
}

class ErrorTracker {
  private errorQueue: CrawlerError[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly batchSize = 10
  private readonly flushIntervalMs = 5000

  constructor() {
    // Auto-flush errors periodically
    this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs)
  }

  /**
   * Track an error
   */
  track(error: CrawlerError) {
    this.errorQueue.push(error)

    // Flush immediately if batch is full
    if (this.errorQueue.length >= this.batchSize) {
      this.flush()
    }
  }

  /**
   * Track error from axios response
   */
  trackAxiosError(source: string, url: string, error: any) {
    const crawlerError: CrawlerError = {
      source,
      url,
      errorType: 'unknown',
      message: error.message || String(error),
    }

    if (error.response) {
      crawlerError.statusCode = error.response.status
      crawlerError.errorType = this.categorizeHttpError(error.response.status)
    } else if (error.code === 'ECONNABORTED') {
      crawlerError.errorType = 'network'
      crawlerError.message = 'Request timeout'
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      crawlerError.errorType = 'network'
    }

    if (error.stack) {
      crawlerError.stack = error.stack.substring(0, 500)
    }

    this.track(crawlerError)
  }

  private categorizeHttpError(status: number): CrawlerError['errorType'] {
    if (status === 401 || status === 403) return 'auth'
    if (status === 429) return 'rate_limit'
    if (status >= 500) return 'network'
    return 'unknown'
  }

  /**
   * Flush errors to database
   */
  async flush() {
    if (this.errorQueue.length === 0) return

    const errors = [...this.errorQueue]
    this.errorQueue = []

    try {
      const records = errors.map(e => ({
        source: e.source,
        error_type: e.errorType,
        message: e.message,
        url: e.url || null,
        status_code: e.statusCode || null,
        stack: e.stack || null,
        created_at: new Date().toISOString(),
      }))

      // Insert to CrawlerErrors table (create if needed)
      const { error } = await supabase
        .from('CrawlerErrors')
        .insert(records)

      if (error) {
        // Table might not exist, log to console instead
        console.error('Failed to log errors to DB:', error.message)
        console.error('Errors:', errors.map(e => `[${e.source}] ${e.errorType}: ${e.message}`).join('\n'))
      }
    } catch (err) {
      console.error('Error tracker flush failed:', err)
    }
  }

  /**
   * Stop the error tracker
   */
  stop() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flush()
  }

  /**
   * Get recent errors for a source
   */
  async getRecentErrors(source: string, limit = 10): Promise<CrawlerError[]> {
    try {
      const { data } = await supabase
        .from('CrawlerErrors')
        .select('*')
        .eq('source', source)
        .order('created_at', { ascending: false })
        .limit(limit)

      return (data || []).map(d => ({
        source: d.source,
        errorType: d.error_type,
        message: d.message,
        url: d.url,
        statusCode: d.status_code,
        stack: d.stack,
      }))
    } catch {
      return []
    }
  }

  /**
   * Get error summary for dashboard
   */
  async getErrorSummary(hours = 24): Promise<Record<string, { total: number; byType: Record<string, number> }>> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('CrawlerErrors')
        .select('source, error_type')
        .gte('created_at', since)

      if (!data) return {}

      const summary: Record<string, { total: number; byType: Record<string, number> }> = {}

      for (const row of data) {
        if (!summary[row.source]) {
          summary[row.source] = { total: 0, byType: {} }
        }
        summary[row.source].total++
        summary[row.source].byType[row.error_type] = (summary[row.source].byType[row.error_type] || 0) + 1
      }

      return summary
    } catch {
      return {}
    }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker()
