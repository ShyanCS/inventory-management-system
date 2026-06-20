/**
 * useCustomers — custom hook for customer data management.
 */
import { useState, useEffect, useCallback } from 'react'
import { customersApi } from '../api/customers'

export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await customersApi.list()
      setCustomers(data)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

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
