/**
 * useProducts — custom hook for product data management.
 * Handles list fetching, create, update, delete with loading/error state.
 */
import { useState, useEffect, useCallback } from 'react'
import { productsApi } from '../api/products'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false

    async function startFetching() {
      try {
        const { data } = await productsApi.list()
        if (!ignore) {
          setProducts(data)
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

  // Refresh the list after mutations (keeps current UI visible while fetching)
  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await productsApi.list()
      setProducts(data)
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
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
