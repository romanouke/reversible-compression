import { config, type LogLevel } from '../config.js'

const LEVEL_WEIGHT: Record<LogLevel, number> = { DEBUG: 10, INFO: 20, WARNING: 30, ERROR: 40 }

type Fields = Record<string, unknown>

function write(level: LogLevel, logger: string, message: string, fields: Fields = {}): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[config.logLevel]) return

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    logger,
    ...fields,
    message,
  }

  if (config.logFormat === 'pretty') {
    const extras = Object.entries(fields)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(' ')
    process.stdout.write(`${payload.timestamp} ${level} [${logger}] ${message}${extras ? ` ${extras}` : ''}\n`)
    return
  }

  process.stdout.write(`${JSON.stringify(payload)}\n`)
}

export interface Logger {
  debug(message: string, fields?: Fields): void
  info(message: string, fields?: Fields): void
  warn(message: string, fields?: Fields): void
  error(message: string, fields?: Fields): void
  child(extra: Fields): Logger
}

export function createLogger(logger: string, base: Fields = {}): Logger {
  return {
    debug: (message, fields) => write('DEBUG', logger, message, { ...base, ...fields }),
    info: (message, fields) => write('INFO', logger, message, { ...base, ...fields }),
    warn: (message, fields) => write('WARNING', logger, message, { ...base, ...fields }),
    error: (message, fields) => write('ERROR', logger, message, { ...base, ...fields }),
    child: (extra) => createLogger(logger, { ...base, ...extra }),
  }
}

export const logger = createLogger('app')
