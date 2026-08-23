/**
 * useOrders — custom hook for order data management.
 */
import { useState, useEffect, useCallback } from 'react'
import { ordersApi } from '../api/orders'

export function useOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false

    async function startFetching() {
      try {
        const { data } = await ordersApi.list()
        if (!ignore) {
          setOrders(data)
          setError(null)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.error?.message || 'Failed to load orders')
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
  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await ordersApi.list()
      setOrders(data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load orders')
    }
  }, [])

  const createOrder = async (orderData) => {
    const { data } = await ordersApi.create(orderData)
    await fetchOrders()
    return data
  }

  const cancelOrder = async (id) => {
    await ordersApi.cancel(id)
    await fetchOrders()
  }

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    cancelOrder,
  }
}
