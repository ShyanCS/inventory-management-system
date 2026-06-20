/**
 * OrderForm — modal form for creating a new order.
 * Supports multiple line items with dynamic add/remove.
 * Shows a live running total calculated client-side.
 */
import { useState } from 'react'

const emptyItem = () => ({ product_id: '', quantity: 1 })

function validate(customerId, items) {
  const errors = {}
  if (!customerId) errors.customer_id = 'Customer is required'
  const itemErrors = items.map(item => {
    const e = {}
    if (!item.product_id) e.product_id = 'Product is required'
    if (!item.quantity || item.quantity < 1) e.quantity = 'Min quantity is 1'
    return e
  })
  if (itemErrors.some(e => Object.keys(e).length > 0)) errors.items = itemErrors
  return errors
}

export default function OrderForm({ customers, products, onSave, onCancel, apiError }) {
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const addLine = () => setItems(prev => [...prev, emptyItem()])

  const removeLine = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const updateLine = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
    // Clear item-level error on change
    if (errors.items?.[idx]?.[field]) {
      setErrors(prev => {
        const newItemErrors = [...(prev.items || [])]
        if (newItemErrors[idx]) newItemErrors[idx] = { ...newItemErrors[idx], [field]: undefined }
        return { ...prev, items: newItemErrors }
      })
    }
  }

  // Compute live total using product prices
  const liveTotal = items.reduce((sum, item) => {
    const product = products.find(p => p.id === Number(item.product_id))
    if (!product || !item.quantity) return sum
    return sum + product.price * Number(item.quantity)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate(customerId, items)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setSubmitting(true)
    try {
      await onSave({
        customer_id: Number(customerId),
        items: items.map(item => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
        })),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New Order"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        className="w-full max-w-lg rounded-xl glass-panel shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-white tracking-tight">New Order</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* API error banner */}
        {apiError && (
          <div role="alert" className="mx-6 mt-4 glass-card !bg-rose-500/5 !border-rose-500/30 px-4 py-3 text-sm text-rose-400 flex-shrink-0">
            <span className="font-medium">Error: </span>{apiError}
          </div>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} noValidate id="order-form" className="space-y-6 px-6 py-5">
            {/* Customer select */}
            <div>
              <label htmlFor="order-customer" className="block text-sm font-medium text-slate-300 mb-1.5">
                Customer
              </label>
              <select
                id="order-customer"
                aria-label="Customer"
                value={customerId}
                onChange={e => {
                  setCustomerId(e.target.value)
                  if (errors.customer_id) setErrors(prev => ({ ...prev, customer_id: undefined }))
                }}
                className={`w-full rounded-lg glass-input px-3 py-2.5 text-sm text-white ${
                  errors.customer_id ? '!border-rose-500/50' : ''
                }`}
              >
                <option value="" className="bg-slate-900">Select a customer…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{c.full_name}</option>
                ))}
              </select>
              {errors.customer_id && <p className="mt-1.5 text-xs text-rose-400">{errors.customer_id}</p>}
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">Line Items</span>
                <button
                  type="button"
                  onClick={addLine}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Line
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start rounded-xl glass-card bg-white/[0.01] p-3">
                    {/* Product */}
                    <div className="flex-1">
                      <label htmlFor={`item-product-${idx}`} className="block text-xs font-medium text-slate-400 mb-1">
                        Product
                      </label>
                      <select
                        id={`item-product-${idx}`}
                        aria-label="Product"
                        value={item.product_id}
                        onChange={e => updateLine(idx, 'product_id', e.target.value)}
                        className={`w-full rounded-md glass-input px-2.5 py-2 text-xs text-white ${
                          errors.items?.[idx]?.product_id ? '!border-rose-500/50' : ''
                        }`}
                      >
                        <option value="" className="bg-slate-900">Select…</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} className="bg-slate-900">
                            {p.name} — ${Number(p.price).toFixed(2)} ({p.quantity_in_stock} in stock)
                          </option>
                        ))}
                      </select>
                      {errors.items?.[idx]?.product_id && (
                        <p className="mt-1 text-xs text-rose-400">{errors.items[idx].product_id}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-20">
                      <label htmlFor={`item-qty-${idx}`} className="block text-xs font-medium text-slate-400 mb-1">
                        Quantity
                      </label>
                      <input
                        id={`item-qty-${idx}`}
                        aria-label="Quantity"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateLine(idx, 'quantity', e.target.value)}
                        className={`w-full rounded-md glass-input px-2.5 py-2 text-xs text-white ${
                          errors.items?.[idx]?.quantity ? '!border-rose-500/50' : ''
                        }`}
                      />
                      {errors.items?.[idx]?.quantity && (
                        <p className="mt-1 text-xs text-rose-400">{errors.items[idx].quantity}</p>
                      )}
                    </div>

                    {/* Remove button */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="mt-[22px] rounded-md p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Live total */}
            {liveTotal > 0 && (
              <div className="flex items-center justify-between rounded-xl glass-card !bg-amber-500/10 !border-amber-500/20 px-5 py-4">
                <span className="text-sm font-medium text-amber-200/70 uppercase tracking-wider">Estimated Total</span>
                <span className="text-2xl font-bold text-amber-400 font-mono tracking-tight">${liveTotal.toFixed(2)}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/5 bg-white/[0.02] px-6 py-4 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="order-form"
            disabled={submitting}
            className="rounded-lg bg-emerald-500/20 px-5 py-2 text-sm font-medium text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all disabled:opacity-50"
          >
            {submitting ? 'Placing…' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
