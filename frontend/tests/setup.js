/**
 * Vitest test setup file.
 *
 * Configures @testing-library/jest-dom matchers (e.g., toBeInTheDocument)
 * and sets up the MSW mock server for API interception.
 */
import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
// Reset handlers after each test to avoid bleed-through
afterEach(() => server.resetHandlers())
// Close server after all tests
afterAll(() => server.close())
