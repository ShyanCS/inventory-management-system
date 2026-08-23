/**
 * Zod schemas for product form validation.
 * Mirrors the rules previously inlined in ProductForm.jsx.
 */
import { z } from 'zod'
import { requiredNumber } from './utils'

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Name must be at most 200 characters'),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be at most 50 characters'),
  price: requiredNumber('Price is required').pipe(
    z
      .number({ message: 'Price is required' })
      .gt(0, 'Price must be greater than 0'),
  ),
  quantity_in_stock: requiredNumber('Quantity is required').pipe(
    z
      .number({ message: 'Quantity is required' })
      .int('Quantity must be a whole number')
      .min(0, 'Quantity cannot be negative'),
  ),
  low_stock_threshold: requiredNumber('Low stock threshold is required').pipe(
    z
      .number({ message: 'Low stock threshold is required' })
      .int('Threshold must be a whole number')
      .min(0, 'Threshold cannot be negative'),
  ),
})
