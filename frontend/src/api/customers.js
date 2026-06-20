/**
 * Customers API module.
 */
import apiClient from './client'

export const customersApi = {
  list: (params = {}) => apiClient.get('/customers', { params }),
  get: (id) => apiClient.get(`/customers/${id}`),
  create: (data) => apiClient.post('/customers', data),
  delete: (id) => apiClient.delete(`/customers/${id}`),
}
