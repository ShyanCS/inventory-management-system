/**
 * Phase 8 — Product Page Tests (TDD Red → Green)
 * Tests: ProductsPage renders list, opens form, creates, deletes, edits, validates, handles errors.
 */
import { render, screen, waitFor } from '@testing-library/react'
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
        return HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Server error', details: null } },
          { status: 500 },
        )
      }),
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

  it('renders the low stock threshold input with a default of 10', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    await waitFor(() => screen.getByText('Wireless Mouse'))

    await user.click(screen.getByRole('button', { name: /add product/i }))
    expect(screen.getByLabelText(/low stock threshold/i)).toHaveValue(10)
  })

  it('submits the low stock threshold with the product payload', async () => {
    const user = userEvent.setup()
    let capturedBody
    server.use(
      http.post('http://localhost:8000/api/v1/products', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          {
            id: 99,
            ...capturedBody,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          { status: 201 },
        )
      }),
    )
    render(<ProductsPage />)
    await waitFor(() => screen.getByText('Wireless Mouse'))

    await user.click(screen.getByRole('button', { name: /add product/i }))
    await user.type(screen.getByLabelText(/product name/i), 'Threshold Widget')
    await user.type(screen.getByLabelText(/sku/i), 'TW-001')
    await user.type(screen.getByLabelText(/price/i), '9.99')
    await user.type(screen.getByLabelText(/quantity/i), '25')
    const thresholdInput = screen.getByLabelText(/low stock threshold/i)
    await user.clear(thresholdInput)
    await user.type(thresholdInput, '4')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(capturedBody?.low_stock_threshold).toBe(4)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('uses the per-product threshold for the low stock badge', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/products', () => {
        return HttpResponse.json({
          items: [
            {
              id: 1,
              name: 'Custom Threshold',
              sku: 'CT-001',
              price: 5,
              quantity_in_stock: 8,
              low_stock_threshold: 5,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          total: 1,
          skip: 0,
          limit: 50,
        })
      }),
    )
    render(<ProductsPage />)
    await waitFor(() => screen.getByText('Custom Threshold'))
    // stock 8 is above this product's threshold of 5 -> normal state
    expect(screen.getByText('8 in stock')).toBeInTheDocument()
  })

  it('falls back to threshold 10 for legacy products without one', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/products', () => {
        return HttpResponse.json({
          items: [
            {
              id: 2,
              name: 'Legacy Product',
              sku: 'LP-001',
              price: 5,
              quantity_in_stock: 7,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          total: 1,
          skip: 0,
          limit: 50,
        })
      }),
    )
    render(<ProductsPage />)
    await waitFor(() => screen.getByText('Legacy Product'))
    // stock 7 <= default threshold 10 -> low state
    expect(screen.getByText('7 left')).toBeInTheDocument()
  })

  it('shows an error banner when deleting a product fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.delete('http://localhost:8000/api/v1/products/:id', () => {
        return HttpResponse.json(
          {
            error: {
              code: 'CONFLICT',
              message: 'Cannot delete a product referenced by an order',
              details: {},
            },
          },
          { status: 409 },
        )
      }),
    )
    render(<ProductsPage />)
    await waitFor(() => screen.getByText('Wireless Mouse'))

    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.getByText(/cannot delete a product/i)).toBeInTheDocument()
    })
  })
})

describe('ProductsPage pagination', () => {
  it('requests the next page with skip when Next is clicked', async () => {
    const user = userEvent.setup()
    const manyProducts = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      sku: `PG-${String(i + 1).padStart(3, '0')}`,
      price: 5,
      quantity_in_stock: 50,
      low_stock_threshold: 10,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }))
    let requestedUrl = ''
    server.use(
      http.get('http://localhost:8000/api/v1/products', ({ request }) => {
        requestedUrl = request.url
        const url = new URL(request.url)
        const skip = Number(url.searchParams.get('skip') ?? 0)
        const limit = Number(url.searchParams.get('limit') ?? 10)
        return HttpResponse.json({
          items: manyProducts.slice(skip, skip + limit),
          total: manyProducts.length,
          skip,
          limit,
        })
      }),
    )
    render(<ProductsPage />)
    await waitFor(() => screen.getByText('Product 1'))
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next page/i }))

    await waitFor(() => {
      expect(requestedUrl).toContain('skip=10')
    })
    await waitFor(() => screen.getByText('Product 11'))
  })
})
