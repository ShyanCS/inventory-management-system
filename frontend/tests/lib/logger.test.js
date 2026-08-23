/**
 * Unit tests for the structured client-side logger.
 */
import { afterEach, describe, it, expect, vi } from 'vitest'
import { logger, setLogLevel } from '../../src/lib/logger'

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    setLogLevel('info')
  })

  it('emits parseable JSON with level, message, and context', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('Request completed', { path: '/products', status: 200 })

    expect(infoSpy).toHaveBeenCalledTimes(1)
    const entry = JSON.parse(infoSpy.mock.calls[0][0])
    expect(entry.level).toBe('info')
    expect(entry.message).toBe('Request completed')
    expect(entry.path).toBe('/products')
    expect(entry.status).toBe(200)
    expect(entry.timestamp).toBeDefined()
  })

  it('routes entries to the matching console method', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    logger.warn('slow request', { duration_ms: 1500 })
    logger.error('request failed', { status: 500 })

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('suppresses entries below the active threshold by default', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    logger.debug('noisy detail') // below default info threshold
    logger.info('kept')

    expect(logSpy).not.toHaveBeenCalled()
    expect(infoSpy).toHaveBeenCalledTimes(1)
  })

  it('respects an overridden threshold via setLogLevel', () => {
    setLogLevel('error')
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    logger.info('hidden')
    logger.error('shown')

    expect(infoSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })
})
