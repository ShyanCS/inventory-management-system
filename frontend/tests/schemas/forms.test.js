/**
 * Unit tests for zod form schemas.
 */
import { describe, it, expect } from 'vitest'
import { productSchema } from '../../src/schemas/product'
import { customerSchema } from '../../src/schemas/customer'
import { orderSchema } from '../../src/schemas/order'
import { toFieldErrors } from '../../src/schemas/utils'

describe('productSchema', () => {
  it('accepts a valid product payload and coerces numbers', () => {
    const result = productSchema.safeParse({
      name: 'Widget',
      sku: 'WG-1',
      price: '9.99',
      quantity_in_stock: '25',
      low_stock_threshold: '5',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(9.99)
      expect(result.data.quantity_in_stock).toBe(25)
    }
  })

  it('requires name, sku, and price on empty input', () => {
    const result = productSchema.safeParse({
      name: '',
      sku: '',
      price: '',
      quantity_in_stock: '0',
      low_stock_threshold: '10',
    })
    expect(result.success).toBe(false)
    const errors = toFieldErrors(result.error)
    expect(errors.name).toBe('Name is required')
    expect(errors.sku).toBe('SKU is required')
    expect(errors.price).toBe('Price is required')
  })

  it('rejects non-positive prices', () => {
    const result = productSchema.safeParse({
      name: 'X',
      sku: 'X-1',
      price: '0',
      quantity_in_stock: '0',
      low_stock_threshold: '0',
    })
    const errors = toFieldErrors(result.error)
    expect(errors.price).toBe('Price must be greater than 0')
  })

  it('rejects negative stock quantities', () => {
    const result = productSchema.safeParse({
      name: 'X',
      sku: 'X-1',
      price: '5',
      quantity_in_stock: '-3',
      low_stock_threshold: '0',
    })
    const errors = toFieldErrors(result.error)
    expect(errors.quantity_in_stock).toBe('Quantity cannot be negative')
  })
})

describe('customerSchema', () => {
  it('accepts a valid customer payload', () => {
    const result = customerSchema.safeParse({
      full_name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1-555-0101',
    })
    expect(result.success).toBe(true)
  })

  it('requires all fields', () => {
    const result = customerSchema.safeParse({ full_name: '', email: '', phone: '' })
    const errors = toFieldErrors(result.error)
    expect(errors.full_name).toBe('Name is required')
    expect(errors.email).toBe('Email is required')
    expect(errors.phone).toBe('Phone is required')
  })

  it('rejects malformed emails', () => {
    const result = customerSchema.safeParse({
      full_name: 'Bob',
      email: 'not-an-email',
      phone: '1',
    })
    const errors = toFieldErrors(result.error)
    expect(errors.email).toBe('Please enter a valid email address')
  })
})

describe('orderSchema', () => {
  it('accepts a valid order payload with multiple items', () => {
    const result = orderSchema.safeParse({
      customer_id: '1',
      items: [
        { product_id: '2', quantity: '2' },
        { product_id: '3', quantity: '1' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('requires a customer', () => {
    const result = orderSchema.safeParse({
      customer_id: '',
      items: [{ product_id: '1', quantity: '1' }],
    })
    const errors = toFieldErrors(result.error)
    expect(errors.customer_id).toBe('Customer is required')
  })

  it('reports per-item errors at indexed paths', () => {
    const result = orderSchema.safeParse({
      customer_id: '1',
      items: [
        { product_id: '', quantity: '0' },
        { product_id: '2', quantity: '1' },
      ],
    })
    const errors = toFieldErrors(result.error)
    expect(errors['items.0.product_id']).toBe('Product is required')
    expect(errors['items.0.quantity']).toBe('Min quantity is 1')
    expect(errors['items.1.product_id']).toBeUndefined()
  })
})

describe('toFieldErrors', () => {
  it('keeps the first message per field', () => {
    const result = productSchema.safeParse({
      name: '',
      sku: '',
      price: '-5',
      quantity_in_stock: '-1',
      low_stock_threshold: '-2',
    })
    const errors = toFieldErrors(result.error)
    expect(Object.keys(errors).filter((k) => k === 'price')).toHaveLength(1)
  })
})
