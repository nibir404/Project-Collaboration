import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyGitHubWebhook, parseActivityFromEvent } from '@/lib/github-webhook'
import { isOrgRateLimited, type RateLimitResult } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { apiError, badRequest, rateLimited, getRequestId, unauthorized } from '@/lib/api-response'

// ========================================
// Constants
// ========================================

const MAX_PAYLOAD_SIZE = 1_000_000 // 1MB
const ALLOWED_EVENTS = ['push', 'pull_request', 'issues', 'issue_comment', 'create', 'delete', 'fork', 'watch', 'release']

// ========================================
// POST Handler - Receive GitHub Webhooks
// ========================================

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  const log = logger.withRequest(requestId)

  try {
    // 1. Validate content type
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      log.warn('Invalid content type', { contentType })
      return badRequest('Content-Type must be application/json', undefined, requestId)
    }

    // 2. Get headers
    const signature = request.headers.get('x-hub-signature-256')
    const eventType = request.headers.get('x-github-event')
    const deliveryId = request.headers.get('x-github-delivery')

    if (!eventType) {
      log.warn('Missing event type header')
      return badRequest('Missing x-github-event header', undefined, requestId)
    }

    // 3. Validate event type
    if (!ALLOWED_EVENTS.includes(eventType)) {
      log.info('Unsupported event type', { eventType })
      // Return success for unsupported events to satisfy GitHub
      return NextResponse.json({ acknowledged: true, eventType })
    }

    // 4. Check payload size
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      log.warn('Payload too large', { size: contentLength })
      return badRequest('Payload too large', { maxSize: MAX_PAYLOAD_SIZE }, requestId)
    }

    // 5. Read and validate body
    const rawBody = await request.text()
    let payload: any

    try {
      payload = JSON.parse(rawBody)
    } catch {
      log.warn('Invalid JSON payload')
      return badRequest('Invalid JSON payload', undefined, requestId)
    }

    // 6. Get organizations with webhook secret configured
    const organizations = await prisma.organization.findMany({
      where: {
        webhookSecret: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        webhookSecret: true,
        name: true,
      },
    })

    if (organizations.length === 0) {
      log.info('No organizations configured with webhooks')
      return NextResponse.json({ acknowledged: true })
    }

    let processedOrgs = 0

    // 7. Process each organization
    for (const org of organizations) {
      if (!org.webhookSecret) continue

      // Check rate limit for this org
      const rateLimit: RateLimitResult = isOrgRateLimited(org.id)
      if (!rateLimit.allowed) {
        log.warn('Organization rate limited', { orgId: org.id, orgName: org.name })
        return rateLimited(rateLimit.retryAfter, requestId)
      }

      // Verify webhook signature
      const isValidSignature = verifyGitHubWebhook(rawBody, signature, org.webhookSecret)
      if (!isValidSignature) {
        log.debug('Invalid signature', { orgId: org.id, orgName: org.name })
        continue
      }

      // 8. Check for duplicate event using deliveryId
      if (deliveryId) {
        const existing = await prisma.activity.findFirst({
          where: {
            orgId: org.id,
            deliveryId,
          },
          select: { id: true },
        })

        if (existing) {
          log.info('Duplicate webhook event', { deliveryId, orgId: org.id })
          processedOrgs++ // Count as processed but skip
          continue
        }
      }

      // 9. Store raw webhook event for debugging
      await prisma.webhookEvent.create({
        data: {
          orgId: org.id,
          eventType,
          deliveryId: deliveryId || undefined,
          payload: rawBody.slice(0, MAX_PAYLOAD_SIZE), // Limit stored size
          processed: true,
        },
      })

      // 10. Parse and store activity
      const activityData = parseActivityFromEvent(eventType, payload)

      if (activityData) {
        const repoId = payload?.repository?.id?.toString()

        // Find or create repository
        let repository = repoId
          ? await prisma.repository.findUnique({
              where: { githubRepoId: repoId },
            })
          : null

        if (!repository && payload?.repository) {
          repository = await prisma.repository.upsert({
            where: { githubRepoId: String(payload.repository.id) },
            create: {
              name: payload.repository.name,
              fullName: payload.repository.full_name,
              githubRepoId: String(payload.repository.id),
              orgId: org.id,
            },
            update: {},
          })
        }

        // Create activity record
        await prisma.activity.create({
          data: {
            type: activityData.type,
            action: activityData.action,
            repoName: activityData.repoName,
            actor: activityData.actor,
            actorAvatar: activityData.actorAvatar,
            commitSha: activityData.commitSha,
            branch: activityData.branch,
            payload: activityData.payloadJson,
            orgId: org.id,
            repoId: repository?.id,
            deliveryId: deliveryId || undefined,
          },
        })

        log.info('Activity created', {
          orgId: org.id,
          type: activityData.type,
          actor: activityData.actor,
        })

        processedOrgs++
      }
    }

    log.info('Webhook processed', {
      eventType,
      deliveryId,
      processedOrgs,
    })

    return NextResponse.json({
      acknowledged: true,
      eventType,
      deliveredTo: processedOrgs,
    })
  } catch (err) {
    // Log error properly
    const errorMessage = err instanceof Error ? err.message : String(err)
    log.error('Webhook processing failed', { error: errorMessage })

    return apiError(
      'INTERNAL_ERROR',
      'Failed to process webhook',
      500,
      undefined,
      requestId
    )
  }
}

// ========================================
// GET Handler - Health Check
// ========================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'github-webhook',
    timestamp: new Date().toISOString(),
  })
}

// ========================================
// OPTIONS Handler - CORS Preflight
// ========================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  })
}