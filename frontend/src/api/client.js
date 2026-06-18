/**
 * Centralized Axios API client.
 *
 * Base URL comes from the VITE_API_BASE_URL environment variable.
 * All API modules (products, customers, orders) import this client
 * instead of creating their own Axios instances.
 */
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default apiClient
