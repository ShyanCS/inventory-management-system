/**
 * Unit tests for the download/API-error helpers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadBlobResponse, apiErrorMessage } from '../../src/api/download'

describe('downloadBlobResponse', () => {
  let createObjectURL
  let revokeObjectURL
  let createdAnchors
  let originalCreateElement

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock-url')
    revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true })
    createdAnchors = []
    originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') createdAnchors.push(el)
      return el
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an object URL, clicks the link, and revokes the URL', () => {
    const response = { data: 'id,name\n1,X\n', headers: {} }
    downloadBlobResponse(response, 'fallback.csv')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(createdAnchors[0].download).toBe('fallback.csv')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('uses the filename from Content-Disposition when present', () => {
    const response = {
      data: 'csv',
      headers: { 'content-disposition': 'attachment; filename="products_20260823_1200.csv"' },
    }
    downloadBlobResponse(response, 'fallback.csv')

    expect(createdAnchors[0].download).toBe('products_20260823_1200.csv')
  })

  it('handles quoted filenames', () => {
    const response = {
      data: 'csv',
      headers: { 'content-disposition': "attachment; filename='orders.csv'" },
    }
    downloadBlobResponse(response, 'fallback.csv')

    expect(createdAnchors[0].download).toBe('orders.csv')
  })
})

describe('apiErrorMessage', () => {
  const fallback = 'Something went wrong.'

  it('parses the error envelope from a raw string body', () => {
    const err = {
      response: {
        data: JSON.stringify({ error: { code: 'X', message: 'String envelope message' } }),
      },
    }
    expect(apiErrorMessage(err, fallback)).toBe('String envelope message')
  })

  it('returns the fallback for unparseable string bodies', () => {
    const err = { response: { data: '<html>gateway timeout</html>' } }
    expect(apiErrorMessage(err, fallback)).toBe(fallback)
  })

  it('reads the envelope from an object body', () => {
    const err = { response: { data: { error: { code: 'X', message: 'Object envelope message' } } } }
    expect(apiErrorMessage(err, fallback)).toBe('Object envelope message')
  })

  it('returns the fallback when there is no response body', () => {
    expect(apiErrorMessage(new Error('network down'), fallback)).toBe(fallback)
  })
})
