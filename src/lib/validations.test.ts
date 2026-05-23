import { describe, it, expect } from 'vitest'
import {
  activityFiltersSchema,
  cursorPaginationSchema,
  updateOrganizationSchema,
  sanitizeString,
  sanitizeGitHubRef,
} from './validations'

describe('activityFiltersSchema', () => {
  it('should pass with valid filters', () => {
    const result = activityFiltersSchema.safeParse({
      type: 'push',
      repo: 'owner/repo',
      limit: 50,
    })
    expect(result.success).toBe(true)
  })

  it('should pass with no filters', () => {
    const result = activityFiltersSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should fail with invalid type', () => {
    const result = activityFiltersSchema.safeParse({ type: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('should enforce limit bounds', () => {
    expect(activityFiltersSchema.safeParse({ limit: 0 }).success).toBe(false)
    expect(activityFiltersSchema.safeParse({ limit: 101 }).success).toBe(false)
    expect(activityFiltersSchema.safeParse({ limit: 50 }).success).toBe(true)
  })
})

describe('cursorPaginationSchema', () => {
  it('should pass with valid cursor pagination', () => {
    const result = cursorPaginationSchema.safeParse({
      limit: 20,
      cursor: 'abc123',
    })
    expect(result.success).toBe(true)
  })

  it('should apply default values', () => {
    const result = cursorPaginationSchema.parse({})
    expect(result.limit).toBe(20)
    expect(result.cursor).toBeUndefined()
  })
})

describe('updateOrganizationSchema', () => {
  it('should pass with valid organization name', () => {
    const result = updateOrganizationSchema.safeParse({ name: 'My Org 123' })
    expect(result.success).toBe(true)
  })

  it('should fail with empty name', () => {
    const result = updateOrganizationSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('should fail with invalid characters', () => {
    const result = updateOrganizationSchema.safeParse({ name: 'Org@#$%' })
    expect(result.success).toBe(false)
  })
})

describe('sanitizeString', () => {
  it('should remove dangerous characters', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script')
  })

  it('should truncate to 10000 characters', () => {
    const long = 'a'.repeat(15000)
    expect(sanitizeString(long).length).toBe(10000)
  })
})

describe('sanitizeGitHubRef', () => {
  it('should allow valid git refs', () => {
    expect(sanitizeGitHubRef('refs/heads/main')).toBe('refs/heads/main')
    expect(sanitizeGitHubRef('feature/my-branch')).toBe('feature/my-branch')
  })

  it('should remove invalid characters', () => {
    // semicolons are removed, not replaced with spaces
    expect(sanitizeGitHubRef('branch;rm-rf/')).toBe('branchrm-rf/')
  })

  it('should return empty string for undefined', () => {
    expect(sanitizeGitHubRef(undefined)).toBe('')
  })
})