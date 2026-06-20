/**
 * MSW handlers for Order and Dashboard API endpoints.
 */
import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000/api/v1'

const mockOrders = [
  {
    id: 1,
    customer_id: 1,
    status: 'pending',
    total_amount: 59.97,
    items: [
      { id: 1, product_id: 1, quantity: 2, unit_price: 19.99, subtotal: 39.98 },
      { id: 2, product_id: 2, quantity: 1, unit_price: 19.99, subtotal: 19.99 },
    ],
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 2,
    customer_id: 2,
    status: 'cancelled',
    total_amount: 34.99,
    items: [{ id: 3, product_id: 2, quantity: 1, unit_price: 34.99, subtotal: 34.99 }],
    created_at: '2026-01-16T10:00:00Z',
    updated_at: '2026-01-16T12:00:00Z',
  },
]

const mockSummary = {
  total_products: 12,
  total_customers: 5,
  total_orders: 3,
  low_stock_products: [
    { id: 2, name: 'USB Keyboard', sku: 'KB-2002', price: 34.99, quantity_in_stock: 5, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  ],
}

export const orderHandlers = [
  // List orders
  http.get(`${BASE}/orders`, () => {
    return HttpResponse.json(mockOrders)
  }),

  // Get single order
  http.get(`${BASE}/orders/:id`, ({ params }) => {
    const order = mockOrders.find(o => o.id === Number(params.id))
    if (!order) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Order not found', details: {} } }, { status: 404 })
    }
    return HttpResponse.json(order)
  }),

  // Create order
  http.post(`${BASE}/orders`, async ({ request }) => {
    const body = await request.json()

    // Simulate insufficient stock
    if (body.items.some(item => item.quantity > 100)) {
      return HttpResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: 'Insufficient stock for Wireless Mouse (SKU WM-1001). Requested 999, available 50.',
            details: { product_id: 1, requested: 999, available: 50 },
          },
        },
        { status: 409 }
      )
    }

    const newOrder = {
      id: 99,
      customer_id: body.customer_id,
      status: 'pending',
      total_amount: body.items.reduce((sum, item) => sum + item.quantity * 19.99, 0),
      items: body.items.map((item, i) => ({ id: 100 + i, ...item, unit_price: 19.99, subtotal: item.quantity * 19.99 })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json(newOrder, { status: 201 })
  }),

  // Cancel order
  http.delete(`${BASE}/orders/:id`, ({ params }) => {
    if (Number(params.id) === 2) {
      return HttpResponse.json(
        { error: { code: 'CONFLICT', message: 'Order is already cancelled', details: {} } },
        { status: 409 }
      )
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // Dashboard summary
  http.get(`${BASE}/dashboard/summary`, () => {
    return HttpResponse.json(mockSummary)
  }),
]
