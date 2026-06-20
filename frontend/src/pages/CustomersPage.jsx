/**
 * CustomersPage — full customer management page.
 * Shows a customer list with add and delete actions.
 */
import { useState } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import CustomerForm from '../components/customers/CustomerForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { UserPlus, Trash2, AlertCircle } from 'lucide-react'

export default function CustomersPage() {
  const { customers, loading, error, createCustomer, deleteCustomer } = useCustomers()

  const [modalOpen, setModalOpen] = useState(false)
  const [formApiError, setFormApiError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const openAdd = () => {
    setFormApiError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setFormApiError(null)
  }

  const handleSave = async (data) => {
    try {
      await createCustomer(data)
      closeModal()
    } catch (err) {
      setFormApiError(err.response?.data?.error?.message || 'An error occurred. Please try again.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteError(null)
    try {
      await deleteCustomer(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err.response?.data?.error?.message || 'Failed to delete customer.')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 px-5 sm:px-8 md:px-10 max-w-7xl mx-auto pb-12">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Customers</h1>
          <p className="mt-1 text-black/60 font-medium">Manage your customer directory</p>
        </div>
        <button
          id="add-customer-btn"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-medium border border-black/10 hover:bg-black/80 transition-all"
        >
          <UserPlus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div role="alert" className="glass-card !border-rose-500/30 !bg-rose-500/5 px-5 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-rose-400">Cannot Delete</h3>
            <p className="mt-1 text-sm text-rose-300/80">{deleteError}</p>
          </div>
          <button onClick={() => setDeleteError(null)} className="text-rose-500 hover:text-rose-300 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <svg className="mr-3 h-6 w-6 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading customers…
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div role="alert" className="glass-card !border-rose-500/30 !bg-rose-500/5 px-5 py-4 text-sm text-rose-400">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Customers table */}
      {!loading && !error && (
        <div className="glass-panel overflow-hidden border-black/10">
          {customers.length === 0 ? (
            <div className="py-20 text-center text-black/60">
              <p className="text-lg font-medium text-black">No customers yet</p>
              <p className="mt-1 text-sm">Click "Add Customer" to register your first customer.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left bg-white/40">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-black/60">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-black/60">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-black/60">Phone</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-black/60">Member Since</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-black/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {customers.map((customer) => (
                  <tr key={customer.id} className="group hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar initials */}
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-black/10 text-xs font-bold text-black border border-black/20">
                          {customer.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-medium text-black">{customer.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-black/80">{customer.email}</td>
                    <td className="px-6 py-4 text-black/60">{customer.phone}</td>
                    <td className="px-6 py-4 text-black/60 text-xs font-mono">
                      {new Date(customer.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          aria-label={`Delete ${customer.full_name}`}
                          onClick={() => setDeleteTarget(customer)}
                          className="p-1.5 text-black/40 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Modal */}
      {modalOpen && (
        <CustomerForm
          onSave={handleSave}
          onCancel={closeModal}
          apiError={formApiError}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message={`This will permanently delete "${deleteTarget.full_name}". Customers with existing orders cannot be deleted.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
