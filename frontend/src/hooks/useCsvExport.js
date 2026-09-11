/**
 * useCsvExport — shared export flow for list pages.
 * Wraps a request factory returning the CSV response, triggers the browser
 * download, and tracks in-flight/error state for the calling page.
 */
import { useCallback, useState } from 'react'
import { downloadBlobResponse, apiErrorMessage } from '../api/download'

export function useCsvExport() {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

  const exportCsv = useCallback(
    async (requestFn, fallbackName, fallbackError = 'Failed to export CSV.') => {
      setExportError(null)
      setExporting(true)
      try {
        const response = await requestFn()
        downloadBlobResponse(response, fallbackName)
      } catch (err) {
        setExportError(apiErrorMessage(err, fallbackError))
      } finally {
        setExporting(false)
      }
    },
    [],
  )

  return { exporting, exportError, exportCsv }
}
