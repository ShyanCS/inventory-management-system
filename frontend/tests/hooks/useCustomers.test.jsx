/**
 * Hook tests for useCustomers against the MSW server.
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { useCustomers } from '../../src/hooks/useCustomers'

describe('useCustomers', () => {
  it('loads customers and total on mount', async () => {
    const { result } = renderHook(() => useCustomers())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.total).toBe(2)
    expect(result.current.customers.map((c) => c.full_name)).toContain('Alice Johnson')
  })

  it('sets an error when the list request fails', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/customers', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Server error', details: null } },
          { status: 500 },
        ),
      ),
    )
    const { result } = renderHook(() => useCustomers())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Server error')
  })

  it('createCustomer posts the payload then refreshes the list', async () => {
    let createdBody
    server.use(
      http.post('http://localhost:8000/api/v1/customers', async ({ request }) => {
        createdBody = await request.json()
        return HttpResponse.json({ id: 99, ...createdBody }, { status: 201 })
      }),
    )
    const { result } = renderHook(() => useCustomers())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(() =>
      result.current.createCustomer({
        full_name: 'Hook Person',
        email: 'hook@example.com',
        phone: '123',
      }),
    )

    expect(createdBody?.email).toBe('hook@example.com')
    expect(result.current.error).toBeNull()
  })

  it('deleteCustomer issues DELETE then refreshes without error', async () => {
    let deleteCalled = false
    server.use(
      http.delete('http://localhost:8000/api/v1/customers/:id', () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { result } = renderHook(() => useCustomers())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(() => result.current.deleteCustomer(2))

    expect(deleteCalled).toBe(true)
    expect(result.current.error).toBeNull()
  })
})
