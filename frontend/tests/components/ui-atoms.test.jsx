/**
 * Shared UI atom tests.
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from '../../src/components/common/LoadingSpinner'
import ErrorBanner from '../../src/components/common/ErrorBanner'

describe('LoadingSpinner', () => {
  it('renders a default label', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders a custom label', () => {
    render(<LoadingSpinner label="Loading products…" />)
    expect(screen.getByText('Loading products…')).toBeInTheDocument()
  })

  it('applies the icon color class', () => {
    const { container } = render(<LoadingSpinner iconClassName="text-black" />)
    expect(
      container.querySelector('svg')?.className.baseVal ??
        container.querySelector('svg')?.getAttribute('class'),
    ).toContain('text-black')
  })
})

describe('ErrorBanner', () => {
  it('renders nothing without a message', () => {
    const { container } = render(<ErrorBanner message={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders an alert with the message', () => {
    render(<ErrorBanner message="Failed to load products" />)
    expect(screen.getByRole('alert')).toHaveTextContent(/failed to load products/i)
  })
})
