/**
 * MSW mock server for browser/node environments.
 */
import { setupServer } from 'msw/node'
import { productHandlers } from './handlers/productHandlers'
import { customerHandlers } from './handlers/customerHandlers'
import { orderHandlers } from './handlers/orderHandlers'

export const server = setupServer(...productHandlers, ...customerHandlers, ...orderHandlers)
