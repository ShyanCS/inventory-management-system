/**
 * useOrders — custom hook for order data management.
 */
import { useState, useEffect, useCallback } from 'react'
import { ordersApi } from '../api/orders'

export function useOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await ordersApi.list()
      setOrders(data)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

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
