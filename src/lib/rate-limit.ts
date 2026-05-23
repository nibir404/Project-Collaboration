/**
 * Simple in-memory rate limiter for preventing webhook abuse.
 *
 * Note: In production, consider using Redis-backed rate limiter for distributed systems.
 * This implementation works for single-server deployments.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Check if request is allowed and record it
   */
  check(key: string): RateLimitResult {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.resetAt) {
      // New window
      this.store.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      })

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      }
    }

    if (entry.count >= this.maxRequests) {
      // Rate limited
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      }
    }

    // Increment count
    entry.count++
    this.store.set(key, entry)

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.resetAt,
    }
  }

  /**
   * Get current status without incrementing
   */
  getStatus(key: string): RateLimitResult {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.resetAt) {
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetAt: now + this.windowMs,
      }
    }

    return {
      allowed: entry.count < this.maxRequests,
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetAt: entry.resetAt,
      retryAfter: entry.count >= this.maxRequests
        ? Math.ceil((entry.resetAt - now) / 1000)
        : undefined,
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key)
      }
    }
  }
}

// Singleton instance
let rateLimiterInstance: InMemoryRateLimiter | null = null

/**
 * Get or create rate limiter instance
 */
export function getRateLimiter(): InMemoryRateLimiter {
  if (!rateLimiterInstance) {
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10)
    rateLimiterInstance = new InMemoryRateLimiter(maxRequests, windowMs)
  }
  return rateLimiterInstance
}

/**
 * Check if IP address is rate limited
 */
export function isRateLimited(ip: string): RateLimitResult {
  return getRateLimiter().check(`ip:${ip}`)
}

/**
 * Check if webhook org is rate limited
 */
export function isOrgRateLimited(orgId: string): RateLimitResult {
  return getRateLimiter().check(`org:${orgId}`)
}

export type { RateLimitResult }