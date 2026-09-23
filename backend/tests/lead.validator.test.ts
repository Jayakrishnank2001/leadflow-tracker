import { describe, expect, it } from 'vitest'
import {
  HttpError,
  validateCreateLead,
  validateListQuery,
  validateStatusUpdate,
} from '../src/validators/lead.validator.js'

function capturedError(run: () => unknown): HttpError {
  try {
    run()
  } catch (error) {
    if (error instanceof HttpError) return error
    throw error
  }
  throw new Error('Expected the validator to throw an HttpError')
}

describe('validateCreateLead', () => {
  it('accepts a valid payload and normalises it', () => {
    const result = validateCreateLead({
      name: '  Ada Lovelace  ',
      email: '  ADA@Example.COM ',
      phone: ' +1 (555) 010-1000 ',
      status: 'Contacted',
    })

    expect(result).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+1 (555) 010-1000',
      status: 'Contacted',
    })
  })

  it('omits status when it is not provided so the schema default applies', () => {
    const result = validateCreateLead({ name: 'Ada', email: 'ada@example.com', phone: '+1 555 010 1000' })

    expect(result).not.toHaveProperty('status')
  })

  it('rejects a non-object body', () => {
    const error = capturedError(() => validateCreateLead('nope'))

    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('Request body must be a JSON object')
  })

  it('collects every field error in one response', () => {
    const error = capturedError(() => validateCreateLead({ name: '   ', email: 'not-an-email', phone: 'abc' }))

    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('Please fix the highlighted fields')
    expect(Object.keys(error.errors ?? {})).toEqual(['name', 'email', 'phone'])
  })

  it.each(['12345', '+1 555 010 1000 000 000', ''])('rejects phone numbers outside 7-15 digits (%s)', (phone) => {
    const error = capturedError(() => validateCreateLead({ name: 'Ada', email: 'ada@example.com', phone }))
    expect(error.errors?.phone).toBeTruthy()
  })

  it.each(['+1 555 010 1000', '(555) 010-1000', '5550101000'])('accepts a well-formed phone number (%s)', (phone) => {
    expect(() => validateCreateLead({ name: 'Ada', email: 'ada@example.com', phone })).not.toThrow()
  })

  it('rejects letters, letters mixed into digits and an unknown status', () => {
    const letters = capturedError(() => validateCreateLead({ name: 'Ada', email: 'a@b.co', phone: '555-CALL-NOW' }))
    expect(letters.errors?.phone).toMatch(/only numbers/i)

    const status = capturedError(() =>
      validateCreateLead({ name: 'Ada', email: 'a@b.co', phone: '5550101000', status: 'Archived' }),
    )
    expect(status.errors?.status).toMatch(/Status must be one of/)
  })
})

describe('validateListQuery', () => {
  it('applies defaults when nothing is provided', () => {
    expect(validateListQuery({})).toEqual({ page: 1, limit: 10 })
  })

  it('parses and trims the provided values', () => {
    expect(validateListQuery({ search: '  ada  ', status: 'New', page: '2', limit: '5' })).toEqual({
      search: 'ada',
      status: 'New',
      page: 2,
      limit: 5,
    })
  })

  it('ignores empty search and status values', () => {
    expect(validateListQuery({ search: '   ', status: '' })).toEqual({ page: 1, limit: 10 })
  })

  it('rejects an unknown status', () => {
    const error = capturedError(() => validateListQuery({ status: 'Archived' }))
    expect(error.statusCode).toBe(400)
    expect(error.message).toMatch(/status must be one of/)
  })

  it.each(['0', '-1', '1.5', 'abc'])('rejects an invalid page (%s)', (page) => {
    expect(capturedError(() => validateListQuery({ page })).statusCode).toBe(400)
  })

  it.each(['0', '101', '2.5', 'abc'])('rejects an invalid limit (%s)', (limit) => {
    expect(capturedError(() => validateListQuery({ limit })).statusCode).toBe(400)
  })
})

describe('validateStatusUpdate', () => {
  it('accepts every status in the enum', () => {
    for (const status of ['New', 'Contacted', 'Qualified', 'Converted'] as const) {
      expect(validateStatusUpdate({ status })).toEqual({ status })
    }
  })

  it('rejects a missing or unknown status', () => {
    expect(capturedError(() => validateStatusUpdate({})).statusCode).toBe(400)
    expect(capturedError(() => validateStatusUpdate({ status: 'Archived' })).statusCode).toBe(400)
    expect(capturedError(() => validateStatusUpdate(null)).statusCode).toBe(400)
  })
})
