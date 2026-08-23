/**
 * Orders API module.
 */
import apiClient from './client'

export const ordersApi = {
  list: (params = {}) => apiClient.get('/orders', { params }),
  get: (id) => apiClient.get(`/orders/${id}`),
  create: (data) => apiClient.post('/orders', data),
  cancel: (id) => apiClient.delete(`/orders/${id}`),
  // Raw CSV text — skip axios' JSON transform so the payload stays untouched
  exportCsv: (params = {}) =>
    apiClient.get('/orders/export', {
      params,
      responseType: 'text',
      transformResponse: [(d) => d],
    }),
}
