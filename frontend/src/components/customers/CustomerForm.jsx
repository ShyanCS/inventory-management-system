/**
 * CustomerForm — modal form for creating a new customer.
 */
import { useState, useEffect } from 'react'

const emptyForm = { full_name: '', email: '', phone: '' }

function validate(values) {
  const errors = {}
  if (!values.full_name.trim()) errors.full_name = 'Name is required'
  if (!values.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address'
  }
  if (!values.phone.trim()) errors.phone = 'Phone is required'
  return errors
}

export default function CustomerForm({ onSave, onCancel, apiError }) {
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setValues(emptyForm)
    setErrors({})
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues(v => ({ ...v, [name]: value }))
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
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Customer"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        className="w-full max-w-md rounded-xl glass-panel shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Add Customer</h2>
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
          {/* Full Name */}
          <div>
            <label htmlFor="cust-name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              id="cust-name"
              name="full_name"
              type="text"
              aria-label="Full Name"
              value={values.full_name}
              onChange={handleChange}
              className={`w-full rounded-lg glass-input px-3 py-2.5 text-sm text-white placeholder-black/50 ${
                errors.full_name ? '!border-rose-500/50' : ''
              }`}
              placeholder="e.g. Alice Johnson"
            />
            {errors.full_name && <p className="mt-1.5 text-xs text-rose-400">{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="cust-email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              id="cust-email"
              name="email"
              type="email"
              aria-label="Email"
              value={values.email}
              onChange={handleChange}
              className={`w-full rounded-lg glass-input px-3 py-2.5 text-sm text-white placeholder-black/50 ${
                errors.email ? '!border-rose-500/50' : ''
              }`}
              placeholder="e.g. alice@example.com"
            />
            {errors.email && <p className="mt-1.5 text-xs text-rose-400">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="cust-phone" className="block text-sm font-medium text-slate-300 mb-1.5">
              Phone Number
            </label>
            <input
              id="cust-phone"
              name="phone"
              type="tel"
              aria-label="Phone"
              value={values.phone}
              onChange={handleChange}
              className={`w-full rounded-lg glass-input font-mono px-3 py-2.5 text-sm text-white placeholder-black/50 ${
                errors.phone ? '!border-rose-500/50' : ''
              }`}
              placeholder="e.g. +1-555-0101"
            />
            {errors.phone && <p className="mt-1.5 text-xs text-rose-400">{errors.phone}</p>}
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
              {submitting ? 'Saving…' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
