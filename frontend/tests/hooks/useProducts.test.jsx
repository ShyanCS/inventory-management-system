/**
 * Hook tests for useProducts against the MSW server.
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { useProducts } from '../../src/hooks/useProducts'

describe('useProducts', () => {
  it('loads products and total on mount', async () => {
    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.total).toBe(2)
    expect(result.current.products.map((p) => p.sku)).toContain('WM-1001')
  })

  it('sets an error when the list request fails', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/products', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Server error', details: null } },
          { status: 500 },
        ),
      ),
    )
    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Server error')
  })

  it('createProduct posts the payload then refreshes the list', async () => {
    let createdBody
    server.use(
      http.post('http://localhost:8000/api/v1/products', async ({ request }) => {
        createdBody = await request.json()
        return HttpResponse.json({ id: 99, ...createdBody }, { status: 201 })
      }),
    )
    const { result } = renderHook(() => useProducts())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(() =>
      result.current.createProduct({
        name: 'Hook Widget',
        sku: 'HW-001',
        price: 5,
        quantity_in_stock: 3,
        low_stock_threshold: 10,
      }),
    )

    expect(createdBody?.sku).toBe('HW-001')
    expect(result.current.error).toBeNull()
  })

  it('deleteProduct issues DELETE then refreshes without error', async () => {
    let deleteCalled = false
    server.use(
      http.delete('http://localhost:8000/api/v1/products/:id', () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { result } = renderHook(() => useProducts())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(() => result.current.deleteProduct(1))

    expect(deleteCalled).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('fetchProducts applies params to subsequent requests', async () => {
    let lastUrl = ''
    server.use(
      http.get('http://localhost:8000/api/v1/products', ({ request }) => {
        lastUrl = request.url
        return HttpResponse.json({ items: [], total: 0, skip: 10, limit: 10 })
      }),
    )
    const { result } = renderHook(() => useProducts())

    await act(() => result.current.fetchProducts({ skip: 10, limit: 10 }))

    await waitFor(() => expect(lastUrl).toContain('skip=10'))
    expect(result.current.products).toEqual([])
    expect(result.current.total).toBe(0)
  })
})
