/**
 * useCustomers — custom hook for customer data management.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { customersApi } from '../api/customers'

export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  // Latest active params, so post-mutation refreshes preserve them
  const paramsRef = useRef({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false

    async function startFetching() {
      try {
        const { data } = await customersApi.list()
        if (!ignore) {
          setCustomers(data.items)
          setTotal(data.total)
          setError(null)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.error?.message || 'Failed to load customers')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    startFetching()

    return () => {
      ignore = true
    }
  }, [])

  // Fetch with optional pagination params; remembers the latest params so
  // refreshes after mutations keep them applied.
  const fetchCustomers = useCallback(async (params) => {
    if (params !== undefined) paramsRef.current = params
    try {
      const { data } = await customersApi.list(params ?? paramsRef.current)
      setCustomers(data.items)
      setTotal(data.total)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load customers')
    }
  }, [])

  const createCustomer = async (customerData) => {
    const { data } = await customersApi.create(customerData)
    await fetchCustomers()
    return data
  }

  const deleteCustomer = async (id) => {
    await customersApi.delete(id)
    await fetchCustomers()
  }

  return {
    customers,
    total,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    deleteCustomer,
  }
}
