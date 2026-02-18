/**
 * Crawler Stability Library
 *
 * Features:
 * - Proxy rotation (set CRAWLER_PROXIES env var)
 * - Circuit breaker pattern
 * - Error tracking
 * - Resilient fetch with retries
 */

export { proxyManager, type ProxyConfig } from './proxy-manager'
export { circuitBreaker, domainCircuitBreaker } from './circuit-breaker'
export { errorTracker, type CrawlerError } from './error-tracker'
export {
  resilientFetch,
  resilientFetchHTML,
  resilientFetchJSON,
  batchFetch,
  createRateLimitedFetcher,
} from './resilient-fetch'
