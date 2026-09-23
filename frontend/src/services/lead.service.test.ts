import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/api'
import { leadService } from '@/services/lead.service'
import { jsonResponse, stubFetch } from '@/test/http'

const rawLead = {
  _id: '665f1c2e8b3a4d0012a9f001',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+1 (555) 010-1000',
  status: 'New',
  createdAt: '2026-09-23T10:12:31.004Z',
  updatedAt: '2026-09-23T10:12:31.004Z',
}

describe('leadService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalises the Mongo document into the UI shape', async () => {
    stubFetch(jsonResponse({ data: [rawLead], pagination: { page: 1, limit: 5, total: 1, totalPages: 1 } }))

    const result = await leadService.list()

    expect(result.data[0]).toMatchObject({
      id: rawLead._id,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      status: 'New',
      createdAt: expect.stringMatching(/^Sep 23, 2026$/),
    })
  })

  it('omits empty search, the "All statuses" filter and unset paging', async () => {
    const fetchMock = stubFetch(jsonResponse({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } }))

    await leadService.list({ search: '   ', status: 'All statuses' })

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/api/leads`)
  })

  it('builds the query string for search, status and pagination', async () => {
    const fetchMock = stubFetch(jsonResponse({ data: [], pagination: { page: 2, limit: 5, total: 0, totalPages: 1 } }))

    await leadService.list({ search: 'ada lovelace', status: 'Qualified', page: 2, limit: 5 })

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_BASE_URL}/api/leads?search=ada+lovelace&status=Qualified&page=2&limit=5`,
    )
  })

  it('creates a lead with a POST to the collection route', async () => {
    const fetchMock = stubFetch(jsonResponse(rawLead, 201))
    const input = { name: 'Ada Lovelace', email: 'ada@example.com', phone: '+1 555 010 1000', status: 'New' as const }

    const created = await leadService.create(input)

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/api/leads`)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify(input) })
    expect(created.id).toBe(rawLead._id)
  })

  it('updates a status through the dedicated status route', async () => {
    const fetchMock = stubFetch(jsonResponse({ ...rawLead, status: 'Qualified' }))

    const updated = await leadService.updateStatus(rawLead._id, 'Qualified')

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/api/leads/${rawLead._id}/status`)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PATCH', body: JSON.stringify({ status: 'Qualified' }) })
    expect(updated.status).toBe('Qualified')
  })

  it('deletes a lead', async () => {
    const fetchMock = stubFetch(jsonResponse(null, 204))

    await leadService.remove(rawLead._id)

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/api/leads/${rawLead._id}`)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' })
  })
})
