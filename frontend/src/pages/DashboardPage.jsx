/**
 * DashboardPage — shows summary cards for total products, customers, orders
 * plus quick-action navigation pills.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi } from '../api/dashboard'
import { Package, Users, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    dashboardApi
      .getSummary()
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  const statCards = summary
    ? [
        {
          label: 'Total Products',
          value: summary.total_products,
          icon: Package,
          color: 'text-blue-600',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          onClick: () => navigate('/products'),
        },
        {
          label: 'Total Customers',
          value: summary.total_customers,
          icon: Users,
          color: 'text-emerald-600',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          onClick: () => navigate('/customers'),
        },
        {
          label: 'Total Orders',
          value: summary.total_orders,
          icon: ShoppingCart,
          color: 'text-violet-600',
          bg: 'bg-violet-500/10',
          border: 'border-violet-500/20',
          onClick: () => navigate('/orders'),
        },
        {
          label: 'Low Stock Items',
          value: summary.low_stock_products?.length ?? 0,
          icon: AlertTriangle,
          color: 'text-amber-600',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          onClick: () => navigate('/products'),
        },
      ]
    : []

  return (
    <div className="px-5 sm:px-8 md:px-10 max-w-7xl mx-auto pb-12 space-y-8">
      {/* Page header */}
      <div>
        <h1
          className="text-3xl font-bold text-black tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Dashboard
        </h1>
        <p className="mt-1 text-black/60 font-medium">
          Your inventory at a glance
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-black/50">
          <svg className="mr-3 h-6 w-6 animate-spin text-black" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading dashboard…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div role="alert" className="glass-card !border-rose-500/30 !bg-rose-500/5 px-5 py-4 text-sm text-rose-600">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Summary Cards */}
      {!loading && !error && summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon
              return (
                <button
                  key={card.label}
                  onClick={card.onClick}
                  className="glass-card border-black/10 p-5 text-left group hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-black/50">
                      {card.label}
                    </span>
                    <div className={`w-9 h-9 rounded-lg ${card.bg} ${card.border} border flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-black tracking-tight">
                    {card.value}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="glass-card border-black/10 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-black/50 mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/products')}
                className="inline-flex items-center gap-2 bg-black text-white rounded-full text-sm px-5 py-2 hover:bg-black/80 transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
                Manage Products
              </button>
              <button
                onClick={() => navigate('/customers')}
                className="inline-flex items-center gap-2 bg-black text-white rounded-full text-sm px-5 py-2 hover:bg-black/80 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Manage Customers
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="inline-flex items-center gap-2 bg-black text-white rounded-full text-sm px-5 py-2 hover:bg-black/80 transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Manage Orders
              </button>
            </div>
          </div>

          {/* Low Stock Alert Table */}
          {summary.low_stock_products && summary.low_stock_products.length > 0 && (
            <div className="glass-card border-black/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-black/10">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-black/50 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Low Stock Alerts
                </h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 bg-white/40">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-black/50 text-left">Product</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-black/50 text-left">SKU</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-black/50 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {summary.low_stock_products.map((p) => (
                    <tr key={p.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-black">{p.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-black/60">{p.sku}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          p.quantity_in_stock === 0
                            ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                        }`}>
                          {p.quantity_in_stock === 0 ? 'Out of Stock' : `${p.quantity_in_stock} left`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
