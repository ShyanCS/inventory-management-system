/**
 * Pagination component tests.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Pagination from '../../src/components/common/Pagination'

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    render(<Pagination page={1} pageSize={10} total={8} onChange={() => {}} />)
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument()
  })

  it('shows the current page out of the total pages', () => {
    render(<Pagination page={2} pageSize={10} total={25} onChange={() => {}} />)
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument()
  })

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = render(
      <Pagination page={1} pageSize={10} total={25} onChange={() => {}} />,
    )
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next page/i })).toBeEnabled()

    rerender(<Pagination page={3} pageSize={10} total={25} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /previous page/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
  })

  it('calls onChange with the adjacent page numbers', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Pagination page={2} pageSize={10} total={25} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /previous page/i }))
    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(onChange).toHaveBeenNthCalledWith(1, 1)
    expect(onChange).toHaveBeenNthCalledWith(2, 3)
  })
})
