import { api } from '@/lib/api'
import type { CreateLeadInput, Lead, LeadStatus } from '@/types/lead'

export interface PaginatedLeads {
  data: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ListLeadsParams {
  search?: string
  status?: LeadStatus | 'All statuses'
  page?: number
  limit?: number
}

interface RawLead {
  _id: string
  name: string
  email: string
  phone: string
  status: LeadStatus
  createdAt: string
  updatedAt: string
}

interface RawPaginatedLeads {
  data: RawLead[]
  pagination: PaginatedLeads['pagination']
}

/** Backend returns Mongo `_id`; UI keys rows by `id`. Normalize once here. */
function toLead(raw: RawLead): Lead {
  const createdAt = new Date(raw.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return { ...raw, id: raw._id, createdAt }
}

export const leadService = {
  async list(params: ListLeadsParams = {}): Promise<PaginatedLeads> {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.set('search', params.search)
    if (params.status && params.status !== 'All statuses') searchParams.set('status', params.status)
    if (params.page) searchParams.set('page', String(params.page))
    if (params.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    const result = await api.get<RawPaginatedLeads>(`/api/leads${query ? `?${query}` : ''}`)
    return { ...result, data: result.data.map(toLead) }
  },

  async create(input: CreateLeadInput): Promise<Lead> {
    const raw = await api.post<RawLead>('/api/leads', input)
    return toLead(raw)
  },

  async updateStatus(id: Lead['id'], status: LeadStatus): Promise<Lead> {
    const raw = await api.patch<RawLead>(`/api/leads/${id}/status`, { status })
    return toLead(raw)
  },

  async remove(id: Lead['id']): Promise<void> {
    await api.del<void>(`/api/leads/${id}`)
  },
}
