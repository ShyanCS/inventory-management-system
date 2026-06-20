/**
 * Phase 9 — Customer Page Tests (TDD Red → Green)
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import CustomersPage from '../../src/pages/CustomersPage'

describe('CustomersPage', () => {
  it('renders a list of customers from the API', async () => {
    render(<CustomersPage />)
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
      expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    })
  })

  it('shows a loading state initially', () => {
    render(<CustomersPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error banner when the API fails', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/customers', () => {
        return HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error', details: null } }, { status: 500 })
      })
    )
    render(<CustomersPage />)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('opens the Add Customer modal when button is clicked', async () => {
    const user = userEvent.setup()
    render(<CustomersPage />)
    await waitFor(() => screen.getByText('Alice Johnson'))

    await user.click(screen.getByRole('button', { name: /add customer/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitting an empty form', async () => {
    const user = userEvent.setup()
    render(<CustomersPage />)
    await waitFor(() => screen.getByText('Alice Johnson'))

    await user.click(screen.getByRole('button', { name: /add customer/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/phone is required/i)).toBeInTheDocument()
    })
  })

  it('shows a validation error for invalid email format', async () => {
    const user = userEvent.setup()
    render(<CustomersPage />)
    await waitFor(() => screen.getByText('Alice Johnson'))

    await user.click(screen.getByRole('button', { name: /add customer/i }))
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.type(screen.getByLabelText(/phone/i), '123')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('creates a customer successfully and closes the modal', async () => {
    const user = userEvent.setup()
    render(<CustomersPage />)
    await waitFor(() => screen.getByText('Alice Johnson'))

    await user.click(screen.getByRole('button', { name: /add customer/i }))
    await user.type(screen.getByLabelText(/full name/i), 'Charlie Brown')
    await user.type(screen.getByLabelText(/email/i), 'charlie@example.com')
    await user.type(screen.getByLabelText(/phone/i), '+1-555-0303')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shows a conflict error for duplicate email', async () => {
    const user = userEvent.setup()
    render(<CustomersPage />)
    await waitFor(() => screen.getByText('Alice Johnson'))

    await user.click(screen.getByRole('button', { name: /add customer/i }))
    await user.type(screen.getByLabelText(/full name/i), 'Dupe User')
    await user.type(screen.getByLabelText(/email/i), 'dupe@example.com')
    await user.type(screen.getByLabelText(/phone/i), '123')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })

  it('deletes a customer after confirmation', async () => {
    const user = userEvent.setup()
    render(<CustomersPage />)
    await waitFor(() => screen.getByText('Alice Johnson'))

    const deleteBtns = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteBtns[0])

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    })
  })
})
