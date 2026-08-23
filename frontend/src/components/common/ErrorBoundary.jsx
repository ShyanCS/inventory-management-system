/**
 * ErrorBoundary — catches render-time errors in the component tree and
 * renders a fallback instead of a blank screen. Logs failures through the
 * structured logger so they surface alongside API errors.
 */
import { Component } from 'react'
import { logger } from '../../lib/logger'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    logger.error('Unhandled render error', {
      message: String(error),
      component_stack: info?.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div role="alert" className="py-20 text-center">
            <p className="text-lg font-medium text-black">Something went wrong.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-black text-white px-4 py-2 text-sm font-medium border border-black/10 hover:bg-black/80 transition-all"
            >
              Reload page
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
