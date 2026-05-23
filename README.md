# GitHub Activity Tracker

A production-grade Next.js application for tracking GitHub organization activities via webhooks. Monitor pushes, pull requests, issues, and more in real-time.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Real-time Activity Tracking** - Receives webhooks from GitHub for pushes, PRs, issues, and more
- **Organization Scoped** - Each organization only sees their own activities
- **Dashboard** - Visual dashboard with activity feeds and statistics
- **Webhook Management** - Auto-generated secrets with regeneration support
- **Production Ready** - Security headers, rate limiting, input validation, structured logging

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and navigate
cd github-activity-tracker

# Install dependencies
npm install

# Setup database
npx prisma db push

# Start development server
npm run dev
```

Visit http://localhost:3000

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
NEXTAUTH_SECRET="at-least-32-characters-long-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
LOG_LEVEL="info"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW_MS="60000"
```

## GitHub OAuth Setup

1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Set **Homepage URL**: `http://localhost:3000`
4. Set **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and generate Client Secret
6. Update `.env` with credentials

## GitHub Webhook Setup

1. Go to your repository or organization Settings → Webhooks
2. Add webhook:
   - **Payload URL**: `{YOUR_APP_URL}/api/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: Copy from Settings page in the app
3. Select events: `Push`, `Pull requests`, `Issues`

## Project Structure

```
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── api/         # API routes
│   │   │   ├── activities/
│   │   │   ├── health/
│   │   │   ├── organization/
│   │   │   └── webhook/github/
│   │   ├── auth/        # Authentication pages
│   │   └── dashboard/   # Protected dashboard
│   ├── components/      # React components
│   ├── lib/             # Utilities
│   │   ├── auth.ts      # NextAuth config
│   │   ├── api-response.ts
│   │   ├── env.ts
│   │   ├── github-webhook.ts
│   │   ├── logger.ts
│   │   ├── prisma.ts
│   │   ├── rate-limit.ts
│   │   ├── sentry.ts
│   │   └── validations.ts
│   └── types/           # TypeScript definitions
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

## API Endpoints

| Method | Path | Description |
|--------|------|------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/activities` | List activities |
| GET/PATCH | `/api/organization` | Get/update org |
| POST | `/api/organization/regenerate-webhook` | Regenerate webhook secret |
| POST | `/api/webhook/github` | Receive GitHub webhooks |

## Scripts

```bash
npm run dev          # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run db:push     # Push schema to database
npm run db:studio   # Open Prisma Studio
npm run db:migrate # Run migrations
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3
- **Database**: Prisma with SQLite (PostgreSQL-ready)
- **Auth**: NextAuth.js with GitHub Provider
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Monitoring**: Sentry (optional)

## Production Deployment

### Database (PostgreSQL)

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Update `.env`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/tracker"
NODE_ENV="production"
```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL database URL
- [ ] Set strong `NEXTAUTH_SECRET` (32+ chars, randomly generated)
- [ ] Configure `NEXT_PUBLIC_APP_URL` to your production URL
- [ ] Set up Sentry DSN (optional)
- [ ] Configure rate limiting for production load

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Features

- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Input validation with Zod
- ✅ Rate limiting (100 req/min per organization)
- ✅ Webhook signature verification (HMAC-SHA256)
- ✅ Request ID tracing
- ✅ Structured logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.