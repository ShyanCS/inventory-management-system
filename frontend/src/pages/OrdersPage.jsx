/**
 * OrdersPage — full order management page.
 * Shows order list with status badges, line item details, and cancel action.
 * Supports filtering by status/date range and debounced search.
 */
import { useRef, useState } from 'react'
import { useOrders } from '../hooks/useOrders'
import { useProducts } from '../hooks/useProducts'
import { useCustomers } from '../hooks/useCustomers'
import OrderForm from '../components/orders/OrderForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { Plus, XCircle, ChevronDown, Search } from 'lucide-react'

const STATUS_STYLES = {
  pending: 'bg-amber-500/20 text-amber-600 border border-amber-500/30',
  completed: 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30',
  cancelled: 'bg-black/5 text-black/50 border border-black/10',
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
    >
      {status}
    </span>
  )
}

export default function OrdersPage() {
  const { orders, loading, error, createOrder, cancelOrder, fetchOrders } = useOrders()
  const { products } = useProducts()
  const { customers } = useCustomers()

  const [modalOpen, setModalOpen] = useState(false)
  const [formApiError, setFormApiError] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelError, setCancelError] = useState(null)
  const [expandedOrder, setExpandedOrder] = useState(null)

  // Filter state: '' means "no filter" for that field
  const [filters, setFilters] = useState({ status: '', date_from: '', date_to: '', q: '' })
  const [dateError, setDateError] = useState(null)
  const searchTimeoutRef = useRef(null)

  // Build a params object with empty filters removed
  const buildParams = (f) =>
    Object.fromEntries(Object.entries(f).filter(([, value]) => value !== ''))

  const handleStatusChange = (status) => {
    const next = { ...filters, status }
    setFilters(next)
    fetchOrders(buildParams(next))
  }

  const handleDateChange = (field, value) => {
    const next = { ...filters, [field]: value }
    setFilters(next)
    if (next.date_from && next.date_to && next.date_to < next.date_from) {
      setDateError('"To" date must be on or after the "From" date.')
      return
    }
    setDateError(null)
    fetchOrders(buildParams(next))
  }

  // Debounced search — schedules the fetch without an effect
  const handleSearchChange = (q) => {
    const next = { ...filters, q }
    setFilters(next)
    clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => fetchOrders(buildParams(next)), 300)
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== '')

  // Build customer lookup map
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]))

  const openNew = () => {
    setFormApiError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setFormApiError(null)
  }

  const handleSave = async (data) => {
    try {
      await createOrder(data)
      closeModal()
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create order.'
      setFormApiError(msg)
    }
  }

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    setCancelError(null)
    try {
      await cancelOrder(cancelTarget.id)
    } catch (err) {
      setCancelError(err.response?.data?.error?.message || 'Failed to cancel order.')
    } finally {
      setCancelTarget(null)
    }
  }

  return (
    <div className="space-y-6 px-5 sm:px-8 md:px-10 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-black tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Orders
          </h1>
          <p className="mt-1 text-black/60 font-medium">Track and manage customer orders</p>
        </div>
        <button
          id="new-order-btn"
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-medium border border-black/10 hover:bg-black/80 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Order
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <svg
            className="mr-3 h-6 w-6 animate-spin text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading orders…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          role="alert"
          className="glass-card !border-rose-500/30 !bg-rose-500/5 px-5 py-4 text-sm text-rose-400"
        >
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Filter toolbar */}
      <div className="glass-card border-black/10 px-5 py-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
          <input
            type="search"
            aria-label="Search orders"
            placeholder="Search by order # or customer"
            value={filters.q}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="glass-input rounded-lg pl-9 pr-3 py-2 text-sm text-black w-64 placeholder-black/40"
          />
        </div>

        <select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="glass-input rounded-lg px-3 py-2 text-sm text-black"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          aria-label="From date"
          value={filters.date_from}
          onChange={(e) => handleDateChange('date_from', e.target.value)}
          className="glass-input rounded-lg px-3 py-2 text-sm text-black"
        />
        <span className="text-black/40 text-sm">to</span>
        <input
          type="date"
          aria-label="To date"
          value={filters.date_to}
          onChange={(e) => handleDateChange('date_to', e.target.value)}
          className="glass-input rounded-lg px-3 py-2 text-sm text-black"
        />

        {dateError && (
          <p role="alert" className="text-xs text-rose-500 font-medium">
            {dateError}
          </p>
        )}
      </div>

      {/* Cancel error banner */}
      {cancelError && (
        <div
          role="alert"
          className="glass-card !border-rose-500/30 !bg-rose-500/5 px-5 py-4 text-sm text-rose-400"
        >
          <span className="font-medium">Error:</span> {cancelError}
        </div>
      )}

      {/* Orders list */}
      {!loading && !error && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            hasActiveFilters ? (
              <div className="glass-panel border-black/10 py-20 text-center text-black/60">
                <p className="text-lg font-medium text-black">No orders match your filters</p>
                <p className="mt-1 text-sm">Try adjusting the status, dates, or search term.</p>
              </div>
            ) : (
              <div className="glass-panel border-black/10 py-20 text-center text-black/60">
                <p className="text-lg font-medium text-black">No orders yet</p>
                <p className="mt-1 text-sm">Click "New Order" to place the first order.</p>
              </div>
            )
          ) : (
            orders.map((order) => {
              const customer = customerMap[order.customer_id]
              const isExpanded = expandedOrder === order.id
              return (
                <div key={order.id} className="glass-card border-black/10 overflow-hidden">
                  {/* Order header row */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="flex items-center gap-4 flex-1 text-left"
                    >
                      <span className="font-mono text-sm text-black/60 bg-black/5 px-2 py-1 rounded">
                        #{order.id}
                      </span>
                      <StatusBadge status={order.status} />
                      <span className="text-sm font-medium text-black">
                        {customer ? customer.full_name : `Customer #${order.customer_id}`}
                      </span>
                      <span className="ml-auto text-sm font-mono font-medium text-emerald-600">
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                      <span className="text-xs font-mono text-black/60">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-black/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Cancel button — only for non-cancelled orders */}
                    {order.status !== 'cancelled' && (
                      <button
                        aria-label={`Cancel Order #${order.id}`}
                        onClick={() => setCancelTarget(order)}
                        className="p-1.5 text-black/40 hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors"
                        title="Cancel Order"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Expanded line items */}
                  {isExpanded && (
                    <div className="border-t border-black/10 bg-white/40 px-5 pb-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-black/60 mt-3 mb-2">
                        Line Items
                      </p>
                      <div className="space-y-1">
                        {order.items.map((item) => {
                          const product = products.find((p) => p.id === item.product_id)
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm py-1"
                            >
                              <span className="text-black font-medium">
                                {product ? product.name : `Product #${item.product_id}`}
                              </span>
                              <span className="text-black/60 font-mono text-xs">
                                {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                              </span>
                              <span className="text-black/80 font-mono font-medium">
                                ${Number(item.subtotal).toFixed(2)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* New Order Modal */}
      {modalOpen && (
        <OrderForm
          customers={customers}
          products={products}
          onSave={handleSave}
          onCancel={closeModal}
          apiError={formApiError}
        />
      )}

      {/* Cancel Confirmation */}
      {cancelTarget && (
        <ConfirmDialog
          message={`Cancel Order #${cancelTarget.id}? This will restore stock for all line items.`}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelTarget(null)}
        />
      )}
    </div>
  )
}
