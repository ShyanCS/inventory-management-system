/**
 * Phase 8 — Product Page Tests (TDD Red → Green)
 * Tests: ProductsPage renders list, opens form, creates, deletes, edits, validates, handles errors.
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import ProductsPage from '../../src/pages/ProductsPage'

describe('ProductsPage', () => {
  it('renders a list of products from the API', async () => {
    render(<ProductsPage />)
    await waitFor(() => {
      expect(screen.getByText('Wireless Mouse')).toBeInTheDocument()
      expect(screen.getByText('USB Keyboard')).toBeInTheDocument()
      expect(screen.getByText('WM-1001')).toBeInTheDocument()
    })
  })

  it('shows a loading state initially', () => {
    render(<ProductsPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error banner when the API fails', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/products', () => {
        return HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error', details: null } }, { status: 500 })
      })
    )
    render(<ProductsPage />)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('opens the Add Product modal when button is clicked', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    // Wait for page to load
    await waitFor(() => screen.getByText('Wireless Mouse'))

    const addBtn = screen.getByRole('button', { name: /add product/i })
    await user.click(addBtn)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitting an empty form', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    await waitFor(() => screen.getByText('Wireless Mouse'))

    await user.click(screen.getByRole('button', { name: /add product/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/sku is required/i)).toBeInTheDocument()
      expect(screen.getByText(/price is required/i)).toBeInTheDocument()
    })
  })

  it('creates a product successfully and closes the modal', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    await waitFor(() => screen.getByText('Wireless Mouse'))

    await user.click(screen.getByRole('button', { name: /add product/i }))
    await user.type(screen.getByLabelText(/product name/i), 'New Widget')
    await user.type(screen.getByLabelText(/sku/i), 'NW-001')
    await user.type(screen.getByLabelText(/price/i), '9.99')
    await user.type(screen.getByLabelText(/quantity/i), '25')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shows a conflict error for duplicate SKU', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    await waitFor(() => screen.getByText('Wireless Mouse'))

    await user.click(screen.getByRole('button', { name: /add product/i }))
    await user.type(screen.getByLabelText(/product name/i), 'Dupe Product')
    await user.type(screen.getByLabelText(/sku/i), 'DUPE-SKU')
    await user.type(screen.getByLabelText(/price/i), '10')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })

  it('opens the edit modal pre-populated with product data', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    await waitFor(() => screen.getByText('Wireless Mouse'))

    const editBtns = screen.getAllByRole('button', { name: /edit/i })
    await user.click(editBtns[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Wireless Mouse')).toBeInTheDocument()
    expect(screen.getByDisplayValue('WM-1001')).toBeInTheDocument()
  })

  it('deletes a product after confirmation', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    await waitFor(() => screen.getByText('Wireless Mouse'))

    const deleteBtns = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteBtns[0])

    // Confirm dialog
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    })
  })
})
