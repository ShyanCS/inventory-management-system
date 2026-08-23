/**
 * ErrorBanner — shared inline error surface (role="alert").
 */
export default function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="glass-card !border-rose-500/30 !bg-rose-500/5 px-5 py-4 text-sm text-rose-400"
    >
      <span className="font-medium">Error:</span> {message}
    </div>
  )
}
