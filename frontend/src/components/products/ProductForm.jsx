/**
 * ProductForm — modal form for creating and editing a product.
 * Handles client-side validation before calling the API.
 */
import { useState, useEffect } from 'react'

const emptyForm = { name: '', sku: '', price: '', quantity_in_stock: '0' }

function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Name is required'
  if (!values.sku.trim()) errors.sku = 'SKU is required'
  if (!values.price && values.price !== 0) {
    errors.price = 'Price is required'
  } else if (Number(values.price) <= 0) {
    errors.price = 'Price must be greater than 0'
  }
  if (Number(values.quantity_in_stock) < 0) {
    errors.quantity_in_stock = 'Quantity cannot be negative'
  }
  return errors
}

export default function ProductForm({ product, onSave, onCancel, apiError }) {
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (product) {
      setValues({
        name: product.name ?? '',
        sku: product.sku ?? '',
        price: product.price ?? '',
        quantity_in_stock: product.quantity_in_stock ?? 0,
      })
    } else {
      setValues(emptyForm)
    }
    setErrors({})
  }, [product])

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues(v => ({ ...v, [name]: value }))
    // Clear the error for the field being edited
    if (errors[name]) setErrors(e => ({ ...e, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate(values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setSubmitting(true)
    try {
      await onSave({
        name: values.name.trim(),
        sku: values.sku.trim(),
        price: parseFloat(values.price),
        quantity_in_stock: parseInt(values.quantity_in_stock, 10),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={product ? 'Edit Product' : 'Add Product'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        className="w-full max-w-md rounded-xl glass-panel shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
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
          <div role="alert" className="mx-6 mt-4 glass-card !bg-rose-500/5 !border-rose-500/30 px-4 py-3 text-sm text-rose-400">
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-5">
          {/* Name */}
          <div>
            <label htmlFor="prod-name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Product Name
            </label>
            <input
              id="prod-name"
              name="name"
              type="text"
              aria-label="Product Name"
              value={values.name}
              onChange={handleChange}
              className={`w-full rounded-lg glass-input px-3 py-2.5 text-sm text-white placeholder-slate-500 ${
                errors.name ? '!border-rose-500/50' : ''
              }`}
              placeholder="e.g. Wireless Mouse"
            />
            {errors.name && <p className="mt-1.5 text-xs text-rose-400">{errors.name}</p>}
          </div>

          {/* SKU */}
          <div>
            <label htmlFor="prod-sku" className="block text-sm font-medium text-slate-300 mb-1.5">
              SKU
            </label>
            <input
              id="prod-sku"
              name="sku"
              type="text"
              aria-label="SKU"
              value={values.sku}
              onChange={handleChange}
              disabled={!!product}
              className={`w-full rounded-lg glass-input font-mono px-3 py-2.5 text-sm text-white placeholder-slate-500 disabled:opacity-50 ${
                errors.sku ? '!border-rose-500/50' : ''
              }`}
              placeholder="e.g. WM-1001"
            />
            {errors.sku && <p className="mt-1.5 text-xs text-rose-400">{errors.sku}</p>}
          </div>

          {/* Price + Quantity row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-price" className="block text-sm font-medium text-slate-300 mb-1.5">
                Price ($)
              </label>
              <input
                id="prod-price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                aria-label="Price"
                value={values.price}
                onChange={handleChange}
                className={`w-full rounded-lg glass-input px-3 py-2.5 text-sm text-white placeholder-slate-500 ${
                  errors.price ? '!border-rose-500/50' : ''
                }`}
                placeholder="0.00"
              />
              {errors.price && <p className="mt-1.5 text-xs text-rose-400">{errors.price}</p>}
            </div>
            <div>
              <label htmlFor="prod-qty" className="block text-sm font-medium text-slate-300 mb-1.5">
                Quantity
              </label>
              <input
                id="prod-qty"
                name="quantity_in_stock"
                type="number"
                min="0"
                aria-label="Quantity"
                value={values.quantity_in_stock}
                onChange={handleChange}
                className={`w-full rounded-lg glass-input px-3 py-2.5 text-sm text-white placeholder-slate-500 ${
                  errors.quantity_in_stock ? '!border-rose-500/50' : ''
                }`}
                placeholder="0"
              />
              {errors.quantity_in_stock && <p className="mt-1.5 text-xs text-rose-400">{errors.quantity_in_stock}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-500/20 px-5 py-2 text-sm font-medium text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
