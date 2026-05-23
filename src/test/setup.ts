// Global test setup
import { vi } from 'vitest'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-chars-long'
process.env.DATABASE_URL = 'file:./test.db'

// Global test timeout
vi.setConfig({
  testTimeout: 10000,
})