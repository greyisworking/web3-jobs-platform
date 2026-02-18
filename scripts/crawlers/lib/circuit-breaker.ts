/**
 * Circuit Breaker Pattern
 * Prevents repeated calls to failing services
 */

type CircuitState = 'closed' | 'open' | 'half-open'

interface CircuitConfig {
  failureThreshold: number    // Number of failures before opening
  resetTimeout: number        // Time in ms before trying again
  halfOpenRequests: number    // Number of test requests in half-open state
}

interface CircuitStats {
  state: CircuitState
  failures: number
  successes: number
  lastFailure: number | null
  lastSuccess: number | null
  openedAt: number | null
}

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 5,
  resetTimeout: 60000,    // 1 minute
  halfOpenRequests: 2,
}

class CircuitBreaker {
  private circuits: Map<string, CircuitStats> = new Map()
  private config: CircuitConfig

  constructor(config: Partial<CircuitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  private getCircuit(name: string): CircuitStats {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        state: 'closed',
        failures: 0,
        successes: 0,
        lastFailure: null,
        lastSuccess: null,
        openedAt: null,
      })
    }
    return this.circuits.get(name)!
  }

  /**
   * Check if requests are allowed for this circuit
   */
  canRequest(name: string): boolean {
    const circuit = this.getCircuit(name)
    const now = Date.now()

    switch (circuit.state) {
      case 'closed':
        return true

      case 'open':
        // Check if reset timeout has passed
        if (circuit.openedAt && now - circuit.openedAt >= this.config.resetTimeout) {
          circuit.state = 'half-open'
          circuit.successes = 0
          console.log(`🔄 Circuit ${name}: half-open (testing)`)
          return true
        }
        return false

      case 'half-open':
        // Allow limited requests for testing
        return circuit.successes < this.config.halfOpenRequests
    }
  }

  /**
   * Record a successful request
   */
  recordSuccess(name: string) {
    const circuit = this.getCircuit(name)
    circuit.lastSuccess = Date.now()
    circuit.successes++

    if (circuit.state === 'half-open') {
      if (circuit.successes >= this.config.halfOpenRequests) {
        circuit.state = 'closed'
        circuit.failures = 0
        circuit.openedAt = null
        console.log(`✅ Circuit ${name}: closed (recovered)`)
      }
    } else if (circuit.state === 'closed') {
      // Reduce failure count on success (gradual recovery)
      circuit.failures = Math.max(0, circuit.failures - 1)
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(name: string, error?: Error) {
    const circuit = this.getCircuit(name)
    circuit.lastFailure = Date.now()
    circuit.failures++

    if (circuit.state === 'half-open') {
      // Any failure in half-open state reopens the circuit
      circuit.state = 'open'
      circuit.openedAt = Date.now()
      console.log(`❌ Circuit ${name}: re-opened (half-open test failed)`)
    } else if (circuit.state === 'closed') {
      if (circuit.failures >= this.config.failureThreshold) {
        circuit.state = 'open'
        circuit.openedAt = Date.now()
        console.log(`🔴 Circuit ${name}: opened (threshold reached: ${circuit.failures} failures)`)
      }
    }
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.canRequest(name)) {
      throw new Error(`Circuit ${name} is open - requests blocked`)
    }

    try {
      const result = await fn()
      this.recordSuccess(name)
      return result
    } catch (error) {
      this.recordFailure(name, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Get stats for all circuits
   */
  getStats(): Record<string, CircuitStats & { remainingCooldown?: number }> {
    const now = Date.now()
    const stats: Record<string, CircuitStats & { remainingCooldown?: number }> = {}

    for (const [name, circuit] of this.circuits) {
      stats[name] = {
        ...circuit,
        remainingCooldown: circuit.state === 'open' && circuit.openedAt
          ? Math.max(0, this.config.resetTimeout - (now - circuit.openedAt))
          : undefined,
      }
    }

    return stats
  }

  /**
   * Reset a specific circuit (for manual intervention)
   */
  reset(name: string) {
    this.circuits.delete(name)
    console.log(`🔧 Circuit ${name}: manually reset`)
  }

  /**
   * Reset all circuits
   */
  resetAll() {
    this.circuits.clear()
    console.log('🔧 All circuits reset')
  }
}

// Singleton instance
export const circuitBreaker = new CircuitBreaker()

// Per-domain circuit breaker (more granular)
export const domainCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000,    // 30 seconds for domain-level
  halfOpenRequests: 1,
})
