/**
 * Structured client-side logger.
 *
 * Emits single-line JSON entries so browser console output can be piped
 * into log aggregators (e.g. via console collectors) without parsing rules.
 *
 * Level resolution:
 * - VITE_LOG_LEVEL env var wins if set (debug | info | warn | error)
 * - otherwise: debug in dev builds, info in production builds
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }

function resolveLevel() {
  const configured = import.meta.env.VITE_LOG_LEVEL
  if (configured && configured.toLowerCase() in LEVELS) {
    return LEVELS[configured.toLowerCase()]
  }
  return import.meta.env.DEV ? LEVELS.debug : LEVELS.info
}

let threshold = resolveLevel()

const SINKS = {
  debug: (...args) => console.log(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
}

function emit(level, message, context = {}) {
  if (LEVELS[level] < threshold) return
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  })
  SINKS[level](entry)
}

export const logger = {
  debug: (message, context) => emit('debug', message, context),
  info: (message, context) => emit('info', message, context),
  warn: (message, context) => emit('warn', message, context),
  error: (message, context) => emit('error', message, context),
}

/** Test/ops hook: override the active threshold. */
export function setLogLevel(level) {
  if (level in LEVELS) threshold = LEVELS[level]
}
