import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app.js'

const validLead = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+1 (555) 010-1000',
}

function createLead(overrides: Record<string, unknown> = {}) {
  return request(app)
    .post('/api/leads')
    .send({ ...validLead, ...overrides })
}

describe('GET /api/health', () => {
  it('reports the service as healthy', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true })
  })
})

describe('POST /api/leads', () => {
  it('creates a lead, defaulting the status to New', async () => {
    const response = await createLead()

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+1 (555) 010-1000',
      status: 'New',
    })
    expect(response.body._id).toBeTruthy()
    expect(new Date(response.body.createdAt).toString()).not.toBe('Invalid Date')

    const list = await request(app).get('/api/leads')
    expect(list.body.pagination.total).toBe(1)
  })

  it('trims the name and lowercases the email', async () => {
    const response = await createLead({ name: '  Ada Lovelace  ', email: 'ADA@Example.COM' })

    expect(response.status).toBe(201)
    expect(response.body.name).toBe('Ada Lovelace')
    expect(response.body.email).toBe('ada@example.com')
  })

  it('returns per-field errors for an invalid payload', async () => {
    const response = await createLead({ name: '', email: 'nope', phone: '555-CALL' })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Please fix the highlighted fields')
    expect(response.body.errors).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
      phone: expect.any(String),
    })
  })

  it('rejects a duplicate email regardless of casing', async () => {
    await createLead()
    const response = await createLead({ name: 'Ada Again', email: 'ADA@example.com' })

    expect(response.status).toBe(409)
    expect(response.body.message).toBe('A lead with this email already exists')
    expect(response.body.errors?.email).toBe('A lead with this email already exists')
  })
})

describe('GET /api/leads', () => {
  it('returns an empty page when there are no leads', async () => {
    const response = await request(app).get('/api/leads')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    })
  })

  it('paginates and sorts newest first', async () => {
    await createLead({ name: 'First', email: 'first@example.com' })
    await createLead({ name: 'Second', email: 'second@example.com' })
    await createLead({ name: 'Third', email: 'third@example.com' })

    const pageOne = await request(app).get('/api/leads?page=1&limit=2')
    expect(pageOne.status).toBe(200)
    expect(pageOne.body.data).toHaveLength(2)
    expect(pageOne.body.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 })

    // Timestamps have millisecond precision, so compare ordering rather than ids.
    const dates = pageOne.body.data.map((lead: { createdAt: string }) => new Date(lead.createdAt).getTime())
    expect(dates).toEqual([...dates].sort((a: number, b: number) => b - a))

    const pageTwo = await request(app).get('/api/leads?page=2&limit=2')
    expect(pageTwo.body.data).toHaveLength(1)
    expect(pageTwo.body.pagination.page).toBe(2)
  })

  it('searches name, email and phone case-insensitively', async () => {
    await createLead()
    await createLead({ name: 'Grace Hopper', email: 'grace@navy.mil', phone: '555-000-1234' })

    const byName = await request(app).get('/api/leads?search=hopper')
    expect(byName.body.data.map((lead: { name: string }) => lead.name)).toEqual(['Grace Hopper'])

    const byEmail = await request(app).get('/api/leads?search=NAVY.MIL')
    expect(byEmail.body.data).toHaveLength(1)

    const byPhone = await request(app).get('/api/leads?search=010-1000')
    expect(byPhone.body.data.map((lead: { name: string }) => lead.name)).toEqual(['Ada Lovelace'])
  })

  it('treats regex characters in the search term literally', async () => {
    await createLead()

    // "(" is an invalid regex on its own, so an unescaped search would crash the query.
    const paren = await request(app).get(`/api/leads?search=${encodeURIComponent('(5')}`)
    expect(paren.status).toBe(200)
    expect(paren.body.data).toHaveLength(1)

    // "^" and ".*" must not be interpreted as anchors/wildcards.
    const anchor = await request(app).get(`/api/leads?search=${encodeURIComponent('^Ada')}`)
    expect(anchor.body.data).toEqual([])

    const wildcard = await request(app).get(`/api/leads?search=${encodeURIComponent('.*')}`)
    expect(wildcard.body.data).toEqual([])
  })

  it('filters by status', async () => {
    await createLead({ email: 'new@example.com' })
    const qualified = await createLead({ email: 'qualified@example.com' })
    await request(app).patch(`/api/leads/${qualified.body._id}/status`).send({ status: 'Qualified' })

    const response = await request(app).get('/api/leads?status=Qualified')
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].email).toBe('qualified@example.com')
  })

  it('combines search, status filter and pagination', async () => {
    await createLead({ name: 'Grace Hopper', email: 'grace@example.com' })
    const converted = await createLead({ name: 'Grace Kelly', email: 'kelly@example.com' })
    await request(app).patch(`/api/leads/${converted.body._id}/status`).send({ status: 'Converted' })

    const response = await request(app).get('/api/leads?search=grace&status=Converted&page=1&limit=5')
    expect(response.body.pagination.total).toBe(1)
    expect(response.body.data[0].name).toBe('Grace Kelly')
  })

  it.each([
    ['status=Archived', 'status must be one of'],
    ['page=0', 'page must be a positive integer'],
    ['limit=101', 'limit must be an integer between 1 and 100'],
  ])('rejects invalid query (%s)', async (query, message) => {
    const response = await request(app).get(`/api/leads?${query}`)

    expect(response.status).toBe(400)
    expect(response.body.message).toContain(message)
  })
})


describe('PATCH /api/leads/:id/status', () => {
  it('updates the status and persists it', async () => {
    const created = await createLead()
    const response = await request(app)
      .patch(`/api/leads/${created.body._id}/status`)
      .send({ status: 'Qualified' })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('Qualified')

    const list = await request(app).get('/api/leads')
    expect(list.body.data[0].status).toBe('Qualified')
  })

  it('rejects an unknown status', async () => {
    const created = await createLead()
    const response = await request(app)
      .patch(`/api/leads/${created.body._id}/status`)
      .send({ status: 'Archived' })

    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/status must be one of/)
  })

  it('returns 404 for a valid but unknown id', async () => {
    const response = await request(app)
      .patch('/api/leads/665f1c2e8b3a4d0012a9f001/status')
      .send({ status: 'New' })

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Lead not found')
  })

  it('returns 400 for a malformed id', async () => {
    const response = await request(app).patch('/api/leads/not-an-id/status').send({ status: 'New' })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Invalid lead id')
  })
})

describe('DELETE /api/leads/:id', () => {
  it('deletes a lead and returns 204', async () => {
    const created = await createLead()
    const response = await request(app).delete(`/api/leads/${created.body._id}`)

    expect(response.status).toBe(204)
    expect(response.text).toBe('')

    const list = await request(app).get('/api/leads')
    expect(list.body.pagination.total).toBe(0)
  })

  it('returns 404 for a valid but unknown id', async () => {
    const response = await request(app).delete('/api/leads/665f1c2e8b3a4d0012a9f001')

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Lead not found')
  })

  it('returns 400 for a malformed id', async () => {
    const response = await request(app).delete('/api/leads/not-an-id')

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Invalid lead id')
  })
})

describe('unknown routes', () => {
  it('returns a JSON 404', async () => {
    const response = await request(app).get('/api/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'Route not found' })
  })
})

