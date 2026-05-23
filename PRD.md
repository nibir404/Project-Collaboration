# Product Requirements Document (PRD)

## GitHub Activity Tracker

**Version:** 1.0.0  
**Last Updated:** 2026-05-23  
**Status:** Production Ready

---

## 1. Executive Summary

### Problem Statement

Organizations using GitHub need a centralized way to track and monitor activities across their repositories. Currently, they must manually check individual repos or rely on GitHub notifications, which lack consolidated reporting and historical tracking.

### Solution

A production-grade webhook-based activity tracker that receives events from GitHub, stores them in a database, and presents them through a dashboard with filtering, statistics, and organization scoping.

### Target Users

- Development teams managing multiple repositories
- Org administrators needing activity oversight
- DevOps teams monitoring deployment pipelines

---

## 2. Functional Requirements

### 2.1 Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-001 | GitHub OAuth sign-in | Critical |
| AUTH-002 | Session persistence | Critical |
| AUTH-003 | Auto-create org on first login | High |

### 2.2 Activity Tracking

| ID | Requirement | Priority |
|----|-------------|----------|
| ACT-001 | Receive push events | Critical |
| ACT-002 | Receive pull request events | Critical |
| ACT-003 | Receive issue events | High |
| ACT-004 | Webhook signature verification | Critical |
| ACT-005 | Event deduplication | High |
| ACT-006 | Activity filtering by type/repo/date | High |

### 2.3 Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| DASH-001 | Activity feed with pagination | Critical |
| DASH-002 | Statistics cards (total, pushes, PRs, repos) | High |
| DASH-003 | Recent activity list | High |
| DASH-004 | Activity type filtering | Medium |

### 2.4 Webhook Management

| ID | Requirement | Priority |
|----|-------------|----------|
| WEB-001 | Generate webhook secret | Critical |
| WEB-002 | Display webhook URL | Critical |
| WEB-003 | Regenerate secret | High |
| WEB-004 | Copy to clipboard | Medium |

### 2.5 API

| ID | Requirement | Priority |
|----|-------------|----------|
| API-001 | RESTful endpoints | Critical |
| API-002 | Input validation | Critical |
| API-003 | Rate limiting | High |
| API-004 | Structured logging | High |
| API-005 | Health check endpoint | Medium |

---

## 3. Technical Architecture

### 3.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.3 |
| Database | Prisma ORM → SQLite/PostgreSQL |
| Auth | NextAuth.js |
| Styling | Tailwind CSS |
| Validation | Zod |
| Monitoring | Sentry (optional) |

### 3.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub                                │
│  (push, pull_request, issues events)                      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes                      │
│  ┌──────────────────────────────────────────────────┐   │
│  ���  /api/webhook/github (POST)                      │   │
│  │  - Verify HMAC-SHA256 signature                 │   │
│  │  - Deduplicate by deliveryId                   │   │
│  │  - Rate limit per org                        │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Prisma / SQLite                       │
│  Tables: Organization, User, Repository, Activity,       │
│         WebhookEvent, Account, Session                  │
└───────────────────────────────────────────────────────┘
                     ▲
                     │ Query
┌────────────────────┴────────────────────────────────────┐
│                  Dashboard Pages                        │
│  /dashboard, /dashboard/activities,                │
│  /dashboard/settings                               │
└─────────────────────────────────────────────────┘
```

### 3.3 Database Schema

#### Organization
- `id` (cuid, PK)
- `name` (String)
- `slug` (String, unique)
- `githubOrgId` (String, unique)
- `webhookSecret` (String, unique)
- `createdAt`, `updatedAt` (DateTime)

#### User
- `id` (cuid, PK)
- `email` (String, unique)
- `name`, `image` (String)
- `githubUserId` (String, unique)
- `role` (String, default: "member")
- `orgId` (FK → Organization)

#### Repository
- `id` (cuid, PK)
- `name`, `fullName` (String)
- `githubRepoId` (String, unique)
- `orgId` (FK → Organization)

#### Activity
- `id` (cuid, PK)
- `type` (String) - push, pull_request, issue, etc.
- `action` (String) - opened, closed, merged
- `repoName` (String)
- `actor` (String)
- `actorAvatar`, `commitSha`, `branch` (String)
- `payload` (JSON String)
- `orgId`, `repoId` (FK)
- `deliveryId` (String) - for deduplication
- `createdAt` (DateTime)

#### WebhookEvent
- Stores raw webhook payloads for debugging/replay
- `id`, `orgId`, `eventType`, `deliveryId`
- `payload` (String)
- `processed` (Boolean)
- `createdAt` (DateTime)

### 3.4 API Responses

Standard response format:

```typescript
// Success
{
  success: true,
  data: T,
  meta?: { total, limit, offset, hasMore }
}

// Error
{
  success: false,
  error: {
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 
          'RATE_LIMITED' | 'INTERNAL_ERROR' | 'BAD_REQUEST',
    message: string,
    details?: Record<string, unknown>,
    requestId?: string
  }
}
```

---

## 4. Security Specification

### 4.1 Security Headers

| Header | Value |
|--------|-------|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Strict-Transport-Security | max-age=31536000; includeSubDomains |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

### 4.2 Rate Limiting

- Default: 100 requests per 60 seconds per organization
- Configurable via environment variables
- In-memory implementation (Redis for distributed)

### 4.3 Input Sanitization

- All inputs validated with Zod schemas
- String sanitization for GitHub refs and payloads
- SQL injection prevention via Prisma parameterized queries

---

## 5. Acceptance Criteria

### 5.1 Authentication

| Criteria | Test Scenario |
|----------|--------------|
| Can sign in with GitHub | Click sign in → GitHub OAuth → Redirect to dashboard |
| New user gets org created | First login → Organization auto-created |
| Session persists | Login → Close browser → Reopen → Still logged in |

### 5.2 Webhook

| Criteria | Test Scenario |
|----------|--------------|
| Rejects invalid signature | Send webhook with wrong secret → 401 |
| Accepts valid signature | Send webhook with correct secret → 200 |
| Deduplicates events | Send same delivery twice → Second returns acknowledged |
| Limits abuse | Send 100+ webhooks → 429 response |

### 5.3 Dashboard

| Criteria | Test Scenario |
|----------|--------------|
| Shows activities | Visit dashboard → Activities displayed |
| Shows stats | Visit dashboard → Stats cards visible |
| Filters work | Select filter → Activities filtered |
| Pagination works | Click "View all" → Paginated list |

### 5.4 Health

| Criteria | Test Scenario |
|----------|--------------|
| Health endpoint | GET /api/health → 200 with status |
| DB connectivity | Health check includes database status |

---

## 6. Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection | `file:./dev.db` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | `Iv1.xxx` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret | `xxx` |
| `NEXTAUTH_SECRET` | Auth secret (32+ chars) | Random 32-char string |
| `NEXTAUTH_URL` | App base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Window in ms | `60000` |

---

## 7. Roadmap

### Planned Features

- [ ] Real-time updates (WebSocket/SSE)
- [ ] Activity search
- [ ] Slack/Discord notifications
- [ ] Repository filtering
- [ ] Team activity view
- [ ] Export to CSV/JSON
- [ ] Analytics charts
- [ ] Email digests
- [ ] Two-factor authentication

### Infrastructure

- [ ] PostgreSQL migration
- [ ] Redis for rate limiting
- [ ] CI/CD pipeline
- [ ] Container deployment
- [ ] Monitoring dashboard

---

## 8. Glossary

| Term | Definition |
|------|------------|
| Activity | A recorded GitHub event (push, PR, issue) |
| Delivery ID | Unique ID for each GitHub webhook delivery |
| Organization | GitHub organization being tracked |
| Webhook | HTTP POST from GitHub to this app |
| HMAC | Hash-based message authentication code |

---

## 9. Revision History

| Version | Date | Changes |
|---------|------|--------|
| 1.0.0 | 2026-05-23 | Initial production release |
| 0.9.0 | 2026-05-01 | Beta release |
| 0.1.0 | 2026-04-01 | Initial prototype |

---

## 10. Appendix

### Folder Structure

```
/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── activities/
│   │   │   ├── auth/
│   │   │   ├── health/
│   │   │   ├── organization/
│   │   │   └── webhook/github/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ActivityCard.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── ActivityFilter.tsx
│   │   ├── Chart.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── Navbar.tsx
│   │   ├── Providers.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   └── Toast.tsx
│   ├── lib/
│   │   ├── api-response.ts
│   │   ├── auth.ts
│   │   ├── env.ts
│   │   ├── github-webhook.ts
│   │   ├── logger.ts
│   │   ├── prisma.ts
│   │   ├── rate-limit.ts
│   │   ├── sentry.ts
│   │   └── validations.ts
│   └── types/
│       └── next-auth.d.ts
├── .env
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

### Key Dependencies

```json
{
  "next": "^14.2.0",
  "react": "^18.2.0",
  "@prisma/client": "^5.10.0",
  "next-auth": "^4.24.0",
  "zod": "^3.22.0",
  "tailwindcss": "^3.4.0"
}
```