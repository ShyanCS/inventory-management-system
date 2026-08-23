/**
 * Zod schemas for order form validation.
 * Mirrors the rules previously inlined in OrderForm.jsx.
 */
import { z } from 'zod'
import { requiredNumber } from './utils'

export const orderItemSchema = z.object({
  product_id: z
    .union([z.string(), z.number()])
    .refine((v) => v !== '' && v != null, { message: 'Product is required' }),
  quantity: requiredNumber('Min quantity is 1').pipe(
    z
      .number({ message: 'Min quantity is 1' })
      .int('Min quantity is 1')
      .min(1, 'Min quantity is 1'),
  ),
})

export const orderSchema = z.object({
  customer_id: z
    .union([z.string(), z.number()])
    .refine((v) => v !== '' && v != null, { message: 'Customer is required' }),
  items: z.array(orderItemSchema),
})
