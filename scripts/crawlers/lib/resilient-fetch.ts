/**
 * Resilient Fetch - Combines proxy rotation, circuit breaker, and retry logic
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import * as cheerio from 'cheerio'
import { proxyManager } from './proxy-manager'
import { domainCircuitBreaker } from './circuit-breaker'
import { errorTracker } from './error-tracker'
import { getRandomUserAgent, getBrowserHeaders, delayWithJitter } from '../../utils'

interface FetchOptions {
  timeout?: number
  maxRetries?: number
  retryDelay?: number
  useBrowserHeaders?: boolean
  useProxy?: boolean
  headers?: Record<string, string>
  source?: string  // For error tracking
}

const DEFAULT_OPTIONS: FetchOptions = {
  timeout: 15000,
  maxRetries: 3,
  retryDelay: 1000,
  useBrowserHeaders: true,
  useProxy: true,
}

/**
 * Extract domain from URL for circuit breaker
 */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown'
  }
}

/**
 * Build axios config with optional proxy
 */
function buildConfig(url: string, options: FetchOptions): AxiosRequestConfig {
  const config: AxiosRequestConfig = {
    url,
    timeout: options.timeout,
    headers: {
      ...(options.useBrowserHeaders ? getBrowserHeaders() : { 'User-Agent': getRandomUserAgent() }),
      ...options.headers,
    },
  }

  // Add proxy if available and enabled
  if (options.useProxy && proxyManager.hasProxies) {
    const proxy = proxyManager.getNextProxy()
    if (proxy) {
      config.proxy = {
        host: proxy.host,
        port: proxy.port,
        ...(proxy.auth ? { auth: proxy.auth } : {}),
      }
    }
  }

  return config
}

/**
 * Resilient HTTP GET with all protections
 */
export async function resilientFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const domain = getDomain(url)
  const source = opts.source || domain

  // Check circuit breaker
  if (!domainCircuitBreaker.canRequest(domain)) {
    console.log(`  ⚡ Circuit open for ${domain}, skipping`)
    return null
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= opts.maxRetries!; attempt++) {
    const startTime = Date.now()
    const config = buildConfig(url, opts)
    const proxyUsed = config.proxy

    try {
      const response: AxiosResponse<T> = await axios.get(url, config)

      // Report success
      domainCircuitBreaker.recordSuccess(domain)
      if (proxyUsed) {
        proxyManager.reportSuccess(
          { host: proxyUsed.host, port: proxyUsed.port },
          Date.now() - startTime
        )
      }

      return response.data
    } catch (error: any) {
      lastError = error

      // Report failure
      if (proxyUsed) {
        proxyManager.reportFailure({ host: proxyUsed.host, port: proxyUsed.port })
      }

      // Track error
      errorTracker.trackAxiosError(source, url, error)

      // Check if we should retry
      const shouldRetry = attempt < opts.maxRetries! && !isNonRetryableError(error)

      if (shouldRetry) {
        const delay = opts.retryDelay! * Math.pow(2, attempt - 1) // Exponential backoff
        console.log(`  ↻ Retry ${attempt}/${opts.maxRetries} for ${url} (waiting ${delay}ms)`)
        await delayWithJitter(delay, delay * 0.5)
      } else {
        domainCircuitBreaker.recordFailure(domain)
      }
    }
  }

  console.error(`  ❌ All retries failed for ${url}: ${lastError?.message || 'Unknown error'}`)
  return null
}

/**
 * Resilient HTML fetch with Cheerio parsing
 */
export async function resilientFetchHTML(
  url: string,
  options: FetchOptions = {}
): Promise<cheerio.CheerioAPI | null> {
  const html = await resilientFetch<string>(url, options)
  if (!html) return null

  try {
    return cheerio.load(html)
  } catch (error) {
    errorTracker.track({
      source: options.source || getDomain(url),
      errorType: 'parse',
      message: 'Failed to parse HTML',
      url,
    })
    return null
  }
}

/**
 * Resilient JSON fetch with type safety
 */
export async function resilientFetchJSON<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T | null> {
  return resilientFetch<T>(url, {
    ...options,
    headers: {
      ...options.headers,
      'Accept': 'application/json',
    },
  })
}

/**
 * Check if error is non-retryable
 */
function isNonRetryableError(error: any): boolean {
  // Don't retry client errors (except rate limiting)
  if (error.response?.status) {
    const status = error.response.status
    return status >= 400 && status < 500 && status !== 429
  }
  return false
}

/**
 * Batch fetch multiple URLs with concurrency control
 */
export async function batchFetch<T = any>(
  urls: string[],
  options: FetchOptions & { concurrency?: number } = {}
): Promise<Map<string, T | null>> {
  const { concurrency = 3, ...fetchOptions } = options
  const results = new Map<string, T | null>()
  const pending: Promise<void>[] = []

  for (const url of urls) {
    const promise = (async () => {
      const result = await resilientFetch<T>(url, fetchOptions)
      results.set(url, result)
      // Add small delay between requests
      await delayWithJitter(500, 300)
    })()

    pending.push(promise)

    // Control concurrency
    if (pending.length >= concurrency) {
      await Promise.race(pending)
      // Remove completed promises
      const completed = pending.filter(p => {
        const index = pending.indexOf(p)
        return index >= 0
      })
      pending.length = 0
      pending.push(...completed.filter(() => false)) // Clear array
    }
  }

  // Wait for remaining
  await Promise.all(pending)

  return results
}

/**
 * Create a rate-limited fetcher for a specific domain
 */
export function createRateLimitedFetcher(
  domain: string,
  requestsPerSecond: number = 1
): (url: string, options?: FetchOptions) => Promise<any> {
  let lastRequest = 0
  const minInterval = 1000 / requestsPerSecond

  return async (url: string, options: FetchOptions = {}) => {
    const now = Date.now()
    const elapsed = now - lastRequest

    if (elapsed < minInterval) {
      await delayWithJitter(minInterval - elapsed, 100)
    }

    lastRequest = Date.now()
    return resilientFetch(url, { ...options, source: domain })
  }
}
