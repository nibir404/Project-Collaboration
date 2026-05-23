/**
 * Sentry initialization for error tracking.
 * Import this in your layout or API routes to enable error monitoring.
 *
 * Required: npm install @sentry/nextjs
 *
 * Add to .env:
 *   SENTRY_DSN=https://...@sentry.io/...
 *   SENTRY_AUTH_TOKEN=...
 *   SENTRY_ORG=...
 *   SENTRY_PROJECT=...
 */

import { logger } from './logger'

// ========================================
// Sentry Configuration
// ========================================

interface SentryConfig {
  dsn?: string
  environment?: string
  release?: string
  sampleRate?: number
}

/**
 * Initialize Sentry with Next.js integration
 * Call this in your app's initialization
 */
export async function initSentry(config: SentryConfig = {}): Promise<void> {
  const { dsn, environment, release } = config

  // Check if DSN is configured
  if (!dsn && !process.env.SENTRY_DSN) {
    logger.info('Sentry DSN not configured, skipping initialization')
    return
  }

  try {
    // Dynamic import to allow app to work without Sentry installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs')

    Sentry.init({
      dsn: dsn || process.env.SENTRY_DSN,
      environment: environment || process.env.NODE_ENV,
      release: release || process.env.npm_package_version,
      // Sample rate: 100% in development, 10% in production
      sampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
      // Ignore certain errors
      ignoreErrors: [
        'ResizeObserver',
        'NetworkError',
        'Network request failed',
      ],
      // Attach metadata
      attachments: true,
      // Dedup events
      dedupeSession: true,
    })

    logger.info('Sentry initialized successfully')
  } catch (err) {
    // Sentry not installed, that's okay
    logger.debug('Sentry not available:', err)
  }
}

/**
 * Capture exception with optional tags
 */
export function captureException(
  error: Error,
  tags?: Record<string, string>
): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs')
    Sentry.captureException(error, { tags })
  } catch {
    // Fallback to console
    console.error('Unhandled exception:', error)
  }
}

/**
 * Capture message with optional level
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  tags?: Record<string, string>
): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs')
    Sentry.captureMessage(message, level, { tags })
  } catch {
    // Fallback to console
    console.log(`[${level}]`, message)
  }
}

/**
 * Set user context for all future events
 */
export function setUserContext(user: {
  id: string
  email?: string
  username?: string
}): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs')
    Sentry.setUser(user)
  } catch {
    // Ignore
  }
}

/**
 * Add breadcrumb for tracing
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs')
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    })
  } catch {
    // Ignore
  }
}

/**
 * Create performance transaction wrapper
 */
export function withTransaction<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return require('@sentry/nextjs')
    .startActiveSpan(name, async (span) => {
      try {
        const result = await fn()
        span.setStatus('ok')
        return result
      } catch (err) {
        span.setStatus('internal_error')
        throw err
      } finally {
        span.end()
      }
    })
}

/**
 * Wrap API route handler with error tracking
 */
export function withSentryErrorTracking(
  handler: (request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      return await handler(request)
    } catch (err) {
      if (err instanceof Error) {
        captureException(err, {
          path: request.url,
          method: request.method,
        })
      }
      throw err
    }
  }
}