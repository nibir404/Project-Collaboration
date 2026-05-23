/**
 * Environment variable validation at startup.
 * Ensures all required configuration is present before the application starts.
 */

import { logger } from './logger'

// ========================================
// Required Environment Variables
// ========================================

interface EnvConfig {
  // Database
  DATABASE_URL: string

  // GitHub OAuth
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string

  // Application
  NEXT_PUBLIC_APP_URL: string
  NEXTAUTH_SECRET: string
  NEXTAUTH_URL: string

  // Optional
  NODE_ENV: 'development' | 'production' | 'test'
  LOG_LEVEL: string
  RATE_LIMIT_MAX: string
  RATE_LIMIT_WINDOW_MS: string
}

type OptionalEnvKey = keyof Pick<EnvConfig, 'LOG_LEVEL' | 'RATE_LIMIT_MAX' | 'RATE_LIMIT_WINDOW_MS'>

const REQUIRED_KEYS: (keyof EnvConfig)[] = [
  'DATABASE_URL',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
]

const VALIDATORS: Record<string, (value: string) => boolean> = {
  DATABASE_URL: (v) => v.startsWith('postgresql://') || v.startsWith('sqlite://') || v.startsWith('file:'),
  GITHUB_CLIENT_ID: (v) => v.length > 5,
  GITHUB_CLIENT_SECRET: (v) => v.length > 10,
  NEXT_PUBLIC_APP_URL: (v) => v.startsWith('http://') || v.startsWith('https://'),
  NEXTAUTH_SECRET: (v) => v.length >= 32,
}

class EnvValidationError extends Error {
  constructor(message: string, public missingKeys: string[], public invalidKeys: string[]) {
    super(message)
    this.name = 'EnvValidationError'
  }
}

// ========================================
// Validation Functions
// ========================================

/**
 * Validate all required environment variables
 */
export function validateEnv(): EnvConfig {
  const missingKeys: string[] = []
  const invalidKeys: string[] = []

  // Check required keys
  for (const key of REQUIRED_KEYS) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      missingKeys.push(key)
      continue
    }

    // Run custom validator if exists
    const validator = VALIDATORS[key]
    if (validator && !validator(value)) {
      invalidKeys.push(key)
    }
  }

  if (missingKeys.length > 0 || invalidKeys.length > 0) {
    const errors: string[] = []

    if (missingKeys.length > 0) {
      errors.push(`Missing required environment variables: ${missingKeys.join(', ')}`)
    }

    if (invalidKeys.length > 0) {
      errors.push(`Invalid environment variables: ${invalidKeys.join(', ')}`)
    }

    const message = errors.join('. ')
    logger.fatal(message)
    throw new EnvValidationError(message, missingKeys, invalidKeys)
  }

  logger.info('Environment variables validated successfully')

  return process.env as unknown as EnvConfig
}

/**
 * Get optional environment variable with default
 */
export function getEnv<K extends OptionalEnvKey>(key: K, defaultValue: string): string {
  return process.env[key] || defaultValue
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

// Auto-validate on import (can be disabled in tests)
if (process.env.SKIP_ENV_VALIDATION !== 'true') {
  try {
    validateEnv()
  } catch (err) {
    // In test environment, don't fail
    if (process.env.NODE_ENV === 'test') {
      console.warn('Skipping env validation in test mode')
    } else {
      console.error('Environment validation failed:', err)
      process.exit(1)
    }
  }
}