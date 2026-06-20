/**
 * MSW handlers for Customer API endpoints.
 */
import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000/api/v1'

const mockCustomers = [
  { id: 1, full_name: 'Alice Johnson', email: 'alice@example.com', phone: '+1-555-0101', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 2, full_name: 'Bob Smith', email: 'bob@example.com', phone: '+1-555-0202', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
]

export const customerHandlers = [
  // List customers
  http.get(`${BASE}/customers`, () => {
    return HttpResponse.json(mockCustomers)
  }),

  // Get single customer
  http.get(`${BASE}/customers/:id`, ({ params }) => {
    const customer = mockCustomers.find(c => c.id === Number(params.id))
    if (!customer) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Customer not found', details: {} } }, { status: 404 })
    }
    return HttpResponse.json(customer)
  }),

  // Create customer
  http.post(`${BASE}/customers`, async ({ request }) => {
    const body = await request.json()
    // Simulate duplicate email
    if (body.email === 'dupe@example.com') {
      return HttpResponse.json(
        { error: { code: 'CONFLICT', message: "Customer with email 'dupe@example.com' already exists", details: { email: 'dupe@example.com' } } },
        { status: 409 }
      )
    }
    // Simulate customer with orders (cannot delete)
    const newCustomer = { id: 99, ...body, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
    return HttpResponse.json(newCustomer, { status: 201 })
  }),

  // Delete customer
  http.delete(`${BASE}/customers/:id`, ({ params }) => {
    // Simulate customer with orders
    if (Number(params.id) === 999) {
      return HttpResponse.json(
        { error: { code: 'CONFLICT', message: 'Cannot delete customer because they have existing orders.', details: {} } },
        { status: 409 }
      )
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
