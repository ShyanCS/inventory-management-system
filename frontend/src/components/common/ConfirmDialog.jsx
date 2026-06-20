/**
 * ConfirmDialog — lightweight confirm modal (used for delete confirmation).
 */
export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div
        className="w-full max-w-sm rounded-xl glass-panel p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30">
            <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white tracking-tight mb-1">Are you sure?</h3>
            <p className="text-sm text-slate-400">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-rose-500/20 px-5 py-2 text-sm font-medium text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
