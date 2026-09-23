import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from '@/lib/api'
import { jsonResponse, stubFetch, unparsableResponse } from '@/test/http'

describe('api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses the JSON body of a successful response', async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }))

    await expect(api.get('/api/health')).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/health', {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('resolves undefined for a 204 response', async () => {
    stubFetch(jsonResponse(null, 204))

    await expect(api.del('/api/leads/1')).resolves.toBeUndefined()
  })

  it('serialises the body and method for writes', async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 'New' }))

    await api.patch('/api/leads/1/status', { status: 'New' })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/leads/1/status',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'New' }) }),
    )
  })

  it('throws an ApiError carrying the status, message and field errors', async () => {
    stubFetch(
      jsonResponse({ message: 'Please fix the highlighted fields', errors: { email: 'Already used' } }, 400),
    )

    const error = await api.post('/api/leads', {}).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      message: 'Please fix the highlighted fields',
      errors: { email: 'Already used' },
    })
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    stubFetch(unparsableResponse(502))

    const error = await api.get('/api/leads').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 502, message: 'Request failed with status 502', errors: undefined })
  })
})
