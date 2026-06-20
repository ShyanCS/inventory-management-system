/**
 * MSW handlers for Product API endpoints.
 */
import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000/api/v1'

const mockProducts = [
  { id: 1, name: 'Wireless Mouse', sku: 'WM-1001', price: 19.99, quantity_in_stock: 50, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 2, name: 'USB Keyboard', sku: 'KB-2002', price: 34.99, quantity_in_stock: 5, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
]

export const productHandlers = [
  // List products
  http.get(`${BASE}/products`, () => {
    return HttpResponse.json(mockProducts)
  }),

  // Get single product
  http.get(`${BASE}/products/:id`, ({ params }) => {
    const product = mockProducts.find(p => p.id === Number(params.id))
    if (!product) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Product not found', details: {} } }, { status: 404 })
    }
    return HttpResponse.json(product)
  }),

  // Create product
  http.post(`${BASE}/products`, async ({ request }) => {
    const body = await request.json()
    // Simulate duplicate SKU
    if (body.sku === 'DUPE-SKU') {
      return HttpResponse.json(
        { error: { code: 'CONFLICT', message: "Product with SKU 'DUPE-SKU' already exists", details: { sku: 'DUPE-SKU' } } },
        { status: 409 }
      )
    }
    const newProduct = { id: 99, ...body, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
    return HttpResponse.json(newProduct, { status: 201 })
  }),

  // Update product
  http.put(`${BASE}/products/:id`, async ({ params, request }) => {
    const body = await request.json()
    const product = mockProducts.find(p => p.id === Number(params.id))
    if (!product) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Product not found', details: {} } }, { status: 404 })
    }
    return HttpResponse.json({ ...product, ...body })
  }),

  // Delete product
  http.delete(`${BASE}/products/:id`, ({ params }) => {
    return new HttpResponse(null, { status: 204 })
  }),
]
