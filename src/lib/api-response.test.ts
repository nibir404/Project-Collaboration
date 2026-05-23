import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import {
  generateRequestId,
  getRequestId,
  success,
  unauthorized,
  notFound,
  badRequest,
  internalError,
  validationError,
  rateLimited,
  getClientIp,
  ApiErrorCode,
} from './api-response'
import { ZodError, z } from 'zod'

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    withRequest: () => ({
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
  },
}))

describe('generateRequestId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateRequestId()
    const id2 = generateRequestId()
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^\d+-[a-z0-9]+$/)
  })
})

describe('getRequestId', () => {
  it('should return header request ID if present', () => {
    const req = new NextRequest('http://localhost', {
      headers: { 'x-request-id': 'custom-id-123' },
    })
    expect(getRequestId(req)).toBe('custom-id-123')
  })

  it('should generate new ID if header not present', () => {
    const req = new NextRequest('http://localhost')
    expect(getRequestId(req)).toMatch(/^\d+-[a-z0-9]+$/)
  })
})

describe('success response', () => {
  it('should create success response with data', async () => {
    const res = success({ user: 'test' })
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      data: { user: 'test' },
    })
  })

  it('should include pagination meta when provided', async () => {
    const meta = { total: 100, limit: 20, offset: 0, hasMore: true }
    const res = success({ items: [] }, 200, meta)
    const body = await res.json()
    expect(body.meta).toEqual(meta)
  })
})

describe('error responses', () => {
  it('should create unauthorized response', async () => {
    const res = unauthorized()
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED' },
    })
  })

  it('should create notFound response', async () => {
    const res = notFound('User not found')
    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    })
  })

  it('should create badRequest response', async () => {
    const res = badRequest('Invalid input', { field: 'email' })
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid input',
        details: { field: 'email' },
      },
    })
  })

  it('should create validationError response from ZodError', async () => {
    const schema = z.object({ name: z.string() })
    const err = schema.safeParse({}).error as ZodError
    const res = validationError(err, 'req-123')
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details).toHaveProperty('name')
  })

  it('should create rateLimited response', async () => {
    const res = rateLimited(60, 'req-123')
    expect(res.status).toBe(429)
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        details: { retryAfter: 60 },
      },
    })
  })
})

describe('getClientIp', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const req = new NextRequest('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('should extract IP from cf-connecting-ip header', () => {
    const req = new NextRequest('http://localhost', {
      headers: { 'cf-connecting-ip': '9.8.7.6' },
    })
    expect(getClientIp(req)).toBe('9.8.7.6')
  })

  it('should return unknown when no headers present', () => {
    const req = new NextRequest('http://localhost')
    expect(getClientIp(req)).toBe('unknown')
  })
})