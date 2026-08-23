/**
 * Unit tests for the useOrderFilters hook.
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useOrderFilters, buildOrderParams } from '../../src/hooks/useOrderFilters'

afterEach(() => {
  vi.useRealTimers()
})

describe('buildOrderParams', () => {
  it('strips empty-string filters', () => {
    expect(
      buildOrderParams({ status: 'pending', date_from: '', date_to: '', q: '' }),
    ).toEqual({ status: 'pending' })
  })
})

describe('useOrderFilters', () => {
  it('starts with no active filters and no error', () => {
    const { result } = renderHook(() => useOrderFilters(vi.fn()))
    expect(result.current.hasActiveFilters).toBe(false)
    expect(result.current.dateError).toBeNull()
    expect(result.current.filters).toEqual({ status: '', date_from: '', date_to: '', q: '' })
  })

  it('invokes onChange with cleaned params on status change', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useOrderFilters(onChange))

    act(() => result.current.handleStatusChange('pending'))

    expect(onChange).toHaveBeenCalledWith({ status: 'pending' })
  })

  it('passes through complete valid date ranges', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useOrderFilters(onChange))

    act(() => result.current.handleDateChange('date_from', '2026-01-01'))
    act(() => result.current.handleDateChange('date_to', '2026-01-31'))

    expect(onChange).toHaveBeenLastCalledWith({ date_from: '2026-01-01', date_to: '2026-01-31' })
    expect(result.current.dateError).toBeNull()
  })

  it('sets dateError and skips onChange for inverted ranges', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useOrderFilters(onChange))

    act(() => result.current.handleDateChange('date_from', '2026-05-01'))
    onChange.mockClear()
    act(() => result.current.handleDateChange('date_to', '2026-01-01'))

    expect(result.current.dateError).toMatch(/must be on or after/i)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('debounces search input into a single onChange', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const { result } = renderHook(() => useOrderFilters(onChange))

    act(() => result.current.handleSearchChange('A'))
    act(() => result.current.handleSearchChange('Al'))
    act(() => result.current.handleSearchChange('Alice'))

    expect(onChange).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ q: 'Alice' })
  })

  it('reports active filters once any field is set', () => {
    const { result } = renderHook(() => useOrderFilters(vi.fn()))
    expect(result.current.hasActiveFilters).toBe(false)

    act(() => result.current.handleStatusChange('completed'))

    expect(result.current.hasActiveFilters).toBe(true)
  })
})
