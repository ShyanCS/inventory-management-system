/**
 * Phase 0 — App shell smoke test.
 *
 * TDD Red: This test verifies the app shell renders with navigation
 * links to all four pages (Dashboard, Products, Customers, Orders).
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../src/App.jsx'

describe('App shell', () => {
  it('renders the brand name', () => {
    render(<App />)
    expect(screen.getByText(/inventrack/i)).toBeInTheDocument()
  })

  it('renders navigation links for all pages', () => {
    render(<App />)
    for (const label of ['Dashboard', 'Products', 'Customers', 'Orders']) {
      expect(screen.getAllByRole('link', { name: label }).length).toBeGreaterThan(0)
    }
  })

  it('renders the dashboard page by default', () => {
    render(<App />)
    // The Dashboard page stub should be visible on the default route
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })
})
