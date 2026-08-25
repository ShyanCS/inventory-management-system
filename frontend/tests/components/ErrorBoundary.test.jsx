/**
 * ErrorBoundary tests.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import ErrorBoundary from '../../src/components/common/ErrorBoundary'
import { logger } from '../../src/lib/logger'

function ThrowingChild({ shouldThrow }) {
  if (shouldThrow) throw new Error('boom')
  return <p>all good</p>
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('all good')).toBeInTheDocument()
  })

  it('renders the fallback and logs through the structured logger', () => {
    const logSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i)
    expect(logSpy).toHaveBeenCalledWith(
      'Unhandled render error',
      expect.objectContaining({ message: 'Error: boom' }),
    )
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('renders a custom fallback when provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary fallback={<div role="alert">custom fallback</div>}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('custom fallback')).toBeInTheDocument()
  })

  it('recovers to normal rendering after a reset via remount', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    let throwing = false

    function App() {
      return (
        <ErrorBoundary key={throwing ? 'a' : 'b'}>
          <ThrowingChild shouldThrow={throwing} />
        </ErrorBoundary>
      )
    }

    const { rerender } = render(<App />)
    throwing = true
    rerender(<App />)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    throwing = false
    rerender(<App />)
    await user.click(document.body) // settle
    expect(screen.getByText('all good')).toBeInTheDocument()
  })
})
