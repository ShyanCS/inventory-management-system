/**
 * Shared helper to trigger a browser download from an axios blob response.
 * Reads the filename from Content-Disposition when present.
 */
export function downloadBlobResponse(response, fallbackName = 'download.csv') {
  const disposition = response.headers?.['content-disposition'] || ''
  const match = disposition.match(/filename="?([^";]+)"?/)
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
