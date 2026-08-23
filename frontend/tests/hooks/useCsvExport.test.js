/**
 * Unit tests for the useCsvExport hook.
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { useCsvExport } from '../../src/hooks/useCsvExport'

const csvResponse = {
  data: 'order_id,status\n1,pending\n',
  headers: { 'content-disposition': 'attachment; filename="x.csv"' },
}

describe('useCsvExport', () => {
  let createObjectURL
  let revokeObjectURL

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock')
    revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts idle with no error', () => {
    const { result } = renderHook(() => useCsvExport())
    expect(result.current.exporting).toBe(false)
    expect(result.current.exportError).toBeNull()
  })

  it('downloads the file on a successful export', async () => {
    const { result } = renderHook(() => useCsvExport())

    await act(async () => {
      await result.current.exportCsv(() => Promise.resolve(csvResponse), 'orders.csv')
    })

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
    expect(result.current.exporting).toBe(false)
    expect(result.current.exportError).toBeNull()
  })

  it('surfaces the API error message on failure', async () => {
    const { result } = renderHook(() => useCsvExport())
    const failure = {
      response: {
        data: JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Export failed' } }),
      },
    }

    await act(async () => {
      await result.current.exportCsv(
        () => Promise.reject(failure),
        'orders.csv',
        'Failed to export orders.',
      )
    })

    await waitFor(() => expect(result.current.exportError).toBe('Export failed'))
    expect(result.current.exporting).toBe(false)
  })

  it('falls back to the provided default error message', async () => {
    const { result } = renderHook(() => useCsvExport())

    await act(async () => {
      await result.current.exportCsv(
        () => Promise.reject(new Error('network down')),
        'x.csv',
        'Failed to export products.',
      )
    })

    await waitFor(() => expect(result.current.exportError).toBe('Failed to export products.'))
  })

  it('toggles exporting while the request is in flight', async () => {
    let resolveRequest
    const { result } = renderHook(() => useCsvExport())

    act(() => {
      result.current.exportCsv(() => new Promise((resolve) => (resolveRequest = resolve)), 'x.csv')
    })

    await waitFor(() => expect(result.current.exporting).toBe(true))

    await act(async () => {
      resolveRequest(csvResponse)
    })

    await waitFor(() => expect(result.current.exporting).toBe(false))
  })
})
