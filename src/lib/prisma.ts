import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

// ========================================
// Prisma Client with Connection Pooling
// ========================================

// Prevent multiple instances in development due to hot reload
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma ?? new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
})

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Prisma query', {
      duration: e.duration,
      query: e.query.slice(0, 200),
    })
  })
}

prisma.$on('warn', (e) => {
  logger.warn('Prisma warning', { message: e.message })
})

prisma.$on('error', (e) => {
  logger.error('Prisma error', { message: e.message })
})

// Store client instance to avoid reconnections during hot reload
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// ========================================
// Graceful Shutdown
// ========================================

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect()
  logger.info('Prisma disconnected')
}

// Handle shutdown signals
process.on('beforeExit', async () => {
  await disconnectPrisma()
})

export default prisma