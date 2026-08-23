/**
 * useOrders — custom hook for order data management.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { ordersApi } from '../api/orders'

export function useOrders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Latest active filters, so post-mutation refreshes preserve them
  const filtersRef = useRef({})

  useEffect(() => {
    let ignore = false

    async function startFetching() {
      try {
        const { data } = await ordersApi.list()
        if (!ignore) {
          setOrders(data.items)
          setTotal(data.total)
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

  // Fetch with optional filter params; remembers the latest params so
  // refreshes after mutations keep the active filters applied.
  const fetchOrders = useCallback(async (params = undefined) => {
    if (params !== undefined) filtersRef.current = params
    try {
      const { data } = await ordersApi.list(params ?? filtersRef.current)
      setOrders(data.items)
      setTotal(data.total)
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
    total,
    loading,
    error,
    fetchOrders,
    createOrder,
    cancelOrder,
  }
}
