/**
 * useCustomers — custom hook for customer data management.
 */
import { useState, useEffect, useCallback } from 'react'
import { customersApi } from '../api/customers'

export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false

    async function startFetching() {
      try {
        const { data } = await customersApi.list()
        if (!ignore) {
          setCustomers(data)
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

  // Refresh the list after mutations (keeps current UI visible while fetching)
  const fetchCustomers = useCallback(async () => {
    try {
      const { data } = await customersApi.list()
      setCustomers(data)
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
    loading,
    error,
    fetchCustomers,
    createCustomer,
    deleteCustomer,
  }
}
