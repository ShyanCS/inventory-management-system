/**
 * ProductsPage — full product management page.
 * Shows a product list with add / edit / delete actions.
 */
import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import ProductForm from '../components/products/ProductForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { Plus, Edit2, Trash2 } from 'lucide-react'

// Stock badge helper
function StockBadge({ qty }) {
  if (qty === 0) return <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-400">Out of Stock</span>
  if (qty <= 10) return <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-400">{qty} left</span>
  return <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-400">{qty} in stock</span>
}

export default function ProductsPage() {
  const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formApiError, setFormApiError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const openAdd = () => {
    setEditingProduct(null)
    setFormApiError(null)
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditingProduct(product)
    setFormApiError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingProduct(null)
    setFormApiError(null)
  }

  const handleSave = async (data) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data)
      } else {
        await createProduct(data)
      }
      closeModal()
    } catch (err) {
      setFormApiError(err.response?.data?.error?.message || 'An error occurred. Please try again.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget.id)
    } catch (err) {
      // Error is captured by useProducts hook
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 px-5 sm:px-8 md:px-10 max-w-7xl mx-auto pb-12">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Products</h1>
          <p className="mt-1 text-black/60 font-medium">Manage your inventory catalog</p>
        </div>
        <button
          id="add-product-btn"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-medium border border-black/10 hover:bg-black/80 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <svg className="mr-3 h-6 w-6 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading products…
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div role="alert" className="glass-card !border-rose-500/30 !bg-rose-500/5 px-5 py-4 text-sm text-rose-400">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Products table */}
      {!loading && !error && (
        <div className="glass-panel overflow-hidden border-black/10">
          {products.length === 0 ? (
            <div className="py-20 text-center text-black/60">
              <p className="text-lg font-medium text-black">No products yet</p>
              <p className="mt-1 text-sm">Click "Add Product" to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left bg-white/40">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-black/60">Product</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-black/60">SKU</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-black/60">Price</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-black/60">Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-black/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="group hover:bg-white/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-black">{product.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="rounded text-xs text-black/60 font-mono bg-black/5 px-2 py-1">{product.sku}</code>
                    </td>
                    <td className="px-6 py-4 text-black/80 font-mono">${Number(product.price).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <StockBadge qty={product.quantity_in_stock} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          aria-label={`Edit ${product.name}`}
                          onClick={() => openEdit(product)}
                          className="p-1.5 text-black/40 hover:text-black transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          aria-label={`Delete ${product.name}`}
                          onClick={() => setDeleteTarget(product)}
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onCancel={closeModal}
          apiError={formApiError}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message={`This will permanently delete "${deleteTarget.name}". This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
