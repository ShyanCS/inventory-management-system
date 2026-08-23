/**
 * Shared helper to trigger a browser download from an axios blob response.
 * Reads the filename from Content-Disposition when present.
 */
export function downloadBlobResponse(response, fallbackName = 'download.csv') {
  const disposition = response.headers?.['content-disposition'] || ''
  const match = disposition.match(/filename=["']?([^";']+)["']?/)
  const filename = match ? match[1] : fallbackName

  const url = URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Extracts the API error envelope message from an axios error whose
 * response body may be a raw string (CSV endpoints) or a parsed object.
 */
export function apiErrorMessage(err, fallback) {
  const detail = err.response?.data
  if (typeof detail === 'string') {
    try {
      return JSON.parse(detail)?.error?.message || fallback
    } catch {
      return fallback
    }
  }
  return detail?.error?.message || fallback
}
