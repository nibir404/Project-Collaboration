# Project Structure

## Current (Messy)
```
project-root/
├── src/
│   ├── app/              # Mixed pages + API
│   ├── components/       # Mixed UI
│   ├── lib/             # Mixed utilities - should be in core/
│   └── types/          # Mixed types
├── config/             # Some config here...
├── database/           # ...and some here
├── prisma/             # ...and here too!
├── infrastructure/     # Empty folder
├── package.json
└── next.config.js
```

## Proposed (Clean Domain-Based)

```
project-root/
├── apps/
│   ├── web/                    # Next.js web application  
│   │   ├── src/
│   │   │   ├── app/         # App Router pages & API
│   │   │   ├── components/ # UI Components
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── lib/      # Web-specific utils
│   │   │   └── types/    # Web types
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                    # API Server (future extraction)
│       ├── src/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── lib/       # Auth, DB clients
│       │   └── types/
│       └── package.json
│
├── packages/                    # Shared packages
│   ├── ui/                    # Shared UI components
│   │   └── src/
│   ├── utils/                 # Shared utilities
│   │   └── src/
│   ├── auth/                 # Auth configuration  
│   │   └── src/
│   └── config/                # Shared config
│       └── src/
│
├── database/
│   ├── schema.prisma         # Prisma schema
│   ├── migrations/          # SQL migrations
│   └── seed/               # Seed scripts
│
├── infrastructure/           # DevOps
│   ├── docker/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   └── Dockerfile.api
│   └── k8s/
│       ├── deployment.yaml
│       └── service.yaml
│
├── config/                     # Root config files
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── next.config.js
│   └── .eslintrc.json
│
├── package.json               # Root workspace
├── turbo.json              # Turborepo config
├── .env.example
├── README.md
└── docker-compose.yml
```

## Simplified Option (Current Project Recommended)

For a Next.js single-app project, use this cleaner internal structure:

```
src/
├── app/                       # Next.js App Router
│   ├── (auth)/               # Auth group
│   │   ├── signin/
│   │   └── error/
│   ├── (dashboard)/         # Protected group
│   │   ├── activities/
│   │   ├── settings/
│   │   └── page.tsx
│   ├── api/                  # API Routes
│   │   ├── activities/
│   │   ├── health/
│   │   ├── organization/
│   │   └── webhook/github/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                 # React Components
│   ├── ui/                 # Base UI (buttons, inputs)
│   ├── features/            # Feature-specific
│   │   ├── activities/
│   │   ├── dashboard/
│   │   └── webhooks/
│   └── layouts/             # Layout components
│
��── lib/                     # Core utilities
│   ├── api/                # API helpers
│   ├── auth.ts             # NextAuth config
│   ├── db.ts               # Prisma client
│   └── validation.ts        # Zod schemas
│
├── types/                   # TypeScript types
│
├── hooks/                   # React hooks
│
├── constants/               # App constants
│
└── utils/                  # Utility functions
    ├── date.ts
    └── string.ts

# Keep database and infra separate:
database/
├── schema.prisma
└── seed/

infrastructure/
├── docker/
│   └── Dockerfile
└── k8s/

config/                     # Root config
├── tailwind.config.ts
├── next.config.js
└── .env.example
```

## Benefits of Domain Separation

| Aspect | Benefit |
|--------|---------|
| **Components** | UI/feature separation enables reuse |
| **Lib/Utils** | Clear ownership, easier testing |
| **Database** | Independent versioning |
| **Config** | Clear what's env-specific |
| **Infra** | Ready for containerization |