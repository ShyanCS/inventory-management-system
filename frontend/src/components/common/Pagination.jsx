/**
 * Pagination — shared page controls for list views.
 * Renders nothing when there is only one page.
 */
export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  return (
    <div
      data-testid="pagination"
      className="flex items-center justify-between px-5 py-3 border-t border-black/10 bg-white/40"
    >
      <span className="text-sm text-black/60">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-black border border-black/10 hover:bg-white/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-black border border-black/10 hover:bg-white/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}
