import type { LeadStatus } from '../models/lead.model.js'

export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted']

export interface CreateLeadInput {
  name: string
  email: string
  phone: string
  status?: LeadStatus
}

export interface ListLeadsQuery {
  search?: string
  status?: LeadStatus
  page: number
  limit: number
}

function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as string[]).includes(value)
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Digits with optional spaces, dashes, parentheses, and a single leading +.
const PHONE_PATTERN = /^\+?[0-9\s\-()]+$/

function phoneDigitCount(phone: string): number {
  return phone.replace(/\D/g, '').length
}

/** Validate POST /api/leads body. Returns sanitized input or throws HttpError. */
export function validateCreateLead(body: unknown): CreateLeadInput {
  if (typeof body !== 'object' || body === null) {
    throw new HttpError(400, 'Request body must be a JSON object')
  }

  const { name, email, phone, status } = body as Record<string, unknown>
  const errors: Record<string, string> = {}

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Name is required'
  }
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  if (typeof phone !== 'string' || phone.trim().length === 0) {
    errors.phone = 'Phone is required'
  } else if (!PHONE_PATTERN.test(phone.trim())) {
    errors.phone = 'Phone must contain only numbers, spaces, dashes, parentheses, and an optional leading +'
  } else if (phoneDigitCount(phone) < 7 || phoneDigitCount(phone) > 15) {
    errors.phone = 'Phone must contain between 7 and 15 digits'
  }
  if (status !== undefined && !isLeadStatus(status)) {
    errors.status = `Status must be one of: ${LEAD_STATUSES.join(', ')}`
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, 'Please fix the highlighted fields', errors)
  }

  return {
    name: (name as string).trim(),
    email: (email as string).trim().toLowerCase(),
    phone: (phone as string).trim(),
    ...(status !== undefined ? { status: status as LeadStatus } : {}),
  }
}

/** Validate GET /api/leads query params. Applies defaults: page=1, limit=10 (max 100). */
export function validateListQuery(query: unknown): ListLeadsQuery {
  const params = query as Record<string, unknown>
  const search = typeof params.search === 'string' ? params.search.trim() : undefined

  let status: LeadStatus | undefined
  if (params.status !== undefined && params.status !== '') {
    if (!isLeadStatus(params.status)) {
      throw new HttpError(400, `status must be one of: ${LEAD_STATUSES.join(', ')}`)
    }
    status = params.status
  }

  const page = params.page === undefined ? 1 : Number(params.page)
  const limit = params.limit === undefined ? 10 : Number(params.limit)

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(400, 'page must be a positive integer')
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(400, 'limit must be an integer between 1 and 100')
  }

  return {
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    page,
    limit,
  }
}

/** Validate PATCH /api/leads/:id/status body. */
export function validateStatusUpdate(body: unknown): { status: LeadStatus } {
  if (typeof body !== 'object' || body === null) {
    throw new HttpError(400, 'Request body must be a JSON object')
  }

  const { status } = body as Record<string, unknown>

  if (!isLeadStatus(status)) {
    throw new HttpError(400, `status must be one of: ${LEAD_STATUSES.join(', ')}`)
  }

  return { status }
}

// Declared here (rather than in the middleware) to avoid a validators → middleware import cycle.
export class HttpError extends Error {
  statusCode: number
  errors?: Record<string, string>

  constructor(statusCode: number, message: string, errors?: Record<string, string>) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
  }
}
