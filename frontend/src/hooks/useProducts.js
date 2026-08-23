/**
 * useProducts — custom hook for product data management.
 * Handles list fetching, create, update, delete with loading/error state.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { productsApi } from '../api/products'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Latest active params, so post-mutation refreshes preserve them
  const paramsRef = useRef({})

  useEffect(() => {
    let ignore = false

    async function startFetching() {
      try {
        const { data } = await productsApi.list()
        if (!ignore) {
          setProducts(data.items)
          setTotal(data.total)
          setError(null)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.error?.message || 'Failed to load products')
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

  // Fetch with optional pagination/filter params; remembers the latest params
  // so refreshes after mutations keep them applied.
  const fetchProducts = useCallback(async (params = undefined) => {
    if (params !== undefined) paramsRef.current = params
    try {
      const { data } = await productsApi.list(params ?? paramsRef.current)
      setProducts(data.items)
      setTotal(data.total)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load products')
    }
  }, [])

  const createProduct = async (productData) => {
    const { data } = await productsApi.create(productData)
    await fetchProducts()
    return data
  }

  const updateProduct = async (id, productData) => {
    const { data } = await productsApi.update(id, productData)
    await fetchProducts()
    return data
  }

  const deleteProduct = async (id) => {
    await productsApi.delete(id)
    await fetchProducts()
  }

  return {
    products,
    total,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
