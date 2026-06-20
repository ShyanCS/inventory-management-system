/**
 * Phase 10 — Orders Page Tests (TDD Red → Green)
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import OrdersPage from '../../src/pages/OrdersPage'

describe('OrdersPage', () => {
  it('renders a list of orders from the API', async () => {
    render(<OrdersPage />)
    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('#2')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(<OrdersPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows status badges correctly', async () => {
    render(<OrdersPage />)
    await waitFor(() => screen.getByText('#1'))
    expect(screen.getByText('pending')).toBeInTheDocument()
    expect(screen.getByText('cancelled')).toBeInTheDocument()
  })

  it('shows an error banner when the API fails', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/orders', () => {
        return HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error', details: null } }, { status: 500 })
      })
    )
    render(<OrdersPage />)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('opens the Create Order modal when button is clicked', async () => {
    const user = userEvent.setup()
    render(<OrdersPage />)
    await waitFor(() => screen.getByText('#1'))

    await user.click(screen.getByRole('button', { name: /new order/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows validation errors when submitting an empty order form', async () => {
    const user = userEvent.setup()
    render(<OrdersPage />)
    await waitFor(() => screen.getByText('#1'))

    await user.click(screen.getByRole('button', { name: /new order/i }))
    await user.click(screen.getByRole('button', { name: /place order/i }))

    await waitFor(() => {
      expect(screen.getByText(/customer is required/i)).toBeInTheDocument()
    })
  })

  it('creates an order successfully and closes the modal', async () => {
    const user = userEvent.setup()
    render(<OrdersPage />)
    await waitFor(() => screen.getByText('#1'))

    await user.click(screen.getByRole('button', { name: /new order/i }))

    // Select customer
    const customerSelect = screen.getByLabelText(/customer/i)
    await user.selectOptions(customerSelect, '1')

    // First line item should already be there — fill product and qty
    const productSelects = screen.getAllByLabelText(/product/i)
    await user.selectOptions(productSelects[0], '1')
    const qtyInputs = screen.getAllByLabelText(/quantity/i)
    await user.clear(qtyInputs[0])
    await user.type(qtyInputs[0], '2')

    await user.click(screen.getByRole('button', { name: /place order/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shows insufficient stock error from the API', async () => {
    const user = userEvent.setup()
    render(<OrdersPage />)
    await waitFor(() => screen.getByText('#1'))

    await user.click(screen.getByRole('button', { name: /new order/i }))

    const customerSelect = screen.getByLabelText(/customer/i)
    await user.selectOptions(customerSelect, '1')

    const productSelects = screen.getAllByLabelText(/product/i)
    await user.selectOptions(productSelects[0], '1')
    const qtyInputs = screen.getAllByLabelText(/quantity/i)
    await user.clear(qtyInputs[0])
    await user.type(qtyInputs[0], '999') // triggers stock error in mock

    await user.click(screen.getByRole('button', { name: /place order/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/insufficient stock/i)).toBeInTheDocument()
    })
  })

  it('cancels a pending order after confirmation', async () => {
    const user = userEvent.setup()
    render(<OrdersPage />)
    await waitFor(() => screen.getByText('#1'))

    const cancelBtns = screen.getAllByRole('button', { name: /cancel order/i })
    await user.click(cancelBtns[0])

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    })
  })
})
