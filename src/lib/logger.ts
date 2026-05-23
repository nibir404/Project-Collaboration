/**
 * Structured logging utility using pino-compatible format.
 * Works with existing console logging, upgrades to structured output.
 */

export enum LogLevel {
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
  FATAL = 50,
}

interface LogMetadata {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: number
  levelName: string
  message: string
  metadata?: LogMetadata
  requestId?: string
  userId?: string
  orgId?: string
}

class Logger {
  private minLevel: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.minLevel = this.parseLevel(process.env.LOG_LEVEL || 'info')
    this.isDevelopment = process.env.NODE_ENV !== 'production'
  }

  private parseLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG
      case 'info': return LogLevel.INFO
      case 'warn': return LogLevel.WARN
      case 'error': return LogLevel.ERROR
      case 'fatal': return LogLevel.FATAL
      default: return LogLevel.INFO
    }
  }

  private formatEntry(entry: LogEntry): string {
    // In production, output JSON for log aggregation
    if (!this.isDevelopment) {
      return JSON.stringify(entry)
    }

    // In development, use human-readable format
    const levelColors: Record<string, string> = {
      DEBUG: '\x1b[36m',
      INFO: '\x1b[32m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      FATAL: '\x1b[35m',
    }
    const reset = '\x1b[0m'

    const color = levelColors[entry.levelName] || ''
    const timestamp = new Date(entry.timestamp).toISOString()

    return `${timestamp} ${color}${entry.levelName}${reset} ${entry.message}${
      entry.metadata ? ' ' + JSON.stringify(entry.metadata) : ''
    }`
  }

  private log(level: LogLevel, levelName: string, message: string, metadata?: LogMetadata): void {
    if (level < this.minLevel) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName,
      message,
      metadata,
    }

    // Use console methods for proper log levels
    const output = this.formatEntry(entry)

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(output)
        break
      case LogLevel.WARN:
        console.warn(output)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(output)
        break
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, metadata)
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, 'INFO', message, metadata)
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, 'WARN', message, metadata)
  }

  error(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.ERROR, 'ERROR', message, metadata)
  }

  fatal(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.FATAL, 'FATAL', message, metadata)
  }

  // Helper for request context
  withRequest(requestId: string): Pick<Logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'> {
    const self = this
    return {
      debug(message: string, metadata?: LogMetadata) {
        self.log(LogLevel.DEBUG, 'DEBUG', message, { ...metadata, requestId })
      },
      info(message: string, metadata?: LogMetadata) {
        self.log(LogLevel.INFO, 'INFO', message, { ...metadata, requestId })
      },
      warn(message: string, metadata?: LogMetadata) {
        self.log(LogLevel.WARN, 'WARN', message, { ...metadata, requestId })
      },
      error(message: string, metadata?: LogMetadata) {
        self.log(LogLevel.ERROR, 'ERROR', message, { ...metadata, requestId })
      },
      fatal(message: string, metadata?: LogMetadata) {
        self.log(LogLevel.FATAL, 'FATAL', message, { ...metadata, requestId })
      },
    }
  }

  // Helper for user/org context
  withContext(userId?: string, orgId?: string): Pick<Logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'> {
    const self = this
    return {
      debug(message: string, metadata?: LogMetadata) {
        self.log(LogLevel.DEBUG, 'DEBUG', message, { ...metadata, userId, orgId })
      },
      info(message: string, metadata?: LogMetadata) {
        self.log(LogLevel.INFO, 'INFO', message, { ...metadata, userId, orgId })
      },
      warn(message: string, metadata?: LogMetadata) {
        self.log(LogLevel.WARN, 'WARN', message, { ...metadata, userId, orgId })
      },
      error(message: string, metadata?: LogMetadata) {
        self.log(LogLevel.ERROR, 'ERROR', message, { ...metadata, userId, orgId })
      },
      fatal(message: string, metadata?: LogMetadata) {
        self.log(LogLevel.FATAL, 'FATAL', message, { ...metadata, userId, orgId })
      },
    }
  }
}

// Export singleton
export const logger = new Logger()

// Convenience exports
export const debug = (message: string, metadata?: LogMetadata) => logger.debug(message, metadata)
export const info = (message: string, metadata?: LogMetadata) => logger.info(message, metadata)
export const warn = (message: string, metadata?: LogMetadata) => logger.warn(message, metadata)
export const error = (message: string, metadata?: LogMetadata) => logger.error(message, metadata)
export const fatal = (message: string, metadata?: LogMetadata) => logger.fatal(message, metadata)