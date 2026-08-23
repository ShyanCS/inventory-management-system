/**
 * Zod schemas for customer form validation.
 * Mirrors the rules previously inlined in CustomerForm.jsx.
 */
import { z } from 'zod'

export const customerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Name must be at most 200 characters'),
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
  phone: z.string().trim().min(1, 'Phone is required'),
})
