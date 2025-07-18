export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

const LEVEL_MAP: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

function getCurrentLevel(): number {
  const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel | undefined
  if (envLevel && envLevel in LEVEL_MAP) {
    return LEVEL_MAP[envLevel]
  }
  return process.env.NODE_ENV === 'production' ? LEVEL_MAP.error : LEVEL_MAP.debug
}

const CURRENT_LEVEL = getCurrentLevel()

function emit(level: LogLevel, message: string, data?: any) {
  if (LEVEL_MAP[level] > CURRENT_LEVEL) return

  const payload: Record<string, any> = {
    level,
    timestamp: new Date().toISOString(),
    message,
  }

  if (data !== undefined) {
    payload.data = data
  }

  const serialized = JSON.stringify(payload)

  switch (level) {
    case 'error':
      console.error(serialized)
      break
    case 'warn':
      console.warn(serialized)
      break
    default:
      console.log(serialized)
  }
}

export const logger = {
  error: (message: string, error?: any) =>
    emit(
      'error',
      message,
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error,
    ),
  warn: (message: string, data?: any) => emit('warn', message, data),
  info: (message: string, data?: any) => emit('info', message, data),
  debug: (message: string, data?: any) => emit('debug', message, data),
}

export default logger
