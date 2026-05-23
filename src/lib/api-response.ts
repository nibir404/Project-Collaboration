import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from './logger'

/**
 * Standardized API response helpers with consistent error handling.
 */

// ========================================
// Response Types
// ========================================

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'METHOD_NOT_ALLOWED'

interface ApiError {
  code: ApiErrorCode
  message: string
  details?: Record<string, unknown>
  requestId?: string
}

interface PaginationMeta {
  total: number
  limit: number
  offset: number
  hasMore: boolean
  nextCursor?: string
}

interface SuccessResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

interface ErrorResponse {
  success: false
  error: ApiError
}

// ========================================
// Response Helpers
// ========================================

/**
 * Generate unique request ID for tracing
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Get request ID from headers or generate new one
 */
export function getRequestId(request: NextRequest): string {
  return request.headers.get('x-request-id') || generateRequestId()
}

/**
 * Successful response with optional pagination
 */
export function success<T>(
  data: T,
  status = 200,
  meta?: PaginationMeta
): NextResponse<SuccessResponse<T>> {
  const body: SuccessResponse<T> = {
    success: true,
    data,
  }
  if (meta) {
    body.meta = meta
  }
  return NextResponse.json(body, { status })
}

/**
 * Error response with standardized format
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status = 400,
  details?: Record<string, unknown>,
  requestId?: string
): NextResponse<ErrorResponse> {
  const body: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      requestId,
    },
  }
  return NextResponse.json(body, { status })
}

/**
 * Unauthorized (not logged in)
 */
export function unauthorized(message = 'Authentication required'): NextResponse<ErrorResponse> {
  return apiError('UNAUTHORIZED', message, 401)
}

/**
 * Forbidden (logged in but no permissions)
 */
export function forbidden(message = 'Access denied'): NextResponse<ErrorResponse> {
  return apiError('FORBIDDEN', message, 403)
}

/**
 * Resource not found
 */
export function notFound(message = 'Resource not found'): NextResponse<ErrorResponse> {
  return apiError('NOT_FOUND', message, 404)
}

/**
 * Validation error from Zod
 */
export function validationError(
  err: ZodError,
  requestId?: string
): NextResponse<ErrorResponse> {
  const details: Record<string, unknown> = {}
  err.errors.forEach((e) => {
    const path = e.path.join('.')
    details[path] = e.message
  })

  return apiError(
    'VALIDATION_ERROR',
    'Request validation failed',
    400,
    details,
    requestId
  )
}

/**
 * Rate limited
 */
export function rateLimited(
  retryAfter?: number,
  requestId?: string
): NextResponse<ErrorResponse> {
  return apiError(
    'RATE_LIMITED',
    'Too many requests',
    429,
    { retryAfter },
    requestId
  )
}

/**
 * Internal server error (sanitized for production)
 */
export function internalError(
  requestId?: string,
  isDevelopment = process.env.NODE_ENV !== 'production'
): NextResponse<ErrorResponse> {
  const message = isDevelopment
    ? 'An unexpected error occurred. Please check the logs.'
    : 'Internal server error'

  return apiError(
    'INTERNAL_ERROR',
    message,
    500,
    isDevelopment ? { requestId } : undefined,
    requestId
  )
}

/**
 * Bad request helper
 */
export function badRequest(
  message: string,
  details?: Record<string, unknown>,
  requestId?: string
): NextResponse<ErrorResponse> {
  return apiError('BAD_REQUEST', message, 400, details, requestId)
}

// ========================================
// Error Handler Wrapper
// ========================================

/**
 * Wrap route handler with centralized error handling
 */
export function withErrorHandling(
  handler: (request: NextRequest, requestId: string) => Promise<NextResponse<any>>,
  requireAuth = true
) {
  return async function (request: NextRequest) {
    const requestId = getRequestId(request)
    const log = logger.withRequest(requestId)

    try {
      // Optional auth check could be added here
      // if (requireAuth) {
      //   const session = await getServerSession(authOptions)
      //   if (!session?.user) {
      //     return unauthorized(undefined, requestId)
      //   }
      // }

      return await handler(request, requestId)
    } catch (err) {
      // Log the error
      log.error('Unhandled error in API route', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      })

      // Return sanitized error response
      return internalError(requestId)
    }
  }
}

// ========================================
// Parse/Validate Helpers
// ========================================

/**
 * Safely parse JSON body
 */
export async function parseJsonBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json() as T
  } catch {
    return null
  }
}

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}