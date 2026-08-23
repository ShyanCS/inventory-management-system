/**
 * Hook tests for useOrders against the MSW server.
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { useOrders } from '../../src/hooks/useOrders'

describe('useOrders', () => {
  it('loads orders and total on mount', async () => {
    const { result } = renderHook(() => useOrders())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.total).toBe(2)
    expect(result.current.orders.map((o) => o.id)).toContain(1)
  })

  it('sets an error when the list request fails', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/orders', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Server error', details: null } },
          { status: 500 },
        ),
      ),
    )
    const { result } = renderHook(() => useOrders())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Server error')
  })

  it('cancelOrder issues DELETE then refreshes, preserving active filters', async () => {
    let deleteCalled = false
    let lastListUrl = ''
    server.use(
      http.delete('http://localhost:8000/api/v1/orders/:id', () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
      http.get('http://localhost:8000/api/v1/orders', ({ request }) => {
        lastListUrl = request.url
        return HttpResponse.json({ items: [], total: 0, skip: 0, limit: 50 })
      }),
    )
    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Simulate an active status filter
    await act(() => result.current.fetchOrders({ status: 'pending' }))
    lastListUrl = ''

    await act(() => result.current.cancelOrder(1))

    expect(deleteCalled).toBe(true)
    await waitFor(() => expect(lastListUrl).toContain('status=pending'))
  })
})
