/**
 * Products API module.
 * Thin wrapper around the Axios client for product endpoints.
 */
import apiClient from './client'

export const productsApi = {
  list: (params = {}) => apiClient.get('/products', { params }),
  get: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
}
