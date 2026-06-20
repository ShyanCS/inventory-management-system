/**
 * Phase 10 — Dashboard Page Tests (TDD Red → Green)
 */
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DashboardPage from '../../src/pages/DashboardPage'

describe('DashboardPage', () => {
  it('renders summary stat cards', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument()  // total_products
      expect(screen.getByText('5')).toBeInTheDocument()   // total_customers
      expect(screen.getByText('3')).toBeInTheDocument()   // total_orders
    })
  })

  it('renders a low stock products table', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('USB Keyboard')).toBeInTheDocument()
      expect(screen.getByText('KB-2002')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
