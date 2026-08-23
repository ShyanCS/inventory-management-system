/**
 * useOrderFilters — owns order list filter state (status, date range, search)
 * and converts changes into clean query params via the provided onChange
 * callback. Search input is debounced; inverted date ranges set dateError
 * and skip the callback so callers don't fetch invalid ranges.
 */
import { useRef, useState } from 'react'

/** Strip empty-string filters from a filter object. */
export function buildOrderParams(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))
}

const EMPTY_FILTERS = { status: '', date_from: '', date_to: '', q: '' }

export function useOrderFilters(onChange) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [dateError, setDateError] = useState(null)
  const searchTimeoutRef = useRef(null)

  const handleStatusChange = (status) => {
    const next = { ...filters, status }
    setFilters(next)
    onChange?.(buildOrderParams(next))
  }

  const handleDateChange = (field, value) => {
    const next = { ...filters, [field]: value }
    setFilters(next)
    if (next.date_from && next.date_to && next.date_to < next.date_from) {
      setDateError('"To" date must be on or after the "From" date.')
      return
    }
    setDateError(null)
    onChange?.(buildOrderParams(next))
  }

  // Debounced search — schedules the callback without an effect
  const handleSearchChange = (q) => {
    const next = { ...filters, q }
    setFilters(next)
    clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => onChange?.(buildOrderParams(next)), 300)
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== '')

  return {
    filters,
    dateError,
    hasActiveFilters,
    handleStatusChange,
    handleDateChange,
    handleSearchChange,
  }
}
