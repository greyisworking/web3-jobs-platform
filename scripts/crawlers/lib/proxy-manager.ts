/**
 * Proxy Manager - Handles proxy rotation and health tracking
 */

import axios from 'axios'

export interface ProxyConfig {
  host: string
  port: number
  auth?: {
    username: string
    password: string
  }
  protocol?: 'http' | 'https' | 'socks5'
}

interface ProxyHealth {
  proxy: ProxyConfig
  failCount: number
  lastUsed: number
  lastFailed: number | null
  successCount: number
  avgLatency: number
}

// Environment variable format: "host1:port1:user1:pass1,host2:port2:user2:pass2"
function parseProxiesFromEnv(): ProxyConfig[] {
  const proxyStr = process.env.CRAWLER_PROXIES || ''
  if (!proxyStr) return []

  return proxyStr.split(',').map(p => {
    const parts = p.trim().split(':')
    if (parts.length < 2) return null

    const config: ProxyConfig = {
      host: parts[0],
      port: parseInt(parts[1], 10),
      protocol: 'http',
    }

    if (parts.length >= 4) {
      config.auth = {
        username: parts[2],
        password: parts[3],
      }
    }

    return config
  }).filter(Boolean) as ProxyConfig[]
}

class ProxyManager {
  private proxies: ProxyHealth[] = []
  private currentIndex = 0
  private readonly maxFailures = 3
  private readonly cooldownMs = 60000 // 1 minute cooldown after failures

  constructor() {
    this.loadProxies()
  }

  private loadProxies() {
    const configs = parseProxiesFromEnv()
    this.proxies = configs.map(proxy => ({
      proxy,
      failCount: 0,
      lastUsed: 0,
      lastFailed: null,
      successCount: 0,
      avgLatency: 0,
    }))

    if (this.proxies.length > 0) {
      console.log(`📡 Loaded ${this.proxies.length} proxies`)
    }
  }

  /**
   * Get the next available proxy (round-robin with health check)
   */
  getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) return null

    const now = Date.now()
    let attempts = 0

    while (attempts < this.proxies.length) {
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length
      const health = this.proxies[this.currentIndex]

      // Skip if in cooldown
      if (health.failCount >= this.maxFailures) {
        if (health.lastFailed && now - health.lastFailed < this.cooldownMs) {
          attempts++
          continue
        }
        // Reset after cooldown
        health.failCount = 0
      }

      health.lastUsed = now
      return health.proxy
    }

    // All proxies are in cooldown, return the least recently failed one
    const sortedByLastFailed = [...this.proxies].sort((a, b) =>
      (a.lastFailed || 0) - (b.lastFailed || 0)
    )

    return sortedByLastFailed[0]?.proxy || null
  }

  /**
   * Report proxy success
   */
  reportSuccess(proxy: ProxyConfig, latencyMs: number) {
    const health = this.findHealth(proxy)
    if (health) {
      health.successCount++
      health.failCount = Math.max(0, health.failCount - 1) // Reduce fail count on success
      health.avgLatency = health.avgLatency === 0
        ? latencyMs
        : (health.avgLatency * 0.8 + latencyMs * 0.2) // Exponential moving average
    }
  }

  /**
   * Report proxy failure
   */
  reportFailure(proxy: ProxyConfig) {
    const health = this.findHealth(proxy)
    if (health) {
      health.failCount++
      health.lastFailed = Date.now()
    }
  }

  private findHealth(proxy: ProxyConfig): ProxyHealth | undefined {
    return this.proxies.find(h =>
      h.proxy.host === proxy.host && h.proxy.port === proxy.port
    )
  }

  /**
   * Get proxy URL for axios
   */
  getProxyUrl(proxy: ProxyConfig): string {
    const auth = proxy.auth ? `${proxy.auth.username}:${proxy.auth.password}@` : ''
    return `${proxy.protocol || 'http'}://${auth}${proxy.host}:${proxy.port}`
  }

  /**
   * Get axios proxy config
   */
  getAxiosConfig(proxy: ProxyConfig): { proxy: { host: string; port: number; auth?: { username: string; password: string } } } {
    return {
      proxy: {
        host: proxy.host,
        port: proxy.port,
        ...(proxy.auth ? { auth: proxy.auth } : {}),
      },
    }
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    return this.proxies.map(h => ({
      host: h.proxy.host,
      port: h.proxy.port,
      successCount: h.successCount,
      failCount: h.failCount,
      avgLatency: Math.round(h.avgLatency),
      isHealthy: h.failCount < this.maxFailures,
    }))
  }

  get hasProxies(): boolean {
    return this.proxies.length > 0
  }
}

// Singleton instance
export const proxyManager = new ProxyManager()
