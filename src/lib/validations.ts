import { z } from 'zod'

// ========================================
// Activity Filters Validation
// ========================================

export const activityFiltersSchema = z.object({
  type: z.enum(['push', 'pull_request', 'issue', 'create', 'delete', 'fork', 'watch', 'release']).optional(),
  repo: z.string().max(255).optional(),
  actor: z.string().max(255).optional(),
  branch: z.string().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const cursorPaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

export type ActivityFilters = z.infer<typeof activityFiltersSchema>
export type CursorPagination = z.infer<typeof cursorPaginationSchema>

// ========================================
// Organization Validation
// ========================================

export const updateOrganizationSchema = z.object({
  name: z.string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s'-]+$/, 'Organization name contains invalid characters'),
})

export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>

// ========================================
// Webhook Event Validation
// ========================================

export const webhookHeaderSchema = z.object({
  'x-hub-signature-256': z.string().optional(),
  'x-github-event': z.string().optional(),
  'x-github-delivery': z.string().optional(),
}).strict()

// ========================================
// Pagination Response Schema
// ========================================

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
  items: z.array(itemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
})

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
  nextCursor?: string
}

// ========================================
// Sanitization Helpers
// ========================================

export function sanitizeString(input: string): string {
  return input.replace(/[<>\"'&]/g, '').slice(0, 10000)
}

export function sanitizeGitHubRef(ref: string | undefined): string {
  if (!ref) return ''
  return ref.replace(/[^a-zA-Z0-9_~./^\-=]/g, '').slice(0, 500)
}