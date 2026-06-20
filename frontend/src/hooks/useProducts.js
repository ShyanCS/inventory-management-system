/**
 * useProducts — custom hook for product data management.
 * Handles list fetching, create, update, delete with loading/error state.
 */
import { useState, useEffect, useCallback } from 'react'
import { productsApi } from '../api/products'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await productsApi.list()
      setProducts(data)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

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
